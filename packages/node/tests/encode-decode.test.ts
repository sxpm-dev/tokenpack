// End-to-end encode→decode round-trips for both file and pack formats.
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { decode, decodeRouter, encode, PackBuilder, TokenPack } from '../src'

describe('node decode source dispatch', () => {
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tokenpack-decode-test-'))
  })

  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it('decode(file:// URL) reads from disk', async () => {
    const r = await encode(Buffer.from('via file url'))
    const tokenPath = join(dir, 'tok.png')

    await writeFile(tokenPath, r)
    const pack = await decode(pathToFileURL(tokenPath))

    if (!pack.isPack() && !pack.isDiff()) {
      expect(await pack.text()).toBe('via file url')
    }
  })

  it('decode(file:// string) reads from disk', async () => {
    const r = await encode(Buffer.from('via file string'))
    const tokenPath = join(dir, 'tok2.png')

    await writeFile(tokenPath, r)
    const pack = await decode(pathToFileURL(tokenPath).toString())

    if (!pack.isPack() && !pack.isDiff()) {
      expect(await pack.text()).toBe('via file string')
    }
  })
})

describe('node encode + decode round-trip', () => {
  it('file format: Buffer string content', async () => {
    const r = await encode(Buffer.from('hello world'))
    const pack = await decode(r.bytes)

    expect(pack.isPack()).toBe(false)
    expect(pack.isDiff()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      expect(await pack.text()).toBe('hello world')
    }
  })

  it('file format: Buffer content', async () => {
    const r = await encode(Buffer.from([1, 2, 3, 4, 5]))
    const pack = await decode(r.bytes)

    if (!pack.isPack() && !pack.isDiff()) {
      const bytes = await pack.content()

      expect(Array.from(bytes)).toEqual([1, 2, 3, 4, 5])
    }
  })

  it('pack format: builder with multiple files', async () => {
    const r = await encode(
      new PackBuilder()
        .withFile('a.js', 'console.log("a")')
        .withFile('src/b.js', 'console.log("b")'),
    )
    const pack = await decode(r.bytes)

    expect(pack.isPack()).toBe(true)
    if (pack.isPack()) {
      expect(pack.list).toEqual(['a.js', 'src/b.js'])
      expect(await pack.text('a.js')).toBe('console.log("a")')
      expect(await pack.text('src/b.js')).toBe('console.log("b")')
    }
  })

  it('pack format: extractAll returns all files', async () => {
    const r = await encode(new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'))
    const pack = await decode(r.bytes)

    if (pack.isPack()) {
      const all = await pack.extractAll()

      expect(all.map(e => e.path)).toEqual(['a.js', 'b.js'])
      expect(new TextDecoder().decode(all[0].bytes)).toBe('aa')
      expect(new TextDecoder().decode(all[1].bytes)).toBe('bb')
    }
  })

  it('pack format: nested directories', async () => {
    const r = await encode(
      new PackBuilder().withDirectory('src', sub => {
        sub.withFile('a.js', 'aa')
        sub.withDirectory('utils', u => u.withFile('b.js', 'bb'))
      }),
    )
    const pack = await decode(r.bytes)

    if (pack.isPack()) {
      expect(pack.list).toEqual(['src/a.js', 'src/utils/b.js'])
      expect(await pack.text('src/utils/b.js')).toBe('bb')
    }
  })

  it('pack format: empty file inside pack', async () => {
    const r = await encode(
      new PackBuilder().withFile('empty.txt', '').withFile('non-empty.txt', 'hello'),
    )
    const pack = await decode(r.bytes)

    if (pack.isPack()) {
      const empty = await pack.extract('empty.txt')

      expect(empty.length).toBe(0)
      expect(await pack.text('non-empty.txt')).toBe('hello')
    }
  })

  it('pack format: json convenience', async () => {
    const r = await encode(
      new PackBuilder().withFile('config.json', JSON.stringify({ x: 1, y: [1, 2] })),
    )
    const pack = await decode(r.bytes)

    if (pack.isPack()) {
      expect(await pack.json('config.json')).toEqual({ x: 1, y: [1, 2] })
    }
  })

  it('pack format: large content (50 KB)', async () => {
    const big = 'x'.repeat(50_000)
    const r = await encode(new PackBuilder().withFile('big.txt', big))
    const pack = await decode(r.bytes)

    if (pack.isPack()) {
      const text = await pack.text('big.txt')

      expect(text.length).toBe(50_000)
      expect(text).toBe(big)
    }
  })

  it('router token: splits a large compressed file into capped chunk segments', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenpack-router-test-'))
    const bytes = deterministicBytes(300 * 1024)
    const artifacts = await encode(
      new TokenPack().withBuffer('assets/big.bin', bytes).router({
        targetChunkBytes: 1024,
        maxSegmentsPerFile: 5,
      }),
    )

    try {
      await Promise.all(
        artifacts.map(async artifact => {
          await writeFile(
            join(dir, artifact.filename),
            new Uint8Array(await artifact.blob.arrayBuffer()),
          )
        }),
      )

      const pack = await decodeRouter(join(dir, 'router.png'))

      expect(pack.isRouter()).toBe(true)
      if (!pack.isRouter()) throw new Error('expected RouterPack')
      const manifest = (await pack.manifest()) as {
        chunks: unknown[]
        files: Array<{ segments: unknown[] }>
      }

      expect(manifest.chunks).toHaveLength(5)
      expect(manifest.files[0]!.segments).toHaveLength(5)
      expect(Array.from(await pack.stream.blob('assets/big.bin').then(blobToBytes))).toEqual(
        Array.from(bytes),
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('diff: produce + apply round-trip via Pack methods', async () => {
    const v1 = await encode(new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'))
    const v2 = await encode(new PackBuilder().withFile('a.js', 'AA').withFile('c.js', 'cc'))
    const prev = await decode(v1.bytes)
    const next = await decode(v2.bytes)

    if (!prev.isPack() || !next.isPack()) throw new Error('expected DirPacks')

    // Produce diff
    const diffResult = (await prev.diffTo(next)) as { bytes: Uint8Array }
    const diffPack = await decode(diffResult.bytes)

    expect(diffPack.isDiff()).toBe(true)

    if (!diffPack.isDiff()) return

    const reconstructed = await prev.apply(diffPack)

    expect(reconstructed.list.sort()).toEqual(['a.js', 'c.js'])
    expect(await reconstructed.text('a.js')).toBe('AA')
    expect(await reconstructed.text('c.js')).toBe('cc')
  })

  it('file format: encode with name → decode surfaces name in list', async () => {
    const r = await encode(Buffer.from('hello'), { name: 'greeting.txt' })
    const pack = await decode(r.bytes)

    expect(pack.isPack()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      expect(pack.list).toEqual(['greeting.txt'])
      expect(await pack.text()).toBe('hello')
    }
  })

  it('file format: anonymous encode → list is empty string', async () => {
    const r = await encode(Buffer.from('plain'))
    const pack = await decode(r.bytes)

    if (!pack.isPack() && !pack.isDiff()) {
      expect(pack.list).toEqual([''])
    }
  })

  it('diff: identical packs produce empty diff', async () => {
    const same = await encode(new PackBuilder().withFile('a.js', 'aa'))
    const a = await decode(same.bytes)
    const b = await decode(same.bytes)

    if (!a.isPack() || !b.isPack()) throw new Error('expected DirPacks')
    const diffResult = (await a.diffTo(b)) as { bytes: Uint8Array }
    const diffPack = await decode(diffResult.bytes)

    if (!diffPack.isDiff()) throw new Error('expected DiffPack')
    expect(diffPack.entries.length).toBe(0)
  })
})

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

function deterministicBytes(size: number): Uint8Array {
  const out = new Uint8Array(size)
  let state = 0x12345678

  for (let i = 0; i < out.length; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    out[i] = state >>> 24
  }

  return out
}
