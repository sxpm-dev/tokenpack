import type { Codec, PixelBuffer } from '../types'

// Palette-pixel codec.
// Builds a 255-entry palette from the top-255 most frequent byte values.
// Palette stored in first 255 bytes of output.
// Data bytes: common bytes → 1-byte palette index (0-254); rare bytes → escape (0xFF) + raw byte.
//
// Benefit: common byte values (0x20, 0x0A, etc.) map to low indices 0-30,
// making the pixel value sequence cluster heavily in the 0-30 range
// instead of spreading across 0-255. PNG's DEFLATE compresses the clustered
// pixel sequence much better.

export const palettePixelCodec: Codec = {
  id: 11,
  name: 'palette-pixel',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    // Build frequency table
    const freq = new Uint32Array(256)
    for (let i = 0; i < input.length; i++) freq[input[i]]++

    // Top 255 most frequent byte values → palette
    const sorted = Array.from({ length: 256 }, (_, i) => i)
      .sort((a, b) => freq[b] - freq[a])
    const palette = sorted.slice(0, 255)

    // Build reverse mapping: byte value → palette index (255 = escape)
    const paletteIndex = new Uint8Array(256).fill(255)
    for (let idx = 0; idx < palette.length; idx++) {
      paletteIndex[palette[idx]] = idx
    }

    // Encode: 255-byte palette header + encoded data
    const encoded: number[] = [...palette]
    for (let i = 0; i < input.length; i++) {
      const idx = paletteIndex[input[i]]
      if (idx < 255) {
        encoded.push(idx)
      } else {
        encoded.push(255, input[i])
      }
    }

    const out = new Uint8Array(dataPixelCount * channels)
    out.set(encoded.slice(0, out.length))
    return out
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    // Read palette from first 255 bytes
    const palette = pixels.slice(0, 255)

    const out = Buffer.allocUnsafe(length)
    let ri = 255
    let wi = 0
    while (wi < length && ri < pixels.length) {
      const idx = pixels[ri++]
      if (idx < 255) {
        out[wi++] = palette[idx]
      } else {
        out[wi++] = pixels[ri++]
      }
    }
    return out
  },

  estimateDataPixels(input: Buffer, channels = 3): number {
    // Analyze frequency to estimate output size
    const freq = new Uint32Array(256)
    for (let i = 0; i < input.length; i++) freq[input[i]]++

    const sortedFreq = Array.from(freq).sort((a, b) => b - a)

    let inPalette = 0
    for (let i = 0; i < 255; i++) inPalette += sortedFreq[i]
    const escapes = input.length - inPalette

    // 255-byte palette header + 1 byte per in-palette byte + 2 bytes per escape
    const encodedSize = 255 + inPalette + escapes * 2
    return Math.ceil(encodedSize / channels)
  },
}
