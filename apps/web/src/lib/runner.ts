// Generic per-variant runner. Calls `variant.run(ctx)` N iterations, aggregates
// the metrics, and computes a fingerprint of the decoded bytes off the timing
// hot path (so hash CPU never enters any reported number).

import type { RunCtx, RunMetric, VariantDef, VariantStageBreakdown } from '@/scenarios/types'

export interface DecodeFingerprint {
  /** First 8 bytes of SHA-256, hex-encoded. */
  hash: string
  /** Total decoded bytes. */
  bytes: number
  /** Truncated head of the decoded payload (utf-8 if printable, else hex). */
  head: string
}

export interface AggregatedStats {
  median: number
  p95: number
  min: number
  max: number
}

export interface AggregatedRow {
  variantId: string
  iterations: number
  totalMs: AggregatedStats
  wireBytes: number
  /** Median of each declared stage. Only present if at least one sample reported it. */
  stages?: Partial<Record<keyof VariantStageBreakdown, AggregatedStats>>
  fingerprint: DecodeFingerprint | null
  perRunTotalMs: number[]
}

export async function runVariant(
  variant: VariantDef,
  ctx: RunCtx,
  iterations: number,
): Promise<AggregatedRow> {
  const samples: RunMetric[] = []
  let firstDecoded: Uint8Array | null = null

  for (let i = 0; i < iterations; i++) {
    const metric = await variant.run(ctx)

    samples.push(metric)
    // Retain only iter0 bytes for fingerprinting; later iters' bytes are
    // free to be GC'd so multi-MB payloads don't pile up.
    if (i === 0) firstDecoded = metric.decodedBytes
  }

  const fingerprint = firstDecoded ? await computeFingerprint(firstDecoded) : null

  return aggregate(variant.id, samples, fingerprint)
}

async function computeFingerprint(bytes: Uint8Array): Promise<DecodeFingerprint> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as any)
  const hashBytes = new Uint8Array(digest, 0, 8)
  const hash = Array.from(hashBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return { hash, bytes: bytes.byteLength, head: makeHead(bytes) }
}

function makeHead(bytes: Uint8Array): string {
  const sample = bytes.subarray(0, 64)
  let printable = 0

  for (const b of sample) {
    if ((b >= 0x20 && b < 0x7f) || b === 0x09 || b === 0x0a || b === 0x0d) printable++
  }
  if (sample.length > 0 && printable / sample.length >= 0.9) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(sample)

    return text.replace(/\s+/g, ' ').slice(0, 56).trim()
  }

  return Array.from(sample.subarray(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
}

function aggregate(
  variantId: string,
  samples: RunMetric[],
  fingerprint: DecodeFingerprint | null,
): AggregatedRow {
  const totalMs = stats(samples.map(s => s.totalMs))
  const stages = aggregateStages(samples)
  // Wire bytes is constant across iterations for a given fixture; use the median
  // for safety in case a variant reports something dynamic.
  const wireBytes = stats(samples.map(s => s.wireBytes)).median

  return {
    variantId,
    iterations: samples.length,
    totalMs,
    wireBytes,
    stages,
    fingerprint,
    perRunTotalMs: samples.map(s => s.totalMs),
  }
}

function aggregateStages(
  samples: RunMetric[],
): Partial<Record<keyof VariantStageBreakdown, AggregatedStats>> | undefined {
  const keys: (keyof VariantStageBreakdown)[] = ['ttfbMs', 'transferMs', 'decodeMs', 'executeMs']
  const out: Partial<Record<keyof VariantStageBreakdown, AggregatedStats>> = {}
  let any = false

  for (const k of keys) {
    const values = samples.map(s => s.stages?.[k]).filter((v): v is number => typeof v === 'number')

    if (values.length === 0) continue
    out[k] = stats(values)
    any = true
  }

  return any ? out : undefined
}

function stats(values: number[]): AggregatedStats {
  const sorted = [...values].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]

  return { median, p95, min: sorted[0], max: sorted[sorted.length - 1] }
}

// ── Formatting helpers used by the table ──────────────────────────────────────

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
