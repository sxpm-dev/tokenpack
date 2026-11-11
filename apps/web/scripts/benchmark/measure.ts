/* eslint-disable no-console */
// Measurement helpers — Tinybench warmup, multiple samples, percentiles, optional GC.
// Used by scripts/benchmark/run.ts and scripts/benchmark/run-extended.ts to cut variance.
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

import { Bench } from 'tinybench'

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
  hz?: number
  rme?: number
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
  const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
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
  const bench = new Bench({
    iterations: samples,
    time: 0,
    warmupIterations: warmup,
    warmupTime: 0,
    throws: true,
    setup: async (_task, mode) => {
      if (mode !== 'run') return
      maybeGc(useGc)
      await settle()
    },
  })

  bench.add('measure', fn)
  await bench.warmup()
  await bench.run()
  const result = bench.tasks[0]?.result

  if (!result) return computeStats([])

  const stats = computeStats(result.samples)

  return {
    ...stats,
    mean: result.mean,
    stddev: result.sd,
    min: result.min,
    max: result.max,
    hz: result.hz,
    rme: result.rme,
  }
}

export async function measureOnce<T>(fn: () => Promise<T> | T): Promise<{ value: T; ms: number }> {
  let value: T | undefined
  const bench = new Bench({
    iterations: 1,
    time: 0,
    warmupIterations: 0,
    warmupTime: 0,
    throws: true,
  })

  bench.add('measure-once', async () => {
    value = await fn()
  })
  await bench.run()

  return {
    value: value as T,
    ms: bench.tasks[0]?.result?.samples[0] ?? 0,
  }
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
