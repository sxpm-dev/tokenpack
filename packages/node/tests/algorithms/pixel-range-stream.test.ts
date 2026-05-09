import { describe, expect, it } from 'vitest'

import '../../src/register'
import { PixelRangeStreamPngBrotli } from '../../src/algorithms/pixel-range-stream'

describe('PixelRangeStreamPngBrotli', () => {
  it('exposes computed capabilities — streamable surface', () => {
    const caps = PixelRangeStreamPngBrotli.capabilities
    expect(caps.streamable).toBe(true)
  })

  it('round-trips an arbitrary byte buffer through the tpAK chunk', async () => {
    const algo = new PixelRangeStreamPngBrotli()
    const input = new TextEncoder().encode('streaming pixel-range brotli')
    const encoded = await algo.encode(input)

    expect(encoded[0]).toBe(0x89)
    expect(encoded.length).toBeGreaterThan(0)

    const decoded = await algo.decode(encoded)
    expect(new TextDecoder().decode(decoded)).toBe('streaming pixel-range brotli')
  })

  it('round-trips a larger payload', async () => {
    const algo = new PixelRangeStreamPngBrotli()
    const input = new Uint8Array(4096)
    for (let i = 0; i < input.length; i++) input[i] = (i * 31) & 0xff
    const encoded = await algo.encode(input)
    const decoded = await algo.decode(encoded)

    expect(decoded.length).toBe(input.length)
    expect(Array.from(decoded.subarray(0, 16))).toEqual(Array.from(input.subarray(0, 16)))
  })
})
