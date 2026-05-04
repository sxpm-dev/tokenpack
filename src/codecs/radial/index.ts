import type { Codec, PixelBuffer } from '../types'
import { HEADER_PIXELS } from '../../header'

function spiralOrder(dataPixelCount: number, width: number, height: number): number[] {
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const indices = Array.from({ length: dataPixelCount }, (_, i) => i)
  indices.sort((a, b) => {
    const ia = a + HEADER_PIXELS, ib = b + HEADER_PIXELS
    const xa = ia % width, ya = Math.floor(ia / width)
    const xb = ib % width, yb = Math.floor(ib / width)
    return ((xa - cx) ** 2 + (ya - cy) ** 2) - ((xb - cx) ** 2 + (yb - cy) ** 2) || a - b
  })
  return indices
}

export const radialCodec: Codec = {
  id: 1,
  name: 'radial',

  encode(input: Buffer, dataPixelCount: number, width: number, height: number, channels = 3): PixelBuffer {
    const order = spiralOrder(dataPixelCount, width, height)
    const pixels = new Uint8Array(dataPixelCount * channels)
    for (let byteIdx = 0; byteIdx < input.length; byteIdx++) {
      const pixelPos = order[Math.floor(byteIdx / channels)]
      pixels[pixelPos * channels + (byteIdx % channels)] = input[byteIdx]
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, width: number, height: number, channels = 3): Buffer {
    const order = spiralOrder(pixels.length / channels, width, height)
    const output = Buffer.allocUnsafe(length)
    for (let byteIdx = 0; byteIdx < length; byteIdx++) {
      const pixelPos = order[Math.floor(byteIdx / channels)]
      output[byteIdx] = pixels[pixelPos * channels + (byteIdx % channels)]
    }
    return output
  },
}
