export interface Style {
  gradient?: {
    from: [number, number, number]
    to: [number, number, number]
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  background?: [number, number, number]
  opacity: number
}

export type ImageFormat = 'png' | 'avif' | 'webp'

export interface HeaderData {
  version: number
  algorithmId: number
  fileLength: number // bytes the codec encodes (compressed length when compressionLevel > 0)
  width: number
  height: number
  styleFlags: number
  ecLevel: number
  codecMeta: Uint8Array
  gradientFrom: [number, number, number]
  gradientTo: [number, number, number]
  gradientDirection: number
  backgroundOpacity: number
  backgroundColor: [number, number, number]
  compressionLevel: number // 0=none, 1=deflate, 2=brotli
  uncompressedLength: number // original file byte count (0 when compressionLevel === 0)
  cellSize: number // 0|1=dense, 2+=dot mode (dots per cell side)
  dataPixelCount: number // actual pixels the codec used (stored for dot mode decode)
  chunkIndex: number    // 0-based index of this chunk (0 when not chunked)
  chunkTotal: number    // total chunk count (1 when not chunked)
  streamId: number      // uint32 hash of full compressed stream — ties chunks together
  channels: 1 | 2 | 3 | 4  // bpp stored in header
}

export interface EncodeOptions {
  algo?: string
  style?: Partial<Style>
  width?: number
  out: string
  compress?: boolean        // true → brotli-11; falls back to uncompressed if larger
  compressionMode?: string  // overrides compress when set; one of: none, deflate-1, deflate-6, deflate-9, brotli-4, brotli-6, brotli-11
  cellSize?: number         // 1=dense (default), 5=sparse dots (reference-image look)
  key?: string              // optional AES-256-GCM encryption password
  channels?: 1 | 2 | 3 | 4 // bytes of data per pixel (default 3)
  format?: ImageFormat      // image container (default 'png')
  streaming?: boolean       // write PNG with small IDAT chunks so stream-decoder gets pixels progressively
}

export interface DecodeOptions {
  out: string
  key?: string       // required if token was encrypted
}
