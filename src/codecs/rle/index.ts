import type { Codec, PixelBuffer } from '../types'

// Run-length encoding codec using a packet system.
// Packet header byte:
//   bit 7 = 0: next (N+1) bytes are literals (N = low 7 bits, max 128 bytes)
//   bit 7 = 1: next 1 byte repeats (N+1) times (N = low 7 bits, max 128 repeats)
// Handles both random data (literal packets) and repetitive data (repeat packets).

export const rleCodec: Codec = {
  id: 9,
  name: 'rle',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out: number[] = []
    let i = 0
    while (i < input.length) {
      // Check for repeat run
      let runLen = 1
      while (runLen < 128 && i + runLen < input.length && input[i + runLen] === input[i]) runLen++
      if (runLen >= 2) {
        out.push(0x80 | (runLen - 1), input[i])
        i += runLen
        continue
      }
      // Literal run
      let litEnd = i + 1
      while (litEnd < input.length && litEnd - i < 128) {
        // Peek: if next 2+ are the same, stop literal run to allow repeat packet
        if (litEnd + 1 < input.length && input[litEnd] === input[litEnd + 1]) break
        litEnd++
      }
      const litLen = litEnd - i
      out.push(litLen - 1)
      for (let j = i; j < litEnd; j++) out.push(input[j])
      i = litEnd
    }
    // Pad to pixel boundary
    const pixels = new Uint8Array(dataPixelCount * channels)
    pixels.set(out.slice(0, pixels.length))
    return pixels
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    const out = Buffer.allocUnsafe(length)
    let ri = 0
    let wi = 0
    while (wi < length && ri < pixels.length) {
      const hdr = pixels[ri++]
      if (hdr & 0x80) {
        // Repeat packet
        const count = (hdr & 0x7f) + 1
        const val = pixels[ri++]
        for (let j = 0; j < count && wi < length; j++) out[wi++] = val
      } else {
        // Literal packet
        const count = (hdr & 0x7f) + 1
        for (let j = 0; j < count && wi < length; j++) out[wi++] = pixels[ri++]
      }
    }
    return out
  },

  estimateDataPixels(input: Buffer, channels = 3): number {
    // RLE worst case: every byte is a literal → ~1.016x overhead (2 bytes per 128 literals)
    // Conservative estimate: 1.05x overhead for mixed data
    return Math.ceil((input.length * 1.05) / channels)
  },
}
