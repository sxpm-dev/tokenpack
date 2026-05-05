import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// NibPair codec: process input in pairs of 2 bytes, each pair → 1 RGBA pixel (4 channels).
//   R = (b0 >> 4) * 17
//   G = (b0 & 0xF) * 17
//   B = (b1 >> 4) * 17
//   A = (b1 & 0xF) * 17
//
// Each channel holds only one of 16 possible values (multiples of 17).
// This limits channel entropy → excellent PNG DEFLATE compression.
// Always uses 4 channels per pixel (RGBA), regardless of the channels argument.

const SCALE = 17 // maps nibble 0-15 → channel value 0-255
const NIBPAIR_CHANNELS = 4

interface NibpairState extends StreamCodecState {
  partial: number // -1 = no pending byte, 0–255 = pending first byte of pair
}

export const nibpairCodec: StreamingCodec = {
  id: 13,
  name: 'nibpair',

  estimateDataPixels(input: Buffer): number {
    // 1 pixel per 2 bytes (always RGBA)
    return Math.ceil(input.length / 2)
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, _channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * NIBPAIR_CHANNELS)
    const pairs = Math.ceil(input.length / 2)
    for (let p = 0; p < pairs; p++) {
      const b0 = input[p * 2] ?? 0
      const b1 = input[p * 2 + 1] ?? 0
      const base = p * NIBPAIR_CHANNELS
      pixels[base] = ((b0 >> 4) & 0xf) * SCALE
      pixels[base + 1] = (b0 & 0xf) * SCALE
      pixels[base + 2] = ((b1 >> 4) & 0xf) * SCALE
      pixels[base + 3] = (b1 & 0xf) * SCALE
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    const output = Buffer.allocUnsafe(length)
    let outIdx = 0
    const pairs = Math.ceil(length / 2)
    for (let p = 0; p < pairs && outIdx < length; p++) {
      const base = p * NIBPAIR_CHANNELS
      const hiNib0 = Math.round(pixels[base] / SCALE) & 0xf
      const loNib0 = Math.round(pixels[base + 1] / SCALE) & 0xf
      const hiNib1 = Math.round(pixels[base + 2] / SCALE) & 0xf
      const loNib1 = Math.round(pixels[base + 3] / SCALE) & 0xf
      if (outIdx < length) output[outIdx++] = (hiNib0 << 4) | loNib0
      if (outIdx < length) output[outIdx++] = (hiNib1 << 4) | loNib1
    }
    return output
  },

  createDecodeState(): NibpairState {
    return { partial: -1 }
  },

  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState } {
    const s = state as NibpairState
    const decoded: number[] = []

    // Each group of 4 channel bytes = 1 RGBA pixel = 2 source bytes
    const numPixels = Math.floor(pixelChunk.length / NIBPAIR_CHANNELS)
    for (let p = 0; p < numPixels; p++) {
      const base = p * NIBPAIR_CHANNELS
      const hiNib0 = Math.round(pixelChunk[base] / SCALE) & 0xf
      const loNib0 = Math.round(pixelChunk[base + 1] / SCALE) & 0xf
      const hiNib1 = Math.round(pixelChunk[base + 2] / SCALE) & 0xf
      const loNib1 = Math.round(pixelChunk[base + 3] / SCALE) & 0xf
      decoded.push((hiNib0 << 4) | loNib0)
      decoded.push((hiNib1 << 4) | loNib1)
    }

    const newState: NibpairState = { partial: s.partial }
    return { bytes: Buffer.from(decoded), state: newState }
  },
} as Codec as StreamingCodec
