import { AbstractCodec, type PixelBuffer } from '../types'
import { xorInfo } from './metadata'

export class XorCodec extends AbstractCodec {
  readonly id = xorInfo.id
  readonly name = xorInfo.name
  readonly metadata = xorInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    let prev = 0

    for (let i = 0; i < input.length; i++) {
      pixels[i] = input[i] ^ prev
      prev = input[i]
    }

    return pixels
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    const output = Buffer.alloc(length)
    let prev = 0

    for (let i = 0; i < length; i++) {
      output[i] = pixels[i] ^ prev
      prev = output[i]
    }

    return output
  }
}

export const xorCodec = new XorCodec()
