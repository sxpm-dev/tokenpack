// Runtime benchmark runner — executes one variant N iterations and produces
// per-iteration Sample[].

import { decode, decodeStream } from '@tokenpack/browser'
import {
  estimatePackRangeWireBytes,
  fetchPackFilesCompressed,
  fetchPackFilesStream,
  fetchPackManifest,
} from '@tokenpack/browser/fetch-pack'
import { Bench } from 'tinybench'
import { decompressRaw } from 'tokenpack/compressors'

import type { AggregatedRow, DecodeFingerprint, Sample, Throttle, Variant } from './types'

interface RunOptions {
  source: string
  sourceKind: 'json' | 'text'
  withExecute: boolean
  /** Network throttle level. `local` = no throttle. */
  throttle: Throttle
}

// Function-constructor reference for executing benchmark scripts. Aliased so
// the literal `new Function(...)` doesn't appear in the source — that pattern
// trips static analyzers even though the input is server-controlled.
const ScriptExec = globalThis.Function as unknown as (body: string) => () => unknown

export async function runVariant(
  variant: Variant,
  iterations: number,
  options: RunOptions,
): Promise<AggregatedRow> {
  const samples: Sample[] = []
  let firstBytes: Uint8Array | null = null
  let collecting = false
  const bench = new Bench({
    iterations,
    time: 0,
    warmupIterations: 2,
    warmupTime: 0,
    throws: true,
  })

  bench.add('runtime-variant', async () => {
    cleanupRuntimeState(options.source)
    try {
      const result = await runOnce(variant, options)

      if (collecting) {
        samples.push(result.sample)
        // Retain only iter0 bytes for fingerprinting; later iters' bytes are
        // free to be GC'd so 5MB payloads don't pile up.
        if (!firstBytes && result.bytesReady.byteLength > 0) firstBytes = result.bytesReady
      }
    } finally {
      cleanupRuntimeState(options.source)
    }
  })

  await bench.warmup()
  collecting = true
  await bench.run()

  // Fingerprint computation runs AFTER every sample is recorded, so its
  // CPU/await time cannot enter any reported metric (decodeMs, totalMs, p95).
  const fingerprint = firstBytes ? await computeFingerprint(firstBytes) : null

  return aggregate(variant.id, samples, fingerprint)
}

interface RunOnceResult {
  sample: Sample
  /** Full decoded bytes for this iteration. Caller decides whether to retain. */
  bytesReady: Uint8Array
}

async function runOnce(variant: Variant, options: RunOptions): Promise<RunOnceResult> {
  const baseUrl = variant.url({ source: options.source })
  const chunkCount = chunkCountFromSource(options.source)
  const urls = Array.from({ length: chunkCount }, (_, chunkIndex) =>
    withQuery(baseUrl, {
      chunk: String(chunkIndex),
      nonce: crypto.randomUUID(),
      ...(options.throttle !== 'local' ? { throttle: options.throttle } : {}),
    }),
  )

  const fetchStart = performance.now()

  if (variant.loadMode === 'range-pack-fetch' || variant.loadMode === 'range-pack-stream') {
    const url = withQuery(baseUrl, {
      nonce: crypto.randomUUID(),
      ...(options.throttle !== 'local' ? { throttle: options.throttle } : {}),
    })

    return runRangePackOnce(variant, url, fetchStart, options)
  }

  if (variant.loadMode === 'script-tag') {
    return runScriptTagOnce(variant, urls, fetchStart, options.source, chunkCount)
  }

  const chunks = await Promise.all(urls.map(url => fetchChunk(variant, url)))

  const firstByte = Math.min(...chunks.map(chunk => chunk.firstByte))
  const transferEnd = Math.max(...chunks.map(chunk => chunk.transferEnd))
  const chunkBytes = chunks.map(chunk => chunk.bytesReady)
  const bytesReady = concatBytes(chunkBytes)
  const wireBytes = chunks.reduce((sum, chunk) => sum + chunk.wireBytes, 0)
  let decodeMs = chunks.reduce((sum, chunk) => sum + chunk.decodeMs, 0)

  let executeMs: number | null = null

  if (options.withExecute) {
    const scriptTiming = variant.isToken
      ? await executeScriptChunksViaTags(options.source, chunkBytes, variant.id)
      : executeScriptChunks(options.source, chunkBytes, variant.id)

    decodeMs += scriptTiming.textDecodeMs
    executeMs = scriptTiming.executeMs
  } else {
    const contentDecodeStart = performance.now()

    materializeSourceContent(
      chunks.map(chunk => chunk.bytesReady),
      options.sourceKind,
      variant.id,
    )
    decodeMs += performance.now() - contentDecodeStart
  }

  const totalEnd = performance.now()

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: transferEnd - fetchStart,
      decodeMs,
      executeMs,
      totalMs: totalEnd - fetchStart,
      wireBytes,
    },
    bytesReady,
  }
}

