import type { Codec, PixelBuffer } from '../types'

export const linearCodec: Codec = {
  id: 0,
  name: 'linear',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    pixels.set(input.subarray(0, Math.min(input.length, pixels.length)))
    return pixels
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    return Buffer.from(pixels.buffer, pixels.byteOffset, length)
  },
}
