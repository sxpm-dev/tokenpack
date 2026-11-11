import { describe, expect, it } from 'vitest'
import UPNG from 'upng-js'
import { BrowserPngSurface } from '../src/surfaces/png'

describe('browser PNG byte preservation', () => {
  it('rejects corrupt RGBA image data instead of hanging', async () => {
    const surface = new BrowserPngSurface()
    const bytes = await surface.writeBuffer({ pixels: new Uint8Array(16), width: 2, height: 2, fileChannels: 4 })
    bytes.fill(0xff, 41, 45) // Corrupt the first IDAT zlib header.
    await expect(surface.readBuffer(bytes)).rejects.toThrow()
  })
  for (const channels of [3, 4] as const) {
    it(`writes exact ${channels}-channel pixels without canvas conversion`, async () => {
      const pixels = Uint8Array.from({ length: 19 * 13 * channels }, (_, index) => (index * 37) & 255)
      const bytes = await new BrowserPngSurface().writeBuffer({ pixels, width: 19, height: 13, fileChannels: channels })
      expect(bytes[25]).toBe(channels === 3 ? 2 : 6)
      const decoded = new Uint8Array(UPNG.toRGBA8(UPNG.decode(bytes))[0])
      const actual = []
      for (let i = 0; i < decoded.length; i += 4) actual.push(...decoded.subarray(i, i + channels))
      expect(actual).toEqual([...pixels])
      if (channels === 4) expect((await new BrowserPngSurface().readBuffer(bytes)).pixels).toEqual(pixels)
    })
  }
})
