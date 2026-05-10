import { decode, decodeStream } from '@tokenpack/browser'
import {
  estimatePackRangeWireBytes,
  fetchPackFilesCompressed,
  fetchPackFilesStream,
  fetchPackManifest,
} from '@tokenpack/browser/fetch-pack'
import { decompressRaw } from 'tokenpack/compressors'
import type { DirPack } from 'tokenpack/pack/types'

import type { ApplyDiffCase, RowResult, Sample, Throttle, Variant } from './types'

interface BaseCache {
  packByToken: Map<string, DirPack>
  entriesByToken: Map<string, Array<{ path: string; bytes: Uint8Array }>>
}

interface RunOptions {
  item: ApplyDiffCase
  throttle: Throttle
  iterations: number
  variant: Variant
  baseCache: BaseCache
}

interface RunOnceResult {
  sample: Sample
  verifyHash: string | null
  verifyBytes: number
}

const RANGE_MANIFEST_PREFETCH_BYTES = 16 * 1024

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 100 * 1024 ? 1 : 0)}KB`

  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

export function formatMs(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value < 1) return `${(value * 1000).toFixed(1)}µs`
  if (value < 100) return `${value.toFixed(1)}ms`

  return `${Math.round(value)}ms`
}

export async function prepareBase(item: ApplyDiffCase, tokenId: string, throttle: Throttle) {
  const token = item.tokens.find(candidate => candidate.id === tokenId)

  if (!token) throw new Error(`base token metadata missing for ${tokenId}`)

  const url = tokenUrl(item.id, tokenId, 'base', throttle)
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) throw new Error(`base token fetch failed: ${response.status}`)
  const pack = await decodeTokenResponse(response, token)

  if (!pack.isPack()) throw new Error(`base token ${tokenId} did not decode to a directory pack`)

  return {
    pack,
    entries: await pack.extractAll(),
  }
}

export async function runVariant(options: RunOptions): Promise<RowResult> {
  const samples: RunOnceResult[] = []

  for (let index = 0; index < options.iterations; index += 1) {
    samples.push(await runOnce(options))
  }

  const sorted = [...samples].sort((a, b) => a.sample.totalMs - b.sample.totalMs)
  const median = sorted[Math.floor(sorted.length / 2)]
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]

  return {
    id: options.variant.id,
    label: options.variant.label,
    kind: options.variant.kind,
    tokenId: options.variant.token?.id,
    iterations: options.iterations,
    median: median.sample,
    p95: p95.sample,
    perRunTotal: samples.map(sample => sample.sample.totalMs),
    verifyHash: median.verifyHash,
    verifyBytes: median.verifyBytes,
  }
}

async function runOnce(options: RunOptions): Promise<RunOnceResult> {
  switch (options.variant.kind) {
    case 'native-full':
      return runNativeFull(options)
    case 'token-full':
      return runTokenFull(options)
    case 'diff-apply':
      return runDiffApply(options)
    case 'range-changed-fetch':
      return runRangeChanged(options, false)
    case 'range-changed-stream':
      return runRangeChanged(options, true)
  }
}

async function runNativeFull({ item, throttle, variant }: RunOptions): Promise<RunOnceResult> {
  const encoding = variant.encoding ?? 'raw'
  const url = withNonce(
    `/api/apply-diff-benchmark/native?case=${item.id}&encoding=${encoding}`,
    throttle,
  )
  const fetchStart = performance.now()
  const response = await fetch(url, { cache: 'no-store' })
  const firstByte = performance.now()

  if (!response.ok) throw new Error(`native fetch failed: ${response.status}`)
  const buffer = await response.arrayBuffer()
  const transferEnd = performance.now()
  const bytes = new Uint8Array(buffer)

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: transferEnd - fetchStart,
      decodeMs: 0,
      applyMs: 0,
      totalMs: transferEnd - fetchStart,
      wireBytes: wireBytes(response, bytes.byteLength),
    },
    verifyHash: await shortHash(bytes),
    verifyBytes: bytes.byteLength,
  }
}

async function runTokenFull({ item, throttle, variant }: RunOptions): Promise<RunOnceResult> {
  const token = requireToken(variant)
  const url = tokenUrl(item.id, token.id, 'next', throttle)
  const fetchStart = performance.now()
  const response = await fetch(url, { cache: 'no-store' })
  const firstByte = performance.now()

  if (!response.ok) throw new Error(`next token fetch failed: ${response.status}`)

  const decoded = await decodeTokenResponseTimed(
    response,
    token,
    tokenBytes(item, token.id, 'next'),
  )
  const { pack } = decoded

  if (!pack.isPack()) throw new Error(`next token ${token.id} did not decode to a directory pack`)
  const entries = await pack.extractAll()
  const readyEnd = performance.now()

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: decoded.transferEnd - fetchStart,
      decodeMs: readyEnd - decoded.decodeStart,
      applyMs: 0,
      totalMs: readyEnd - fetchStart,
      wireBytes: decoded.wireBytes,
    },
    verifyHash: await treeHash(entries),
    verifyBytes: totalEntryBytes(entries),
  }
}

async function runDiffApply({
  item,
  throttle,
  variant,
  baseCache,
}: RunOptions): Promise<RunOnceResult> {
  const token = requireToken(variant)
  const basePack = baseCache.packByToken.get(token.id)

  if (!basePack) throw new Error(`base cache missing for ${token.id}`)

  const url = tokenUrl(item.id, token.id, 'diff', throttle)
  const fetchStart = performance.now()
  const response = await fetch(url, { cache: 'no-store' })
  const firstByte = performance.now()

  if (!response.ok) throw new Error(`diff token fetch failed: ${response.status}`)
  const decoded = await decodeTokenResponseTimed(
    response,
    token,
    tokenBytes(item, token.id, 'diff'),
  )
  const { pack: diffPack } = decoded

  if (!diffPack.isDiff()) throw new Error(`diff token ${token.id} did not decode to a diff pack`)

  const applyStart = performance.now()
  const nextPack = await diffPack.apply(basePack)
  const entries = await nextPack.extractAll()
  const applyEnd = performance.now()

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: decoded.transferEnd - fetchStart,
      decodeMs: decoded.decodeEnd - decoded.decodeStart,
      applyMs: applyEnd - applyStart,
      totalMs: applyEnd - fetchStart,
      wireBytes: decoded.wireBytes,
    },
    verifyHash: await treeHash(entries),
    verifyBytes: totalEntryBytes(entries),
  }
}

async function runRangeChanged(
  { item, throttle, variant, baseCache }: RunOptions,
  stream: boolean,
): Promise<RunOnceResult> {
  const token = requireToken(variant)
  const baseEntries = baseCache.entriesByToken.get(token.id)

  if (!baseEntries) throw new Error(`base entries cache missing for ${token.id}`)

  const url = withNonce(
    `/api/apply-diff-benchmark/range-pack?case=${item.id}&token=${token.id}`,
    throttle,
  )
  const fetchStart = performance.now()
  const remote = await fetchPackManifest(url, RANGE_MANIFEST_PREFETCH_BYTES)
  const firstByte = performance.now()
  const changedPaths = item.changedPaths
  let decoded: Array<{ path: string; bytes: Uint8Array }>
  let transferEnd: number
  let decodeStart: number
  let decodeEnd: number
  const rangeOptions = { maxGapBytes: 0 }
  const wire = estimatePackRangeWireBytes(remote, changedPaths, rangeOptions)

  if (stream) {
    decodeStart = performance.now()
    const streams = await fetchPackFilesStream(remote, changedPaths, rangeOptions)
    const files = await Promise.all(streams.map(file => readStream(file.stream)))

    decodeEnd = performance.now()
    transferEnd = decodeEnd
    decoded = files.map((bytes, index) => ({ path: changedPaths[index], bytes }))
  } else {
    const compressed = await fetchPackFilesCompressed(remote, changedPaths, rangeOptions)

    transferEnd = performance.now()
    decodeStart = performance.now()
    const files = await Promise.all(
      compressed.map(file =>
        decompressRaw(file.bytes, file.entry.compressor, {
          level: file.entry.level,
          uncompressedLength: file.entry.originalSize,
        }),
      ),
    )

    decodeEnd = performance.now()
    decoded = files.map((bytes, index) => ({ path: changedPaths[index], bytes }))
  }

  const applyStart = performance.now()
  const nextEntries = applyChangedEntries(baseEntries, decoded)
  const hash = await treeHash(nextEntries)
  const applyEnd = performance.now()

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: transferEnd - fetchStart,
      decodeMs: decodeEnd - decodeStart,
      applyMs: applyEnd - applyStart,
      totalMs: applyEnd - fetchStart,
      wireBytes: wire,
    },
    verifyHash: hash,
    verifyBytes: totalEntryBytes(nextEntries),
  }
}

function requireToken(variant: Variant) {
  if (!variant.token) throw new Error(`${variant.id} is not a token variant`)

  return variant.token
}

function tokenUrl(
  caseId: string,
  tokenId: string,
  kind: 'base' | 'next' | 'diff',
  throttle: Throttle,
): string {
  return withNonce(
    `/api/apply-diff-benchmark/token?case=${caseId}&token=${tokenId}&kind=${kind}`,
    throttle,
  )
}

function withNonce(url: string, throttle: Throttle): string {
  const separator = url.includes('?') ? '&' : '?'
  const params = new URLSearchParams({ nonce: crypto.randomUUID() })

  if (throttle !== 'local') params.set('throttle', throttle)

  return `${url}${separator}${params.toString()}`
}

async function decodeTokenResponse(
  response: Response,
  token: Pick<ApplyDiffCase['tokens'][number], 'id' | 'streamable'>,
) {
  if (token.streamable && response.body) {
    return decodeStream(response.body)
  }

  return decode(await response.arrayBuffer())
}

async function decodeTokenResponseTimed(
  response: Response,
  token: Pick<ApplyDiffCase['tokens'][number], 'id' | 'streamable'>,
  fallbackWireBytes: number,
) {
  if (token.streamable && response.body) {
    const decodeStart = performance.now()
    const pack = await decodeStream(response.body)
    const decodeEnd = performance.now()

    return {
      pack,
      transferEnd: decodeEnd,
      decodeStart,
      decodeEnd,
      wireBytes: wireBytes(response, fallbackWireBytes),
    }
  }

  const buffer = await response.arrayBuffer()
  const transferEnd = performance.now()
  const decodeStart = performance.now()
  const pack = await decode(buffer)
  const decodeEnd = performance.now()

  return {
    pack,
    transferEnd,
    decodeStart,
    decodeEnd,
    wireBytes: wireBytes(response, buffer.byteLength),
  }
}

function wireBytes(response: Response, fallback: number): number {
  const header = response.headers.get('content-length')
  const value = header ? Number(header) : NaN

  return Number.isFinite(value) && value > 0 ? value : fallback
}

function tokenBytes(item: ApplyDiffCase, tokenId: string, kind: 'next' | 'diff' | 'base'): number {
  const token = item.tokens.find(candidate => candidate.id === tokenId)

  if (!token) return 0
  if (kind === 'base') return token.baseBytes
  if (kind === 'diff') return token.diffBytes

  return token.nextBytes
}

function applyChangedEntries(
  baseEntries: readonly { path: string; bytes: Uint8Array }[],
  changedEntries: readonly { path: string; bytes: Uint8Array }[],
) {
  const map = new Map(baseEntries.map(entry => [entry.path, entry.bytes]))

  for (const entry of changedEntries) map.set(entry.path, entry.bytes)

  return Array.from(map, ([path, bytes]) => ({ path, bytes }))
}

async function treeHash(entries: readonly { path: string; bytes: Uint8Array }[]): Promise<string> {
  const rows = await Promise.all(
    [...entries]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(async entry => {
        const hash = await fullHash(entry.bytes)

        return `${entry.path}\0${entry.bytes.byteLength}\0${hash}`
      }),
  )

  return shortHash(new TextEncoder().encode(rows.join('\n')))
}

function totalEntryBytes(entries: readonly { bytes: Uint8Array }[]): number {
  return entries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0)
}

async function shortHash(bytes: Uint8Array): Promise<string> {
  return (await fullHash(bytes)).slice(0, 16)
}

async function fullHash(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes)
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer)

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break
    if (!value) continue
    chunks.push(value)
    total += value.byteLength
  }

  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}
