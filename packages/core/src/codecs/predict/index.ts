import { AbstractCodec, type PixelBuffer } from '../types'
import { predictInfo } from './metadata'

export class PredictCodec extends AbstractCodec {
  readonly id = predictInfo.id
  readonly name = predictInfo.name
  readonly metadata = predictInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out = new Uint8Array(dataPixelCount * channels)

    for (let i = 0; i < input.length && i < out.length; i++) {
      if (i < 2) {
        out[i] = input[i]
        continue
      }
      const predicted = (2 * input[i - 1] - input[i - 2] + 256) & 0xff

      out[i] = (input[i] - predicted + 256) & 0xff
    }

    return out
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    const out = Buffer.allocUnsafe(length)

    for (let i = 0; i < length; i++) {
      if (i < 2) {
        out[i] = pixels[i]
        continue
      }
      const predicted = (2 * out[i - 1] - out[i - 2] + 256) & 0xff

      out[i] = (pixels[i] + predicted) & 0xff
    }

    return out
  }
}

export const predictCodec = new PredictCodec()
