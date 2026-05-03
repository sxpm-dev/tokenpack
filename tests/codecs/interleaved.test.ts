import { describe, it, expect } from 'vitest'
import { interleavedCodec } from '../../src/codecs/interleaved.js'

describe('interleavedCodec', () => {
  it('produces a different pixel order than raw bytes', () => {
    const input = Buffer.from([0xAA, 0xBB, 0xCC, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66])
    const encoded = interleavedCodec.encode(input, 3, 10, 10)
    // pixel 0 (i=0, 0%3===0) swapped with pixel 1
    // Before: pixel0=[0xAA,0xBB,0xCC], pixel1=[0x11,0x22,0x33]
    // After:  pixel0=[0x11,0x22,0x33], pixel1=[0xAA,0xBB,0xCC]
    expect(encoded[0]).toBe(0x11)
    expect(encoded[3]).toBe(0xAA)
  })

  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Interleaved encoding test with some longer content here!')
    const dataPixelCount = Math.ceil(input.length / 3)
    const encoded = interleavedCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = interleavedCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })
})
