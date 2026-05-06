import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { NodePackBuilder } from '../src/node-pack-builder'

let dir: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tokenpack-test-'))
  await writeFile(join(dir, 'a.txt'), 'hello a')
  await writeFile(join(dir, 'b.txt'), 'hello b')
  await mkdir(join(dir, 'sub'))
  await writeFile(join(dir, 'sub', 'c.txt'), 'hello c')
  await writeFile(join(dir, 'sub', 'skip.log'), 'noisy')
})

afterAll(async () => {
  await rm(dir, { recursive: true })
})

describe('NodePackBuilder', () => {
  it('withFileSystem on a file → single entry', async () => {
    const entries = await new NodePackBuilder().withFileSystem(join(dir, 'a.txt')).build()

    expect(entries.map(e => e.path)).toEqual(['a.txt'])
    expect(new TextDecoder().decode(entries[0].bytes)).toBe('hello a')
  })

  it('withFileSystem on a dir → recursive walk', async () => {
    const entries = await new NodePackBuilder().withFileSystem(dir).build()
    const paths = entries.map(e => e.path).sort()

    expect(paths).toEqual(['a.txt', 'b.txt', 'sub/c.txt', 'sub/skip.log'])
  })

  it('withFileSystem with `as` remap on a file', async () => {
    const entries = await new NodePackBuilder()
      .withFileSystem(join(dir, 'a.txt'), { as: 'renamed.txt' })
      .build()

    expect(entries.map(e => e.path)).toEqual(['renamed.txt'])
  })

  it('withFileSystem with exclude patterns', async () => {
    const entries = await new NodePackBuilder().withFileSystem(dir, { exclude: ['*.log', '**/*.log'] }).build()
    const paths = entries.map(e => e.path)

    expect(paths).not.toContain('sub/skip.log')
    expect(paths).toContain('a.txt')
  })

  it('withGlob picks matching files', async () => {
    const entries = await new NodePackBuilder()
      .withGlob('**/*.txt', { cwd: dir })
      .build()
    const paths = entries.map(e => e.path).sort()

    expect(paths).toEqual(['a.txt', 'b.txt', 'sub/c.txt'])
  })

  it('chains withFile + withFileSystem', async () => {
    const entries = await new NodePackBuilder()
      .withFile('inline.md', '# inline')
      .withFileSystem(join(dir, 'a.txt'))
      .build()
    const paths = entries.map(e => e.path).sort()

    expect(paths).toEqual(['a.txt', 'inline.md'])
  })

  it('inherits base PackBuilder methods (withDirectory)', async () => {
    const entries = await new NodePackBuilder()
      .withDirectory('docs', sub => {
        sub.withFile('intro.md', '# intro')
      })
      .build()

    expect(entries).toEqual([
      { path: 'docs/intro.md', bytes: new TextEncoder().encode('# intro') },
    ])
  })
})
