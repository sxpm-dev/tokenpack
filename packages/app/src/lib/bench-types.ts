/** Statistics over multiple timed samples (warmup discarded). Optional on
 *  result rows so legacy result files (pre measurement-helper rewrite) keep
 *  rendering: when `*Stats` is missing, the UI falls back to the scalar
 *  `encodeMs` / `decodeMs` (which are now the *median* of the new samples). */
export interface BenchStats {
  samples: number[]
  mean: number
  median: number
  p95: number
  stddev: number
  min: number
  max: number
}

export interface ExtBenchRow {
  codecId: number
  /** Algorithm name as registered in the catalog (e.g. `pixel-range`). */
  codecName: string
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
  /** Surface id of the algorithm: 'png' | 'png-upng' | 'webp' | 'avif' | 'png-stream'. */
  surfaceId?: string
  /** Compressor id, e.g. 'deflate-6' | 'brotli-11' | 'none'. */
  compressorId?: string
  /** Drawer class name, e.g. 'DenseDrawer' | 'DotDrawer'. */
  drawerName?: string
  /** Human-readable summary of non-default options (cellSize, fecMode, etc.). */
  optionsSummary?: string
  /** Full statistics from `measure()`. Present on rows produced after the
   *  measurement-helper rewrite. */
  encodeStats?: BenchStats
  decodeStats?: BenchStats
  /** Path actually taken by the runner. Lets the UI confirm dispatch was correct. */
  pathTaken?: 'stream' | 'batch'
}
