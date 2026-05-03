import { describe, it, expect } from 'vitest'
import { radialCodec } from '../../src/codecs/radial.js'

describe('radialCodec', () => {
  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Hello, radial world! This is a test of the radial codec.')
    const width = 20
    const height = 20
    const dataPixelCount = width * height - 32
    const encoded = radialCodec.encode(input, dataPixelCount, width, height)
    expect(encoded.length).toBe(dataPixelCount * 3)
    const decoded = radialCodec.decode(encoded, input.length, width, height)
    expect(decoded).toEqual(input)
  })

  it('places different bytes in different pixels than linear', () => {
    const input = Buffer.alloc(9, 0xFF)
    input[0] = 0xAA; input[3] = 0xBB; input[6] = 0xCC
    const width = 10; const height = 10
    const dataPixelCount = width * height - 32
    const linear = Buffer.alloc(dataPixelCount * 3)
    linear[0] = 0xAA; linear[9] = 0xBB; linear[18] = 0xCC
    const radial = radialCodec.encode(input, dataPixelCount, width, height)
    expect(Buffer.from(radial)).not.toEqual(linear)
  })
})
