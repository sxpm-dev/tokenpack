export interface BenchRow {
  scenario: string
  source: string
  condition: string
  ttfb: number
  fetchMs: number
  decodeMs: number
  totalMs: number
  firstByteMs: number
  transferBytes: number
  decodedBytes: number
  throughputMBps: number
  /** Whether the runner used the streaming decode path. Lets the dashboard
   *  confirm dispatch was correct per algo's `streamable` capability. */
  pathTaken?: 'stream' | 'batch'
  /** Stddev of `totalMs` across timed samples. */
  totalMsStddev?: number
}

export type SummarySortKey =
  | 'scenario'
  | 'ttfb'
  | 'total'
  | 'firstByte'
  | 'decode'
  | 'transfer'
  | 'throughput'

export interface SummaryRow {
  scenario: string
  ttfb: number
  total: number
  firstByte: number
  decode: number
  transfer: number
  throughput: number
  pathTaken?: 'stream' | 'batch'
  totalMsStddev?: number
}

export interface BestEntry {
  group: string
  scenario: string
  total: number
  firstByte: number
  transfer: number
  decode: number
}
