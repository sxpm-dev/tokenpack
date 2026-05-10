import '@tokenpack/node'

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

import { decode, encode as tokenpackEncode, PackBuilder } from '@tokenpack/node'

import { APP_BENCHMARK_FIXTURE_DIR, REPO_ROOT, sha256 } from './benchmark/fixture-corpus'

type Encoding = 'raw' | 'deflate' | 'brotli'
type TokenGroup = 'fetch' | 'stream'

const APPLY_DIFF_FIXTURE_DIR = path.join(APP_BENCHMARK_FIXTURE_DIR, 'apply-diff')
const APPLY_DIFF_CACHE_DIR = path.join(APP_BENCHMARK_FIXTURE_DIR, '.apply-diff-cache')

const RELEASE_SIZES_KB = [100, 500, 1000, 2000, 5000] as const
const CHANGE_RATES_PCT = [1, 5, 20, 50, 70, 90] as const
const FILE_COUNT = 100
const ENCODINGS: readonly Encoding[] = ['raw', 'deflate', 'brotli']

const TOKEN_VARIANTS: readonly TokenVariant[] = [
  {
    id: 'linear-deflate-c3',
    algo: 'linear-deflate',
    channels: 3,
    group: 'fetch',
    streamable: false,
  },
  {
    id: 'linear-stream-deflate-c3',
    algo: 'linear-stream-deflate',
    channels: 3,
    group: 'stream',
    streamable: true,
  },
  {
    id: 'linear-stream-deflate-c4',
    algo: 'linear-stream-deflate',
    channels: 4,
    group: 'stream',
    streamable: true,
  },
  {
    id: 'pixel-range-deflate-c3',
    algo: 'pixel-range-deflate',
    channels: 3,
    group: 'fetch',
    streamable: false,
  },
  {
    id: 'pixel-range-deflate-c4',
    algo: 'pixel-range-deflate',
    channels: 4,
    group: 'fetch',
    streamable: false,
  },
  {
    id: 'pixel-range-none-c3',
    algo: 'pixel-range-none',
    channels: 3,
    group: 'fetch',
    streamable: false,
    rangePack: true,
  },
  {
    id: 'pixel-range-none-c4',
    algo: 'pixel-range-none',
    channels: 4,
    group: 'fetch',
    streamable: false,
    rangePack: true,
  },
  {
    id: 'pixel-range-stream-deflate-c3',
    algo: 'pixel-range-stream-deflate',
    channels: 3,
    group: 'stream',
    streamable: true,
  },
  {
    id: 'pixel-range-stream-deflate-c4',
    algo: 'pixel-range-stream-deflate',
    channels: 4,
    group: 'stream',
    streamable: true,
  },
] as const

interface TokenVariant {
  id: string
  algo: string
  channels: 3 | 4
  group: TokenGroup
  streamable: boolean
  rangePack?: boolean
}

interface ReleaseEntry {
  path: string
  bytes: Buffer
}

interface NativeFixture {
  encoding: Encoding
  file: string
  bytes: number
  sha256: string
}

interface TokenFixture {
  id: string
  algo: string
  channels: number
  group: TokenGroup
  streamable: boolean
  baseFile: string
  nextFile: string
  diffFile: string
  baseBytes: number
  nextBytes: number
  diffBytes: number
  baseSha256: string
  nextSha256: string
  diffSha256: string
  rangePackFile?: string
  rangePackBytes?: number
  rangePackSha256?: string
}

interface ApplyDiffCase {
  id: string
  sizeKB: number
  changeRatePct: number
  fileCount: number
  changedFileCount: number
  changedPaths: string[]
  baseOriginalBytes: number
  nextOriginalBytes: number
  changedOriginalBytes: number
  baseTreeSha256: string
  nextTreeSha256: string
  native: NativeFixture[]
  tokens: TokenFixture[]
}

