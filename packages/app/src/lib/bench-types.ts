export interface ExtBenchRow {
  codecId: number
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
}
