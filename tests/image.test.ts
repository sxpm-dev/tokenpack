import { describe, it, expect } from 'vitest'
import { writePNG, readPNG } from '../src/image.js'
import path from 'path'
import os from 'os'

describe('image', () => {
  it('roundtrips a flat RGB buffer through PNG', () => {
    const width = 4
    const height = 4
    const pixels = new Uint8Array(width * height * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = i % 256

    const tmp = path.join(os.tmpdir(), `codeart-test-${Date.now()}.png`)
    writePNG(tmp, pixels, width, height)
    const result = readPNG(tmp)

    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.pixels).toEqual(pixels)
  })
})
