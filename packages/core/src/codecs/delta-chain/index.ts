import { AbstractCodec, type PixelBuffer } from '../types'
import { deltaChainInfo } from './metadata'

export class DeltaChainCodec extends AbstractCodec {
  readonly id = deltaChainInfo.id
  readonly name = deltaChainInfo.name
  readonly metadata = deltaChainInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out = new Uint8Array(dataPixelCount * channels)
    let prev = 0

    for (let i = 0; i < input.length && i < out.length; i++) {
      out[i] = (input[i] - prev + 256) & 0xff
      prev = input[i]
    }

    return out
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    const out = Buffer.allocUnsafe(length)
    let prev = 0

    for (let i = 0; i < length; i++) {
      const val = (pixels[i] + prev) & 0xff

      out[i] = val
      prev = val
    }

    return out
  }
}

export const deltaChainCodec = new DeltaChainCodec()
