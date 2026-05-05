import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// FreqDelta codec: Move-to-Front (MTF) transform.
// Maintain a 256-element list initialised as [0, 1, 2, ..., 255].
// Encode: for each input byte b, find its index (rank) in the list, emit rank,
//         then move b to index 0 (shift others right by 1).
// Decode: for each encoded rank, output list[rank], move that value to index 0.
//
// Output values cluster near 0 for repeated bytes → excellent PNG DEFLATE compression.
// Particularly effective for binary data with repeated patterns or limited alphabets.

function makeMtfList(): Uint8Array {
  const list = new Uint8Array(256)
  for (let i = 0; i < 256; i++) list[i] = i
  return list
}

function mtfEncode(list: Uint8Array, b: number): number {
  const rank = list.indexOf(b)
  // Move b to front: shift [0..rank-1] right by 1
  for (let i = rank; i > 0; i--) list[i] = list[i - 1]
  list[0] = b
  return rank
}

function mtfDecode(list: Uint8Array, rank: number): number {
  const b = list[rank]
  // Move b to front
  for (let i = rank; i > 0; i--) list[i] = list[i - 1]
  list[0] = b
  return b
}

interface FreqdeltaState extends StreamCodecState {
  list: Uint8Array
}

export const freqdeltaCodec: StreamingCodec = {
  id: 14,
  name: 'freqdelta',

  estimateDataPixels(input: Buffer, channels = 3): number {
    // 1:1 size ratio
    return Math.ceil(input.length / channels)
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    const list = makeMtfList()
    for (let i = 0; i < input.length && i < pixels.length; i++) {
      pixels[i] = mtfEncode(list, input[i])
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    const output = Buffer.allocUnsafe(length)
    const list = makeMtfList()
    for (let i = 0; i < length; i++) {
      output[i] = mtfDecode(list, pixels[i])
    }
    return output
  },

  createDecodeState(): FreqdeltaState {
    return { list: makeMtfList() }
  },

  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState } {
    const s = state as FreqdeltaState
    const list = s.list
    const decoded = Buffer.allocUnsafe(pixelChunk.length)
    for (let i = 0; i < pixelChunk.length; i++) {
      decoded[i] = mtfDecode(list, pixelChunk[i])
    }
    // list is mutated in-place; pass the same reference forward
    const newState: FreqdeltaState = { list }
    return { bytes: decoded, state: newState }
  },
}
