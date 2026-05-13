import { describe, expect, it } from 'vitest'

import type { PackEntry } from '../../src/archive-buffers'
import { DirPack } from '../../src/pack/dir-pack'
import { fromBytes } from '../../src/pack/from-bytes'
import { applyDiff, decodeDiff } from '../../src/pack-format/apply-diff'
import { computeDiffOps, encodeDiff } from '../../src/pack-format/encode-diff'
import { type CompressFn } from '../../src/pack-format/encode-pack'

const enc = new TextEncoder()

const identity: CompressFn = async bytes => ({
  bytes: new Uint8Array(bytes),
  compressor: 'none',
  level: 0,
  originalSize: bytes.length,
})

const identityDecompress = async (bytes: Uint8Array): Promise<Uint8Array> => new Uint8Array(bytes)

describe('diff: computeDiffOps', () => {
  it('detects add for new file', () => {
    const prev: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('aa') }]
    const next: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('aa') },
      { path: 'new.js', bytes: enc.encode('xx') },
    ]

    expect(computeDiffOps(prev, next)).toContainEqual({ op: 'add', path: 'new.js' })
  })

  it('detects delete for removed file', () => {
    const prev: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('aa') },
      { path: 'b.js', bytes: enc.encode('bb') },
    ]
    const next: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('aa') }]

    expect(computeDiffOps(prev, next)).toContainEqual({ op: 'delete', path: 'b.js' })
  })

  it('detects modify for changed content', () => {
    const prev: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('aa') }]
    const next: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('AAA') }]

    expect(computeDiffOps(prev, next)).toContainEqual({ op: 'modify', path: 'a.js' })
  })

  it('detects rename (same content, different path)', () => {
    const prev: PackEntry[] = [{ path: 'old.js', bytes: enc.encode('same') }]
    const next: PackEntry[] = [{ path: 'new.js', bytes: enc.encode('same') }]

    expect(computeDiffOps(prev, next)).toContainEqual({
      op: 'rename',
      path: 'new.js',
      fromPath: 'old.js',
    })
  })

  it('emits no ops for identical sets', () => {
    const a: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('aa') }]

    expect(computeDiffOps(a, a)).toEqual([])
  })
})

describe('diff: encode/decode + apply', () => {
  it('round-trips ops through encodeDiff/decodeDiff', async () => {
    const prev: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('aa') },
      { path: 'b.js', bytes: enc.encode('bb') },
    ]
    const next: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('AA') },
      { path: 'c.js', bytes: enc.encode('cc') },
    ]
    const diffBytes = await encodeDiff(prev, next, identity)
    const decoded = decodeDiff(diffBytes)
    const summary = decoded.manifest.ops.map(o => ({ op: o.op, path: o.path }))

    expect(summary).toContainEqual({ op: 'modify', path: 'a.js' })
    expect(summary).toContainEqual({ op: 'add', path: 'c.js' })
    expect(summary).toContainEqual({ op: 'delete', path: 'b.js' })
  })

  it('apply reconstructs next byte-identical', async () => {
    const prev: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('aa') },
      { path: 'b.js', bytes: enc.encode('bb') },
    ]
    const next: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('AA') },
      { path: 'c.js', bytes: enc.encode('cc') },
    ]
    const diffBytes = await encodeDiff(prev, next, identity)
    const reconstructed = await applyDiff(prev, diffBytes, identityDecompress)
    const map = new Map(reconstructed.map(r => [r.path, r.bytes]))

    expect(new TextDecoder().decode(map.get('a.js')!)).toBe('AA')
    expect(new TextDecoder().decode(map.get('c.js')!)).toBe('cc')
    expect(map.has('b.js')).toBe(false)
  })

  it('stores a compact patch for a localized file edit', async () => {
    const prev: PackEntry[] = [{ path: 'a.txt', bytes: enc.encode('asdasd') }]
    const next: PackEntry[] = [{ path: 'a.txt', bytes: enc.encode('asdzxc') }]
    const diffBytes = await encodeDiff(prev, next, identity)
    const decoded = decodeDiff(diffBytes)
    const op = decoded.manifest.ops[0]

    expect(op).toMatchObject({
      op: 'patch',
      path: 'a.txt',
      patchStart: 3,
      deleteSize: 3,
      originalSize: 3,
      targetSize: 6,
    })
    expect(new TextDecoder().decode(decoded.extractRegion('a.txt'))).toBe('zxc')

    const reconstructed = await applyDiff(prev, diffBytes, identityDecompress)

    expect(new TextDecoder().decode(reconstructed[0].bytes)).toBe('asdzxc')
  })

  it('applies a rename op without re-shipping content', async () => {
    const prev: PackEntry[] = [{ path: 'old.js', bytes: enc.encode('same content') }]
    const next: PackEntry[] = [{ path: 'new.js', bytes: enc.encode('same content') }]
    const diffBytes = await encodeDiff(prev, next, identity)
    const reconstructed = await applyDiff(prev, diffBytes, identityDecompress)

    expect(reconstructed.map(e => e.path)).toEqual(['new.js'])
    expect(new TextDecoder().decode(reconstructed[0].bytes)).toBe('same content')
  })

  it('basePack.apply(diffPack) is lazy and does not extract the full base up front', async () => {
    const prev: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('aa') },
      { path: 'b.js', bytes: enc.encode('bb') },
    ]
    const next: PackEntry[] = [
      { path: 'a.js', bytes: enc.encode('AA') },
      { path: 'b.js', bytes: enc.encode('bb') },
      { path: 'c.js', bytes: enc.encode('cc') },
    ]
    const diffPack = fromBytes(await encodeDiff(prev, next, identity), {
      decompress: identityDecompress,
    })
    let extractAllCalls = 0
    let extractCalls = 0
    const basePack = new DirPack(
      prev.map(entry => ({ path: entry.path, size: entry.bytes.length })),
      async path => {
        extractCalls += 1
        const entry = prev.find(candidate => candidate.path === path)

        if (!entry) throw new Error(`missing ${path}`)

        return entry.bytes
      },
      async () => {
        extractAllCalls += 1

        return prev
      },
    )

    if (!diffPack.isDiff()) throw new Error('expected DiffPack')

    const reconstructed = await basePack.apply(diffPack)

    expect(extractAllCalls).toBe(0)
    expect(extractCalls).toBe(0)
    expect(reconstructed.list.sort()).toEqual(['a.js', 'b.js', 'c.js'])
    expect(new TextDecoder().decode(await reconstructed.extract('b.js'))).toBe('bb')
    expect(extractCalls).toBe(1)
  })

  it('throws on malformed diff bytes', () => {
    expect(() => decodeDiff(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toThrow(/signature/i)
  })
})
