import { describe, it, expect } from 'vitest'
import { interleavedCodec } from '../../src/codecs/interleaved'
import { CHANNELS } from '../../src/image'

describe('interleavedCodec', () => {
  it('produces a different pixel order than raw bytes', () => {
    // 6 bytes → 2 RGB pixels. Interleaved swaps pixel 0 with pixel 1.
    // pixel0=[0xaa,0xbb,0xcc], pixel1=[0x11,0x22,0x33] → after swap:
    // pixel0=[0x11,0x22,0x33], pixel1=[0xaa,0xbb,0xcc]
    const input = Buffer.from([0xaa, 0xbb, 0xcc, 0x11, 0x22, 0x33])
    const encoded = interleavedCodec.encode(input, 2, 10, 10)
    expect(encoded[0]).toBe(0x11)
    expect(encoded[CHANNELS]).toBe(0xaa)
  })

  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Interleaved encoding test with some longer content here!')
    const dataPixelCount = Math.ceil(input.length / CHANNELS)
    const encoded = interleavedCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = interleavedCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })
})
