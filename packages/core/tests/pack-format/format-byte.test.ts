import { describe, expect, it } from 'vitest'

import {
  FORMAT_DIFF,
  FORMAT_FILE,
  FORMAT_PACK,
  readFormatByte,
  writeFormatByte,
} from '../../src/pack-format/format-byte'

describe('format-byte', () => {
  it('writes and reads the file format byte', () => {
    const buf = new Uint8Array(1)

    writeFormatByte(buf, 0, FORMAT_FILE)
    expect(readFormatByte(buf, 0)).toBe(FORMAT_FILE)
  })

  it('writes and reads the pack format byte', () => {
    const buf = new Uint8Array(1)

    writeFormatByte(buf, 0, FORMAT_PACK)
    expect(readFormatByte(buf, 0)).toBe(FORMAT_PACK)
  })

  it('writes and reads the diff format byte', () => {
    const buf = new Uint8Array(1)

    writeFormatByte(buf, 0, FORMAT_DIFF)
    expect(readFormatByte(buf, 0)).toBe(FORMAT_DIFF)
  })

  it('throws on unknown format byte at read', () => {
    const buf = new Uint8Array([0x99])

    expect(() => readFormatByte(buf, 0)).toThrow(/unknown format byte/i)
  })

  it('throws on unknown format byte at write', () => {
    const buf = new Uint8Array(1)

    // @ts-expect-error testing runtime check with invalid value
    expect(() => writeFormatByte(buf, 0, 0x99)).toThrow(/unknown format byte/i)
  })
})
