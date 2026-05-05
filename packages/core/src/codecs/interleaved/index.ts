import { AbstractCodec, type PixelBuffer } from '../types'
import { interleavedInfo } from './metadata'

function swapAdjacentPixels(pixels: Uint8Array, pixelCount: number, channels: number): void {
  for (let i = 0; i + 1 < pixelCount; i += 3) {
    const a = i * channels
    const b = (i + 1) * channels

    for (let c = 0; c < channels; c++) {
      const tmp = pixels[a + c]

      pixels[a + c] = pixels[b + c]
      pixels[b + c] = tmp
    }
  }
}

export class InterleavedCodec extends AbstractCodec {
  readonly id = interleavedInfo.id
  readonly name = interleavedInfo.name
  readonly metadata = interleavedInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)

    for (let i = 0; i < input.length; i++) pixels[i] = input[i]
    swapAdjacentPixels(pixels, Math.ceil(input.length / channels), channels)

    return pixels
  }

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, channels = 3): Buffer {
    const copy = new Uint8Array(pixels)

    swapAdjacentPixels(copy, Math.ceil(length / channels), channels)

    return Buffer.from(copy.slice(0, length))
  }
}

export const interleavedCodec = new InterleavedCodec()
