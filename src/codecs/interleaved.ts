import type { Codec, PixelBuffer } from './types.js'

function swapEveryThird(pixels: Uint8Array, pixelCount: number): void {
  for (let i = 0; i + 1 < pixelCount; i += 3) {
    const a = i * 3
    const b = (i + 1) * 3
    const r = pixels[a]; const g = pixels[a + 1]; const bl = pixels[a + 2]
    pixels[a]     = pixels[b];     pixels[a + 1] = pixels[b + 1]; pixels[a + 2] = pixels[b + 2]
    pixels[b]     = r;             pixels[b + 1] = g;             pixels[b + 2] = bl
  }
}

export const interleavedCodec: Codec = {
  id: 2,
  name: 'interleaved',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let i = 0; i < input.length; i++) pixels[i] = input[i]
    swapEveryThird(pixels, Math.ceil(input.length / 3))
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    const copy = new Uint8Array(pixels)
    swapEveryThird(copy, Math.ceil(length / 3))
    return Buffer.from(copy.slice(0, length))
  },
}
