import { describe, expect, it } from 'vitest'

import '../../src/register'
import { PixelRangePngDeflate } from '../../src/algorithms/pixel-range-deflate'

describe('PixelRangePngDeflate', () => {
  it('exposes computed capabilities', () => {
    const caps = PixelRangePngDeflate.capabilities
    expect(caps.surface).toBe('png')
    expect(caps.lossless).toBe(true)
  })

  it('round-trips an arbitrary byte buffer through the tpAK chunk', async () => {
    const algo = new PixelRangePngDeflate()
    const input = new TextEncoder().encode('hello PixelRange deflate')
    const encoded = await algo.encode(input)

    expect(encoded[0]).toBe(0x89)
    expect(encoded.length).toBeGreaterThan(0)

    const decoded = await algo.decode(encoded)
    expect(new TextDecoder().decode(decoded)).toBe('hello PixelRange deflate')
  })

  it('round-trips a larger payload', async () => {
    const algo = new PixelRangePngDeflate()
    const input = new Uint8Array(4096)
    for (let i = 0; i < input.length; i++) input[i] = (i * 31) & 0xff
    const encoded = await algo.encode(input)
    const decoded = await algo.decode(encoded)

    expect(decoded.length).toBe(input.length)
    expect(Array.from(decoded.subarray(0, 16))).toEqual(Array.from(input.subarray(0, 16)))
  })

  it('canHandle returns true for its own artifacts and false otherwise', async () => {
    const algo = new PixelRangePngDeflate()
    const ours = await algo.encode(new TextEncoder().encode('hi'))
    expect(algo.canHandle(ours)).toBe(true)

    const plain = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(algo.canHandle(plain)).toBe(false)
  })
})
