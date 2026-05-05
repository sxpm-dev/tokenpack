import type { HeaderData } from './types'

export const HEADER_PIXELS = 32
export const HEADER_BYTES = HEADER_PIXELS * 3 // 96

// ── Compact header (2 pixels = 6 bytes) ─────────────────────────────────────
// First byte 0xC1 distinguishes compact from full (0xC0). Saves 90 bytes of
// header overhead for small tokens that don't need style metadata.
export const COMPACT_MAGIC = 0xc1
export const COMPACT_HEADER_PIXELS = 2

// BPP flags encoding for compact header bits 3-2
const BPP_FLAGS: Record<number, 1 | 2 | 3 | 4> = { 0: 3, 1: 1, 2: 2, 3: 4 }
const FLAGS_BPP: Record<number, number> = { 1: 1, 2: 2, 3: 0, 4: 3 }

export interface CompactHeader {
  algoId: number
  // flags byte: bits 3-2: bpp encoding; bit 1 = brotli compressed, bit 0 = AES-256-GCM encrypted
  // Old tokens stored compressionLevel (0 or 2) here — bit 0 was always 0, so backward compatible.
  flags: number
  dataLength: number
  channels: 1 | 2 | 3 | 4 // derived from flags bits 3-2
}

export function isCompactToken(pixels: Uint8Array): boolean {
  return pixels[0] === COMPACT_MAGIC
}

export function writeCompactHeader(
  pixels: Uint8Array,
  d: Omit<CompactHeader, 'channels'> & { channels?: 1 | 2 | 3 | 4 },
): void {
  const bppBits = FLAGS_BPP[d.channels ?? 3] ?? 0

  pixels[0] = COMPACT_MAGIC
  pixels[1] = d.algoId
  pixels[2] = (bppBits << 2) | (d.flags & 0b11)
  pixels[3] = (d.dataLength >>> 16) & 0xff
  pixels[4] = (d.dataLength >>> 8) & 0xff
  pixels[5] = d.dataLength & 0xff
}

export function readCompactHeader(pixels: Uint8Array): CompactHeader {
  if (pixels[0] !== COMPACT_MAGIC) throw new Error('not a compact tokenpack image')
  const rawFlags = pixels[2]
  const bppBits = (rawFlags >> 2) & 0b11

  return {
    algoId: pixels[1],
    flags: rawFlags,
    dataLength: (pixels[3] << 16) | (pixels[4] << 8) | pixels[5],
    channels: BPP_FLAGS[bppBits] ?? 3,
  }
}

export function writeHeader(pixels: Uint8Array, d: HeaderData): void {
  pixels[0] = 0xc0
  pixels[1] = 0xde
  pixels[2] = 0xae
  pixels[3] = 0x54
  pixels[4] = d.version
  pixels[5] = d.algorithmId
  pixels[6] = (d.fileLength >>> 24) & 0xff
  pixels[7] = (d.fileLength >>> 16) & 0xff
  pixels[8] = (d.fileLength >>> 8) & 0xff
  pixels[9] = d.fileLength & 0xff
  pixels[10] = (d.width >>> 8) & 0xff
  pixels[11] = d.width & 0xff
  pixels[12] = (d.height >>> 8) & 0xff
  pixels[13] = d.height & 0xff
  pixels[14] = d.styleFlags
  pixels[15] = d.ecLevel
  pixels.set(d.codecMeta.slice(0, 16), 16)
  pixels[32] = d.gradientFrom[0]
  pixels[33] = d.gradientFrom[1]
  pixels[34] = d.gradientFrom[2]
  pixels[35] = d.gradientTo[0]
  pixels[36] = d.gradientTo[1]
  pixels[37] = d.gradientTo[2]
  pixels[38] = d.gradientDirection
  pixels[39] = d.backgroundOpacity
  pixels[40] = d.backgroundColor[0]
  pixels[41] = d.backgroundColor[1]
  pixels[42] = d.backgroundColor[2]
  pixels[43] = d.compressionLevel
  pixels[44] = (d.uncompressedLength >>> 24) & 0xff
  pixels[45] = (d.uncompressedLength >>> 16) & 0xff
  pixels[46] = (d.uncompressedLength >>> 8) & 0xff
  pixels[47] = d.uncompressedLength & 0xff
  pixels[48] = d.cellSize
  pixels[49] = (d.dataPixelCount >>> 24) & 0xff
  pixels[50] = (d.dataPixelCount >>> 16) & 0xff
  pixels[51] = (d.dataPixelCount >>> 8) & 0xff
  pixels[52] = d.dataPixelCount & 0xff
  // bytes 53-60: chunk metadata (zeros = single-chunk / legacy)
  pixels[53] = (d.chunkIndex >>> 8) & 0xff
  pixels[54] = d.chunkIndex & 0xff
  pixels[55] = (d.chunkTotal >>> 8) & 0xff
  pixels[56] = d.chunkTotal & 0xff
  pixels[57] = (d.streamId >>> 24) & 0xff
  pixels[58] = (d.streamId >>> 16) & 0xff
  pixels[59] = (d.streamId >>> 8) & 0xff
  pixels[60] = d.streamId & 0xff
  // byte 61: bpp — 0 or 3 means default bpp=3 (backward compat)
  pixels[61] = d.channels ?? 3
}

export function readHeader(pixels: Uint8Array): HeaderData {
  if (pixels[0] !== 0xc0 || pixels[1] !== 0xde || pixels[2] !== 0xae || pixels[3] !== 0x54) {
    throw new Error('not a tokenpack image')
  }
  const rawChannels = pixels[61]

  return {
    version: pixels[4],
    algorithmId: pixels[5],
    fileLength: ((pixels[6] << 24) | (pixels[7] << 16) | (pixels[8] << 8) | pixels[9]) >>> 0,
    width: (pixels[10] << 8) | pixels[11],
    height: (pixels[12] << 8) | pixels[13],
    styleFlags: pixels[14],
    ecLevel: pixels[15],
    codecMeta: new Uint8Array(pixels.buffer, pixels.byteOffset + 16, 16).slice(),
    gradientFrom: [pixels[32], pixels[33], pixels[34]],
    gradientTo: [pixels[35], pixels[36], pixels[37]],
    gradientDirection: pixels[38],
    backgroundOpacity: pixels[39],
    backgroundColor: [pixels[40], pixels[41], pixels[42]],
    compressionLevel: pixels[43],
    uncompressedLength:
      ((pixels[44] << 24) | (pixels[45] << 16) | (pixels[46] << 8) | pixels[47]) >>> 0,
    cellSize: pixels[48],
    dataPixelCount:
      ((pixels[49] << 24) | (pixels[50] << 16) | (pixels[51] << 8) | pixels[52]) >>> 0,
    chunkIndex: (pixels[53] << 8) | pixels[54],
    chunkTotal: (pixels[55] << 8) | pixels[56] || 1, // 0 in old tokens → treat as 1
    streamId: ((pixels[57] << 24) | (pixels[58] << 16) | (pixels[59] << 8) | pixels[60]) >>> 0,
    channels: (rawChannels === 0 ? 3 : rawChannels) as 1 | 2 | 3 | 4,
  }
}
