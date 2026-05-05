import { describe, expect, it } from 'vitest'

import { decodeEcByte, encodeEcByte } from '../../src/header'

describe('ec byte', () => {
  it('roundtrips every (encrypted × fecLevel) combination', () => {
    for (const encrypted of [false, true]) {
      for (let level = 0; level <= 7; level++) {
        const b = encodeEcByte(encrypted, level)
        const decoded = decodeEcByte(b)

        expect(decoded.encrypted).toBe(encrypted)
        expect(decoded.fecLevel).toBe(level)
      }
    }
  })

  it('decodes legacy bytes (0 = clean, 1 = encrypted, fecLevel always 0)', () => {
    expect(decodeEcByte(0)).toEqual({ encrypted: false, fecLevel: 0 })
    expect(decodeEcByte(1)).toEqual({ encrypted: true, fecLevel: 0 })
  })

  it('throws when fecLevel out of range', () => {
    expect(() => encodeEcByte(false, 8)).toThrow()
    expect(() => encodeEcByte(false, -1)).toThrow()
  })
})
