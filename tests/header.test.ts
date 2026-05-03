import { describe, it, expect } from 'vitest'
import { writeHeader, readHeader, HEADER_BYTES } from '../src/header.js'
import type { HeaderData } from '../src/types.js'

const sample: HeaderData = {
  version: 1,
  algorithmId: 0,
  fileLength: 123456,
  width: 200,
  height: 200,
  styleFlags: 0b00000011,
  ecLevel: 0,
  codecMeta: new Uint8Array(16).fill(0xAB),
  gradientFrom: [255, 0, 128],
  gradientTo: [0, 128, 255],
  gradientDirection: 3,
  backgroundOpacity: 128,
  backgroundColor: [10, 20, 30],
}

describe('header', () => {
  it('roundtrips HeaderData through a pixel buffer', () => {
    const buf = new Uint8Array(HEADER_BYTES)
    writeHeader(buf, sample)
    const result = readHeader(buf)
    expect(result).toEqual(sample)
  })

  it('throws on invalid magic', () => {
    const buf = new Uint8Array(HEADER_BYTES)
    expect(() => readHeader(buf)).toThrow('not a codeart image')
  })
})
