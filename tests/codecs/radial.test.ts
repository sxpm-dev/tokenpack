import { describe, it, expect } from 'vitest'
import { radialCodec } from '../../src/codecs/radial'
import { CHANNELS } from '../../src/image'

describe('radialCodec', () => {
  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Hello, radial world! This is a test of the radial codec.')
    const width = 20
    const height = 20
    const dataPixelCount = width * height - 32
    const encoded = radialCodec.encode(input, dataPixelCount, width, height)
    expect(encoded.length).toBe(dataPixelCount * CHANNELS)
    const decoded = radialCodec.decode(encoded, input.length, width, height)
    expect(decoded).toEqual(input)
  })

  it('places different bytes in different pixels than linear', () => {
    const input = Buffer.alloc(12, 0xff)
    input[0] = 0xaa
    input[4] = 0xbb
    input[8] = 0xcc
    const width = 10
    const height = 10
    const dataPixelCount = width * height - 32
    const linear = new Uint8Array(dataPixelCount * CHANNELS)
    linear[0] = 0xaa
    linear[4] = 0xbb
    linear[8] = 0xcc
    const radial = radialCodec.encode(input, dataPixelCount, width, height)
    expect(Buffer.from(radial)).not.toEqual(Buffer.from(linear))
  })
})
