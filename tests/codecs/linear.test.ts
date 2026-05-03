import { describe, it, expect } from 'vitest'
import { linearCodec } from '../../src/codecs/linear.js'

describe('linearCodec', () => {
  it('encodes bytes into flat RGB pixels', () => {
    const input = Buffer.from([0xAB, 0xCD, 0xEF, 0x12])
    const result = linearCodec.encode(input, 2, 1, 2)
    // pixel 0: [0xAB, 0xCD, 0xEF], pixel 1: [0x12, 0x00, 0x00]
    expect(result[0]).toBe(0xAB)
    expect(result[1]).toBe(0xCD)
    expect(result[2]).toBe(0xEF)
    expect(result[3]).toBe(0x12)
    expect(result[4]).toBe(0x00)
    expect(result[5]).toBe(0x00)
  })

  it('decodes flat RGB pixels back to original bytes', () => {
    const input = Buffer.from([0xAB, 0xCD, 0xEF, 0x12])
    const encoded = linearCodec.encode(input, 2, 1, 2)
    const decoded = linearCodec.decode(encoded, input.length, 1, 2)
    expect(decoded).toEqual(input)
  })

  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Hello, CodeArt!')
    const dataPixelCount = Math.ceil(input.length / 3)
    const encoded = linearCodec.encode(input, dataPixelCount, 10, 10)
    const decoded = linearCodec.decode(encoded, input.length, 10, 10)
    expect(decoded).toEqual(input)
  })
})
