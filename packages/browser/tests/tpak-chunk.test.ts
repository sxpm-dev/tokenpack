import { describe, expect, it } from 'vitest'
import { insertTpakChunk, extractTpakChunk } from '../src/algorithms/pixel-range-png-base'

const png = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000049454e44ae426082',
  'hex',
)

describe('tpAK chunks', () => {
  it('roundtrips an offset byte view', () => {
    const data = new Uint8Array([99, 1, 2, 3, 99]).subarray(1, 4)
    expect(Array.from(extractTpakChunk(insertTpakChunk(png, data)))).toEqual([1, 2, 3])
  })
  it('rejects a truncated payload', () => {
    const artifact = insertTpakChunk(png, new Uint8Array([1, 2, 3]))
    expect(() => extractTpakChunk(artifact.subarray(0, 43))).toThrow()
  })
  it('rejects a missing chunk checksum', () => {
    const artifact = insertTpakChunk(png, new Uint8Array([1, 2, 3]))
    expect(() => extractTpakChunk(artifact.subarray(0, 44))).toThrow()
  })
  it('rejects invalid images at insertion', () => {
    expect(() => insertTpakChunk(Buffer.alloc(33), new Uint8Array())).toThrow()
  })
})
