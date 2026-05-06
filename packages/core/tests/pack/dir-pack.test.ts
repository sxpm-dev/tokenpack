import { describe, expect, it } from 'vitest'

import { DirPack } from '../../src/pack/dir-pack'

const enc = new TextEncoder()

const fixtureExtract = (path: string) => {
  if (path === 'a.js') return Promise.resolve(enc.encode('aaa'))
  if (path === 'config.json') return Promise.resolve(enc.encode(JSON.stringify({ x: 1 })))
  if (path === 'logo.png') return Promise.resolve(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))
  throw new Error(`no fixture for ${path}`)
}

describe('DirPack', () => {
  it('exposes list and entries from manifest', () => {
    const p = new DirPack(
      [
        { path: 'a.js', size: 3 },
        { path: 'config.json', size: 7 },
      ],
      fixtureExtract,
      async () => [],
    )

    expect(p.list).toEqual(['a.js', 'config.json'])
    expect(p.entries.map(e => e.path)).toEqual(['a.js', 'config.json'])
  })

  it('isPack returns true; isDiff returns false', () => {
    const p = new DirPack([{ path: 'a.js', size: 3 }], fixtureExtract, async () => [])

    expect(p.isPack()).toBe(true)
    expect(p.isDiff()).toBe(false)
  })

  it('extract returns bytes for a path', async () => {
    const p = new DirPack([{ path: 'a.js', size: 3 }], fixtureExtract, async () => [])

    expect(new TextDecoder().decode(await p.extract('a.js'))).toBe('aaa')
  })

  it('text returns UTF-8 string for a path', async () => {
    const p = new DirPack([{ path: 'a.js', size: 3 }], fixtureExtract, async () => [])

    expect(await p.text('a.js')).toBe('aaa')
  })

  it('json parses path content', async () => {
    const p = new DirPack([{ path: 'config.json', size: 7 }], fixtureExtract, async () => [])

    expect(await p.json('config.json')).toEqual({ x: 1 })
  })

  it('blob returns a Blob for a path', async () => {
    const p = new DirPack([{ path: 'logo.png', size: 4 }], fixtureExtract, async () => [])
    const b = await p.blob('logo.png')

    expect(b.size).toBe(4)
  })

  it('extractAll returns all entries via injected bulk fn', async () => {
    const all = [
      { path: 'a.js', bytes: enc.encode('aaa') },
      { path: 'config.json', bytes: enc.encode('{"x":1}') },
    ]
    const p = new DirPack(
      [
        { path: 'a.js', size: 3 },
        { path: 'config.json', size: 7 },
      ],
      fixtureExtract,
      async () => all,
    )

    expect(await p.extractAll()).toEqual(all)
  })

  it('extract throws on unknown path', async () => {
    const p = new DirPack([{ path: 'a.js', size: 3 }], fixtureExtract, async () => [])

    await expect(p.extract('nope.js')).rejects.toThrow(/no entry/i)
  })

  it('diffTo throws when diffToFn is not injected', async () => {
    const p = new DirPack([{ path: 'a.js', size: 3 }], fixtureExtract, async () => [])
    const q = new DirPack([{ path: 'b.js', size: 3 }], fixtureExtract, async () => [])

    await expect(p.diffTo(q)).rejects.toThrow(/not configured/i)
  })
})
