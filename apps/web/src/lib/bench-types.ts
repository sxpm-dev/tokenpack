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
  /** Row family: TokenPack artifact or traditional archive baseline. */
  kind?: 'token' | 'archive'
  /** Algorithm name as registered in the catalog (e.g. `pixel-range`). */
  codecName: string
  outerCompression: string
  channels?: number
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  condition?: string
  encodeMs: number
  /** Fetch/stream + decode wall time until decoded payload is ready. */
  speedMs?: number
  /** Network/body transfer time from the throttled fetch harness. */
  fetchMs?: number
  /** Decode tail: batch CPU decode after fetch, or stream drain after transfer. */
  decodeTailMs?: number
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

export interface ArchiveTimeEntry {
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  format: string
  encodeMs: number
  decodeMs: number
  bytes: number
  originalBytes: number
}
