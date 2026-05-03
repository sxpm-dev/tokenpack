export interface Style {
  gradient?: {
    from: [number, number, number]
    to: [number, number, number]
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  background?: [number, number, number]
  opacity: number
}

export interface HeaderData {
  version: number
  algorithmId: number
  fileLength: number       // bytes the codec encodes (compressed length when compressionLevel > 0)
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
  compressionLevel: number   // 0=none, 1=deflate, 2=brotli
  uncompressedLength: number // original file byte count (0 when compressionLevel === 0)
  cellSize: number           // 0|1=dense, 2+=dot mode (dots per cell side)
  dataPixelCount: number     // actual pixels the codec used (stored for dot mode decode)
}

export interface EncodeOptions {
  algo?: string
  style?: Partial<Style>
  width?: number
  out: string
  compress?: boolean  // true → brotli (best compression); falls back to uncompressed if larger
  cellSize?: number   // 1=dense (default), 5=sparse dots (reference-image look)
}

export interface DecodeOptions {
  out: string
}