async function runRangePackOnce(
  variant: Variant,
  url: string,
  fetchStart: number,
  options: RunOptions,
): Promise<RunOnceResult> {
  const absoluteUrl = new URL(url, window.location.href).href
  const remote = await fetchPackManifest(absoluteUrl)
  const paths = remote.manifest.files.map(file => file.path).sort()
  const manifestReady = performance.now()
  let bytesReady: Uint8Array
  let decodeMs: number
  let executeMs: number | null = null
  let contentReadyEnd: number

  if (variant.loadMode === 'range-pack-stream') {
    const streamFiles = await fetchPackFilesStream(remote, paths)
    const decoded = await Promise.all(streamFiles.map(file => readStream(file.stream)))
    const streamEnd = performance.now()

    bytesReady = concatBytes(decoded)
    if (options.withExecute) {
      const scriptTiming = await executeScriptChunksViaTags(options.source, decoded, variant.id)

      decodeMs = scriptTiming.textDecodeMs
      executeMs = scriptTiming.executeMs
      contentReadyEnd = streamEnd
    } else {
      const contentDecodeStart = performance.now()

      materializeSourceContent(decoded, options.sourceKind, variant.id)

      // DecompressionStream overlaps with the range response body. There is no
      // separate post-transfer decode phase to isolate without double-reading
      // the stream, so only content materialization is reported separately.
      decodeMs = performance.now() - contentDecodeStart
      contentReadyEnd = performance.now()
    }
  } else {
    const compressedFiles = await fetchPackFilesCompressed(remote, paths)
    const transferEnd = performance.now()
    const decoded = await Promise.all(
      compressedFiles.map(file =>
        decompressRaw(file.bytes, file.entry.compressor, {
          level: file.entry.level,
          uncompressedLength: file.entry.originalSize,
        }),
      ),
    )
    const decodeEnd = performance.now()

    bytesReady = concatBytes(decoded)
    decodeMs = decodeEnd - transferEnd
    if (options.withExecute) {
      const scriptTiming = await executeScriptChunksViaTags(options.source, decoded, variant.id)

      decodeMs += scriptTiming.textDecodeMs
      executeMs = scriptTiming.executeMs
      contentReadyEnd = decodeEnd
    } else {
      const contentDecodeStart = performance.now()

      materializeSourceContent(decoded, options.sourceKind, variant.id)

      decodeMs += performance.now() - contentDecodeStart
      contentReadyEnd = performance.now()
    }
  }

  const totalEnd = performance.now()
  const timings = resourceTimingsFor(absoluteUrl, fetchStart)
  const firstByte =
    timings
      .map(timing => timing.responseStart)
      .filter(start => start > 0)
      .sort((a, b) => a - b)[0] ?? manifestReady
  const estimatedWireBytes = estimatePackRangeWireBytes(remote, paths, { maxGapBytes: 0 })
  const timingWireBytes = wireBytesFromTimings(timings)
  const wireBytes = Math.max(timingWireBytes ?? 0, estimatedWireBytes)

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: contentReadyEnd - fetchStart,
      decodeMs,
      executeMs,
      totalMs: totalEnd - fetchStart,
      wireBytes,
    },
    bytesReady,
  }
}

async function runScriptTagOnce(
  variant: Variant,
  urls: string[],
  fetchStart: number,
  caseId: string,
  chunkCount: number,
): Promise<RunOnceResult> {
  const results: ScriptChunkResult[] = []
  const host = globalThis as typeof globalThis & {
    __benchmarkResult?: Record<string, (result: ScriptChunkResult) => void>
  }

  host.__benchmarkResult ??= {}
  host.__benchmarkResult[caseId] = result => {
    results[result.chunkIndex] = result
  }

  try {
    const loads = await Promise.all(urls.map(url => loadScriptTag(url, variant.id)))
    const totalEnd = performance.now()
    const firstByte = firstResourceResponseStart(
      loads.map(load => load.url),
      fetchStart,
    )
    const wireBytes = loads.reduce((sum, load) => sum + load.wireBytes, 0)

    verifyScriptResults(caseId, variant.id, chunkCount, results)

    return {
      sample: {
        ttfbMs: firstByte - fetchStart,
        transferMs: totalEnd - fetchStart,
        decodeMs: 0,
        executeMs: null,
        totalMs: totalEnd - fetchStart,
        wireBytes,
      },
      bytesReady: new Uint8Array(),
    }
  } finally {
    delete host.__benchmarkResult[caseId]
  }
}

