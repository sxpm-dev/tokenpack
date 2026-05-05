import '../../src/algorithms/register-all'

import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { decode } from '../../src/decoder'
import { encode } from '../../src/encoder'

function tmp(ext = '.png'): string {
  return path.join(
    os.tmpdir(),
    `codeart-fec-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
  )
}

describe('FEC pipeline integration', () => {
  it('round-trips with rs-15 (compress + encrypt + FEC)', async () => {
    const data = Buffer.from('Reed-Solomon roundtrip — '.repeat(50))
    const png = tmp()
    const out = tmp('.txt')

    await encode(data, {
      out: png,
      compressionMode: 'brotli-11',
      key: 'secret',
      fecMode: 'rs-15',
    })
    await decode(png, { out, key: 'secret' })

    expect(fs.readFileSync(out).equals(data)).toBe(true)
  })

  it('round-trips with each FEC level', async () => {
    const data = Buffer.from('hello FEC ' + 'x'.repeat(800))

    for (const fecMode of ['rs-5', 'rs-15', 'rs-25']) {
      const png = tmp()
      const out = tmp('.txt')

      await encode(data, { out: png, fecMode })
      await decode(png, { out })

      expect(fs.readFileSync(out).equals(data)).toBe(true)
    }
  })

  it('rejects FEC + streaming at encode time', async () => {
    const data = Buffer.from('streaming + fec must throw')
    const png = tmp()

    await expect(encode(data, { out: png, fecMode: 'rs-5', streaming: true })).rejects.toThrow(
      /streaming and FEC are incompatible/,
    )
  })

  it('decode without FEC works for non-FEC tokens (backward compat)', async () => {
    const data = Buffer.from('no fec here, just a plain token')
    const png = tmp()
    const out = tmp('.txt')

    await encode(data, { out: png })
    await decode(png, { out })

    expect(fs.readFileSync(out).equals(data)).toBe(true)
  })
})
