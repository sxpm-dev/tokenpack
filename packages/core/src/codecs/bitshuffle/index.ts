import {
  AbstractCodec,
  type PixelBuffer,
  type StreamCodecState,
  type StreamingCodec,
} from '../types'
import { bitshuffleInfo } from './metadata'

// BitShuffle codec: bit-plane transpose in groups of 3 bytes (24 bits).
// Rearranges bits so all bits of the same bit-position appear together:
//   output bits: b0[7],b1[7],b2[7], b0[6],b1[6],b2[6], ..., b0[0],b1[0],b2[0]
// For ASCII (bit 7 always 0): first 3 output bits = 0,0,0 → near-zero runs → great compression.

function encodeGroup3(b0: number, b1: number, b2: number): [number, number, number] {
  let out = 0

  for (let p = 7; p >= 0; p--) {
    out = (out << 1) | ((b0 >> p) & 1)
    out = (out << 1) | ((b1 >> p) & 1)
    out = (out << 1) | ((b2 >> p) & 1)
  }

  return [(out >> 16) & 0xff, (out >> 8) & 0xff, out & 0xff]
}

function decodeGroup3(in0: number, in1: number, in2: number): [number, number, number] {
  const combined = (in0 << 16) | (in1 << 8) | in2
  let o0 = 0
  let o1 = 0
  let o2 = 0
  let bitIdx = 23

  for (let p = 7; p >= 0; p--) {
    o0 |= ((combined >> bitIdx) & 1) << p
    bitIdx--
    o1 |= ((combined >> bitIdx) & 1) << p
    bitIdx--
    o2 |= ((combined >> bitIdx) & 1) << p
    bitIdx--
  }

  return [o0, o1, o2]
}

interface BitshuffleState extends StreamCodecState {
  partial: Buffer
  partialCount: number
}

export class BitshuffleCodec extends AbstractCodec implements StreamingCodec {
  readonly id = bitshuffleInfo.id
  readonly name = bitshuffleInfo.name
  readonly metadata = bitshuffleInfo.metadata

  estimateDataPixels(input: Buffer, channels = 3): number {
    return Math.ceil(input.length / channels)
  }

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    const groups = Math.ceil(input.length / 3)

    for (let g = 0; g < groups; g++) {
      const b0 = input[g * 3] ?? 0
      const b1 = input[g * 3 + 1] ?? 0
      const b2 = input[g * 3 + 2] ?? 0
      const [o0, o1, o2] = encodeGroup3(b0, b1, b2)
      const base = g * 3

      if (base < pixels.length) pixels[base] = o0
      if (base + 1 < pixels.length) pixels[base + 1] = o1
      if (base + 2 < pixels.length) pixels[base + 2] = o2
    }

    return pixels
  }

  decode(pixels: PixelBuffer, length: number): Buffer {
    const output = Buffer.allocUnsafe(length)
    const groups = Math.ceil(length / 3)

    for (let g = 0; g < groups; g++) {
      const base = g * 3
      const in0 = pixels[base] ?? 0
      const in1 = pixels[base + 1] ?? 0
      const in2 = pixels[base + 2] ?? 0
      const [o0, o1, o2] = decodeGroup3(in0, in1, in2)

      if (base < length) output[base] = o0
      if (base + 1 < length) output[base + 1] = o1
      if (base + 2 < length) output[base + 2] = o2
    }

    return output
  }

  createDecodeState(): BitshuffleState {
    return { partial: Buffer.alloc(2), partialCount: 0 }
  }

  decodeChunk(
    pixelChunk: PixelBuffer,
    state: StreamCodecState,
  ): { bytes: Buffer; state: StreamCodecState } {
    const s = state as BitshuffleState
    const decoded: number[] = []

    const partial = Buffer.from(s.partial)
    let partialCount = s.partialCount
    let i = 0

    while (partialCount > 0 && i < pixelChunk.length) {
      partial[partialCount++] = pixelChunk[i++]
      if (partialCount === 3) {
        const [o0, o1, o2] = decodeGroup3(partial[0], partial[1], partial[2])

        decoded.push(o0, o1, o2)
        partialCount = 0
      }
    }

    while (i + 3 <= pixelChunk.length) {
      const [o0, o1, o2] = decodeGroup3(pixelChunk[i], pixelChunk[i + 1], pixelChunk[i + 2])

      decoded.push(o0, o1, o2)
      i += 3
    }

    while (i < pixelChunk.length) {
      partial[partialCount++] = pixelChunk[i++]
    }

    const newPartial = Buffer.alloc(2)

    for (let j = 0; j < partialCount; j++) newPartial[j] = partial[j]

    return { bytes: Buffer.from(decoded), state: { partial: newPartial, partialCount } }
  }
}

export const bitshuffleCodec = new BitshuffleCodec()
