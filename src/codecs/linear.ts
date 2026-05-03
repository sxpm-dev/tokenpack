import type { Codec, PixelBuffer } from './types.js'

export const linearCodec: Codec = {
  id: 0,
  name: 'linear',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let i = 0; i < input.length; i++) pixels[i] = input[i]
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    return Buffer.from(pixels.slice(0, length))
  },
}
