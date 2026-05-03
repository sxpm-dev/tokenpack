import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { encode } from '../src/encoder.js'
import { decode } from '../src/decoder.js'
import { readPNG } from '../src/image.js'
import { readHeader } from '../src/header.js'
import path from 'path'
import os from 'os'

function tmpPath() {
  return path.join(os.tmpdir(), `codeart-enc-${Date.now()}-${Math.random().toString(36).slice(2)}.png`)
}

describe('encoder', () => {
  it('produces a PNG with a valid header', () => {
    const data = Buffer.from('const x = 42;')
    const out = tmpPath()
    encode(data, { out })

    const { pixels, width, height } = readPNG(out)
    const header = readHeader(pixels)

    expect(header.version).toBe(1)
    expect(header.algorithmId).toBe(0)
    expect(header.fileLength).toBe(data.length)
    expect(header.width).toBe(width)
    expect(header.height).toBe(height)
  })

  it('image dimensions fit the data', () => {
    const data = Buffer.alloc(300, 0xAB)
    const out = tmpPath()
    encode(data, { out })

    const { width, height } = readPNG(out)
    const totalPixels = width * height
    expect(totalPixels).toBeGreaterThanOrEqual(32 + Math.ceil(300 / 3))
  })

  it('encode → decode roundtrip preserves exact bytes', () => {
    const data = Buffer.from('function hello() { return 42; }')
    const png = tmpPath()
    const recovered = tmpPath().replace('.png', '.txt')

    encode(data, { out: png })
    decode(png, { out: recovered })

    expect(fs.readFileSync(recovered)).toEqual(data)
  })

  it('roundtrips a large binary buffer', () => {
    const data = Buffer.alloc(10_000)
    for (let i = 0; i < data.length; i++) data[i] = i % 256

    const png = tmpPath()
    const recovered = tmpPath().replace('.png', '.bin')

    encode(data, { out: png })
    decode(png, { out: recovered })

    expect(fs.readFileSync(recovered)).toEqual(data)
  })
})
