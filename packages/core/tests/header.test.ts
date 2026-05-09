import { describe, expect, it } from 'vitest'

import { HEADER_BYTES, readHeader, writeHeader } from '../src/header'
import type { HeaderData } from '../src/types'

const sample: HeaderData = {
  version: 1,
  algorithmId: 0,
  fileLength: 123456,
  width: 200,
  height: 200,
  ecLevel: 0,
  compressionLevel: 2,
  uncompressedLength: 999999,
  cellSize: 5,
  dataPixelCount: 12345,
  channels: 4,
  preFecLength: 0,
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

    expect(() => readHeader(buf)).toThrow('not a tokenpack image')
  })
})
