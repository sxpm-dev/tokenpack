import { decode, encode } from '@tokenpack/node'
import { PackBuilder } from '@tokenpack/node'
import { describe, expect, it } from 'vitest'

import { algorithmCatalog } from '../../src/algorithms/catalog'
import type { DiffPack, DirPack } from '../../src/pack/types'

async function buildLinearToken(...files: Array<[string, string]>): Promise<Buffer> {
  let b = new PackBuilder()

  for (const [path, body] of files) b = b.withFile(path, body)
  const r = await encode(b)

  return Buffer.from(r.buffer, r.byteOffset, r.byteLength)
}

describe('AbstractAlgorithm.diff', () => {
  it('linear: text() reports per-file line changes', async () => {
    const tokenA = await buildLinearToken(['a.txt', 'one\ntwo\nthree'])
    const tokenB = await buildLinearToken(['a.txt', 'one\nTWO\nthree'])
    const [packA, packB] = await Promise.all([decode(tokenA), decode(tokenB)])
    const Linear = algorithmCatalog.getByName('linear')
    const algo = new Linear()
    const fileDiffs = await algo.diff(packA, packB).text()

    expect(fileDiffs).toHaveLength(1)
    expect(fileDiffs[0].filePath).toBe('a.txt')
    expect(fileDiffs[0].added).toBe(1)
    expect(fileDiffs[0].removed).toBe(1)
  })

  it('linear: token() produces a DiffPack roundtrip applies cleanly', async () => {
    const tokenA = await buildLinearToken(['a.txt', 'first'], ['b.txt', 'kept'])
    const tokenB = await buildLinearToken(['a.txt', 'second'], ['c.txt', 'added'])
    const [packA, packB] = await Promise.all([decode(tokenA), decode(tokenB)])

    if (!packA.isPack() || !packB.isPack()) throw new Error('expected DirPacks')
    const Linear = algorithmCatalog.getByName('linear')
    const algo = new Linear()
    const diffTokenBytes = await algo.diff(packA, packB).token()
    const diffPack = await decode(diffTokenBytes)

    expect(diffPack.isDiff()).toBe(true)
    const ops = (diffPack as DiffPack).entries.map(e => e.op).sort()

    expect(ops).toContain('modify') // a.txt
    expect(ops).toContain('add') // c.txt
    expect(ops).toContain('delete') // b.txt

    // Patch flow: applying the diff to packA reconstructs packB's tree.
    const reconstructed = await (diffPack as DiffPack).apply(packA as DirPack)
    const reconstructedEntries = await reconstructed.extractAll()
    const expectedEntries = await (packB as DirPack).extractAll()
    const sortByPath = (a: { path: string }, b: { path: string }) =>
      a.path.localeCompare(b.path)

    reconstructedEntries.sort(sortByPath)
    expectedEntries.sort(sortByPath)
    expect(reconstructedEntries.map(e => e.path)).toEqual(expectedEntries.map(e => e.path))
    for (let i = 0; i < expectedEntries.length; i++) {
      expect(Buffer.from(reconstructedEntries[i].bytes)).toEqual(
        Buffer.from(expectedEntries[i].bytes),
      )
    }
  })

  it('diff token uses the source algorithm', async () => {
    const tokenA = await buildLinearToken(['a.txt', 'one'])
    const tokenB = await buildLinearToken(['a.txt', 'two'])
    const [packA, packB] = await Promise.all([decode(tokenA), decode(tokenB)])
    const Linear = algorithmCatalog.getByName('linear')
    const algo = new Linear()
    const diffTokenBytes = await algo.diff(packA, packB).token()
    // Sniff algorithmId from the diff token header — should be linear's id.
    const expectedId = (Linear as unknown as { id: number }).id
    // Compact header byte 1 OR full header byte 5; sniff via catalog's detector.
    const Detected = await algorithmCatalog.detectFromBuffer(
      Buffer.from(diffTokenBytes.buffer, diffTokenBytes.byteOffset, diffTokenBytes.byteLength),
      '.png',
    )

    expect((Detected as unknown as { id: number }).id).toBe(expectedId)
  })
})
