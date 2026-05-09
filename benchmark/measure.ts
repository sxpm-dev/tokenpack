// Measurement helpers — warmup, multiple samples, percentiles, optional GC.
// Used by benchmark/run.ts and benchmark/run-extended.ts to cut variance.
//
// Variance-reduction recipe:
//   1. Run `warmup` iterations and discard (JIT, page cache).
//   2. For each measured iteration: try `globalThis.gc?.()` (no-op without
//      `NODE_OPTIONS=--expose-gc`), yield to the loop, then time the call.
//   3. Report median + p95 + stddev — single-number means hide tail variance.
//
// Caller is responsible for picking a function that does ONE unit of work
// (one decode, one encode). Composing multiple operations inside `fn` will
// blur the per-op variance.

const now = (): number => performance.now()

export interface Stats {
  /** All raw samples, in call order. */
  samples: number[]
  mean: number
  median: number
  /** 95th percentile — sample[ceil(0.95 * n) - 1] after sort. */
  p95: number
  stddev: number
  min: number
  max: number
}

export interface MeasureOptions {
  warmup?: number
  samples?: number
  /** Try to call `globalThis.gc?.()` between samples. No-op without --expose-gc. */
  gc?: boolean
}

const DEFAULT_WARMUP = 2
const DEFAULT_SAMPLES = 10

let warnedNoGc = false

function maybeGc(enabled: boolean): void {
  if (!enabled) return
  const gc = (globalThis as { gc?: () => void }).gc

  if (typeof gc === 'function') {
    gc()
  } else if (!warnedNoGc) {
    warnedNoGc = true
    console.warn(
      '[measure] globalThis.gc not available — invoke node with NODE_OPTIONS=--expose-gc for less variance',
    )
  }
}

function settle(): Promise<void> {
  return new Promise<void>(resolve => setImmediate(resolve))
}

function computeStats(samples: number[]): Stats {
  const n = samples.length

  if (n === 0) {
    return { samples: [], mean: 0, median: 0, p95: 0, stddev: 0, min: 0, max: 0 }
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const mean = samples.reduce((s, v) => s + v, 0) / n
  const median =
    n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  const p95 = sorted[Math.max(0, Math.ceil(0.95 * n) - 1)]
  const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const stddev = Math.sqrt(variance)

  return { samples, mean, median, p95, stddev, min: sorted[0], max: sorted[n - 1] }
}

/**
 * Measure `fn` repeatedly, return statistics over the timed samples.
 * `warmup` iterations run first and are discarded.
 */
export async function measure(
  fn: () => Promise<unknown> | unknown,
  options: MeasureOptions = {},
): Promise<Stats> {
  const warmup = options.warmup ?? DEFAULT_WARMUP
  const samples = options.samples ?? DEFAULT_SAMPLES
  const useGc = options.gc ?? true

  for (let i = 0; i < warmup; i++) {
    await fn()
  }

  const timings: number[] = []

  for (let i = 0; i < samples; i++) {
    maybeGc(useGc)
    await settle()
    const t = now()

    await fn()
    timings.push(now() - t)
  }

  return computeStats(timings)
}

/** Pretty-print a Stats: "12.4 ± 0.8 (median, p95=14.1)". */
export function formatStats(s: Stats, unit: 'ms' | 'us' = 'ms'): string {
  if (s.samples.length === 0) return '—'
  const u = unit === 'us' ? 'µs' : 'ms'
  const m = s.median.toFixed(s.median < 1 ? 2 : 1)
  const sd = s.stddev.toFixed(s.stddev < 1 ? 2 : 1)
  const p = s.p95.toFixed(s.p95 < 1 ? 2 : 1)

  return `${m}${u} ± ${sd} (p95=${p}${u})`
}
