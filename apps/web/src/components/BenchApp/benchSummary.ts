// Sample aggregation for the in-page bench: median across repeated passes,
// plus wire-byte accounting read from the fixture iframe.

export interface WireBytes {
  requests: number
  transferBytes: number
  encodedBytes: number
  decodedBytes: number
}

export interface RunSample {
  totalMs: number
  phases: Record<string, number>
  bytes: WireBytes | null
}

export interface RunSummary {
  runs: number
  totalMs: number
  minMs: number
  maxMs: number
  phases: Record<string, number>
  bytes: WireBytes | null
}

export interface BenchFrameWindow extends Window {
  __BENCH_BOOT_DONE?: number
  __BENCH_PHASES?: Record<string, number>
  __BENCH_BYTES?: WireBytes
  __BENCH_ERROR?: string
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

export function summarizeRuns(samples: RunSample[]): RunSummary {
  const totals = samples.map(sample => sample.totalMs)
  const phaseKeys = new Set(samples.flatMap(sample => Object.keys(sample.phases)))
  const phases = Object.fromEntries(
    [...phaseKeys].map(key => [
      key,
      median(
        samples.flatMap(sample => (sample.phases[key] !== undefined ? [sample.phases[key]] : [])),
      ),
    ]),
  )
  const byteSamples = samples.flatMap(sample => (sample.bytes ? [sample.bytes] : []))
  const bytes: WireBytes | null =
    byteSamples.length === 0
      ? null
      : {
          requests: median(byteSamples.map(b => b.requests)),
          transferBytes: median(byteSamples.map(b => b.transferBytes)),
          encodedBytes: median(byteSamples.map(b => b.encodedBytes)),
          decodedBytes: median(byteSamples.map(b => b.decodedBytes)),
        }

  return {
    runs: samples.length,
    totalMs: median(totals),
    minMs: Math.min(...totals),
    maxMs: Math.max(...totals),
    phases,
    bytes,
  }
}

/**
 * Read wire bytes from the fixture iframe. The fixture runtime publishes
 * __BENCH_BYTES at boot-done (preferred — it raises the resource-timing
 * buffer before assets load). Fall back to reading the iframe's resource
 * timing directly for fixtures built before the bytes instrumentation;
 * that path may under-count past 250 entries.
 */
export function readFrameWireBytes(frame: BenchFrameWindow): WireBytes | null {
  if (frame.__BENCH_BYTES) return frame.__BENCH_BYTES

  try {
    const totals = { requests: 0, transferBytes: 0, encodedBytes: 0, decodedBytes: 0 }
    const resources = frame.performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    for (const entry of resources) {
      if (!entry.name.startsWith('http')) continue
      totals.requests += 1
      totals.transferBytes += entry.transferSize
      totals.encodedBytes += entry.encodedBodySize
      totals.decodedBytes += entry.decodedBodySize
    }

    const nav = frame.performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined

    if (nav) {
      totals.requests += 1
      totals.transferBytes += nav.transferSize
      totals.encodedBytes += nav.encodedBodySize
      totals.decodedBytes += nav.decodedBodySize
    }

    return totals
  } catch {
    return null
  }
}

export function formatMs(value: number): string {
  return `${Math.max(0, Math.round(value))}ms`
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0B'
  if (bytes < 1024) return `${Math.round(bytes)}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`

  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
