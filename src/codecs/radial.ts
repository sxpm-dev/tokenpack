import type { Codec, PixelBuffer } from './types.js'

function spiralOrder(dataPixelCount: number, width: number, height: number): number[] {
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const items = Array.from({ length: dataPixelCount }, (_, i) => {
    const imgIdx = i + 32
    const x = imgIdx % width
    const y = Math.floor(imgIdx / width)
    return { i, dist: (x - cx) ** 2 + (y - cy) ** 2 }
  })
  items.sort((a, b) => a.dist - b.dist || a.i - b.i)
  return items.map(({ i }) => i)
}

export const radialCodec: Codec = {
  id: 1,
  name: 'radial',

  encode(input: Buffer, dataPixelCount: number, width: number, height: number): PixelBuffer {
    const order = spiralOrder(dataPixelCount, width, height)
    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let byteIdx = 0; byteIdx < input.length; byteIdx++) {
      const pixelPos = order[Math.floor(byteIdx / 3)]
      pixels[pixelPos * 3 + (byteIdx % 3)] = input[byteIdx]
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, width: number, height: number): Buffer {
    const dataPixelCount = pixels.length / 3
    const order = spiralOrder(dataPixelCount, width, height)
    const output = Buffer.allocUnsafe(length)
    for (let byteIdx = 0; byteIdx < length; byteIdx++) {
      const pixelPos = order[Math.floor(byteIdx / 3)]
      output[byteIdx] = pixels[pixelPos * 3 + (byteIdx % 3)]
    }
    return output
  },
}
