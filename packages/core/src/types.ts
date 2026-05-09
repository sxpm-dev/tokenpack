export type ImageFormat = 'png' | 'avif' | 'webp'

export interface HeaderData {
  version: number
  algorithmId: number
  fileLength: number // bytes the codec encodes (compressed length when compressionLevel > 0)
  width: number
  height: number
  ecLevel: number
  compressionLevel: number // 0=none, 1=deflate, 2=brotli
  uncompressedLength: number // original file byte count (0 when compressionLevel === 0)
  cellSize: number // 0|1=dense, 2+=dot mode (dots per cell side)
  dataPixelCount: number // actual pixels the codec used (stored for dot mode decode)
  channels: 1 | 2 | 3 | 4 // bpp stored in header
  preFecLength: number // payload byte count BEFORE FEC encode (0 when fecLevel === 0)
}

/**
 * Decode hint passed to algorithm classes when reading a buffer back.
 * Algorithm-level options live on the per-instance `AlgorithmOptions` object;
 * this type only carries CLI-style hints (key + extension override).
 */
export interface DecodeOptions {
  /** Decryption key — required if the token was encrypted. */
  key?: string
  /** Optional file extension hint to pick the surface decoder (default '.png'). */
  ext?: string
}
