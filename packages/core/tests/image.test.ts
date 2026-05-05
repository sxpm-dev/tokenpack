import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { CHANNELS } from '../src/surfaces/channels'
import { PngSurface } from '../src/surfaces/png-surface'

describe('PngSurface', () => {
  it('roundtrips a flat RGB buffer through PNG', () => {
    const width = 4
    const height = 4
    const pixels = new Uint8Array(width * height * CHANNELS)

    for (let i = 0; i < pixels.length; i++) pixels[i] = i % 256

    const tmp = path.join(os.tmpdir(), `codeart-test-${Date.now()}.png`)

    PngSurface.encodeSync(tmp, { pixels, width, height, fileChannels: 3 })
    const result = PngSurface.decodeSync(tmp)

    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.fileChannels).toBe(3)
    expect(Array.from(result.pixels)).toEqual(Array.from(pixels))
  })
})
