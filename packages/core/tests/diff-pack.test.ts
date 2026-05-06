import { describe, expect, it } from 'vitest'

import { packBuffers, type PackEntry } from '../src/archive'
import { applyDiff, diffPack, readDiffMeta } from '../src/diff-pack'

const enc = new TextEncoder()

function pe(path: string, content: string): PackEntry {
  return { path, bytes: enc.encode(content) }
}

function dec(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

describe('diff-pack', () => {
  it('round-trips an unchanged pack as an empty diff', () => {
    const v1 = [pe('a.txt', 'aaa'), pe('b.txt', 'bbb')]
    const result = diffPack(v1, v1)

    expect(result.empty).toBe(true)
    expect(result.added).toEqual([])
    expect(result.modified).toEqual([])
    expect(result.deleted).toEqual([])

    const v2 = applyDiff(v1, result.diff)

    expect(v2.map(e => [e.path, dec(e.bytes)])).toEqual([
      ['a.txt', 'aaa'],
      ['b.txt', 'bbb'],
    ])
  })

  it('captures additions, modifications, deletions correctly', () => {
    const v1 = [pe('a.txt', 'aaa'), pe('b.txt', 'bbb'), pe('c.txt', 'ccc')]
    const v2 = [pe('a.txt', 'aaa'), pe('b.txt', 'BBB'), pe('d.txt', 'ddd')]

    const result = diffPack(v1, v2)

    expect(result.added).toEqual(['d.txt'])
    expect(result.modified).toEqual(['b.txt'])
    expect(result.deleted).toEqual(['c.txt'])
    expect(result.empty).toBe(false)

    const reconstructed = applyDiff(v1, result.diff)
    const map = Object.fromEntries(reconstructed.map(e => [e.path, dec(e.bytes)]))

    expect(map).toEqual({ 'a.txt': 'aaa', 'b.txt': 'BBB', 'd.txt': 'ddd' })
  })

  it('embeds optional baseSha for sanity check', () => {
    const v1 = [pe('a.txt', 'aaa')]
    const v2 = [pe('a.txt', 'AAA')]
    const result = diffPack(v1, v2, { baseSha: 'abc123' })

    const meta = readDiffMeta(result.diff)

    expect(meta).not.toBeNull()
    expect(meta!.baseSha).toBe('abc123')
    expect(meta!.deletions).toEqual([])
  })

  it('chains diffs', () => {
    const v1 = [pe('a.txt', 'v1'), pe('b.txt', 'b')]
    const v2 = [pe('a.txt', 'v2'), pe('b.txt', 'b'), pe('c.txt', 'c')]
    const v3 = [pe('a.txt', 'v3'), pe('c.txt', 'C')]

    const d12 = diffPack(v1, v2).diff
    const d23 = diffPack(v2, v3).diff

    const reconstructedV2 = applyDiff(v1, d12)
    const reconstructedV3 = applyDiff(reconstructedV2, d23)

    const map = Object.fromEntries(reconstructedV3.map(e => [e.path, dec(e.bytes)]))

    expect(map).toEqual({ 'a.txt': 'v3', 'c.txt': 'C' })
  })

  it('rejects non-diff archives in applyDiff', () => {
    const v1 = [pe('a.txt', 'aaa')]
    // A regular pack archive (no .tokenpack-diff-meta.json) should be rejected.
    const fullPack = packBuffers([pe('a.txt', 'something')])

    expect(() => applyDiff(v1, fullPack)).toThrow(/missing .tokenpack-diff-meta.json/)
  })

  it('readDiffMeta returns null for non-diff archives', () => {
    const fullPack = packBuffers([pe('a.txt', 'something')])

    expect(readDiffMeta(fullPack)).toBeNull()
  })
})
