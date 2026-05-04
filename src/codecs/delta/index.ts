import type { Codec, PixelBuffer } from '../types'

// Delta encoding: each pixel byte = (input[i] - input[i-1]) mod 256.
// First byte is stored as-is (prev = 0).
//
// Best for: monotonically changing or slowly drifting data.
// PNG's own Sub row-filter does this per row; doing it ourselves first lets
// brotli also exploit the delta structure across rows.

export const deltaCodec: Codec = {
  id: 5,
  name: 'delta',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    let prev = 0
    for (let i = 0; i < input.length; i++) {
      pixels[i] = (input[i] - prev + 256) & 0xff
      prev = input[i]
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    const output = Buffer.alloc(length)
    let prev = 0
    for (let i = 0; i < length; i++) {
      output[i] = (pixels[i] + prev) & 0xff
      prev = output[i]
    }
    return output
  },
}