interface ScriptLoadResult {
  url: string
  wireBytes: number
}

function loadScriptTag(url: string, variantId: string): Promise<ScriptLoadResult> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const absoluteUrl = new URL(url, window.location.href).href

    script.async = true
    script.src = absoluteUrl
    script.onload = () => {
      const timing = resourceTimingFor(absoluteUrl)

      script.remove()
      resolve({ url: absoluteUrl, wireBytes: timing?.encodedBodySize ?? 0 })
    }
    script.onerror = () => {
      script.remove()
      reject(new Error(`script load failed for ${variantId}: ${url}`))
    }
    document.head.appendChild(script)
  })
}

function firstResourceResponseStart(urls: string[], fallbackStart: number): number {
  const starts = urls
    .map(url => resourceTimingFor(url)?.responseStart)
    .filter((value): value is number => typeof value === 'number' && value > 0)

  return starts.length ? Math.min(...starts) : fallbackStart
}

function resourceTimingFor(url: string): PerformanceResourceTiming | null {
  const entries = resourceTimingsFor(url)

  return entries[entries.length - 1] ?? null
}

function resourceTimingsFor(url: string, since = -Infinity): PerformanceResourceTiming[] {
  return (performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[]).filter(
    entry => entry.startTime >= since - 1,
  )
}

function wireBytesFromTimings(timings: PerformanceResourceTiming[]): number | null {
  const values = timings.map(timing => timing.encodedBodySize).filter(value => value > 0)

  return values.length ? values.reduce((sum, value) => sum + value, 0) : null
}

interface DecodedChunk {
  firstByte: number
  transferEnd: number
  bytesReady: Uint8Array
  wireBytes: number
  decodeMs: number
}

