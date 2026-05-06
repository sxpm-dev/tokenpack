import { describe, expect, it } from 'vitest'

import { FilePack } from '../../src/pack/file-pack'

const enc = new TextEncoder()

describe('FilePack', () => {
  it('exposes list with empty path by default', () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))

    expect(p.list).toEqual([''])
    expect(p.entries).toEqual([{ path: '', size: 5 }])
  })

  it('uses overridden name in list', () => {
    const p = new FilePack({ name: 'data', size: 5 }, async () => enc.encode('hello'))

    expect(p.list).toEqual(['data'])
  })

  it('isPack and isDiff return false', () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))

    expect(p.isPack()).toBe(false)
    expect(p.isDiff()).toBe(false)
  })

  it('content() returns bytes', async () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))

    expect(new TextDecoder().decode(await p.content())).toBe('hello')
  })

  it('text() returns UTF-8 string', async () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))

    expect(await p.text()).toBe('hello')
  })

  it('json() parses content', async () => {
    const obj = { a: 1, b: 'x' }
    const p = new FilePack({ name: '', size: 99 }, async () => enc.encode(JSON.stringify(obj)))

    expect(await p.json()).toEqual(obj)
  })

  it('blob() returns a Blob with correct size', async () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))
    const b = await p.blob()

    expect(b.size).toBe(5)
  })
})
