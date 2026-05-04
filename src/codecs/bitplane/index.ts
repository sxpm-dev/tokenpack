import type { Codec, PixelBuffer } from '../types'

// Bit-plane interleaving: groups of 8 input bytes → 2 RGBA pixels.
//
// slot[bitPos] = b[0][bitPos]<<7 | b[1][bitPos]<<6 | … | b[7][bitPos]<<0
//
// pixel 0: R=slot[7]  G=slot[6]  B=slot[5]  A=slot[4]
// pixel 1: R=slot[3]  G=slot[2]  B=slot[1]  A=slot[0]
//
// ASCII advantage: bit-7 is always 0 → pixel-0 R = 0x00 per group → long
// zero run that PNG's zlib compresses near-perfectly.

const BYTES_PER_GROUP = 8 // = 2 pixels × 4 channels

function encodeGroup(src: Buffer, srcOffset: number, dst: Uint8Array, dstOffset: number): void {
  for (let bitPos = 0; bitPos < 8; bitPos++) {
    let slot = 0
    for (let b = 0; b < BYTES_PER_GROUP; b++) {
      const byte = srcOffset + b < src.length ? src[srcOffset + b] : 0
      slot |= ((byte >> bitPos) & 1) << (7 - b)
    }
    dst[dstOffset + (7 - bitPos)] = slot
  }
}

// Reusable slots buffer — avoids per-group allocation in the decode hot path.
const _slots = new Uint8Array(BYTES_PER_GROUP)

function decodeGroup(src: Uint8Array, srcOffset: number, dst: Buffer, dstOffset: number, len: number): void {
  for (let s = 0; s < BYTES_PER_GROUP; s++) _slots[s] = src[srcOffset + s] ?? 0
  for (let b = 0; b < BYTES_PER_GROUP && dstOffset + b < len; b++) {
    let byte = 0
    for (let bitPos = 0; bitPos < 8; bitPos++) {
      byte |= ((_slots[7 - bitPos] >> (7 - b)) & 1) << bitPos
    }
    dst[dstOffset + b] = byte
  }
}

export const bitplaneCodec: Codec = {
  id: 4,
  name: 'bitplane',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    if (channels !== 4) {
      pixels.set(input.subarray(0, Math.min(input.length, pixels.length)))
      return pixels
    }
    for (let g = 0; g < Math.ceil(input.length / BYTES_PER_GROUP); g++) {
      encodeGroup(input, g * BYTES_PER_GROUP, pixels, g * BYTES_PER_GROUP)
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, channels = 3): Buffer {
    const output = Buffer.allocUnsafe(length)
    if (channels !== 4) {
      for (let i = 0; i < length; i++) output[i] = pixels[i]
      return output
    }
    for (let g = 0; g < Math.ceil(length / BYTES_PER_GROUP); g++) {
      decodeGroup(pixels, g * BYTES_PER_GROUP, output, g * BYTES_PER_GROUP, length)
    }
    return output
  },
}
