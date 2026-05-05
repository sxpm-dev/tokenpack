import { describe, expect, it } from 'vitest'

import { bitshuffleCodec } from '../../src/codecs/bitshuffle'

function makeRandom(size: number, seed = 42): Buffer {
  const buf = Buffer.allocUnsafe(size)
  let s = seed

  for (let i = 0; i < size; i++) {
    s = (s * 1664525 + 1013904223) >>> 0
    buf[i] = s & 0xff
  }

  return buf
}

function roundtrip(input: Buffer, channels = 3): Buffer {
  const dataPixelCount = bitshuffleCodec.estimateDataPixels!(input, channels)
  const encoded = bitshuffleCodec.encode(input, dataPixelCount, 10, 10, channels)

  return bitshuffleCodec.decode(encoded, input.length, 10, 10, channels)
}

describe('bitshuffleCodec', () => {
  it('roundtrips empty buffer', () => {
    const input = Buffer.alloc(0)

    expect(roundtrip(input)).toEqual(input)
  })

  it('roundtrips single byte', () => {
    for (const b of [0, 1, 0x7f, 0x80, 0xff]) {
      const input = Buffer.from([b])

      expect(roundtrip(input)).toEqual(input)
    }
  })

  it('roundtrips exactly 3 bytes (one complete group)', () => {
    const input = Buffer.from([0xde, 0xad, 0xbe])

    expect(roundtrip(input)).toEqual(input)
  })

  it('roundtrips 4 bytes (one complete + one partial group)', () => {
    const input = Buffer.from([0xde, 0xad, 0xbe, 0xef])

    expect(roundtrip(input)).toEqual(input)
  })

  it('roundtrips 1KB ASCII source code', () => {
    const ascii = 'import { readFileSync } from "fs";\nconst data = readFileSync("x");\n'
      .repeat(16)
      .slice(0, 1024)
    const input = Buffer.from(ascii, 'ascii')

    expect(roundtrip(input)).toEqual(input)
  })

  it('roundtrips 1KB random binary', () => {
    const input = makeRandom(1024)

    expect(roundtrip(input)).toEqual(input)
  })

  it('roundtrips 64KB binary', () => {
    const input = makeRandom(64 * 1024)

    expect(roundtrip(input)).toEqual(input)
  })

  it('ASCII bytes have near-zero first output byte per group', () => {
    // All ASCII: bit 7 = 0 for every byte.
    // The shuffle packs b0[7], b1[7], b2[7] into the top 3 bits of output byte 0.
    // For pure ASCII all three are 0, so bits 7, 6, 5 of output[g*3] are all 0
    // → value is always in range 0–31 (top 3 bits clear).
    const input = Buffer.from('Hello ASCII world!!! ')
    const dataPixelCount = bitshuffleCodec.estimateDataPixels!(input, 3)
    const encoded = bitshuffleCodec.encode(input, dataPixelCount, 10, 10, 3)

    // Check first byte of each 3-byte group: top 3 bits should be 0 for pure ASCII
    for (let g = 0; g * 3 < Math.min(input.length, encoded.length); g++) {
      expect(encoded[g * 3] & 0xe0).toBe(0) // bits 7,6,5 must be zero
    }
  })

  it('decodeChunk streams correctly', () => {
    const input = makeRandom(600)
    const channels = 3
    const dataPixelCount = bitshuffleCodec.estimateDataPixels!(input, channels)
    const encoded = bitshuffleCodec.encode(input, dataPixelCount, 10, 10, channels)

    // Simulate streaming: 10 pixels × 3 channels = 30 bytes per row
    const CHUNK_SIZE = 30
    let state = bitshuffleCodec.createDecodeState()
    const chunks: Buffer[] = []

    for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
      const chunk = encoded.subarray(i, Math.min(i + CHUNK_SIZE, encoded.length))
      const result = bitshuffleCodec.decodeChunk(chunk, state)

      state = result.state
      if (result.bytes.length > 0) chunks.push(result.bytes)
    }

    const streamed = Buffer.concat(chunks).subarray(0, input.length)

    expect(streamed).toEqual(input)
  })
})
