import { AbstractCodec, type PixelBuffer } from '../types'
import { linearInfo } from './metadata'

export class LinearCodec extends AbstractCodec {
  readonly id = linearInfo.id
  readonly name = linearInfo.name
  readonly metadata = linearInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)

    pixels.set(input.subarray(0, Math.min(input.length, pixels.length)))

    return pixels
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    return Buffer.from(pixels.buffer, pixels.byteOffset, length)
  }
}

export const linearCodec = new LinearCodec()
