import { AbstractCodec, type PixelBuffer } from '../types'
import { rleInfo } from './metadata'

export class RleCodec extends AbstractCodec {
  readonly id = rleInfo.id
  readonly name = rleInfo.name
  readonly metadata = rleInfo.metadata

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out: number[] = []
    let i = 0

    while (i < input.length) {
      let runLen = 1

      while (runLen < 128 && i + runLen < input.length && input[i + runLen] === input[i]) runLen++
      if (runLen >= 2) {
        out.push(0x80 | (runLen - 1), input[i])
        i += runLen
        continue
      }
      let litEnd = i + 1

      while (litEnd < input.length && litEnd - i < 128) {
        if (litEnd + 1 < input.length && input[litEnd] === input[litEnd + 1]) break
        litEnd++
      }
      const litLen = litEnd - i

      out.push(litLen - 1)
      for (let j = i; j < litEnd; j++) out.push(input[j])
      i = litEnd
    }
    const pixels = new Uint8Array(dataPixelCount * channels)

    pixels.set(out.slice(0, pixels.length))

    return pixels
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    const out = Buffer.allocUnsafe(length)
    let ri = 0
    let wi = 0

    while (wi < length && ri < pixels.length) {
      const hdr = pixels[ri++]

      if (hdr & 0x80) {
        const count = (hdr & 0x7f) + 1
        const val = pixels[ri++]

        for (let j = 0; j < count && wi < length; j++) out[wi++] = val
      } else {
        const count = (hdr & 0x7f) + 1

        for (let j = 0; j < count && wi < length; j++) out[wi++] = pixels[ri++]
      }
    }

    return out
  }

  // RLE worst case: ~1.016x overhead (2 bytes per 128 literals); use 1.05x for safety.
  estimateDataPixels(input: Buffer, channels = 3): number {
    return Math.ceil((input.length * 1.05) / channels)
  }
}

export const rleCodec = new RleCodec()