interface ApplyDiffManifest {
  generatedAt: string
  sizesKB: readonly number[]
  changeRatesPct: readonly number[]
  fileCount: number
  encodings: readonly Encoding[]
  tokenVariants: readonly TokenVariant[]
  cases: ApplyDiffCase[]
}

function computeImplementationMtime(): number {
  const dirs = [
    path.join(REPO_ROOT, 'packages', 'core', 'src'),
    path.join(REPO_ROOT, 'packages', 'node', 'src'),
    path.join(REPO_ROOT, 'packages', 'browser', 'src'),
  ]
  let max = 0
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return

    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name)
      const stat = fs.statSync(p)

      if (stat.isDirectory()) walk(p)
      else if (stat.isFile() && p.endsWith('.ts')) max = Math.max(max, stat.mtimeMs)
    }
  }

  dirs.forEach(walk)

  return Math.floor(max)
}

function caseId(sizeKB: number, changeRatePct: number): string {
  return `size-${sizeKB}kb__change-${changeRatePct}pct`
}

function pad(index: number): string {
  return String(index).padStart(3, '0')
}

function makeRelease(
  sizeKB: number,
  changedPaths: ReadonlySet<string>,
  version: '1.0.0' | '1.0.1',
) {
  const totalBytes = sizeKB * 1024
  const baseSize = Math.floor(totalBytes / FILE_COUNT)
  const remainder = totalBytes - baseSize * FILE_COUNT
  const entries: ReleaseEntry[] = []

  for (let index = 0; index < FILE_COUNT; index += 1) {
    const entryPath = `chunks/chunk-${pad(index)}.js`
    const targetBytes = baseSize + (index < remainder ? 1 : 0)
    const entryVersion = changedPaths.has(entryPath) ? version : '1.0.0'

    entries.push({
      path: entryPath,
      bytes: makeSizedJs(entryPath, targetBytes, entryVersion, sizeKB),
    })
  }

  entries.push({
    path: 'manifest.json',
    bytes: Buffer.from(
      JSON.stringify({
        name: 'tokenpack-apply-diff-fixture',
        version,
        sizeKB,
        fileCount: FILE_COUNT,
        changed: Array.from(changedPaths).sort(),
      }),
      'utf-8',
    ),
  })

  return entries
}

function changedPathsFor(changeRatePct: number): Set<string> {
  const count = Math.max(1, Math.min(FILE_COUNT, Math.round((FILE_COUNT * changeRatePct) / 100)))
  const out = new Set<string>()

  for (let index = 0; index < count; index += 1) {
    const mixed = (index * 37 + changeRatePct * 11) % FILE_COUNT

    out.add(`chunks/chunk-${pad(mixed)}.js`)
  }

  return out
}

function makeSizedJs(
  entryPath: string,
  targetBytes: number,
  version: string,
  sizeKB: number,
): Buffer {
  const header = `/* ${entryPath} ${version} ${sizeKB}kb */\n`
  const statement = `globalThis.__tokenpackApplyDiffLoaded = (globalThis.__tokenpackApplyDiffLoaded || 0) + ${JSON.stringify(entryPath)}.length;\n`
  const seed = `${entryPath}:${version}:${sizeKB}:`
  let text = header + statement

  while (Buffer.byteLength(text, 'utf-8') < targetBytes) {
    text += `const v_${text.length.toString(36)} = ${JSON.stringify(seed + text.length)};\n`
  }

  const bytes = Buffer.from(text, 'utf-8')

  return bytes.subarray(0, targetBytes)
}

function entriesToBuilder(entries: readonly ReleaseEntry[]): PackBuilder {
  const builder = new PackBuilder()

  for (const entry of entries) builder.withFile(entry.path, entry.bytes)

  return builder
}

function treeHash(entries: readonly ReleaseEntry[]): string {
  return sha256(
    Buffer.from(
      [...entries]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(entry => `${entry.path}\0${entry.bytes.byteLength}\0${sha256(entry.bytes)}`)
        .join('\n'),
      'utf-8',
    ),
  )
}

