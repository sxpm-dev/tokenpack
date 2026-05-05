import { describe, expect, it } from 'vitest'

import { rsDecode, rsEncode } from '../../src/fec/rs'

describe('Reed-Solomon GF(2^8)', () => {
  describe.each([
    { label: 'rs-5', parity: 12 },
    { label: 'rs-15', parity: 38 },
    { label: 'rs-25', parity: 64 },
  ])('parity=$parity ($label)', ({ parity }) => {
    it('roundtrips a clean payload', () => {
      const data = Buffer.from('hello, reed-solomon world! ' + 'x'.repeat(500))
      const encoded = rsEncode(data, parity)
      const decoded = rsDecode(encoded, parity, data.length)

      expect(decoded.length).toBe(data.length)
      expect(decoded.equals(data)).toBe(true)
    })

    it('recovers from corruption up to the theoretical limit', () => {
      const data = Buffer.alloc(400)

      for (let i = 0; i < data.length; i++) data[i] = i % 256

      const encoded = rsEncode(data, parity)
      const corrupted = Buffer.from(encoded)
      const correctableBytes = Math.floor(parity / 2)

      // corrupt `correctableBytes` random positions in the first 255-byte block
      for (let i = 0; i < correctableBytes; i++) {
        corrupted[i * 2] = (corrupted[i * 2] + 0x37) & 0xff
      }

      const decoded = rsDecode(corrupted, parity, data.length)

      expect(decoded.equals(data)).toBe(true)
    })

    it('throws when corruption exceeds the limit', () => {
      const data = Buffer.alloc(200)

      for (let i = 0; i < data.length; i++) data[i] = (i * 7) % 256

      const encoded = rsEncode(data, parity)
      const corrupted = Buffer.from(encoded)
      const tooMany = Math.floor(parity / 2) + 1

      for (let i = 0; i < tooMany; i++) {
        corrupted[i] = (corrupted[i] + 0xa5) & 0xff
      }

      expect(() => rsDecode(corrupted, parity, data.length)).toThrow()
    })

    it('handles multi-block payloads', () => {
      // force >1 block
      const data = Buffer.alloc(800)

      for (let i = 0; i < data.length; i++) data[i] = (i * 13 + 5) % 256

      const encoded = rsEncode(data, parity)
      const dataPerBlock = 255 - parity
      const expectedBlocks = Math.ceil(data.length / dataPerBlock)

      expect(encoded.length).toBe(expectedBlocks * 255)

      const decoded = rsDecode(encoded, parity, data.length)

      expect(decoded.equals(data)).toBe(true)
    })

    it('handles a final partial block (padding)', () => {
      const data = Buffer.from('short')
      const encoded = rsEncode(data, parity)

      expect(encoded.length).toBe(255)

      const decoded = rsDecode(encoded, parity, data.length)

      expect(decoded.length).toBe(data.length)
      expect(decoded.equals(data)).toBe(true)
    })
  })
})
