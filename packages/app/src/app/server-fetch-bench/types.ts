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
}

export interface BestEntry {
  group: string
  scenario: string
  total: number
  firstByte: number
  transfer: number
  decode: number
}