function bundleBytes(entries: readonly ReleaseEntry[]): Buffer {
  const parts = [...entries]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(entry => Buffer.concat([Buffer.from(`\n/* file:${entry.path} */\n`), entry.bytes]))

  return Buffer.concat(parts)
}

function encodeNative(bytes: Buffer, encoding: Encoding): Buffer {
  switch (encoding) {
    case 'raw':
      return bytes
    case 'deflate':
      return zlib.deflateSync(bytes, { level: 6 })
    case 'brotli':
      return zlib.brotliCompressSync(bytes, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      })
  }
}

function nativeExt(encoding: Encoding): string {
  if (encoding === 'raw') return '.raw'
  if (encoding === 'brotli') return '.br'

  return '.deflate'
}

function writeFixture(
  relativePath: string,
  bytes: Buffer | Uint8Array,
): { bytes: number; sha256: string; reused: boolean } {
  const outPath = path.join(APPLY_DIFF_FIXTURE_DIR, relativePath)
  const body = Buffer.from(bytes)
  const digest = sha256(body)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath)

    if (existing.byteLength === body.byteLength && sha256(existing) === digest) {
      return { bytes: body.byteLength, sha256: digest, reused: true }
    }
  }

  fs.writeFileSync(outPath, body)

  return { bytes: body.byteLength, sha256: digest, reused: false }
}

function cachePath(key: string, ext: string): string {
  return path.join(APPLY_DIFF_CACHE_DIR, `${key}${ext}`)
}

async function cachedToken(
  key: string,
  builder: PackBuilder,
  variant: TokenVariant,
  implementationMtime: number,
): Promise<{ bytes: Buffer; reused: boolean }> {
  const fullKey = [
    `v${implementationMtime}`,
    key,
    variant.id,
    variant.algo,
    `c${variant.channels}`,
  ].join('__')
  const outPath = cachePath(fullKey, '.png')

  if (fs.existsSync(outPath)) return { bytes: fs.readFileSync(outPath), reused: true }

  const bytes = Buffer.from(
    await tokenpackEncode(builder, {
      algo: variant.algo,
      compressor: 'deflate-9',
      algoOptions: { surface: { channels: variant.channels } },
    }),
  )

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, bytes)

  return { bytes, reused: false }
}

async function diffTokenBytes(baseToken: Buffer, nextToken: Buffer): Promise<Buffer> {
  const base = await decode(baseToken)
  const next = await decode(nextToken)

  if (!base.isPack()) throw new Error('base token did not decode to a directory pack')
  if (!next.isPack()) throw new Error('next token did not decode to a directory pack')
  const diffResult = (await base.diffTo(next)) as { bytes: Uint8Array }

  return Buffer.from(diffResult.bytes)
}

