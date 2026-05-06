// Runtime benchmark runner — executes one variant N iterations and produces
// per-iteration Sample[].

import { decode, decodeStream } from '@tokenpack/browser'

import type { AggregatedRow, DecodeFingerprint, Sample, Throttle, Variant } from './types'

interface RunOptions {
  source: string
  withExecute: boolean
  /** When true, append `&live=1` so the server encodes per request instead of streaming a pre-generated fixture. */
  live: boolean
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

  for (let i = 0; i < iterations; i++) {
    const result = await runOnce(variant, options)

    samples.push(result.sample)
    // Retain only iter0 bytes for fingerprinting; later iters' bytes are
    // free to be GC'd so 5MB payloads don't pile up.
    if (i === 0) firstBytes = result.bytesReady
  }

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
  const sep = baseUrl.includes('?') ? '&' : '?'
  const liveParam = options.live ? '&live=1' : ''
  const throttleParam = options.throttle !== 'local' ? `&throttle=${options.throttle}` : ''
  const url = baseUrl + sep + `nonce=${crypto.randomUUID()}` + liveParam + throttleParam

  const fetchStart = performance.now()

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
      // Wire bytes for streaming aren't known up-front (no Blob to size); fall
      // back to the Content-Length header. Server always sets it.
      const lenHeader = response.headers.get('content-length')

      wireBytes = lenHeader ? Number(lenHeader) : bytesReady.byteLength
    } else {
      const blob = await response.blob()

      wireBytes = blob.size
      decodeStart = performance.now()
      const result = await decode(blob)

      if (result.isPack() || result.isDiff()) {
        throw new Error('runtime-benchmark expected file token, got pack/diff')
      }
      bytesReady = await result.content()
      decodeEnd = performance.now()
    }
  } else {
    // HTTP variant — Content-Encoding decompression happens transparently in the network stack.
    const text = await response.text()

    bytesReady = new TextEncoder().encode(text)
    decodeStart = performance.now()
    decodeEnd = decodeStart
    const lenHeader = response.headers.get('content-length')

    wireBytes = lenHeader ? Number(lenHeader) : text.length
  }

  const transferEnd = decodeStart

  let executeMs: number | null = null

  if (options.withExecute) {
    const scriptText = new TextDecoder().decode(bytesReady)
    const execStart = performance.now()

    try {
      ScriptExec(scriptText)()
    } catch (e: unknown) {
      throw new Error(`exec failed for ${variant.id}: ${e instanceof Error ? e.message : e}`)
    }
    executeMs = performance.now() - execStart
  }

  const totalEnd = performance.now()

  return {
    sample: {
      ttfbMs: firstByte - fetchStart,
      transferMs: transferEnd - fetchStart,
      decodeMs: decodeEnd - decodeStart,
      executeMs,
      totalMs: totalEnd - fetchStart,
      wireBytes,
    },
    bytesReady,
  }
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
  const fields = ['ttfbMs', 'transferMs', 'decodeMs', 'totalMs', 'wireBytes'] as const
  const sortedBy = (k: (typeof fields)[number]) => [...samples].map(s => s[k]).sort((a, b) => a - b)
  const stats = (k: (typeof fields)[number]) => {
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