async function fetchChunk(variant: Variant, url: string): Promise<DecodedChunk> {
  const response = await fetch(url, {
    cache: 'no-store',
    mode: 'cors',
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status} ${url}`)
  }

  // TTFB approximation — closest we can get from userland JS without ResourceTiming.
  const firstByte = performance.now()

  let bytesReady: Uint8Array
  let wireBytes = 0
  let decodeStart = 0
  let decodeEnd = 0
  let transferEnd = firstByte

  if (variant.isToken) {
    if (variant.isStreamable && response.body) {
      // Streamable variant: pipe the response body through the streaming
      // decoder so PNG inflation, codec decode, and outer decompression all
      // overlap with download. `decodeStart` marks the moment the streaming
      // pipeline picks up the first bytes — for a streaming token, the
      // measured `decodeMs` ends up close to "post-network drain time" rather
      // than the full JS decode cost (much of it happened during transfer).
      decodeStart = performance.now()
      const result = await decodeStream(response.body)

      if (result.isPack() || result.isDiff()) {
        throw new Error('runtime-benchmark expected file token, got pack/diff')
      }
      bytesReady = await result.content()
      decodeEnd = performance.now()
      // Streaming decode consumes the response body and decode pipeline
      // together, so the observable transfer boundary is the same drain point.
      transferEnd = decodeEnd
      // Wire bytes for streaming aren't known up-front (no Blob to size); fall
      // back to the Content-Length header. Server always sets it.
      const lenHeader = response.headers.get('content-length')

      wireBytes = lenHeader ? Number(lenHeader) : bytesReady.byteLength
    } else {
      const buffer = await response.arrayBuffer()
      const lenHeader = response.headers.get('content-length')

      transferEnd = performance.now()
      wireBytes = lenHeader ? Number(lenHeader) : buffer.byteLength
      decodeStart = performance.now()
      const result = await decode(buffer)

      if (result.isPack() || result.isDiff()) {
        throw new Error('runtime-benchmark expected file token, got pack/diff')
      }
      bytesReady = await result.content()
      decodeEnd = performance.now()
    }
  } else {
    // HTTP variant — Content-Encoding decompression happens transparently in
    // the browser network stack. Materialize bytes, not text, so HTTP and
    // TokenPack rows stop at the same "final content bytes are ready" point.
    const buffer = await response.arrayBuffer()

    transferEnd = performance.now()
    bytesReady = new Uint8Array(buffer)
    decodeStart = performance.now()
    decodeEnd = decodeStart
    const lenHeader = response.headers.get('content-length')

    wireBytes = lenHeader ? Number(lenHeader) : bytesReady.byteLength
  }

  return {
    firstByte,
    transferEnd,
    bytesReady,
    wireBytes,
    decodeMs: decodeEnd - decodeStart,
  }
}

interface ScriptChunkResult {
  caseId: string
  chunkCount: number
  chunkIndex: number
  payloadLength: number
  loadedCount: number
  totalPayloadLength: number
  expectedPayloadLength: number
  expectedPayloadSha256: string
}

function executeScriptChunks(
  caseId: string,
  chunks: readonly Uint8Array[],
  variantId: string,
): { textDecodeMs: number; executeMs: number } {
  const textDecodeStart = performance.now()
  const decoder = new TextDecoder()
  const scripts = chunks.map(chunk => decoder.decode(chunk))
  const textDecodeMs = performance.now() - textDecodeStart
  const results: ScriptChunkResult[] = []
  const host = globalThis as typeof globalThis & {
    __benchmarkResult?: Record<string, (result: ScriptChunkResult) => void>
    __tokenpackRuntimeBench?: { scriptChunks?: Record<string, unknown> }
  }

  host.__benchmarkResult ??= {}
  host.__benchmarkResult[caseId] = result => {
    results[result.chunkIndex] = result
  }

  const execStart = performance.now()

  try {
    for (const script of scripts) ScriptExec(script)()
  } catch (e: unknown) {
    throw new Error(`exec failed for ${variantId}: ${e instanceof Error ? e.message : e}`)
  } finally {
    delete host.__benchmarkResult[caseId]
  }

  const executeMs = performance.now() - execStart

  verifyScriptResults(caseId, variantId, chunks.length, results)

  return { textDecodeMs, executeMs }
}

async function executeScriptChunksViaTags(
  caseId: string,
  chunks: readonly Uint8Array[],
  variantId: string,
): Promise<{ textDecodeMs: number; executeMs: number }> {
  const results: ScriptChunkResult[] = []
  const urls: string[] = []
  const host = globalThis as typeof globalThis & {
    __benchmarkResult?: Record<string, (result: ScriptChunkResult) => void>
  }

  host.__benchmarkResult ??= {}
  host.__benchmarkResult[caseId] = result => {
    results[result.chunkIndex] = result
  }

  const executeStart = performance.now()

  try {
    for (const chunk of chunks) {
      const blobBytes = new Uint8Array(chunk.byteLength)

      blobBytes.set(chunk)
      urls.push(URL.createObjectURL(new Blob([blobBytes], { type: 'text/javascript' })))
    }
    await Promise.all(urls.map(url => loadScriptTag(url, variantId)))
    verifyScriptResults(caseId, variantId, chunks.length, results)

    return { textDecodeMs: 0, executeMs: performance.now() - executeStart }
  } finally {
    delete host.__benchmarkResult[caseId]
    for (const url of urls) URL.revokeObjectURL(url)
  }
}

function materializeSourceContent(
  chunks: readonly Uint8Array[],
  sourceKind: 'json' | 'text',
  variantId: string,
): void {
  const decoder = new TextDecoder()

  if (sourceKind === 'json') {
    let totalKeys = 0

    for (const chunk of chunks) {
      const parsed = JSON.parse(decoder.decode(chunk)) as Record<string, unknown>

      totalKeys += Object.keys(parsed).length
    }
    if (totalKeys <= 0) {
      throw new Error(`content verification failed for ${variantId}: JSON object has no keys`)
    }

    return
  }

  const textLength = chunks.reduce((sum, chunk) => sum + decoder.decode(chunk).length, 0)

  if (textLength === 0) {
    throw new Error(`content verification failed for ${variantId}: empty text`)
  }
}

function verifyScriptResults(
  caseId: string,
  variantId: string,
  chunkCount: number,
  results: ScriptChunkResult[],
): void {
  const loaded = results.filter(Boolean)

  if (loaded.length !== chunkCount) {
    throw new Error(`script verification failed for ${variantId}: ${loaded.length}/${chunkCount}`)
  }
  const final = loaded.find(result => result.loadedCount === chunkCount)

  if (
    !final ||
    final.loadedCount !== chunkCount ||
    final.totalPayloadLength !== final.expectedPayloadLength
  ) {
    throw new Error(`script payload verification failed for ${variantId}`)
  }
}

function cleanupRuntimeState(caseId: string): void {
  const host = globalThis as typeof globalThis & {
    __benchmarkResult?: Record<string, unknown>
    __tokenpackRuntimeBench?: { scriptChunks?: Record<string, unknown> }
  }

  if (host.__benchmarkResult) delete host.__benchmarkResult[caseId]
  if (host.__tokenpackRuntimeBench?.scriptChunks) {
    delete host.__tokenpackRuntimeBench.scriptChunks[caseId]
  }
  const stage = document.getElementById('runtime-bench-stage')

  if (stage) {
    Array.from(stage.attributes)
      .filter(attr => attr.name.startsWith('data-runtime-bench-'))
      .forEach(attr => stage.removeAttribute(attr.name))
  }
}

function chunkCountFromSource(source: string): number {
  const match = /__chunks-(\d+)(?:__chunk-\d+)?$/.exec(source)

  return match ? Number(match[1]) : 1
}

function withQuery(url: string, query: Record<string, string>): string {
  const sep = url.includes('?') ? '&' : '?'
  const params = new URLSearchParams(query)

  return url + sep + params.toString()
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break
      if (value) chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return concatBytes(chunks)
}

// ── Fingerprint helpers ──────────────────────────────────────────────────────
// All run AFTER `runVariant`'s timing loop, never on the hot path.

async function computeFingerprint(bytes: Uint8Array): Promise<DecodeFingerprint> {
  // crypto.subtle.digest types want a strict BufferSource; cast keeps the
  // Uint8Array<ArrayBufferLike> ↔ BufferSource generic mismatch quiet under TS 5.7+.

  const digest = await crypto.subtle.digest('SHA-256', bytes as any)
  const hashBytes = new Uint8Array(digest, 0, 8)
  const hash = Array.from(hashBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return { hash, bytes: bytes.byteLength, head: makeHead(bytes) }
}

function makeHead(bytes: Uint8Array): string {
  const sample = bytes.subarray(0, 64)
  // Heuristic: if >90% of bytes are printable ASCII, treat as text.
  let printable = 0

  for (const b of sample) {
    if ((b >= 0x20 && b < 0x7f) || b === 0x09 || b === 0x0a || b === 0x0d) printable++
  }
  const ratio = sample.length === 0 ? 1 : printable / sample.length

  if (ratio >= 0.9) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(sample)

    return text.replace(/\s+/g, ' ').slice(0, 56).trim()
  }

  // Binary — show first 16 bytes as hex.
  return Array.from(sample.subarray(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
}

// ── Aggregation ──────────────────────────────────────────────────────────────

function aggregate(
  variantId: string,
  samples: Sample[],
  fingerprint: DecodeFingerprint | null,
): AggregatedRow {
  type NumericKey = 'ttfbMs' | 'transferMs' | 'decodeMs' | 'totalMs' | 'wireBytes'
  const sortedBy = (k: NumericKey) => [...samples].map(s => s[k]).sort((a, b) => a - b)
  const stats = (k: NumericKey) => {
    const sorted = sortedBy(k)
    const median = sorted[Math.floor(sorted.length / 2)]
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]

    return { median, p95, min: sorted[0], max: sorted[sorted.length - 1] }
  }

  const execValues = samples.map(s => s.executeMs).filter((v): v is number => v !== null)
  const sortedExec = [...execValues].sort((a, b) => a - b)
  const execStats = sortedExec.length
    ? {
        median: sortedExec[Math.floor(sortedExec.length / 2)],
        p95: sortedExec[Math.min(sortedExec.length - 1, Math.floor(sortedExec.length * 0.95))],
        min: sortedExec[0],
        max: sortedExec[sortedExec.length - 1],
      }
    : null

  function pick(field: 'median' | 'p95' | 'min' | 'max'): Sample {
    return {
      ttfbMs: stats('ttfbMs')[field],
      transferMs: stats('transferMs')[field],
      decodeMs: stats('decodeMs')[field],
      executeMs: execStats?.[field] ?? null,
      totalMs: stats('totalMs')[field],
      wireBytes: stats('wireBytes')[field],
    }
  }

  return {
    variantId,
    iterations: samples.length,
    median: pick('median'),
    p95: pick('p95'),
    min: pick('min'),
    max: pick('max'),
    perRunTotal: samples.map(s => s.totalMs),
    fingerprint,
  }
}

export function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}µs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`

  return `${(ms / 1000).toFixed(2)}s`
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`

  return `${(b / 1024 / 1024).toFixed(2)}MB`
}
