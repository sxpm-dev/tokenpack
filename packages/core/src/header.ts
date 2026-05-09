import type { HeaderData } from './types'

// ── Full header (10 pixels = 30 bytes) ──────────────────────────────────────
// Compact layout — only the fields the decode pipeline actually needs. The
// previous 32-pixel format carried gradient/background/chunk metadata that
// was never read; those bytes are gone now (and old tokens are not readable).
export const HEADER_PIXELS = 10
export const HEADER_BYTES = HEADER_PIXELS * 3 // 30

// ── Compact header (2 pixels = 6 bytes) ─────────────────────────────────────
// First byte 0xC1 distinguishes compact from full (0xC0). Saves 24 bytes of
// header overhead for small tokens that don't need the full metadata set.
export const COMPACT_MAGIC = 0xc1
export const COMPACT_HEADER_PIXELS = 2

// BPP flags encoding for compact header bits 3-2
const BPP_FLAGS: Record<number, 1 | 2 | 3 | 4> = { 0: 3, 1: 1, 2: 2, 3: 4 }
const FLAGS_BPP: Record<number, number> = { 1: 1, 2: 2, 3: 0, 4: 3 }

export interface CompactHeader {
  algoId: number
  // flags byte: bits 3-2: bpp encoding; bit 1 = brotli compressed, bit 0 = AES-256-GCM encrypted
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
  pixels[14] = d.ecLevel
  pixels[15] = d.compressionLevel
  pixels[16] = (d.uncompressedLength >>> 24) & 0xff
  pixels[17] = (d.uncompressedLength >>> 16) & 0xff
  pixels[18] = (d.uncompressedLength >>> 8) & 0xff
  pixels[19] = d.uncompressedLength & 0xff
  pixels[20] = d.cellSize
  pixels[21] = (d.dataPixelCount >>> 24) & 0xff
  pixels[22] = (d.dataPixelCount >>> 16) & 0xff
  pixels[23] = (d.dataPixelCount >>> 8) & 0xff
  pixels[24] = d.dataPixelCount & 0xff
  pixels[25] = d.channels
  pixels[26] = (d.preFecLength >>> 24) & 0xff
  pixels[27] = (d.preFecLength >>> 16) & 0xff
  pixels[28] = (d.preFecLength >>> 8) & 0xff
  pixels[29] = d.preFecLength & 0xff
}

// ── Error-correction byte (byte 14) layout ───────────────────────────────────
//   bit 0     : encryption flag (1 = AES-256-GCM encrypted)
//   bits 1-3  : FEC level (0 = none, 1 = rs-5, 2 = rs-15, 3 = rs-25, 4-7 reserved)
//   bits 4-7  : reserved
export function encodeEcByte(encrypted: boolean, fecLevel: number): number {
  if (fecLevel < 0 || fecLevel > 7) throw new Error(`fecLevel out of range: ${fecLevel}`)

  return (encrypted ? 1 : 0) | ((fecLevel & 0b111) << 1)
}

export function decodeEcByte(b: number): { encrypted: boolean; fecLevel: number } {
  return { encrypted: (b & 1) !== 0, fecLevel: (b >> 1) & 0b111 }
}

export function readHeader(pixels: Uint8Array): HeaderData {
  if (pixels[0] !== 0xc0 || pixels[1] !== 0xde || pixels[2] !== 0xae || pixels[3] !== 0x54) {
    throw new Error('not a tokenpack image')
  }
  const rawChannels = pixels[25]

  return {
    version: pixels[4],
    algorithmId: pixels[5],
    fileLength: ((pixels[6] << 24) | (pixels[7] << 16) | (pixels[8] << 8) | pixels[9]) >>> 0,
    width: (pixels[10] << 8) | pixels[11],
    height: (pixels[12] << 8) | pixels[13],
    ecLevel: pixels[14],
    compressionLevel: pixels[15],
    uncompressedLength:
      ((pixels[16] << 24) | (pixels[17] << 16) | (pixels[18] << 8) | pixels[19]) >>> 0,
    cellSize: pixels[20],
    dataPixelCount:
      ((pixels[21] << 24) | (pixels[22] << 16) | (pixels[23] << 8) | pixels[24]) >>> 0,
    channels: (rawChannels === 0 ? 3 : rawChannels) as 1 | 2 | 3 | 4,
    preFecLength: ((pixels[26] << 24) | (pixels[27] << 16) | (pixels[28] << 8) | pixels[29]) >>> 0,
  }
}
