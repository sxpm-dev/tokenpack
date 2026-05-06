import { describe, expect, it } from 'vitest'

import { PackBuilder } from '../src/pack-builder'

const enc = new TextEncoder()

describe('PackBuilder', () => {
  it('builds an empty entries list', async () => {
    expect(await new PackBuilder().build()).toEqual([])
  })

  it('builds withFile string', async () => {
    const entries = await new PackBuilder().withFile('a.js', 'hello').build()

    expect(entries).toEqual([{ path: 'a.js', bytes: enc.encode('hello') }])
  })

  it('builds withFile Uint8Array', async () => {
    const data = new Uint8Array([1, 2, 3])
    const entries = await new PackBuilder().withFile('a.bin', data).build()

    expect(entries).toEqual([{ path: 'a.bin', bytes: data }])
  })

  it('builds withBuffer alias for binary content', async () => {
    const data = new Uint8Array([4, 5, 6])
    const entries = await new PackBuilder().withBuffer('b.bin', data).build()

    expect(entries).toEqual([{ path: 'b.bin', bytes: data }])
  })

  it('builds withDirectory with nested files', async () => {
    const entries = await new PackBuilder()
      .withFile('readme.md', 'x')
      .withDirectory('src', sub => {
        sub.withFile('a.js', 'aa')
        sub.withDirectory('utils', u => u.withFile('b.js', 'bb'))
      })
      .build()

    expect(entries.map(e => e.path)).toEqual(['readme.md', 'src/a.js', 'src/utils/b.js'])
  })

  it('strips leading ./', async () => {
    const entries = await new PackBuilder().withFile('./a.js', 'x').build()

    expect(entries[0].path).toBe('a.js')
  })

  it('rejects absolute path', async () => {
    await expect(new PackBuilder().withFile('/abs/a.js', 'x').build()).rejects.toThrow(/absolute/i)
  })

  it('rejects parent segment', async () => {
    await expect(new PackBuilder().withFile('../escape.js', 'x').build()).rejects.toThrow(/parent/i)
  })

  it('rejects duplicate paths', async () => {
    await expect(
      new PackBuilder().withFile('a.js', 'x').withFile('a.js', 'y').build(),
    ).rejects.toThrow(/duplicate/i)
  })

  it('normalizes backslashes to forward slashes', async () => {
    const entries = await new PackBuilder().withFile('src\\a.js', 'x').build()

    expect(entries[0].path).toBe('src/a.js')
  })

  it('returns this for chaining', () => {
    const b = new PackBuilder()

    expect(b.withFile('a', 'x')).toBe(b)
    expect(b.withBuffer('b', new Uint8Array(0))).toBe(b)
    expect(b.withDirectory('d', () => {})).toBe(b)
  })
})
