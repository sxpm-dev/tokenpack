import type { HeaderData } from './types.js'

export const HEADER_PIXELS = 32
export const HEADER_BYTES = HEADER_PIXELS * 3  // 96

export function writeHeader(pixels: Uint8Array, d: HeaderData): void {
  pixels[0] = 0xC0; pixels[1] = 0xDE; pixels[2] = 0xAE; pixels[3] = 0x54
  pixels[4] = d.version
  pixels[5] = d.algorithmId
  pixels[6]  = (d.fileLength >>> 24) & 0xFF
  pixels[7]  = (d.fileLength >>> 16) & 0xFF
  pixels[8]  = (d.fileLength >>> 8)  & 0xFF
  pixels[9]  =  d.fileLength         & 0xFF
  pixels[10] = (d.width  >>> 8) & 0xFF
  pixels[11] =  d.width         & 0xFF
  pixels[12] = (d.height >>> 8) & 0xFF
  pixels[13] =  d.height        & 0xFF
  pixels[14] = d.styleFlags
  pixels[15] = d.ecLevel
  pixels.set(d.codecMeta.slice(0, 16), 16)
  pixels[32] = d.gradientFrom[0]; pixels[33] = d.gradientFrom[1]; pixels[34] = d.gradientFrom[2]
  pixels[35] = d.gradientTo[0];   pixels[36] = d.gradientTo[1];   pixels[37] = d.gradientTo[2]
  pixels[38] = d.gradientDirection
  pixels[39] = d.backgroundOpacity
  pixels[40] = d.backgroundColor[0]; pixels[41] = d.backgroundColor[1]; pixels[42] = d.backgroundColor[2]
  pixels[43] = d.compressionLevel
  pixels[44] = (d.uncompressedLength >>> 24) & 0xFF
  pixels[45] = (d.uncompressedLength >>> 16) & 0xFF
  pixels[46] = (d.uncompressedLength >>> 8)  & 0xFF
  pixels[47] =  d.uncompressedLength         & 0xFF
  pixels[48] = d.cellSize
  pixels[49] = (d.dataPixelCount >>> 24) & 0xFF
  pixels[50] = (d.dataPixelCount >>> 16) & 0xFF
  pixels[51] = (d.dataPixelCount >>> 8)  & 0xFF
  pixels[52] =  d.dataPixelCount         & 0xFF
}

export function readHeader(pixels: Uint8Array): HeaderData {
  if (pixels[0] !== 0xC0 || pixels[1] !== 0xDE || pixels[2] !== 0xAE || pixels[3] !== 0x54) {
    throw new Error('not a codeart image')
  }
  return {
    version: pixels[4],
    algorithmId: pixels[5],
    fileLength:
      ((pixels[6] << 24) | (pixels[7] << 16) | (pixels[8] << 8) | pixels[9]) >>> 0,
    width:  (pixels[10] << 8) | pixels[11],
    height: (pixels[12] << 8) | pixels[13],
    styleFlags: pixels[14],
    ecLevel: pixels[15],
    codecMeta: new Uint8Array(pixels.buffer, pixels.byteOffset + 16, 16).slice(),
    gradientFrom: [pixels[32], pixels[33], pixels[34]],
    gradientTo:   [pixels[35], pixels[36], pixels[37]],
    gradientDirection: pixels[38],
    backgroundOpacity: pixels[39],
    backgroundColor: [pixels[40], pixels[41], pixels[42]],
    compressionLevel: pixels[43],
    uncompressedLength: ((pixels[44] << 24) | (pixels[45] << 16) | (pixels[46] << 8) | pixels[47]) >>> 0,
    cellSize: pixels[48],
    dataPixelCount: ((pixels[49] << 24) | (pixels[50] << 16) | (pixels[51] << 8) | pixels[52]) >>> 0,
  }
}
