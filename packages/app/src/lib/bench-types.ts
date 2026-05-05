export interface ExtBenchRow {
  codecId: number
  codecName: string
  family: 'legacy' | 'A' | 'B' | 'C'
  outerCompression: string
  channels: number
  source: string
  encodeMs: number
  decodeMs: number
  roundTripMs: number
  tokenBytes: number
  originalBytes: number
  ratio: number
  throughputMBps: number
  isStreaming: boolean
  isBrowserSafe: boolean
  error?: string
}
