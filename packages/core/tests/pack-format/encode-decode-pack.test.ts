import { describe, expect, it } from 'vitest'

import type { PackEntry } from '../../src/archive-buffers'
import { decodePack } from '../../src/pack-format/decode-pack'
import { type CompressFn, encodePack } from '../../src/pack-format/encode-pack'

// Identity "compressor" for tests — bytes pass through unchanged.
const identity: CompressFn = async bytes => ({
  bytes: new Uint8Array(bytes),
  compressor: 'none',
  level: 0,
  originalSize: bytes.length,
})

const enc = new TextEncoder()
const dec = new TextDecoder()

describe('encode-pack + decode-pack', () => {
  it('round-trips one file', async () => {
    const entries: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('hello') }]
    const packed = await encodePack(entries, identity)
    const handle = decodePack(packed)

    expect(handle.manifest.files.map(f => f.path)).toEqual(['a.js'])
    expect(dec.decode(handle.extractRegion('a.js'))).toBe('hello')
  })

  it('round-trips many files', async () => {
    const entries: PackEntry[] = [
      { path: 'src/a.js', bytes: enc.encode('aaa') },
      { path: 'src/b.js', bytes: enc.encode('bbbb') },
      { path: 'README.md', bytes: enc.encode('# title') },
    ]
    const packed = await encodePack(entries, identity)
    const handle = decodePack(packed)

    expect(handle.manifest.files.map(f => f.path)).toEqual(['src/a.js', 'src/b.js', 'README.md'])
    expect(dec.decode(handle.extractRegion('src/a.js'))).toBe('aaa')
    expect(dec.decode(handle.extractRegion('src/b.js'))).toBe('bbbb')
    expect(dec.decode(handle.extractRegion('README.md'))).toBe('# title')
  })

  it('handles empty file', async () => {
    const entries: PackEntry[] = [{ path: 'empty', bytes: new Uint8Array(0) }]
    const packed = await encodePack(entries, identity)
    const handle = decodePack(packed)

    expect(handle.extractRegion('empty')).toEqual(new Uint8Array(0))
  })

  it('handles 1MB file', async () => {
    const big = new Uint8Array(1024 * 1024).fill(0x42)
    const packed = await encodePack([{ path: 'big.bin', bytes: big }], identity)
    const handle = decodePack(packed)
    const out = handle.extractRegion('big.bin')

    expect(out.length).toBe(big.length)
    expect(out[0]).toBe(0x42)
    expect(out[out.length - 1]).toBe(0x42)
  })

  it('throws on unknown path', async () => {
    const packed = await encodePack([{ path: 'a.js', bytes: enc.encode('x') }], identity)
    const handle = decodePack(packed)

    expect(() => handle.extractRegion('nope')).toThrow(/no entry/i)
  })

  it('produces empty pack for empty entries', async () => {
    const packed = await encodePack([], identity)
    const handle = decodePack(packed)

    expect(handle.manifest.files).toEqual([])
  })

  it('rejects bytes lacking signature', async () => {
    expect(() => decodePack(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toThrow(/signature/i)
  })
})
