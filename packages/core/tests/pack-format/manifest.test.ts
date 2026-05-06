import { describe, expect, it } from 'vitest'

import {
  type DiffManifest,
  type PackManifest,
  readDiffManifest,
  readPackManifest,
  writeDiffManifest,
  writePackManifest,
} from '../../src/pack-format/manifest'

describe('manifest', () => {
  it('round-trips a pack manifest with one file', () => {
    const manifest: PackManifest = {
      version: 1,
      files: [
        {
          path: 'a.js',
          compressor: 'brotli-11',
          level: 11,
          compressedSize: 100,
          originalSize: 200,
          offset: 0,
        },
      ],
    }
    const bytes = writePackManifest(manifest)

    expect(readPackManifest(bytes)).toEqual(manifest)
  })

  it('round-trips a pack manifest with many files', () => {
    const manifest: PackManifest = {
      version: 1,
      files: [
        {
          path: 'src/a.js',
          compressor: 'brotli-11',
          level: 11,
          compressedSize: 100,
          originalSize: 200,
          offset: 0,
        },
        {
          path: 'src/b.js',
          compressor: 'brotli-11',
          level: 11,
          compressedSize: 50,
          originalSize: 80,
          offset: 100,
        },
        {
          path: 'README.md',
          compressor: 'none',
          level: 0,
          compressedSize: 50,
          originalSize: 50,
          offset: 150,
        },
      ],
    }
    const bytes = writePackManifest(manifest)

    expect(readPackManifest(bytes)).toEqual(manifest)
  })

  it('throws when reading a manifest with wrong version', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ version: 999, files: [] }))

    expect(() => readPackManifest(bytes)).toThrow(/manifest version/i)
  })

  it('round-trips a diff manifest with all op types', () => {
    const manifest: DiffManifest = {
      version: 1,
      ops: [
        {
          op: 'add',
          path: 'new.js',
          compressor: 'brotli-11',
          level: 11,
          compressedSize: 800,
          originalSize: 1500,
          offset: 0,
        },
        {
          op: 'modify',
          path: 'old.js',
          compressor: 'brotli-11',
          level: 11,
          compressedSize: 200,
          originalSize: 400,
          offset: 800,
        },
        { op: 'delete', path: 'gone.js' },
        { op: 'rename', path: 'moved.js', fromPath: 'src/old.js' },
      ],
    }
    const bytes = writeDiffManifest(manifest)

    expect(readDiffManifest(bytes)).toEqual(manifest)
  })

  it('throws when reading a diff manifest with wrong version', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ version: 999, ops: [] }))

    expect(() => readDiffManifest(bytes)).toThrow(/manifest version/i)
  })
})
