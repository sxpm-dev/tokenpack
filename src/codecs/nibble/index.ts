import type { Codec, PixelBuffer } from '../types'

// Nibble codec: each source byte → 2 nibbles × 17 (maps 0-15 → 0-255).
// With 3 channels per pixel (RGB), pack 3 nibbles per pixel → 3 bytes per 2 pixels.
//
// Layout (3 bytes → 2 RGB pixels):
//   pixel 0: R=hi(b0)×17  G=lo(b0)×17  B=hi(b1)×17
//   pixel 1: R=lo(b1)×17  G=hi(b2)×17  B=lo(b2)×17
//
// Density: 1.5 source bytes per pixel (vs 3 for linear).
// Benefit: only 16 possible values per channel → PNG zlib compresses well.
// Cost: 2× more pixels than linear.

const N = 17 // scale factor: 0-15 → 0-255

export const nibbleCodec: Codec = {
  id: 7,
  name: 'nibble',

  estimateDataPixels(input: Buffer): number {
    // 2 pixels per 3 bytes
    return Math.ceil((input.length * 2) / 3)
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    const groups = Math.ceil(input.length / 3)
    for (let g = 0; g < groups; g++) {
      const b0 = input[g * 3] ?? 0
      const b1 = input[g * 3 + 1] ?? 0
      const b2 = input[g * 3 + 2] ?? 0
      const p0 = g * 2 * channels
      const p1 = (g * 2 + 1) * channels
      pixels[p0] = ((b0 >> 4) & 0xf) * N
      pixels[p0 + 1] = (b0 & 0xf) * N
      pixels[p0 + 2] = ((b1 >> 4) & 0xf) * N
      if (p1 + 2 < pixels.length) {
        pixels[p1] = (b1 & 0xf) * N
        pixels[p1 + 1] = ((b2 >> 4) & 0xf) * N
        pixels[p1 + 2] = (b2 & 0xf) * N
      }
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, channels = 3): Buffer {
    const output = Buffer.allocUnsafe(length)
    let outPos = 0
    const groups = Math.ceil(length / 3)
    for (let g = 0; g < groups && outPos < length; g++) {
      const p0 = g * 2 * channels
      const p1 = (g * 2 + 1) * channels
      const hi0 = Math.round(pixels[p0] / N) & 0xf
      const lo0 = Math.round(pixels[p0 + 1] / N) & 0xf
      const hi1 = Math.round(pixels[p0 + 2] / N) & 0xf
      const lo1 = p1 < pixels.length ? Math.round(pixels[p1] / N) & 0xf : 0
      const hi2 = p1 + 1 < pixels.length ? Math.round(pixels[p1 + 1] / N) & 0xf : 0
      const lo2 = p1 + 2 < pixels.length ? Math.round(pixels[p1 + 2] / N) & 0xf : 0
      if (outPos < length) output[outPos++] = (hi0 << 4) | lo0
      if (outPos < length) output[outPos++] = (hi1 << 4) | lo1
      if (outPos < length) output[outPos++] = (hi2 << 4) | lo2
    }
    return output
  },
}
