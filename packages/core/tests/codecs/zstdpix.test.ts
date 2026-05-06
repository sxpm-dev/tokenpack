// zstdpix runtime moved to @tokenpack/node — Node 22 / @mongodb-js/zstd live there.
import { hasZstd, zstdpixCodec } from '@tokenpack/node'
import { describe, expect, it } from 'vitest'

function roundtrip(input: Buffer, channels = 3) {
  const dp = zstdpixCodec.estimateDataPixels!(input, channels)
  const enc = zstdpixCodec.encode(input, dp, 10, 10, channels)
  const dec = zstdpixCodec.decode(enc, input.length)

  expect(dec).toEqual(input)
}

describe.skipIf(!hasZstd())('zstdpixCodec', () => {
  it('has id 21 and name zstdpix', () => {
    expect(zstdpixCodec.id).toBe(21)
    expect(zstdpixCodec.name).toBe('zstdpix')
  })

  it('roundtrips empty buffer', () => roundtrip(Buffer.alloc(0)))

  it('roundtrips single byte', () => roundtrip(Buffer.from([0x42])))

  it('roundtrips 1KB of bytes', () =>
    roundtrip(Buffer.from(Array.from({ length: 1024 }, (_, i) => (i * 37 + 13) % 256))))

  it('roundtrips 1KB of repeated text', () => roundtrip(Buffer.from('Hello, CodeArt! '.repeat(64))))

  it('compresses repetitive data better than raw', () => {
    const input = Buffer.from('abcdefghij'.repeat(200))
    const dp = zstdpixCodec.estimateDataPixels!(input, 3)

    // Compressed pixel count should be much less than raw
    expect(dp).toBeLessThan(Math.ceil(input.length / 3))
  })

  it('does not advertise streaming chunk decode', () => {
    expect('decodeChunk' in zstdpixCodec).toBe(false)
  })
})

describe.skipIf(hasZstd())('zstdpixCodec (zstd unavailable)', () => {
  it('throws when zstd is not available', () => {
    expect(() => {
      const dp = zstdpixCodec.estimateDataPixels!(Buffer.from([1, 2, 3]), 3)

      zstdpixCodec.encode(Buffer.from([1, 2, 3]), dp, 1, 1)
    }).toThrow('zstdpix requires')
  })
})
