import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { encode } from '../src/encoder'
import { decode } from '../src/decoder'
import { readPNG } from '../src/image'
import { readHeader } from '../src/header'
import path from 'path'
import os from 'os'
import '../src/codecs/register-all'

function tmpPath(ext = '.png') {
  return path.join(
    os.tmpdir(),
    `codeart-enc-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
  )
}

describe('encoder', () => {
  it('produces a PNG with a valid full header when style is set', async () => {
    const data = Buffer.from('const x = 42;')
    const out = tmpPath()
    // style forces full header mode (compact is only used when no style)
    await encode(data, { out, style: { gradient: { from: [0,0,0], to: [255,0,0], direction: 'horizontal' }, opacity: 1.0, background: [0,0,0] } })

    const { pixels, width, height } = readPNG(out)
    const header = readHeader(pixels)

    expect(header.version).toBe(1)
    expect(header.algorithmId).toBe(0)
    expect(header.fileLength).toBe(data.length)
    expect(header.width).toBe(width)
    expect(header.height).toBe(height)
  })

  it('image dimensions fit the data', async () => {
    const data = Buffer.alloc(300, 0xab)
    const out = tmpPath()
    await encode(data, { out })

    const { width, height } = readPNG(out)
    const totalPixels = width * height
    expect(totalPixels).toBeGreaterThanOrEqual(32 + Math.ceil(300 / 4))
  })

  it('encode → decode roundtrip preserves exact bytes', async () => {
    const data = Buffer.from('function hello() { return 42; }')
    const png = tmpPath()
    const recovered = tmpPath('.txt')

    await encode(data, { out: png })
    await decode(png, { out: recovered })

    expect(fs.readFileSync(recovered)).toEqual(data)
  })

  it('roundtrips a large binary buffer', async () => {
    const data = Buffer.alloc(10_000)
    for (let i = 0; i < data.length; i++) data[i] = i % 256

    const png = tmpPath()
    const recovered = tmpPath('.bin')

    await encode(data, { out: png })
    await decode(png, { out: recovered })

    expect(fs.readFileSync(recovered)).toEqual(data)
  })

  it('roundtrips with bpp=4 (RGBA)', async () => {
    const data = Buffer.from('hello world with bpp=4 channels!')
    const png = tmpPath()
    const recovered = tmpPath('.txt')

    await encode(data, { out: png, channels: 4 })
    await decode(png, { out: recovered })

    expect(fs.readFileSync(recovered)).toEqual(data)
  })

  it('roundtrips with bpp=1', async () => {
    const data = Buffer.from('hello bpp1')
    const png = tmpPath()
    const recovered = tmpPath('.txt')

    await encode(data, { out: png, channels: 1 })
    await decode(png, { out: recovered })

    expect(fs.readFileSync(recovered)).toEqual(data)
  })
})
