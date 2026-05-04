import type { Codec, PixelBuffer } from '../types'

// Delta-chain encoding: store first byte as-is, each subsequent byte as
// (curr - prev + 256) % 256. Works per-channel across the pixel buffer linearly.
// Makes adjacent pixel values small → PNG's internal deflate compresses pixel data better.

export const deltaChainCodec: Codec = {
  id: 8,
  name: 'delta-chain',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out = new Uint8Array(dataPixelCount * channels)
    let prev = 0
    for (let i = 0; i < input.length && i < out.length; i++) {
      out[i] = (input[i] - prev + 256) & 0xff
      prev = input[i]
    }
    return out
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    const out = Buffer.allocUnsafe(length)
    let prev = 0
    for (let i = 0; i < length; i++) {
      const val = (pixels[i] + prev) & 0xff
      out[i] = val
      prev = val
    }
    return out
  },
}
