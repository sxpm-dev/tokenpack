import { decode, diff, encode, PackBuilder } from '@tokenpack/node'
import { describe, expect, it } from 'vitest'

describe('node.diff', () => {
  it('roundtrip: token + apply reconstructs the next pack', async () => {
    const tokenA = await encode(new PackBuilder().withFile('a.txt', 'first'))
    const tokenB = await encode(
      new PackBuilder().withFile('a.txt', 'second').withFile('b.txt', 'added'),
    )
    const diffPack = await diff(tokenA, tokenB)

    expect(diffPack.isDiff()).toBe(true)
    if (!diffPack.isDiff()) throw new Error('expected DiffPack')

    const basePack = await decode(tokenA)

    if (!basePack.isPack()) throw new Error('expected DirPack')
    const reconstructed = await diffPack.apply(basePack)
    const reconstructedEntries = await reconstructed.extractAll()
    const nextPack = await decode(tokenB)

    if (!nextPack.isPack()) throw new Error('expected DirPack')
    const expectedEntries = await nextPack.extractAll()

    reconstructedEntries.sort((a, b) => a.path.localeCompare(b.path))
    expectedEntries.sort((a, b) => a.path.localeCompare(b.path))
    expect(reconstructedEntries.map(e => e.path)).toEqual(expectedEntries.map(e => e.path))
    for (let i = 0; i < expectedEntries.length; i++) {
      expect(Buffer.from(reconstructedEntries[i].bytes)).toEqual(
        Buffer.from(expectedEntries[i].bytes),
      )
    }
  })

  it('text: returns empty diff when payloads are identical', async () => {
    const builder = new PackBuilder().withFile('a.txt', 'same')
    const tokenA = await encode(builder)
    const tokenB = await encode(new PackBuilder().withFile('a.txt', 'same'))
    const diffPack = await diff(tokenA, tokenB)

    expect(diffPack.isDiff()).toBe(true)
    if (!diffPack.isDiff()) throw new Error('expected DiffPack')
    expect(diffPack.entries).toHaveLength(0)
  })

  it('uses a patch op for a localized binary edit and applies it correctly', async () => {
    const base = deterministicBytes(8192)
    const next = new Uint8Array(base)

    next.set(new TextEncoder().encode('zxc'), 4096)

    const tokenA = await encode(new PackBuilder().withFile('a.txt', base))
    const tokenB = await encode(new PackBuilder().withFile('a.txt', next))
    const diffPack = await diff(tokenA, tokenB)

    expect(diffPack.isDiff()).toBe(true)
    if (!diffPack.isDiff()) throw new Error('expected DiffPack')
    expect(diffPack.entries).toContainEqual(
      expect.objectContaining({ op: 'patch', path: 'a.txt', size: next.length }),
    )

    const basePack = await decode(tokenA)

    if (!basePack.isPack()) throw new Error('expected DirPack')
    const reconstructed = await diffPack.apply(basePack)

    expect(Buffer.from(await reconstructed.extract('a.txt'))).toEqual(Buffer.from(next))
  })

  it('cross-algo diff throws same-algo error', async () => {
    const builder = new PackBuilder().withFile('a.txt', 'one')
    const linearToken = await encode(builder, { algo: 'linear' })
    const linearNoneToken = await encode(builder, { algo: 'linear-deflate' })

    await expect(diff(linearToken, linearNoneToken)).rejects.toThrow(/same-algo only/)
  })
})

function deterministicBytes(size: number): Uint8Array {
  const out = new Uint8Array(size)
  let state = 0x12345678

  for (let i = 0; i < out.length; i += 1) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    out[i] = state & 0xff
  }

  return out
}
