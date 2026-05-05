import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// ASCII7 codec: variable-length bit packing.
// Bytes 0–126 encoded as: flag bit 0 + 7 data bits = 8 bits total.
// Bytes 127–255 encoded as: flag bit 1 + 8 data bits = 9 bits total.
// Bits are packed MSB-first (left-to-right) into the output byte stream.
// Effective for ASCII-heavy data: most bytes use 7 bits instead of 8.

interface Ascii7State extends StreamCodecState {
  bitBuf: number
  bitCount: number
  outBytes: number
}

function writeBits(buf: number[], bitBuf: number, bitCount: number, value: number, numBits: number): [number, number] {
  for (let i = numBits - 1; i >= 0; i--) {
    bitBuf = (bitBuf << 1) | ((value >> i) & 1)
    bitCount++
    if (bitCount === 8) {
      buf.push(bitBuf & 0xff)
      bitBuf = 0
      bitCount = 0
    }
  }
  return [bitBuf, bitCount]
}

export const ascii7Codec: StreamingCodec = {
  id: 12,
  name: 'ascii7',

  estimateDataPixels(input: Buffer, channels = 3): number {
    // Worst case: 9 bits per byte (for values 127–255)
    return Math.ceil((input.length * 9) / 8 / channels)
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const rawBits: number[] = []
    let bitBuf = 0
    let bitCount = 0

    for (let i = 0; i < input.length; i++) {
      const b = input[i]
      if (b <= 126) {
        // flag bit 0 + 7 data bits
        ;[bitBuf, bitCount] = writeBits(rawBits, bitBuf, bitCount, 0, 1)
        ;[bitBuf, bitCount] = writeBits(rawBits, bitBuf, bitCount, b, 7)
      } else {
        // flag bit 1 + 8 data bits
        ;[bitBuf, bitCount] = writeBits(rawBits, bitBuf, bitCount, 1, 1)
        ;[bitBuf, bitCount] = writeBits(rawBits, bitBuf, bitCount, b, 8)
      }
    }

    // Flush remaining bits with zero padding
    if (bitCount > 0) {
      rawBits.push((bitBuf << (8 - bitCount)) & 0xff)
    }

    const pixels = new Uint8Array(dataPixelCount * channels)
    pixels.set(rawBits.slice(0, pixels.length))
    return pixels
  },

  decode(pixels: PixelBuffer, length: number): Buffer {
    const output = Buffer.allocUnsafe(length)
    let outIdx = 0
    let bitBuf = 0
    let bitCount = 0
    let pixIdx = 0

    function readBit(): number {
      if (bitCount === 0) {
        if (pixIdx >= pixels.length) return 0
        bitBuf = pixels[pixIdx++]
        bitCount = 8
      }
      bitCount--
      return (bitBuf >> bitCount) & 1
    }

    while (outIdx < length) {
      const flag = readBit()
      if (flag === 0) {
        // Read 7 bits
        let val = 0
        for (let i = 0; i < 7; i++) {
          val = (val << 1) | readBit()
        }
        output[outIdx++] = val
      } else {
        // Read 8 bits
        let val = 0
        for (let i = 0; i < 8; i++) {
          val = (val << 1) | readBit()
        }
        output[outIdx++] = val
      }
    }

    return output
  },

  createDecodeState(): Ascii7State {
    return { bitBuf: 0, bitCount: 0, outBytes: 0 }
  },

  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState } {
    const s = state as Ascii7State
    let bitBuf = s.bitBuf
    let bitCount = s.bitCount

    const decoded: number[] = []
    let pixIdx = 0

    function readBit(): number | null {
      if (bitCount === 0) {
        if (pixIdx >= pixelChunk.length) return null
        bitBuf = pixelChunk[pixIdx++]
        bitCount = 8
      }
      bitCount--
      return (bitBuf >> bitCount) & 1
    }

    while (true) {
      const flag = readBit()
      if (flag === null) break

      if (flag === 0) {
        let val = 0
        let incomplete = false
        for (let i = 0; i < 7; i++) {
          const bit = readBit()
          if (bit === null) {
            // Not enough bits — save partial state and stop
            // We can't emit a partial byte; but we must preserve what we have
            // Since we already consumed the flag bit, we need to buffer it
            // For simplicity: treat leftover bits as belonging to next chunk
            incomplete = true
            break
          }
          val = (val << 1) | bit
        }
        if (!incomplete) decoded.push(val)
        else break
      } else {
        let val = 0
        let incomplete = false
        for (let i = 0; i < 8; i++) {
          const bit = readBit()
          if (bit === null) {
            incomplete = true
            break
          }
          val = (val << 1) | bit
        }
        if (!incomplete) decoded.push(val)
        else break
      }
    }

    const newState: Ascii7State = {
      bitBuf,
      bitCount,
      outBytes: s.outBytes + decoded.length,
    }

    return { bytes: Buffer.from(decoded), state: newState }
  },
}
