import { describe, expect, it } from 'vitest'

import '../../src/register'
import { PixelRangePngBrotli } from '../../src/algorithms/pixel-range-png-brotli'

describe('PixelRangePngBrotli', () => {
  it('exposes computed capabilities', () => {
    const caps = PixelRangePngBrotli.capabilities
    expect(caps.surface).toBe('png')
    expect(caps.lossless).toBe(true)
  })

  it('round-trips an arbitrary byte buffer through the tpAK chunk', async () => {
    const algo = new PixelRangePngBrotli()
    const input = new TextEncoder().encode('hello PixelRange world')
    const encoded = await algo.encode(input)

    expect(encoded[0]).toBe(0x89) // PNG signature
    expect(encoded.length).toBeGreaterThan(0)

    const decoded = await algo.decode(encoded)
    expect(new TextDecoder().decode(decoded)).toBe('hello PixelRange world')
  })

  it('round-trips a larger payload', async () => {
    const algo = new PixelRangePngBrotli()
    const input = new Uint8Array(4096)
    for (let i = 0; i < input.length; i++) input[i] = (i * 31) & 0xff
    const encoded = await algo.encode(input)
    const decoded = await algo.decode(encoded)

    expect(decoded.length).toBe(input.length)
    expect(Array.from(decoded.subarray(0, 16))).toEqual(Array.from(input.subarray(0, 16)))
  })

  it('canHandle returns true for its own artifacts and false otherwise', async () => {
    const algo = new PixelRangePngBrotli()
    const ours = await algo.encode(new TextEncoder().encode('hi'))
    expect(algo.canHandle(ours)).toBe(true)

    // A plain PNG without tpAK chunk should not be claimed.
    const plain = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(algo.canHandle(plain)).toBe(false)
  })

  it('respects custom decoration', async () => {
    const algo = new PixelRangePngBrotli()
    const input = new TextEncoder().encode('decoration test')
    const encoded = await algo.encode(input, {
      decoration: { kind: 'placeholder', size: 4, colorFrom: [200, 100, 50], colorTo: [0, 0, 0] },
    } as never)
    expect(encoded[0]).toBe(0x89)
    const decoded = await algo.decode(encoded)
    expect(new TextDecoder().decode(decoded)).toBe('decoration test')
  })

  it('end-to-end through pack-format: builder → encodePack → algo → decode → decodePack', async () => {
    const { PackBuilder } = await import('tokenpack')
    const { encodePack } = await import('tokenpack/pack-format/encode-pack')
    const { decodePack } = await import('tokenpack/pack-format/decode-pack')
    const { compressRaw, decompressRaw } = await import('tokenpack/compressors')

    const builder = new PackBuilder()
      .withFile('a.txt', 'hello a')
      .withFile('nested/b.json', '{"x":42}')
    const entries = await builder.build()
    const packBytes = await encodePack(entries, async b => {
      const r = await compressRaw(b, 'brotli-11')
      return { bytes: r.bytes, compressor: r.compressor, level: r.level, originalSize: r.originalSize }
    })

    const algo = new PixelRangePngBrotli()
    const png = await algo.encode(packBytes)
    expect(png[0]).toBe(0x89)

    const recovered = await algo.decode(png)
    expect(Array.from(recovered)).toEqual(Array.from(packBytes))

    const decoded = decodePack(new Uint8Array(recovered.buffer, recovered.byteOffset, recovered.byteLength))
    expect(decoded.manifest.files.map(f => f.path).sort()).toEqual(['a.txt', 'nested/b.json'])
    const aRegion = decoded.extractRegion('a.txt')
    const aBytes = await decompressRaw(aRegion, 'brotli-11', { level: 11, uncompressedLength: 7 })
    expect(new TextDecoder().decode(aBytes)).toBe('hello a')
  })
})
