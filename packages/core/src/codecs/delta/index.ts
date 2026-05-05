import { AbstractCodec, type PixelBuffer } from '../types'
import { deltaInfo } from './metadata'

export class DeltaCodec extends AbstractCodec {
  readonly id = deltaInfo.id
  readonly name = deltaInfo.name
  readonly metadata = deltaInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    let prev = 0

    for (let i = 0; i < input.length; i++) {
      pixels[i] = (input[i] - prev + 256) & 0xff
      prev = input[i]
    }

    return pixels
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    const output = Buffer.alloc(length)
    let prev = 0

    for (let i = 0; i < length; i++) {
      output[i] = (pixels[i] + prev) & 0xff
      prev = output[i]
    }

    return output
  }
}

export const deltaCodec = new DeltaCodec()
