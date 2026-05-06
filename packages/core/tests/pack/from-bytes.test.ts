// fromBytes is the format-aware Pack constructor. These tests exercise its
// dispatch logic + backward compatibility with pre-spec single-file tokens
// (raw payload bytes with no signature/format byte).

import { describe, expect, it } from 'vitest'

import { fromBytes } from '../../src/pack/from-bytes'
import { wrapFileWithName } from '../../src/pack-format/encode-file'
import { FORMAT_FILE, writeFormatByte } from '../../src/pack-format/format-byte'

const enc = new TextEncoder()
const identityDecompress = async (bytes: Uint8Array): Promise<Uint8Array> => bytes

describe('fromBytes — format dispatch', () => {
  it('legacy raw payload (no signature) → FilePack with empty name', async () => {
    const raw = enc.encode('legacy content from before format byte existed')
    const pack = fromBytes(raw, { decompress: identityDecompress })

    expect(pack.isPack()).toBe(false)
    expect(pack.isDiff()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      expect(pack.list).toEqual([''])
      expect(pack.entries).toEqual([{ path: '', size: raw.length }])
      expect(await pack.text()).toBe('legacy content from before format byte existed')
    }
  })

  it('FORMAT_FILE wrapper with name → FilePack carries name', async () => {
    const wrapped = wrapFileWithName('readme.md', enc.encode('# title'))
    const pack = fromBytes(wrapped, { decompress: identityDecompress })

    expect(pack.isPack()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      expect(pack.list).toEqual(['readme.md'])
      expect(await pack.text()).toBe('# title')
    }
  })

  it('FORMAT_FILE wrapper with empty name → FilePack with empty name', async () => {
    const wrapped = wrapFileWithName('', enc.encode('still anonymous'))
    const pack = fromBytes(wrapped, { decompress: identityDecompress })

    if (!pack.isPack() && !pack.isDiff()) {
      expect(pack.list).toEqual([''])
      expect(await pack.text()).toBe('still anonymous')
    }
  })

  it('signature without recognized format byte → throws', () => {
    // Signature + arbitrary byte not in {0x01, 0x02, 0x03}
    const buf = new Uint8Array([0xc0, 0xde, 0xae, 0x54, 0x99])

    expect(() => fromBytes(buf, { decompress: identityDecompress })).toThrow(
      /unknown format byte/i,
    )
  })

  it('partial signature (3 bytes) is treated as legacy raw bytes', async () => {
    // Common shape — short payloads that happen not to start with 0xc0 0xde 0xae 0x54.
    const raw = new Uint8Array([0xc0, 0xde, 0xae])
    const pack = fromBytes(raw, { decompress: identityDecompress })

    expect(pack.isPack()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      const out = await pack.content()

      expect(Array.from(out)).toEqual([0xc0, 0xde, 0xae])
    }
  })

  it('bare format byte without signature is treated as raw bytes', async () => {
    // Edge case: someone stores 5 bytes that happen to look like sig+fmt-prefix.
    // We require signature presence before reading format byte; otherwise fall back to legacy.
    const buf = new Uint8Array(5)

    writeFormatByte(buf, 4, FORMAT_FILE) // 0x01 at byte 4 but no sig at 0–3
    const pack = fromBytes(buf, { decompress: identityDecompress })

    if (!pack.isPack() && !pack.isDiff()) {
      const out = await pack.content()

      expect(out.length).toBe(5)
    }
  })
})
