import type { Codec, PixelBuffer } from '../types'

// XOR chain: each pixel byte = input[i] XOR input[i-1].
// First byte is stored as-is (prev = 0).
//
// Best for: data with repeating patterns or runs of identical bytes.
// Repeated byte → XOR delta = 0x00 → long runs of zeros → PNG compresses well.
// Unlike delta, XOR is perfectly reversible without overflow concerns.

export const xorCodec: Codec = {
  id: 6,
  name: 'xor',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    let prev = 0
    for (let i = 0; i < input.length; i++) {
      pixels[i] = input[i] ^ prev
      prev = input[i]
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    const output = Buffer.alloc(length)
    let prev = 0
    for (let i = 0; i < length; i++) {
      output[i] = pixels[i] ^ prev
      prev = output[i]
    }
    return output
  },
}