async function main() {
  const implementationMtime = computeImplementationMtime()
  const manifest: ApplyDiffManifest = {
    generatedAt: new Date().toISOString(),
    sizesKB: RELEASE_SIZES_KB,
    changeRatesPct: CHANGE_RATES_PCT,
    fileCount: FILE_COUNT,
    encodings: ENCODINGS,
    tokenVariants: TOKEN_VARIANTS,
    cases: [],
  }
  let tokenCacheHits = 0
  let tokenEncoded = 0
  let fixtureReused = 0
  let fixtureWritten = 0

  fs.mkdirSync(APPLY_DIFF_FIXTURE_DIR, { recursive: true })
  fs.mkdirSync(APPLY_DIFF_CACHE_DIR, { recursive: true })

  for (const sizeKB of RELEASE_SIZES_KB) {
    const baseEntries = makeRelease(sizeKB, new Set(), '1.0.0')
    const baseBuilder = entriesToBuilder(baseEntries)
    const baseHash = treeHash(baseEntries)

    for (const changeRatePct of CHANGE_RATES_PCT) {
      const changedChunkPaths = changedPathsFor(changeRatePct)
      const changedPaths = new Set([...changedChunkPaths, 'manifest.json'])
      const nextEntries = makeRelease(sizeKB, changedChunkPaths, '1.0.1')
      const nextBuilder = entriesToBuilder(nextEntries)
      const nextHash = treeHash(nextEntries)
      const id = caseId(sizeKB, changeRatePct)
      const caseDir = id
      const nativeBundle = bundleBytes(nextEntries)
      const native: NativeFixture[] = []
      const tokens: TokenFixture[] = []

      for (const encoding of ENCODINGS) {
        const body = encodeNative(nativeBundle, encoding)
        const file = `${caseDir}/native/next${nativeExt(encoding)}`
        const written = writeFixture(file, body)

        if (written.reused) fixtureReused++
        else fixtureWritten++
        native.push({ encoding, file, bytes: written.bytes, sha256: written.sha256 })
      }

      for (const variant of TOKEN_VARIANTS) {
        const baseKey = `${sha256(Buffer.from(baseHash))}__base`
        const nextKey = `${sha256(Buffer.from(nextHash))}__next`
        const baseCached = await cachedToken(baseKey, baseBuilder, variant, implementationMtime)
        const nextCached = await cachedToken(nextKey, nextBuilder, variant, implementationMtime)
        const diff = await diffTokenBytes(baseCached.bytes, nextCached.bytes)

        if (baseCached.reused) tokenCacheHits++
        else tokenEncoded++
        if (nextCached.reused) tokenCacheHits++
        else tokenEncoded++

        const baseFile = `${caseDir}/token/${variant.id}/base.png`
        const nextFile = `${caseDir}/token/${variant.id}/next.png`
        const diffFile = `${caseDir}/token/${variant.id}/diff.png`
        const baseWritten = writeFixture(baseFile, baseCached.bytes)
        const nextWritten = writeFixture(nextFile, nextCached.bytes)
        const diffWritten = writeFixture(diffFile, diff)

        for (const written of [baseWritten, nextWritten, diffWritten]) {
          if (written.reused) fixtureReused++
          else fixtureWritten++
        }

        tokens.push({
          id: variant.id,
          algo: variant.algo,
          channels: variant.channels,
          group: variant.group,
          streamable: variant.streamable,
          baseFile,
          nextFile,
          diffFile,
          baseBytes: baseWritten.bytes,
          nextBytes: nextWritten.bytes,
          diffBytes: diffWritten.bytes,
          baseSha256: baseWritten.sha256,
          nextSha256: nextWritten.sha256,
          diffSha256: diffWritten.sha256,
          ...(variant.rangePack
            ? {
                rangePackFile: nextFile,
                rangePackBytes: nextWritten.bytes,
                rangePackSha256: nextWritten.sha256,
              }
            : {}),
        })
      }

      manifest.cases.push({
        id,
        sizeKB,
        changeRatePct,
        fileCount: FILE_COUNT,
        changedFileCount: changedPaths.size,
        changedPaths: Array.from(changedPaths).sort(),
        baseOriginalBytes: baseEntries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0),
        nextOriginalBytes: nextEntries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0),
        changedOriginalBytes: nextEntries
          .filter(entry => changedPaths.has(entry.path))
          .reduce((sum, entry) => sum + entry.bytes.byteLength, 0),
        baseTreeSha256: baseHash,
        nextTreeSha256: nextHash,
        native,
        tokens,
      })
    }
  }

  fs.writeFileSync(
    path.join(APPLY_DIFF_FIXTURE_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  )
  console.log(`Apply-diff fixtures written to ${APPLY_DIFF_FIXTURE_DIR}`)
  console.log(`Cases: ${manifest.cases.length}`)
  console.log(`Token cache: ${tokenCacheHits} reused, ${tokenEncoded} encoded`)
  console.log(`Fixture files: ${fixtureReused} unchanged, ${fixtureWritten} written`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
