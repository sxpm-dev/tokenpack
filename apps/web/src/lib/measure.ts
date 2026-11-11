// Performance API recorder for runtime-experiments scenarios.
//
// Each scenario calls `bench(label, fn)` to time a single operation. Use
// `runRepeated` to run a scenario N times and report median/p95.

export interface BenchResult {
  label: string
  ms: number
  bytes?: number
}

export interface AggregatedResult {
  label: string
  iterations: number
  median: number
  p95: number
  min: number
  max: number
  bytes?: number
  perRun: number[]
}

const hrtime = typeof performance !== 'undefined' ? performance : Date

export async function bench<T>(
  label: string,
  fn: () => Promise<T> | T,
): Promise<{ result: T; bench: BenchResult }> {
  const t0 = hrtime.now()
  const result = await fn()
  const ms = hrtime.now() - t0

  return { result, bench: { label, ms } }
}

export async function runRepeated(
  label: string,
  iterations: number,
  fn: () => Promise<{ ms: number; bytes?: number }>,
): Promise<AggregatedResult> {
  const samples: number[] = []
  let bytes: number | undefined

  for (let i = 0; i < iterations; i++) {
    const { ms, bytes: b } = await fn()

    samples.push(ms)
    if (b != null) bytes = b
  }

  const sorted = [...samples].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]

  return {
    label,
    iterations,
    median,
    p95,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    bytes,
    perRun: samples,
  }
}

export function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}µs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`

  return `${(ms / 1000).toFixed(2)}s`
}

export function formatBytes(b: number | undefined): string {
  if (b == null) return '—'
  if (b < 1024) return `${b}B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`

  return `${(b / 1024 / 1024).toFixed(2)}MB`
}
