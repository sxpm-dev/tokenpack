// Concrete PngSurface lives in @tokenpack/node — core ships only the abstract base.
import '@tokenpack/node'

import { PngSurface } from '@tokenpack/node/surfaces/png'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { CHANNELS } from '../src/surfaces/channels'

describe('PngSurface', () => {
  it('roundtrips a flat RGB buffer through PNG', async () => {
    const width = 4
    const height = 4
    const pixels = new Uint8Array(width * height * CHANNELS)

    for (let i = 0; i < pixels.length; i++) pixels[i] = i % 256

    const tmp = path.join(os.tmpdir(), `codeart-test-${Date.now()}.png`)
    const surface = new PngSurface()

    await surface.write(tmp, { pixels, width, height, fileChannels: 3 })
    const result = await surface.readFile(tmp)

    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.fileChannels).toBe(3)
    expect(Array.from(result.pixels)).toEqual(Array.from(pixels))
  })
})
