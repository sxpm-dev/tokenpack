# Unified Encode/Decode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the proliferation of encode/decode/file/dir APIs with a single `encode` / `decode` per env package, returning a unified `Pack = FilePack | DirPack | DiffPack` discriminated union, backed by a new pack format with per-file random-access extraction and method-based diff.

**Architecture:** A new pack format (`0x02` discriminator byte) carries a JSON manifest + per-file independently-compressed regions, all packed into the existing pixel byte stream via the `none` algorithm (no outer compression — per-file streams are already compressed). The diff format (`0x03`) reuses the same layout with op metadata. A `PackBuilder` (core) + `NodePackBuilder` (node) assembles entries; encoders dispatch on `instanceof PackBuilder`. Decoders read the format byte and surface either `FilePack`, `DirPack`, or `DiffPack` from the same `decode()` call.

**Tech Stack:** TypeScript 5.7+, vitest, existing tokenpack codecs/compressors/drawers/surfaces (no changes), Web Crypto, CompressionStream/DecompressionStream (browser) + node:zlib (node).

**Spec:** `docs/superpowers/specs/2026-05-06-unified-encode-decode-design.md`

---

## File structure

### `packages/core/src/` (new files)

| Path | Responsibility |
|---|---|
| `pack-format/format-byte.ts` | Read/write the discriminator byte (`0x01` file / `0x02` pack / `0x03` diff) |
| `pack-format/manifest.ts` | `PackManifest` / `DiffManifest` types + JSON encoder/decoder |
| `pack-format/encode-pack.ts` | Encode `PackEntry[]` → pack-format Uint8Array (compress per file, build manifest, serialize) |
| `pack-format/decode-pack.ts` | Decode pack-format Uint8Array → manifest + lazy region access |
| `pack-format/encode-diff.ts` | Compute diff ops between two `DirPack`s, encode to diff-format bytes |
| `pack-format/apply-diff.ts` | Apply diff bytes to a `DirPack`, return new in-memory `DirPack` |
| `pack-builder.ts` | `PackBuilder` class — fluent builder with sub-builder scoping |
| `pack/types.ts` | `Pack`, `FilePack`, `DirPack`, `DiffPack`, `DiffEntry` interfaces |
| `pack/file-pack.ts` | `FilePack` concrete class |
| `pack/dir-pack.ts` | `DirPack` concrete class |
| `pack/diff-pack.ts` | `DiffPack` concrete class |
| `pack/from-bytes.ts` | Sniff format byte, construct correct Pack subclass |

### `packages/core/src/` (modified)

- `index.ts` — slim public exports (Phase 4)

### `packages/node/src/` (new files)

| Path | Responsibility |
|---|---|
| `node-pack-builder.ts` | `NodePackBuilder extends PackBuilder` — adds `withFileSystem` / `withGlob` |
| `pack-encode.ts` | Pack-format encode wrapper (uses Node compressors via core) |

### `packages/node/src/` (modified)

- `encode.ts` — accept builder; dispatch file vs pack format
- `decode.ts` — return new `Pack` discriminated union
- `index.ts` — explicit re-exports (Phase 4)

### `packages/browser/src/` (modified)

- `encode.ts` — accept builder; dispatch
- `decode.ts` — return new `Pack`
- `index.ts` — drop `decode-result` re-export

### Test files

- `packages/core/tests/pack-format/format-byte.test.ts`
- `packages/core/tests/pack-format/manifest.test.ts`
- `packages/core/tests/pack-format/encode-decode-pack.test.ts`
- `packages/core/tests/pack-format/diff.test.ts`
- `packages/core/tests/pack-builder.test.ts`
- `packages/core/tests/pack/file-pack.test.ts`
- `packages/core/tests/pack/dir-pack.test.ts`
- `packages/core/tests/pack/diff-pack.test.ts`
- `packages/node/tests/encode.test.ts`
- `packages/node/tests/decode.test.ts`
- `packages/node/tests/node-pack-builder.test.ts`
- `packages/browser/tests/encode-decode.test.ts`

---

# PHASE 1 — Pack format foundation (core)

## Task 1: Format discriminator byte

**Files:**
- Create: `packages/core/src/pack-format/format-byte.ts`
- Test: `packages/core/tests/pack-format/format-byte.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/pack-format/format-byte.test.ts
import { describe, expect, it } from 'vitest'
import {
  FORMAT_FILE,
  FORMAT_PACK,
  FORMAT_DIFF,
  readFormatByte,
  writeFormatByte,
} from '../../src/pack-format/format-byte'

describe('format-byte', () => {
  it('writes and reads the file format byte', () => {
    const buf = new Uint8Array(1)
    writeFormatByte(buf, 0, FORMAT_FILE)
    expect(readFormatByte(buf, 0)).toBe(FORMAT_FILE)
  })

  it('writes and reads the pack format byte', () => {
    const buf = new Uint8Array(1)
    writeFormatByte(buf, 0, FORMAT_PACK)
    expect(readFormatByte(buf, 0)).toBe(FORMAT_PACK)
  })

  it('writes and reads the diff format byte', () => {
    const buf = new Uint8Array(1)
    writeFormatByte(buf, 0, FORMAT_DIFF)
    expect(readFormatByte(buf, 0)).toBe(FORMAT_DIFF)
  })

  it('throws on unknown format byte at read', () => {
    const buf = new Uint8Array([0x99])
    expect(() => readFormatByte(buf, 0)).toThrow(/unknown format byte/i)
  })

  it('throws on unknown format byte at write', () => {
    const buf = new Uint8Array(1)
    // @ts-expect-error testing runtime check
    expect(() => writeFormatByte(buf, 0, 0x99)).toThrow(/unknown format byte/i)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn workspace tokenpack test pack-format/format-byte`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `format-byte.ts`**

```ts
// packages/core/src/pack-format/format-byte.ts
export const FORMAT_FILE = 0x01
export const FORMAT_PACK = 0x02
export const FORMAT_DIFF = 0x03

export type FormatByte = typeof FORMAT_FILE | typeof FORMAT_PACK | typeof FORMAT_DIFF

const VALID = new Set<number>([FORMAT_FILE, FORMAT_PACK, FORMAT_DIFF])

export function writeFormatByte(buf: Uint8Array, offset: number, value: FormatByte): void {
  if (!VALID.has(value)) throw new Error(`unknown format byte: 0x${value.toString(16)}`)
  buf[offset] = value
}

export function readFormatByte(buf: Uint8Array, offset: number): FormatByte {
  const value = buf[offset]
  if (!VALID.has(value)) throw new Error(`unknown format byte: 0x${value.toString(16)}`)
  return value as FormatByte
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `yarn workspace tokenpack test pack-format/format-byte`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pack-format/format-byte.ts packages/core/tests/pack-format/format-byte.test.ts
git commit -m "feat(core): add pack-format discriminator byte (file/pack/diff)"
```

---

## Task 2: Pack manifest types + read/write

**Files:**
- Create: `packages/core/src/pack-format/manifest.ts`
- Test: `packages/core/tests/pack-format/manifest.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/pack-format/manifest.test.ts
import { describe, expect, it } from 'vitest'
import {
  type PackManifest,
  type DiffManifest,
  writePackManifest,
  readPackManifest,
  writeDiffManifest,
  readDiffManifest,
} from '../../src/pack-format/manifest'

describe('manifest', () => {
  it('round-trips a pack manifest with one file', () => {
    const manifest: PackManifest = {
      version: 1,
      files: [
        { path: 'a.js', codecId: 12, compressedSize: 100, originalSize: 200, offset: 0 },
      ],
    }
    const bytes = writePackManifest(manifest)
    const decoded = readPackManifest(bytes)
    expect(decoded).toEqual(manifest)
  })

  it('round-trips a pack manifest with many files', () => {
    const manifest: PackManifest = {
      version: 1,
      files: [
        { path: 'src/a.js', codecId: 12, compressedSize: 100, originalSize: 200, offset: 0 },
        { path: 'src/b.js', codecId: 12, compressedSize: 50, originalSize: 80, offset: 100 },
        { path: 'README.md', codecId: 7, compressedSize: 30, originalSize: 50, offset: 150 },
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
        { op: 'add', path: 'new.js', codecId: 12, compressedSize: 800, originalSize: 1500, offset: 0 },
        { op: 'modify', path: 'old.js', codecId: 12, compressedSize: 200, originalSize: 400, offset: 800 },
        { op: 'delete', path: 'gone.js' },
        { op: 'rename', path: 'moved.js', fromPath: 'src/old.js' },
      ],
    }
    const bytes = writeDiffManifest(manifest)
    expect(readDiffManifest(bytes)).toEqual(manifest)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn workspace tokenpack test pack-format/manifest`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `manifest.ts`**

```ts
// packages/core/src/pack-format/manifest.ts
export interface PackManifestFile {
  path: string
  codecId: number
  compressedSize: number
  originalSize: number
  offset: number       // byte offset from start of regions block
}

export interface PackManifest {
  version: 1
  files: PackManifestFile[]
}

export type DiffOp = 'add' | 'modify' | 'delete' | 'rename'

export interface DiffManifestEntry {
  op: DiffOp
  path: string
  codecId?: number          // present for add | modify
  compressedSize?: number   // present for add | modify
  originalSize?: number     // present for add | modify
  offset?: number           // present for add | modify
  fromPath?: string         // present for rename
}

export interface DiffManifest {
  version: 1
  ops: DiffManifestEntry[]
}

const SUPPORTED_VERSION = 1
const enc = new TextEncoder()
const dec = new TextDecoder('utf-8')

export function writePackManifest(m: PackManifest): Uint8Array {
  return enc.encode(JSON.stringify(m))
}

export function readPackManifest(bytes: Uint8Array): PackManifest {
  const parsed = JSON.parse(dec.decode(bytes)) as PackManifest
  if (parsed.version !== SUPPORTED_VERSION) {
    throw new Error(`unsupported manifest version: ${parsed.version}`)
  }
  return parsed
}

export function writeDiffManifest(m: DiffManifest): Uint8Array {
  return enc.encode(JSON.stringify(m))
}

export function readDiffManifest(bytes: Uint8Array): DiffManifest {
  const parsed = JSON.parse(dec.decode(bytes)) as DiffManifest
  if (parsed.version !== SUPPORTED_VERSION) {
    throw new Error(`unsupported diff manifest version: ${parsed.version}`)
  }
  return parsed
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `yarn workspace tokenpack test pack-format/manifest`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pack-format/manifest.ts packages/core/tests/pack-format/manifest.test.ts
git commit -m "feat(core): add pack and diff manifest types + JSON read/write"
```

---

## Task 3: Pack format encode/decode

**Files:**
- Create: `packages/core/src/pack-format/encode-pack.ts`
- Create: `packages/core/src/pack-format/decode-pack.ts`
- Test: `packages/core/tests/pack-format/encode-decode-pack.test.ts`

This task implements the byte-level pack format (signature + format byte + manifest size + manifest bytes + region bytes). It uses an injected `compressFile` function so the pure-byte logic stays env-neutral; node and browser will each provide their own.

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/pack-format/encode-decode-pack.test.ts
import { describe, expect, it } from 'vitest'
import { encodePack, type CompressFn } from '../../src/pack-format/encode-pack'
import { decodePack } from '../../src/pack-format/decode-pack'
import type { PackEntry } from '../../src/archive-buffers'

// Identity "compressor" for tests — no real compression, codecId = 0 (none).
const identityCompress: CompressFn = async bytes => ({
  bytes: new Uint8Array(bytes),
  codecId: 0,
})

const enc = new TextEncoder()

describe('encode-pack + decode-pack', () => {
  it('round-trips one file', async () => {
    const entries: PackEntry[] = [{ path: 'a.js', bytes: enc.encode('hello') }]
    const packed = await encodePack(entries, identityCompress)
    const handle = decodePack(packed)
    expect(handle.manifest.files.map(f => f.path)).toEqual(['a.js'])
    const out = handle.extractRegion('a.js')
    expect(new TextDecoder().decode(out)).toBe('hello')
  })

  it('round-trips many files', async () => {
    const entries: PackEntry[] = [
      { path: 'src/a.js', bytes: enc.encode('aaa') },
      { path: 'src/b.js', bytes: enc.encode('bbbb') },
      { path: 'README.md', bytes: enc.encode('# title') },
    ]
    const packed = await encodePack(entries, identityCompress)
    const handle = decodePack(packed)
    expect(handle.manifest.files.map(f => f.path)).toEqual([
      'src/a.js', 'src/b.js', 'README.md',
    ])
    expect(new TextDecoder().decode(handle.extractRegion('src/a.js'))).toBe('aaa')
    expect(new TextDecoder().decode(handle.extractRegion('src/b.js'))).toBe('bbbb')
    expect(new TextDecoder().decode(handle.extractRegion('README.md'))).toBe('# title')
  })

  it('handles empty file', async () => {
    const entries: PackEntry[] = [{ path: 'empty', bytes: new Uint8Array(0) }]
    const packed = await encodePack(entries, identityCompress)
    const handle = decodePack(packed)
    expect(handle.extractRegion('empty')).toEqual(new Uint8Array(0))
  })

  it('handles 1MB file', async () => {
    const big = new Uint8Array(1024 * 1024).fill(0x42)
    const packed = await encodePack([{ path: 'big.bin', bytes: big }], identityCompress)
    const handle = decodePack(packed)
    expect(handle.extractRegion('big.bin')).toEqual(big)
  })

  it('throws on unknown path', async () => {
    const packed = await encodePack(
      [{ path: 'a.js', bytes: enc.encode('x') }],
      identityCompress,
    )
    const handle = decodePack(packed)
    expect(() => handle.extractRegion('nope')).toThrow(/no entry/i)
  })

  it('produces empty pack for empty entries', async () => {
    const packed = await encodePack([], identityCompress)
    const handle = decodePack(packed)
    expect(handle.manifest.files).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `yarn workspace tokenpack test pack-format/encode-decode-pack`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `encode-pack.ts`**

```ts
// packages/core/src/pack-format/encode-pack.ts
import { FORMAT_PACK, writeFormatByte } from './format-byte'
import { writePackManifest, type PackManifest } from './manifest'
import type { PackEntry } from '../archive-buffers'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface CompressFn {
  (bytes: Uint8Array): Promise<{ bytes: Uint8Array; codecId: number }>
}

export async function encodePack(
  entries: readonly PackEntry[],
  compress: CompressFn,
): Promise<Uint8Array> {
  // 1. Compress each file independently.
  const compressed = await Promise.all(
    entries.map(async e => ({ path: e.path, original: e.bytes, ...(await compress(e.bytes)) })),
  )

  // 2. Build manifest.
  let runningOffset = 0
  const manifest: PackManifest = {
    version: 1,
    files: compressed.map(c => {
      const file = {
        path: c.path,
        codecId: c.codecId,
        compressedSize: c.bytes.length,
        originalSize: c.original.length,
        offset: runningOffset,
      }
      runningOffset += c.bytes.length
      return file
    }),
  }
  const manifestBytes = writePackManifest(manifest)

  // 3. Lay out: SIG (4) | FORMAT (1) | manifestSize u32 LE (4) | manifest | regions.
  const totalRegionBytes = compressed.reduce((s, c) => s + c.bytes.length, 0)
  const out = new Uint8Array(4 + 1 + 4 + manifestBytes.length + totalRegionBytes)
  out.set(SIG, 0)
  writeFormatByte(out, 4, FORMAT_PACK)
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength)
  view.setUint32(5, manifestBytes.length, true)
  out.set(manifestBytes, 9)

  let pos = 9 + manifestBytes.length
  for (const c of compressed) {
    out.set(c.bytes, pos)
    pos += c.bytes.length
  }

  return out
}
```

- [ ] **Step 4: Implement `decode-pack.ts`**

```ts
// packages/core/src/pack-format/decode-pack.ts
import { FORMAT_PACK, readFormatByte } from './format-byte'
import { readPackManifest, type PackManifest } from './manifest'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface DecodedPack {
  manifest: PackManifest
  /** Returns the COMPRESSED region bytes for `path`. Decompression happens in env code. */
  extractRegion(path: string): Uint8Array
  /** Raw regions block (for advanced consumers). */
  readonly regionsStart: number
  readonly bytes: Uint8Array
}

export function decodePack(bytes: Uint8Array): DecodedPack {
  if (
    bytes[0] !== SIG[0] || bytes[1] !== SIG[1]
    || bytes[2] !== SIG[2] || bytes[3] !== SIG[3]
  ) {
    throw new Error('decodePack: missing signature')
  }
  const fmt = readFormatByte(bytes, 4)
  if (fmt !== FORMAT_PACK) {
    throw new Error(`decodePack: expected pack format (0x02), got 0x${fmt.toString(16)}`)
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const manifestSize = view.getUint32(5, true)
  const manifestBytes = bytes.subarray(9, 9 + manifestSize)
  const manifest = readPackManifest(manifestBytes)
  const regionsStart = 9 + manifestSize

  return {
    manifest,
    regionsStart,
    bytes,
    extractRegion(path) {
      const file = manifest.files.find(f => f.path === path)
      if (!file) throw new Error(`no entry for path: ${path}`)
      const start = regionsStart + file.offset
      return bytes.subarray(start, start + file.compressedSize)
    },
  }
}
```

- [ ] **Step 5: Run tests to confirm pass**

Run: `yarn workspace tokenpack test pack-format/encode-decode-pack`
Expected: 6 passing.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/pack-format/encode-pack.ts packages/core/src/pack-format/decode-pack.ts packages/core/tests/pack-format/encode-decode-pack.test.ts
git commit -m "feat(core): add pack-format byte-level encode/decode with injected compressor"
```

---

## Task 4: PackBuilder class

**Files:**
- Create: `packages/core/src/pack-builder.ts`
- Test: `packages/core/tests/pack-builder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/pack-builder.test.ts
import { describe, expect, it } from 'vitest'
import { PackBuilder } from '../src/pack-builder'

const enc = new TextEncoder()

describe('PackBuilder', () => {
  it('builds an empty entries list', async () => {
    const entries = await new PackBuilder().build()
    expect(entries).toEqual([])
  })

  it('builds withFile string', async () => {
    const entries = await new PackBuilder()
      .withFile('a.js', 'hello')
      .build()
    expect(entries).toEqual([{ path: 'a.js', bytes: enc.encode('hello') }])
  })

  it('builds withFile Uint8Array', async () => {
    const data = new Uint8Array([1, 2, 3])
    const entries = await new PackBuilder().withFile('a.bin', data).build()
    expect(entries).toEqual([{ path: 'a.bin', bytes: data }])
  })

  it('builds withBuffer (alias for withFile binary)', async () => {
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
    expect(entries.map(e => e.path)).toEqual([
      'readme.md', 'src/a.js', 'src/utils/b.js',
    ])
  })

  it('strips leading ./', async () => {
    const entries = await new PackBuilder().withFile('./a.js', 'x').build()
    expect(entries[0].path).toBe('a.js')
  })

  it('rejects absolute path', async () => {
    await expect(
      new PackBuilder().withFile('/abs/a.js', 'x').build(),
    ).rejects.toThrow(/absolute/i)
  })

  it('rejects .. segment', async () => {
    await expect(
      new PackBuilder().withFile('../escape.js', 'x').build(),
    ).rejects.toThrow(/parent/i)
  })

  it('rejects duplicate paths', async () => {
    await expect(
      new PackBuilder()
        .withFile('a.js', 'x')
        .withFile('a.js', 'y')
        .build(),
    ).rejects.toThrow(/duplicate/i)
  })

  it('normalizes backslashes to forward slashes', async () => {
    const entries = await new PackBuilder().withFile('src\\a.js', 'x').build()
    expect(entries[0].path).toBe('src/a.js')
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `yarn workspace tokenpack test pack-builder`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `pack-builder.ts`**

```ts
// packages/core/src/pack-builder.ts
import type { PackEntry } from './archive-buffers'

type Intent =
  | { kind: 'file'; path: string; content: Uint8Array | string }
  | { kind: 'dir'; path: string; intents: Intent[] }
  | { kind: 'fs-file'; fsPath: string; as?: string; opts?: unknown }       // resolved by NodePackBuilder
  | { kind: 'fs-dir'; fsPath: string; as?: string; opts?: unknown }        // resolved by NodePackBuilder
  | { kind: 'glob'; pattern: string; opts?: unknown }                      // resolved by NodePackBuilder

const enc = new TextEncoder()

export class PackBuilder {
  /** @internal — exposed so subclasses (NodePackBuilder) can append fs intents. */
  protected readonly intents: Intent[] = []

  withFile(path: string, content: Uint8Array | string): this {
    this.intents.push({ kind: 'file', path, content })
    return this
  }

  withBuffer(path: string, buffer: Uint8Array): this {
    return this.withFile(path, buffer)
  }

  withDirectory(path: string, fn: (sub: PackBuilder) => void): this {
    const sub = new PackBuilder()
    fn(sub)
    this.intents.push({ kind: 'dir', path, intents: sub.intents })
    return this
  }

  async build(): Promise<PackEntry[]> {
    const collected: PackEntry[] = []
    await this.resolve(this.intents, '', collected)

    // Validate paths.
    const seen = new Set<string>()
    for (const e of collected) {
      const norm = normalize(e.path)
      assertPath(norm)
      if (seen.has(norm)) throw new Error(`duplicate path: ${norm}`)
      seen.add(norm)
      e.path = norm
    }
    return collected
  }

  /** @internal — overridable by subclasses to handle their own intent kinds. */
  protected async resolve(intents: Intent[], prefix: string, out: PackEntry[]): Promise<void> {
    for (const it of intents) {
      if (it.kind === 'file') {
        out.push({
          path: join(prefix, it.path),
          bytes: typeof it.content === 'string' ? enc.encode(it.content) : it.content,
        })
      } else if (it.kind === 'dir') {
        await this.resolve(it.intents, join(prefix, it.path), out)
      } else {
        throw new Error(`PackBuilder: unhandled intent kind "${it.kind}". Use NodePackBuilder for fs intents.`)
      }
    }
  }
}

function join(prefix: string, path: string): string {
  if (!prefix) return path
  return `${prefix}/${path}`.replace(/\/+/g, '/')
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/')
}

function assertPath(path: string): void {
  if (path.startsWith('/')) throw new Error(`path is absolute: ${path}`)
  if (path.split('/').includes('..')) throw new Error(`path has parent segment (..): ${path}`)
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `yarn workspace tokenpack test pack-builder`
Expected: 10 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pack-builder.ts packages/core/tests/pack-builder.test.ts
git commit -m "feat(core): add PackBuilder with fluent withFile/withBuffer/withDirectory"
```

---

## Task 5: Pack handle classes (FilePack + DirPack + types)

**Files:**
- Create: `packages/core/src/pack/types.ts`
- Create: `packages/core/src/pack/file-pack.ts`
- Create: `packages/core/src/pack/dir-pack.ts`
- Create: `packages/core/src/pack/from-bytes.ts`
- Test: `packages/core/tests/pack/file-pack.test.ts`
- Test: `packages/core/tests/pack/dir-pack.test.ts`

This task introduces the Pack handle abstraction. `from-bytes.ts` sniffs the format byte and constructs the right handle. Decompression is injected via a `decompress(bytes, codecId) => Promise<Uint8Array>` callback so handles stay env-neutral.

- [ ] **Step 1: Write failing tests for FilePack**

```ts
// packages/core/tests/pack/file-pack.test.ts
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

  it('isPack returns false', () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))
    expect(p.isPack()).toBe(false)
    expect(p.isDiff()).toBe(false)
  })

  it('content() returns bytes', async () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))
    const bytes = await p.content()
    expect(new TextDecoder().decode(bytes)).toBe('hello')
  })

  it('text() returns UTF-8 string', async () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))
    expect(await p.text()).toBe('hello')
  })

  it('json() parses content', async () => {
    const obj = { a: 1, b: 'x' }
    const p = new FilePack(
      { name: '', size: 99 },
      async () => enc.encode(JSON.stringify(obj)),
    )
    expect(await p.json()).toEqual(obj)
  })

  it('blob() returns a Blob with correct size', async () => {
    const p = new FilePack({ name: '', size: 5 }, async () => enc.encode('hello'))
    const b = await p.blob()
    expect(b.size).toBe(5)
  })
})
```

- [ ] **Step 2: Write failing tests for DirPack**

```ts
// packages/core/tests/pack/dir-pack.test.ts
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

  it('isPack returns true', () => {
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
      [{ path: 'a.js', size: 3 }, { path: 'config.json', size: 7 }],
      fixtureExtract,
      async () => all,
    )
    expect(await p.extractAll()).toEqual(all)
  })

  it('extract throws on unknown path', async () => {
    const p = new DirPack([{ path: 'a.js', size: 3 }], fixtureExtract, async () => [])
    await expect(p.extract('nope.js')).rejects.toThrow(/no entry/i)
  })
})
```

- [ ] **Step 3: Run tests to confirm failure**

Run: `yarn workspace tokenpack test pack/`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `types.ts`**

```ts
// packages/core/src/pack/types.ts
export interface PackBase {
  list: string[]
  entries: ReadonlyArray<{ path: string; size: number }>
  isPack(): this is DirPack
  isDiff(): this is DiffPack
}

export interface FilePack extends PackBase {
  content(): Promise<Uint8Array>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
  blob(): Promise<Blob>
}

export interface DirPack extends PackBase {
  extract(path: string): Promise<Uint8Array>
  text(path: string): Promise<string>
  json<T = unknown>(path: string): Promise<T>
  blob(path: string): Promise<Blob>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  diffTo(other: DirPack): Promise<unknown>            // returns env-specific EncodeResult
}

export type DiffOp = 'add' | 'modify' | 'delete' | 'rename'

export interface DiffEntry {
  path: string
  op: DiffOp
  size?: number
  fromPath?: string
}

export interface DiffPack extends PackBase {
  entries: ReadonlyArray<DiffEntry>
  apply(prev: DirPack): Promise<DirPack>
}

export type Pack = FilePack | DirPack | DiffPack
```

- [ ] **Step 5: Implement `file-pack.ts`**

```ts
// packages/core/src/pack/file-pack.ts
import type { FilePack as IFilePack, DirPack, DiffPack } from './types'

export interface FilePackInfo {
  name: string                  // '' by default; can be overridden via encode opts
  size: number
}

export class FilePack implements IFilePack {
  readonly list: string[]
  readonly entries: ReadonlyArray<{ path: string; size: number }>

  constructor(
    private readonly info: FilePackInfo,
    private readonly load: () => Promise<Uint8Array>,
  ) {
    this.list = [info.name]
    this.entries = [{ path: info.name, size: info.size }]
  }

  isPack(): this is DirPack { return false }
  isDiff(): this is DiffPack { return false }

  async content(): Promise<Uint8Array> {
    return this.load()
  }

  async text(): Promise<string> {
    return new TextDecoder().decode(await this.load())
  }

  async json<T = unknown>(): Promise<T> {
    return JSON.parse(await this.text()) as T
  }

  async blob(): Promise<Blob> {
    const bytes = await this.load()
    return new Blob([bytes as BlobPart])
  }
}
```

- [ ] **Step 6: Implement `dir-pack.ts`**

```ts
// packages/core/src/pack/dir-pack.ts
import type { DirPack as IDirPack, DiffPack } from './types'

export type ExtractFn = (path: string) => Promise<Uint8Array>
export type ExtractAllFn = () => Promise<Array<{ path: string; bytes: Uint8Array }>>

export class DirPack implements IDirPack {
  readonly list: string[]
  readonly entries: ReadonlyArray<{ path: string; size: number }>

  constructor(
    entries: ReadonlyArray<{ path: string; size: number }>,
    private readonly extractOne: ExtractFn,
    private readonly extractAllFn: ExtractAllFn,
    private readonly diffToFn?: (other: IDirPack) => Promise<unknown>,
  ) {
    this.entries = entries
    this.list = entries.map(e => e.path)
  }

  isPack(): this is IDirPack { return true }
  isDiff(): this is DiffPack { return false }

  async extract(path: string): Promise<Uint8Array> {
    const found = this.entries.find(e => e.path === path)
    if (!found) throw new Error(`no entry for path: ${path}`)
    return this.extractOne(path)
  }

  async text(path: string): Promise<string> {
    return new TextDecoder().decode(await this.extract(path))
  }

  async json<T = unknown>(path: string): Promise<T> {
    return JSON.parse(await this.text(path)) as T
  }

  async blob(path: string): Promise<Blob> {
    const bytes = await this.extract(path)
    return new Blob([bytes as BlobPart])
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    return this.extractAllFn()
  }

  async diffTo(other: IDirPack): Promise<unknown> {
    if (!this.diffToFn) throw new Error('diffTo: not configured (env package must inject)')
    return this.diffToFn(other)
  }
}
```

- [ ] **Step 7: Implement `from-bytes.ts`**

```ts
// packages/core/src/pack/from-bytes.ts
import { FORMAT_FILE, FORMAT_PACK, FORMAT_DIFF, readFormatByte } from '../pack-format/format-byte'
import { decodePack } from '../pack-format/decode-pack'
import { FilePack } from './file-pack'
import { DirPack } from './dir-pack'
import type { Pack } from './types'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface FromBytesOptions {
  /** Decompresses a region's bytes given codecId. */
  decompress: (bytes: Uint8Array, codecId: number) => Promise<Uint8Array>
  /** Hook the env package uses to construct a diff token from two DirPacks. */
  diffTo?: (a: any, b: any) => Promise<unknown>
}

export function fromBytes(bytes: Uint8Array, opts: FromBytesOptions): Pack {
  // Legacy file token (no signature, no format byte) — treat as file format.
  const hasSignature =
    bytes[0] === SIG[0] && bytes[1] === SIG[1] && bytes[2] === SIG[2] && bytes[3] === SIG[3]
  const fmt = hasSignature ? readFormatByte(bytes, 4) : FORMAT_FILE

  if (fmt === FORMAT_FILE) {
    return new FilePack(
      { name: '', size: bytes.length },
      async () => bytes,
    )
  }
  if (fmt === FORMAT_PACK) {
    const decoded = decodePack(bytes)
    const entries = decoded.manifest.files.map(f => ({ path: f.path, size: f.originalSize }))
    return new DirPack(
      entries,
      async path => {
        const file = decoded.manifest.files.find(f => f.path === path)
        if (!file) throw new Error(`no entry for path: ${path}`)
        const region = decoded.extractRegion(path)
        return opts.decompress(region, file.codecId)
      },
      async () => Promise.all(
        decoded.manifest.files.map(async f => ({
          path: f.path,
          bytes: await opts.decompress(decoded.extractRegion(f.path), f.codecId),
        })),
      ),
      opts.diffTo,
    )
  }
  if (fmt === FORMAT_DIFF) {
    // Implemented in Phase 3 (Task 9).
    throw new Error('fromBytes: diff format not yet implemented')
  }
  throw new Error(`fromBytes: unknown format byte 0x${fmt.toString(16)}`)
}
```

- [ ] **Step 8: Run tests to confirm pass**

Run: `yarn workspace tokenpack test pack/`
Expected: file-pack 7 passing, dir-pack 8 passing.

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/pack/ packages/core/tests/pack/
git commit -m "feat(core): add Pack handle types (FilePack, DirPack) + fromBytes dispatch"
```

---

# PHASE 2 — Wire into env packages

## Task 6: Node `encode` accepting builder

**Files:**
- Modify: `packages/node/src/encode.ts`
- Test: `packages/node/tests/encode.test.ts`

The existing node `encode()` accepts `string | Uint8Array | Buffer`. We add `PackBuilder` as a valid input and dispatch to a pack-format encode path. The pack-format path uses node's existing `BrotliCompressor` to compress per file, builds the byte-stream via `encodePack`, and then encodes that byte stream using the existing image pipeline with the `none` algorithm (no outer recompression — region bytes are already compressed).

Read the current encode first to understand the existing flow:

- [ ] **Step 1: Read current encode**

Run: `cat packages/node/src/encode.ts | head -120`

- [ ] **Step 2: Write failing tests**

```ts
// packages/node/tests/encode.test.ts
import { describe, expect, it } from 'vitest'
import { encode, decode, PackBuilder } from '@tokenpack/node'

describe('node encode + decode round-trip', () => {
  it('file format: string content', async () => {
    const result = await encode('hello world')
    const pack = await decode(result.bytes)        // assume EncodeResult has .bytes
    expect(pack.isPack()).toBe(false)
    expect(pack.isDiff()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      expect(await pack.text()).toBe('hello world')
    }
  })

  it('pack format: builder with multiple files', async () => {
    const result = await encode(
      new PackBuilder()
        .withFile('a.js', 'console.log("a")')
        .withFile('src/b.js', 'console.log("b")'),
    )
    const pack = await decode(result.bytes)
    expect(pack.isPack()).toBe(true)
    if (pack.isPack()) {
      expect(pack.list).toEqual(['a.js', 'src/b.js'])
      expect(await pack.text('a.js')).toBe('console.log("a")')
      expect(await pack.text('src/b.js')).toBe('console.log("b")')
    }
  })

  it('pack format: extractAll returns all files', async () => {
    const result = await encode(
      new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'),
    )
    const pack = await decode(result.bytes)
    if (pack.isPack()) {
      const all = await pack.extractAll()
      expect(all.map(e => e.path)).toEqual(['a.js', 'b.js'])
      expect(new TextDecoder().decode(all[0].bytes)).toBe('aa')
      expect(new TextDecoder().decode(all[1].bytes)).toBe('bb')
    }
  })
})
```

- [ ] **Step 3: Run test to confirm failure**

Run: `yarn workspace @tokenpack/node test encode`
Expected: FAIL — `PackBuilder` not exported / encode doesn't dispatch on builder.

**Context:** the existing `algorithm.encodeBytes` returns `DrawnChunk[]` (pixels), not raw compressed bytes. For pack-format per-file regions we need raw compressed bytes. We'll add a `compressRaw` helper in core that wraps the compressor registry directly.

- [ ] **Step 4: Add `compressRaw` helper in core**

```ts
// packages/core/src/compressors/index.ts — add at bottom (or in a new compressors/raw.ts)
import { compressorRegistry } from './registry'

export async function compressRaw(
  bytes: Uint8Array,
  name: string,
): Promise<{ bytes: Uint8Array; codecId: number }> {
  const compressor = compressorRegistry.get(name)
  if (!compressor) throw new Error(`unknown compressor: ${name}`)
  const out = await compressor.compress(bytes)
  return { bytes: out, codecId: compressor.id }
}

export async function decompressRaw(
  bytes: Uint8Array,
  codecId: number,
): Promise<Uint8Array> {
  const compressor = compressorRegistry.getById(codecId)
  if (!compressor) throw new Error(`unknown codecId: ${codecId}`)
  return compressor.decompress(bytes)
}
```

Verify `compressorRegistry.getById` exists by reading `packages/core/src/compressors/registry.ts`. If absent, add it:

```ts
// packages/core/src/compressors/registry.ts — add the missing getter
getById(id: number): Compressor | undefined {
  return this.byId.get(id)        // ← add a `byId` Map alongside the existing byName Map
}
```

- [ ] **Step 5: Wire pack encode in node**

```ts
// packages/node/src/encode.ts — full updated file
import { PackBuilder } from 'tokenpack'
import { compressRaw } from 'tokenpack/compressors'
import { encodePack } from 'tokenpack/pack-format/encode-pack'
// ... existing imports

export type EncodeInput = string | Uint8Array | Buffer | ArrayBuffer | Blob | PackBuilder

export interface EncodeResult {
  // existing fields (path / buffer / png) PLUS:
  bytes: Uint8Array            // raw token bytes for use with decode()
  // ...
}

export async function encode(
  input: EncodeInput,
  options: EncodeOptions = {},
): Promise<EncodeResult> {
  if (input instanceof PackBuilder) {
    const entries = await input.build()
    const compressorName = options.compressor ?? 'brotli-11'
    const packBytes = await encodePack(entries, bytes => compressRaw(bytes, compressorName))
    // The 'none' algorithm wraps these pre-compressed bytes into the image pipeline
    // without re-compressing.
    return encodeBytesViaImagePipeline(packBytes, { ...options, algo: 'none' })
  }
  // existing path: file format
  return encodeBytesViaImagePipeline(await coerceToBytes(input), options)
}

// `encodeBytesViaImagePipeline` is the existing encode() body, extracted into a helper.
// Make sure EncodeResult.bytes is populated either way (read raw bytes from the produced
// PNG buffer if not already exposed).
```

- [ ] **Step 6: Run tests to confirm pass**

Run: `yarn workspace @tokenpack/node test encode`
Expected: 3 passing.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/compressors packages/node/src/encode.ts packages/node/tests/encode.test.ts
git commit -m "feat(node): encode() accepts PackBuilder; pack format wired via compressRaw"
```

---

## Task 7: Node `decode` returning new Pack

**Files:**
- Modify: `packages/node/src/decode.ts`
- Test: `packages/node/tests/decode.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/node/tests/decode.test.ts
import { describe, expect, it } from 'vitest'
import { encode, decode, PackBuilder } from '@tokenpack/node'

describe('node decode source dispatch', () => {
  it('decode(Uint8Array) returns Pack', async () => {
    const r = await encode('hello')
    const pack = await decode(r.bytes)
    expect(pack.isPack()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) expect(await pack.text()).toBe('hello')
  })

  it('decode(Buffer) returns Pack', async () => {
    const r = await encode('hello')
    const pack = await decode(Buffer.from(r.bytes))
    if (!pack.isPack() && !pack.isDiff()) expect(await pack.text()).toBe('hello')
  })

  it('legacy file-format token still decodes via FilePack', async () => {
    // Synthesize a legacy token: just bytes with no signature/format byte.
    // (This is the pre-spec single-file shape.)
    const legacy = new TextEncoder().encode('legacy content')
    const pack = await decode(legacy)
    expect(pack.isPack()).toBe(false)
    if (!pack.isPack() && !pack.isDiff()) {
      expect(await pack.text()).toBe('legacy content')
    }
  })

  it('decode pack token surfaces DirPack with correct list', async () => {
    const r = await encode(new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'))
    const pack = await decode(r.bytes)
    expect(pack.isPack()).toBe(true)
    if (pack.isPack()) expect(pack.list).toEqual(['a.js', 'b.js'])
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn workspace @tokenpack/node test decode`
Expected: FAIL — decode returns old shape.

- [ ] **Step 3: Update `packages/node/src/decode.ts`**

```ts
// packages/node/src/decode.ts — replace the existing return
import { fromBytes } from 'tokenpack/pack/from-bytes'
import { decompressRaw } from 'tokenpack/compressors'
import type { Pack } from 'tokenpack/pack/types'

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  // Step 1: get the raw token bytes from whatever source.
  const bytes = await coerceSourceToBytes(source)        // existing helper, may need extension

  // Step 2: if image (has tokenpack signature), decode pixels first to get the embedded
  // byte stream. The existing decoder returns the raw bytes payload — use it.
  const payloadBytes = await decodeImageToBytes(bytes, options)    // existing image pipeline

  // Step 3: hand off to format-aware Pack handle.
  return fromBytes(payloadBytes, {
    decompress: decompressRaw,
  })
}
```

> The existing decode flow already produces a Uint8Array payload (the bytes that came out of the codec pipeline). Find the boundary in the current `decode.ts` where you have those bytes and route them through `fromBytes` instead of through `toDecodeResult`.

- [ ] **Step 4: Run tests to confirm pass**

Run: `yarn workspace @tokenpack/node test decode`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/node/src/decode.ts packages/node/tests/decode.test.ts
git commit -m "feat(node): decode() returns Pack discriminated union"
```

---

## Task 8: Browser encode + decode (mirror node)

**Files:**
- Modify: `packages/browser/src/encode.ts`
- Modify: `packages/browser/src/decode.ts`
- Test: `packages/browser/tests/encode-decode.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/browser/tests/encode-decode.test.ts
// Run with vitest's happy-dom or jsdom env.
import { describe, expect, it } from 'vitest'
import { encode, decode, PackBuilder } from '../src'

describe('browser encode + decode', () => {
  it('file format: string content round-trip', async () => {
    const r = await encode('hello')
    const bytes = new Uint8Array(await r.blobs[0].arrayBuffer())
    const pack = await decode(bytes)
    if (!pack.isPack() && !pack.isDiff()) expect(await pack.text()).toBe('hello')
  })

  it('pack format: builder round-trip', async () => {
    const r = await encode(
      new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'),
    )
    const bytes = new Uint8Array(await r.blobs[0].arrayBuffer())
    const pack = await decode(bytes)
    expect(pack.isPack()).toBe(true)
    if (pack.isPack()) {
      expect(pack.list).toEqual(['a.js', 'b.js'])
      expect(await pack.text('a.js')).toBe('aa')
    }
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn workspace @tokenpack/browser test encode-decode`
Expected: FAIL.

- [ ] **Step 3: Mirror node changes in browser encode/decode**

```ts
// packages/browser/src/encode.ts — add builder dispatch identical to node
import { PackBuilder } from 'tokenpack'
import { compressRaw } from 'tokenpack/compressors'
import { encodePack } from 'tokenpack/pack-format/encode-pack'

export async function encode(
  content: string | Uint8Array | ArrayBuffer | Blob | PackBuilder,
  options: EncodeBrowserOptions = {},
): Promise<EncodeResult> {
  if (content instanceof PackBuilder) {
    const entries = await content.build()
    const compressorName = options.compressor ?? 'brotli-11'   // browser uses CompressionStream-backed compressor of same name
    const packBytes = await encodePack(entries, b => compressRaw(b, compressorName))
    return encodeBytesViaImagePipeline(packBytes, { ...options, algo: 'none' })
  }
  return encodeBytesViaImagePipeline(await coerceToBytes(content), options)
}
```

```ts
// packages/browser/src/decode.ts — replace toDecodeResult with fromBytes
import { fromBytes } from 'tokenpack/pack/from-bytes'
import { decompressRaw } from 'tokenpack/compressors'

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  const pixels = await sourceToPixels(source)
  const codecId = resolveCodecId(pixels.pixels)
  const algorithm = algorithmCatalog.getById(codecId)
  const result = await algorithm.decodeBytes([pixels], options.key)
  const bytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
  return fromBytes(bytes, { decompress: decompressRaw })
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `yarn workspace @tokenpack/browser test encode-decode`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/browser/src/encode.ts packages/browser/src/decode.ts packages/browser/tests/
git commit -m "feat(browser): encode accepts PackBuilder; decode returns Pack"
```

---

## Task 9: NodePackBuilder with `withFileSystem` and `withGlob`

**Files:**
- Create: `packages/node/src/node-pack-builder.ts`
- Test: `packages/node/tests/node-pack-builder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/node/tests/node-pack-builder.test.ts
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
afterAll(async () => { await rm(dir, { recursive: true }) })

describe('NodePackBuilder', () => {
  it('withFileSystem on a file → single entry', async () => {
    const entries = await new NodePackBuilder()
      .withFileSystem(join(dir, 'a.txt'))
      .build()
    expect(entries.map(e => e.path)).toEqual(['a.txt'])
    expect(new TextDecoder().decode(entries[0].bytes)).toBe('hello a')
  })

  it('withFileSystem on a dir → recursive', async () => {
    const entries = await new NodePackBuilder()
      .withFileSystem(dir)
      .build()
    const paths = entries.map(e => e.path).sort()
    expect(paths).toEqual(['a.txt', 'b.txt', 'sub/c.txt', 'sub/skip.log'])
  })

  it('withFileSystem with `as` remap', async () => {
    const entries = await new NodePackBuilder()
      .withFileSystem(join(dir, 'a.txt'), { as: 'renamed.txt' })
      .build()
    expect(entries.map(e => e.path)).toEqual(['renamed.txt'])
  })

  it('withFileSystem with exclude', async () => {
    const entries = await new NodePackBuilder()
      .withFileSystem(dir, { exclude: ['*.log'] })
      .build()
    expect(entries.map(e => e.path)).not.toContain('sub/skip.log')
  })

  it('withGlob picks matching files only', async () => {
    const entries = await new NodePackBuilder()
      .withGlob('**/*.txt', { cwd: dir })
      .build()
    expect(entries.map(e => e.path).sort()).toEqual(['a.txt', 'b.txt', 'sub/c.txt'])
  })

  it('mixes withFile + withFileSystem chained', async () => {
    const entries = await new NodePackBuilder()
      .withFile('inline.md', '# inline')
      .withFileSystem(join(dir, 'a.txt'))
      .build()
    const paths = entries.map(e => e.path).sort()
    expect(paths).toEqual(['a.txt', 'inline.md'])
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn workspace @tokenpack/node test node-pack-builder`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `node-pack-builder.ts`**

```ts
// packages/node/src/node-pack-builder.ts
import { readFile, stat, readdir } from 'node:fs/promises'
import { join, relative, basename, sep, posix } from 'node:path'
import { PackBuilder } from 'tokenpack'
import type { PackEntry } from 'tokenpack'

export interface FsOptions {
  cwd?: string
  as?: string
  exclude?: string[]
}

export class NodePackBuilder extends PackBuilder {
  withFileSystem(fsPath: string, options: FsOptions = {}): this {
    this.intents.push({ kind: 'fs', fsPath, options } as never)
    return this
  }

  withGlob(pattern: string, options: FsOptions = {}): this {
    this.intents.push({ kind: 'glob', pattern, options } as never)
    return this
  }

  protected async resolve(intents: any[], prefix: string, out: PackEntry[]): Promise<void> {
    for (const it of intents) {
      if (it.kind === 'fs') {
        await resolveFs(it.fsPath, it.options, prefix, out)
      } else if (it.kind === 'glob') {
        await resolveGlob(it.pattern, it.options, prefix, out)
      } else {
        // Delegate file/dir to base class behavior.
        await super.resolve([it], prefix, out)
      }
    }
  }
}

async function resolveFs(
  fsPath: string,
  options: FsOptions,
  prefix: string,
  out: PackEntry[],
): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const absolute = join(cwd, fsPath)
  const s = await stat(absolute)

  if (s.isFile()) {
    if (matchesExclude(basename(absolute), options.exclude)) return
    const bytes = new Uint8Array(await readFile(absolute))
    const path = options.as ?? basename(absolute)
    out.push({ path: joinPosix(prefix, path), bytes })
    return
  }

  if (s.isDirectory()) {
    await walkDir(absolute, absolute, options, prefix, out)
    return
  }
}

async function walkDir(
  rootAbs: string,
  curAbs: string,
  options: FsOptions,
  prefix: string,
  out: PackEntry[],
): Promise<void> {
  const items = await readdir(curAbs, { withFileTypes: true })
  for (const item of items) {
    const itemAbs = join(curAbs, item.name)
    const rel = relative(rootAbs, itemAbs).split(sep).join('/')
    if (matchesExclude(rel, options.exclude)) continue
    if (item.isFile()) {
      const bytes = new Uint8Array(await readFile(itemAbs))
      const path = options.as ? joinPosix(options.as, rel) : rel
      out.push({ path: joinPosix(prefix, path), bytes })
    } else if (item.isDirectory()) {
      await walkDir(rootAbs, itemAbs, options, prefix, out)
    }
  }
}

async function resolveGlob(
  pattern: string,
  options: FsOptions,
  prefix: string,
  out: PackEntry[],
): Promise<void> {
  // Use Node's built-in glob (Node 22+) or fall back to fast-glob if added as dep.
  // Keep this minimal: leverage `fs.glob` if available; else import fast-glob lazily.
  const { glob } = await import('node:fs/promises') as { glob?: (p: string, opts: any) => AsyncIterable<string> }
  const cwd = options.cwd ?? process.cwd()
  if (!glob) throw new Error('NodePackBuilder.withGlob requires Node ≥22 (fs.glob) — install fast-glob if older')
  for await (const filePath of glob(pattern, { cwd })) {
    if (matchesExclude(filePath, options.exclude)) continue
    const bytes = new Uint8Array(await readFile(join(cwd, filePath)))
    out.push({ path: joinPosix(prefix, filePath), bytes })
  }
}

function matchesExclude(path: string, patterns?: string[]): boolean {
  if (!patterns) return false
  return patterns.some(p => globToRegex(p).test(path))
}

function globToRegex(glob: string): RegExp {
  // Very small glob: * → [^/]*, ** → .*, ? → [^/]
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__GS__')
    .replace(/\*/g, '[^/]*')
    .replace(/__GS__/g, '.*')
    .replace(/\?/g, '[^/]')
  return new RegExp(`^${re}$`)
}

function joinPosix(...parts: string[]): string {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/')
}
```

> **NOTE:** if Node 22+ `fs.glob` isn't available in the project's Node version, add `fast-glob` to `@tokenpack/node`'s dependencies and use it instead — same surface, swap the import.

- [ ] **Step 4: Run tests to confirm pass**

Run: `yarn workspace @tokenpack/node test node-pack-builder`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add packages/node/src/node-pack-builder.ts packages/node/tests/node-pack-builder.test.ts
git commit -m "feat(node): add NodePackBuilder with withFileSystem and withGlob"
```

---

# PHASE 3 — Diff format

## Task 10: Diff format encode + decode + DiffPack

**Files:**
- Create: `packages/core/src/pack-format/encode-diff.ts`
- Create: `packages/core/src/pack-format/apply-diff.ts`
- Create: `packages/core/src/pack/diff-pack.ts`
- Modify: `packages/core/src/pack/from-bytes.ts` (handle FORMAT_DIFF)
- Test: `packages/core/tests/pack-format/diff.test.ts`
- Test: `packages/core/tests/pack/diff-pack.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/tests/pack-format/diff.test.ts
import { describe, expect, it } from 'vitest'
import { encodeDiff, computeDiffOps } from '../../src/pack-format/encode-diff'
import { decodeDiff } from '../../src/pack-format/apply-diff'
import { encodePack } from '../../src/pack-format/encode-pack'

const enc = new TextEncoder()
const identity = async (b: Uint8Array) => ({ bytes: new Uint8Array(b), codecId: 0 })

describe('diff encode + apply', () => {
  it('computes add op for new file', () => {
    const prev = [{ path: 'a.js', bytes: enc.encode('aa') }]
    const next = [
      { path: 'a.js', bytes: enc.encode('aa') },
      { path: 'new.js', bytes: enc.encode('xx') },
    ]
    const ops = computeDiffOps(prev, next)
    expect(ops).toContainEqual({ op: 'add', path: 'new.js' })
  })

  it('computes delete op for removed file', () => {
    const prev = [{ path: 'a.js', bytes: enc.encode('aa') }, { path: 'b.js', bytes: enc.encode('bb') }]
    const next = [{ path: 'a.js', bytes: enc.encode('aa') }]
    const ops = computeDiffOps(prev, next)
    expect(ops).toContainEqual({ op: 'delete', path: 'b.js' })
  })

  it('computes modify op for changed content', () => {
    const prev = [{ path: 'a.js', bytes: enc.encode('aa') }]
    const next = [{ path: 'a.js', bytes: enc.encode('AAA') }]
    const ops = computeDiffOps(prev, next)
    expect(ops).toContainEqual({ op: 'modify', path: 'a.js' })
  })

  it('computes rename op (same content, different path)', () => {
    const prev = [{ path: 'old.js', bytes: enc.encode('same') }]
    const next = [{ path: 'new.js', bytes: enc.encode('same') }]
    const ops = computeDiffOps(prev, next)
    expect(ops).toContainEqual({ op: 'rename', path: 'new.js', fromPath: 'old.js' })
  })

  it('encode/decode round-trip preserves ops', async () => {
    const prev = [{ path: 'a.js', bytes: enc.encode('aa') }, { path: 'b.js', bytes: enc.encode('bb') }]
    const next = [
      { path: 'a.js', bytes: enc.encode('AA') },                // modify
      { path: 'c.js', bytes: enc.encode('cc') },                // add (b deleted)
    ]
    const diffBytes = await encodeDiff(prev, next, identity)
    const decoded = decodeDiff(diffBytes)
    const summary = decoded.manifest.ops.map(o => ({ op: o.op, path: o.path }))
    expect(summary).toContainEqual({ op: 'modify', path: 'a.js' })
    expect(summary).toContainEqual({ op: 'delete', path: 'b.js' })
    expect(summary).toContainEqual({ op: 'add', path: 'c.js' })
  })

  it('apply reconstructs next byte-identical', async () => {
    const prev = [{ path: 'a.js', bytes: enc.encode('aa') }, { path: 'b.js', bytes: enc.encode('bb') }]
    const next = [
      { path: 'a.js', bytes: enc.encode('AA') },
      { path: 'c.js', bytes: enc.encode('cc') },
    ]
    const { applyDiff } = await import('../../src/pack-format/apply-diff')
    const diffBytes = await encodeDiff(prev, next, identity)
    const reconstructed = await applyDiff(prev, diffBytes, async b => b)        // identity decompress
    const map = new Map(reconstructed.map(r => [r.path, r.bytes]))
    expect(map.get('a.js')).toEqual(enc.encode('AA'))
    expect(map.get('c.js')).toEqual(enc.encode('cc'))
    expect(map.has('b.js')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn workspace tokenpack test pack-format/diff`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `encode-diff.ts`**

```ts
// packages/core/src/pack-format/encode-diff.ts
import { FORMAT_DIFF, writeFormatByte } from './format-byte'
import { writeDiffManifest, type DiffManifest, type DiffManifestEntry, type DiffOp } from './manifest'
import type { CompressFn } from './encode-pack'
import type { PackEntry } from '../archive-buffers'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface DiffOpSummary {
  op: DiffOp
  path: string
  fromPath?: string
}

const enc = new TextEncoder()

function hash(bytes: Uint8Array): string {
  // FNV-1a 32-bit (existing project style — see dense-drawer.ts in core).
  let h = 0x811c9dc5
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

export function computeDiffOps(
  prev: readonly PackEntry[],
  next: readonly PackEntry[],
): DiffOpSummary[] {
  const prevByPath = new Map(prev.map(e => [e.path, e]))
  const nextByPath = new Map(next.map(e => [e.path, e]))
  const prevByHash = new Map(prev.map(e => [hash(e.bytes), e.path]))
  const ops: DiffOpSummary[] = []

  // ADD or MODIFY or RENAME for paths in next.
  for (const e of next) {
    const prevEntry = prevByPath.get(e.path)
    if (!prevEntry) {
      // Maybe a rename — same content existed under a different path.
      const fromPath = prevByHash.get(hash(e.bytes))
      if (fromPath && !nextByPath.has(fromPath)) {
        ops.push({ op: 'rename', path: e.path, fromPath })
      } else {
        ops.push({ op: 'add', path: e.path })
      }
    } else if (hash(prevEntry.bytes) !== hash(e.bytes)) {
      ops.push({ op: 'modify', path: e.path })
    }
    // else: identical, no op.
  }

  // DELETE for paths gone from next (and not part of a rename).
  const renamedFrom = new Set(ops.filter(o => o.op === 'rename').map(o => o.fromPath!))
  for (const e of prev) {
    if (!nextByPath.has(e.path) && !renamedFrom.has(e.path)) {
      ops.push({ op: 'delete', path: e.path })
    }
  }
  return ops
}

export async function encodeDiff(
  prev: readonly PackEntry[],
  next: readonly PackEntry[],
  compress: CompressFn,
): Promise<Uint8Array> {
  const ops = computeDiffOps(prev, next)
  const nextByPath = new Map(next.map(e => [e.path, e]))

  // For add/modify ops, compress the new content and assign an offset.
  let runningOffset = 0
  const regionBytes: Uint8Array[] = []
  const manifestEntries: DiffManifestEntry[] = []
  for (const op of ops) {
    if (op.op === 'add' || op.op === 'modify') {
      const file = nextByPath.get(op.path)!
      const c = await compress(file.bytes)
      manifestEntries.push({
        op: op.op,
        path: op.path,
        codecId: c.codecId,
        compressedSize: c.bytes.length,
        originalSize: file.bytes.length,
        offset: runningOffset,
      })
      regionBytes.push(c.bytes)
      runningOffset += c.bytes.length
    } else if (op.op === 'rename') {
      manifestEntries.push({ op: 'rename', path: op.path, fromPath: op.fromPath })
    } else {
      manifestEntries.push({ op: 'delete', path: op.path })
    }
  }

  const manifest: DiffManifest = { version: 1, ops: manifestEntries }
  const manifestBytes = writeDiffManifest(manifest)
  const totalRegions = regionBytes.reduce((s, r) => s + r.length, 0)

  const out = new Uint8Array(4 + 1 + 4 + manifestBytes.length + totalRegions)
  out.set(SIG, 0)
  writeFormatByte(out, 4, FORMAT_DIFF)
  new DataView(out.buffer, out.byteOffset, out.byteLength).setUint32(5, manifestBytes.length, true)
  out.set(manifestBytes, 9)
  let pos = 9 + manifestBytes.length
  for (const r of regionBytes) {
    out.set(r, pos)
    pos += r.length
  }
  return out
}
```

- [ ] **Step 4: Implement `apply-diff.ts`**

```ts
// packages/core/src/pack-format/apply-diff.ts
import { FORMAT_DIFF, readFormatByte } from './format-byte'
import { readDiffManifest, type DiffManifest } from './manifest'
import type { PackEntry } from '../archive-buffers'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface DecodedDiff {
  manifest: DiffManifest
  extractRegion(path: string): Uint8Array
  readonly regionsStart: number
  readonly bytes: Uint8Array
}

export function decodeDiff(bytes: Uint8Array): DecodedDiff {
  if (bytes[0] !== SIG[0] || bytes[1] !== SIG[1] || bytes[2] !== SIG[2] || bytes[3] !== SIG[3]) {
    throw new Error('decodeDiff: missing signature')
  }
  const fmt = readFormatByte(bytes, 4)
  if (fmt !== FORMAT_DIFF) {
    throw new Error(`decodeDiff: expected diff format (0x03), got 0x${fmt.toString(16)}`)
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const manifestSize = view.getUint32(5, true)
  const manifestBytes = bytes.subarray(9, 9 + manifestSize)
  const manifest = readDiffManifest(manifestBytes)
  const regionsStart = 9 + manifestSize

  return {
    manifest,
    regionsStart,
    bytes,
    extractRegion(path) {
      const op = manifest.ops.find(o => o.path === path && (o.op === 'add' || o.op === 'modify'))
      if (!op) throw new Error(`no add/modify op for path: ${path}`)
      const start = regionsStart + op.offset!
      return bytes.subarray(start, start + op.compressedSize!)
    },
  }
}

export type DecompressFn = (bytes: Uint8Array, codecId: number) => Promise<Uint8Array>

/**
 * Apply a diff byte stream to `prev` entries, returning new entries.
 * `decompress` only needed if any add/modify ops carry compressed regions.
 */
export async function applyDiff(
  prev: readonly PackEntry[],
  diffBytes: Uint8Array,
  decompress: DecompressFn,
): Promise<PackEntry[]> {
  const decoded = decodeDiff(diffBytes)
  const map = new Map<string, Uint8Array>(prev.map(e => [e.path, e.bytes]))

  for (const op of decoded.manifest.ops) {
    if (op.op === 'delete') {
      map.delete(op.path)
    } else if (op.op === 'rename') {
      const bytes = map.get(op.fromPath!)
      if (!bytes) throw new Error(`rename source missing: ${op.fromPath}`)
      map.delete(op.fromPath!)
      map.set(op.path, bytes)
    } else {
      // add or modify
      const region = decoded.extractRegion(op.path)
      const bytes = await decompress(region, op.codecId!)
      map.set(op.path, bytes)
    }
  }

  return Array.from(map, ([path, bytes]) => ({ path, bytes }))
}
```

- [ ] **Step 5: Implement `DiffPack` class**

```ts
// packages/core/src/pack/diff-pack.ts
import type { DiffPack as IDiffPack, DirPack as IDirPack, DiffEntry } from './types'
import { DirPack } from './dir-pack'
import { applyDiff, type DecompressFn } from '../pack-format/apply-diff'

export class DiffPack implements IDiffPack {
  readonly list: string[]
  readonly entries: ReadonlyArray<DiffEntry>

  constructor(
    entries: ReadonlyArray<DiffEntry>,
    private readonly diffBytes: Uint8Array,
    private readonly decompress: DecompressFn,
  ) {
    this.entries = entries
    this.list = entries.map(e => e.path)
  }

  isPack(): this is IDirPack { return false }
  isDiff(): this is IDiffPack { return true }

  async apply(prev: IDirPack): Promise<IDirPack> {
    // Materialize prev as PackEntry[] then apply.
    const prevEntries = await prev.extractAll()
    const newEntries = await applyDiff(prevEntries, this.diffBytes, this.decompress)
    // Wrap as a DirPack backed by the in-memory entries.
    const map = new Map(newEntries.map(e => [e.path, e.bytes]))
    return new DirPack(
      newEntries.map(e => ({ path: e.path, size: e.bytes.length })),
      async path => {
        const bytes = map.get(path)
        if (!bytes) throw new Error(`no entry for path: ${path}`)
        return bytes
      },
      async () => Array.from(map, ([path, bytes]) => ({ path, bytes })),
    )
  }
}
```

- [ ] **Step 6: Update `from-bytes.ts` for FORMAT_DIFF**

Replace the `throw new Error('fromBytes: diff format not yet implemented')` with:

```ts
// packages/core/src/pack/from-bytes.ts — replace the FORMAT_DIFF branch
  if (fmt === FORMAT_DIFF) {
    const decoded = decodeDiff(bytes)
    const entries = decoded.manifest.ops.map(o => ({
      path: o.path,
      op: o.op,
      size: o.originalSize,
      fromPath: o.fromPath,
    }))
    return new DiffPack(entries, bytes, opts.decompress)
  }
```

Don't forget the imports:

```ts
import { decodeDiff } from '../pack-format/apply-diff'
import { DiffPack } from './diff-pack'
```

- [ ] **Step 7: Run tests to confirm pass**

Run: `yarn workspace tokenpack test pack-format/diff && yarn workspace tokenpack test pack/diff`
Expected: 6 + diff-pack tests passing.

- [ ] **Step 8: Wire `DirPack.diffTo` in env packages**

In both `packages/node/src/encode.ts` and `packages/browser/src/encode.ts`, when constructing the `DirPack` for a decoded pack token, inject the `diffTo` callback so it produces a diff token via `encodeDiff` + the same image pipeline.

```ts
// In each env's decode.ts where fromBytes is called:
return fromBytes(payloadBytes, {
  decompress: decompressRaw,
  diffTo: async (a: PackEntry[], b: PackEntry[]) => {
    const diffBytes = await encodeDiff(a, b, bytes => compressRaw(bytes, 'brotli-11'))
    return encodeBytesViaImagePipeline(diffBytes, { algo: 'none' })   // env-specific helper
  },
})
```

Then update `DirPack.diffTo` to materialize both sides as PackEntry[] before calling the injected fn:

```ts
// Adjust DirPack.diffTo:
async diffTo(other: IDirPack): Promise<unknown> {
  if (!this.diffToFn) throw new Error('diffTo: not configured (env package must inject)')
  const a = await this.extractAll()
  const b = await other.extractAll()
  return (this.diffToFn as any)(a, b)
}
```

- [ ] **Step 9: Add E2E diff round-trip test (node)**

```ts
// packages/node/tests/encode.test.ts — append
it('diff round-trip via Pack methods', async () => {
  const v1 = await encode(new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'))
  const v2 = await encode(new PackBuilder().withFile('a.js', 'AA').withFile('c.js', 'cc'))
  const prev = await decode(v1.bytes)
  const next = await decode(v2.bytes)
  if (!prev.isPack() || !next.isPack()) throw new Error('expected DirPacks')

  const diffResult = await prev.diffTo(next) as { bytes: Uint8Array }
  const diffPack = await decode(diffResult.bytes)
  expect(diffPack.isDiff()).toBe(true)
  if (!diffPack.isDiff()) return

  const reconstructed = await diffPack.apply(prev)
  expect(reconstructed.list.sort()).toEqual(['a.js', 'c.js'])
  expect(await reconstructed.text('a.js')).toBe('AA')
  expect(await reconstructed.text('c.js')).toBe('cc')
})
```

Run: `yarn workspace @tokenpack/node test encode`
Expected: existing 3 + 1 new = 4 passing.

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/pack-format/encode-diff.ts packages/core/src/pack-format/apply-diff.ts packages/core/src/pack/diff-pack.ts packages/core/src/pack/from-bytes.ts packages/core/tests/pack-format/diff.test.ts packages/node/tests/encode.test.ts packages/node/src/decode.ts packages/browser/src/decode.ts
git commit -m "feat(core+env): diff format + DiffPack.apply + DirPack.diffTo wiring"
```

---

# PHASE 4 — Package surface cleanup

## Task 11: Slim `tokenpack` (core) public exports

**Files:**
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json` (drop subpath exports)

- [ ] **Step 1: Replace `packages/core/src/index.ts`**

```ts
// packages/core/src/index.ts
import './algorithms/register-all'

// Algorithm catalog
export { AlgorithmCatalog, algorithmCatalog } from './algorithms/catalog'
export {
  getAlgorithmById,
  getAlgorithmByName,
  listAlgorithmCatalog,
  listAlgorithms,
} from './algorithms/registry'

// CART primitives (env-neutral; legacy callers still use them)
export {
  isCartArchive,
  listArchive,
  packBuffers,
  unpackBuffers,
  type PackEntry,
} from './archive-buffers'

// Crypto
export { CRYPTO_OVERHEAD, decryptData, encryptData } from './crypto'

// Pack types + builder
export { PackBuilder } from './pack-builder'
export type {
  Pack,
  FilePack,
  DirPack,
  DiffPack,
  DiffEntry,
  DiffOp,
} from './pack/types'

// Pack-format primitives (advanced)
export { writePackManifest, readPackManifest, type PackManifest } from './pack-format/manifest'

// Compressor helpers
export { compressRaw, decompressRaw } from './compressors'

// Common option types
export type { DecodeOptions, EncodeOptions, HeaderData, ImageFormat, Style } from './types'

// Finalize chunks helper (used by env wrappers and benchmarks)
export { finalizeChunks } from './finalize-chunks'
```

- [ ] **Step 2: Trim `packages/core/package.json#exports`**

Replace `"exports"` with:

```json
"exports": {
  ".": "./src/index.ts",
  "./pack-format/encode-pack": "./src/pack-format/encode-pack.ts",
  "./pack-format/decode-pack": "./src/pack-format/decode-pack.ts",
  "./pack-format/apply-diff": "./src/pack-format/apply-diff.ts",
  "./pack-format/encode-diff": "./src/pack-format/encode-diff.ts",
  "./pack-format/manifest": "./src/pack-format/manifest.ts",
  "./pack-format/format-byte": "./src/pack-format/format-byte.ts",
  "./pack/from-bytes": "./src/pack/from-bytes.ts",
  "./pack/types": "./src/pack/types.ts",
  "./compressors": "./src/compressors/index.ts",
  "./algorithms": "./src/algorithms/index.ts",
  "./algorithms/catalog": "./src/algorithms/catalog.ts",
  "./codecs": "./src/codecs/index.ts",
  "./drawers": "./src/drawers/index.ts",
  "./surfaces": "./src/surfaces/index.ts",
  "./fec": "./src/fec/index.ts"
}
```

> Removed: `encoder`, `decoder`, `stream-decoder`, `archive`, `decode-result`, `diff`, `diff-pack`, `presets`, `style`, `header`, `types`, `crypto`, plus the `*/types` and `*/registry` advanced subpaths. Anything internal stays imported via relative paths within core.

- [ ] **Step 3: Run all core tests to confirm nothing broke**

Run: `yarn workspace tokenpack test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/index.ts packages/core/package.json
git commit -m "chore(core): slim public exports — primitives + types only"
```

---

## Task 12: Replace `export *` in `@tokenpack/node` with explicit re-exports

**Files:**
- Modify: `packages/node/src/index.ts`

- [ ] **Step 1: Replace the file**

```ts
// packages/node/src/index.ts
import { webcrypto } from 'node:crypto'

if (!(globalThis as { crypto?: unknown }).crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}

import './register'

// Top-level user-facing
export { encode, type EncodeInput, type EncodeResult } from './encode'
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { NodePackBuilder, type FsOptions } from './node-pack-builder'

// Streaming (top-level per spec)
export { createTokenDecodeStream as decodeStream } from 'tokenpack/stream-decoder'
// (encodeStream — to be added when stream encode lands; placeholder export omitted until then)

// Surfaces
export { AvifSurface } from './surfaces/avif'
export { PngSurface } from './surfaces/png'
export { StreamingPngSurface } from './surfaces/streaming-png'
export { WebpSurface } from './surfaces/webp'

// Compressors
export { BrotliCompressor } from './compressors/brotli'
export { DeflateCompressor } from './compressors/deflate'

// Codecs
export { hasZstd, ZstdpixCodec, zstdpixCodec } from './codecs/zstdpix'

// Manual registration
export { registerNodeDefaults } from './register'

// Re-exported from core (explicit — no `export *`)
export {
  PackBuilder,
  type PackEntry,
  type Pack,
  type FilePack,
  type DirPack,
  type DiffPack,
  type DiffEntry,
  type DiffOp,
  type EncodeOptions,
  type ImageFormat,
  type Style,
} from 'tokenpack'
```

> Removed: `extract` (use `pack.extract(path)`), `diffText`/`diffTokens`/`FileDiff` (review whether the dashboard still uses them — if yes, expose under a `/diff-heatmap` subpath; if no, delete), and the implicit `export * from 'tokenpack'`.

- [ ] **Step 2: Search for `extract`, `diffText`, `diffTokens` consumers**

Run: `grep -r "from '@tokenpack/node'" packages/app packages/runtime-experiments benchmark | grep -E "(extract|diffText|diffTokens|FileDiff)"`

If any consumers found, update them:
- `extract(source, path)` → `(await decode(source)).extract(path)` (only valid on DirPack)
- `diffText` / `diffTokens` / `FileDiff` — decide subpath or removal in step 3 below.

- [ ] **Step 3: Decide diffText/diffTokens fate**

Run: `grep -r "diffText\|diffTokens\|FileDiff" packages/app packages/runtime-experiments`

If consumers exist:

```ts
// packages/node/src/diff-heatmap.ts (new)
export { diffText, diffTokens, type FileDiff } from 'tokenpack/diff'
```

Add to `packages/node/package.json`:

```json
"./diff-heatmap": "./src/diff-heatmap.ts"
```

Update consumers from `import { diffText } from '@tokenpack/node'` to `from '@tokenpack/node/diff-heatmap'`.

If no consumers exist, delete `packages/core/src/diff.ts` (or move to `_archived/`) and skip the subpath.

- [ ] **Step 4: Run node tests + smoke test app builds**

Run: `yarn workspace @tokenpack/node test && yarn workspace tokenpack-app build`
Expected: green; if app fails to build because of removed exports, fix the consumer.

- [ ] **Step 5: Commit**

```bash
git add packages/node/src/index.ts packages/node/src/diff-heatmap.ts packages/node/package.json
git commit -m "chore(node): explicit re-exports from core; drop top-level extract/diff* aliases"
```

---

## Task 13: Browser `index.ts` cleanup + symmetry

**Files:**
- Modify: `packages/browser/src/index.ts`

- [ ] **Step 1: Replace the file**

```ts
// packages/browser/src/index.ts
import './buffer-polyfill'
import './register'

// Top-level user-facing
export { encode, type EncodeBrowserOptions, type EncodeResult } from './encode'
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { registerBrowserDefaults } from './register'

// Re-exported from core (explicit)
export {
  PackBuilder,
  type PackEntry,
  type Pack,
  type FilePack,
  type DirPack,
  type DiffPack,
  type DiffEntry,
  type DiffOp,
  type EncodeOptions,
  type ImageFormat,
  type Style,
} from 'tokenpack'
```

(Helper components/hooks/sw/postMessage/inline stay on their existing subpaths. The old `decode-result` re-export is gone since `Pack` is in core's main index now.)

- [ ] **Step 2: Run browser tests**

Run: `yarn workspace @tokenpack/browser test`
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add packages/browser/src/index.ts
git commit -m "chore(browser): symmetric exports with @tokenpack/node; drop decode-result re-export"
```

---

## Task 14: Update internal consumers (app, benchmark)

**Files:**
- Modify (as needed): `packages/app/src/**`, `benchmark/**`, `packages/runtime-experiments/**`

- [ ] **Step 1: Find consumers using removed/changed surface**

Run:
```bash
grep -rn "type === 'file'\|type === 'dir'" packages/app packages/runtime-experiments benchmark
grep -rn "from 'tokenpack/decode-result'\|from 'tokenpack/encoder'\|from 'tokenpack/decoder'\|from 'tokenpack/archive'\|from 'tokenpack/diff'\|from 'tokenpack/diff-pack'" packages/
grep -rn "import.*extract.*'@tokenpack/node'" packages/
```

- [ ] **Step 2: Migrate each callsite**

Translation table:

| Old | New |
|---|---|
| `if (result.type === 'file') ...` | `if (!pack.isPack()) ...` |
| `if (result.type === 'dir') for (const e of result.entries)` | `if (pack.isPack()) for (const path of pack.list)` |
| `e.payload` (single bytes) | `await pack.content()` (FilePack) or `await pack.extract(path)` (DirPack) |
| `e.entries[i].payload` | `await pack.extract(pack.list[i])` |
| `extract(source, path)` | `await (await decode(source)).extract(path)` |
| `diffPack(prev, next)` (top-level) | `await prevPack.diffTo(nextPack)` |
| `applyDiff(prev, diff)` (top-level) | `await diffPack.apply(prevPack)` |

For each migrated file, run its package's test/build to confirm.

- [ ] **Step 3: Run full repo build + tests**

Run:
```bash
yarn workspace tokenpack test
yarn workspace @tokenpack/node test
yarn workspace @tokenpack/browser test
yarn workspace @tokenpack/browser verify:browser
yarn workspace tokenpack-app build
```

Expected: all green; browser bundle has no node imports.

- [ ] **Step 4: Commit**

```bash
git add packages/app packages/runtime-experiments benchmark
git commit -m "refactor: migrate consumers to unified Pack API"
```

---

## Task 15: Move fs-using files from core to node (cleanup follow-through)

**Files:**
- Move: `packages/core/src/encoder.ts` → `packages/node/src/_internal/encoder.ts`
- Move: `packages/core/src/decoder.ts` → `packages/node/src/_internal/decoder.ts`
- Move: `packages/core/src/stream-decoder.ts` → `packages/node/src/streams/decode.ts`
- Move: fs portions of `packages/core/src/archive.ts` → `packages/node/src/_internal/archive-fs.ts`
- Test: existing tests follow files that use them

This is mechanical but tedious. For each move:

- [ ] **Step 1: Move file with `git mv`**

```bash
git mv packages/core/src/encoder.ts packages/node/src/_internal/encoder.ts
```

- [ ] **Step 2: Update all imports** — search-and-replace `'tokenpack/encoder'` → `'@tokenpack/node/_internal/encoder'` (or absolute relative paths inside node).

Run: `grep -rn "from 'tokenpack/encoder'" packages/`

- [ ] **Step 3: Update each file**, e.g.:

```ts
// before: import { encodeFile } from 'tokenpack/encoder'
// after:  import { encodeFile } from '../../_internal/encoder'   // (inside node)
//   or:  import { encodeFile } from '@tokenpack/node/_internal/encoder'   // (cross-package)
```

- [ ] **Step 4: Repeat steps 1-3 for `decoder.ts`, `stream-decoder.ts`, `archive.ts` fs wrappers**

- [ ] **Step 5: Re-run tests + browser build verification**

Run: `yarn workspace tokenpack test && yarn workspace @tokenpack/node test && yarn workspace @tokenpack/browser verify:browser`

Expected: green; browser build now reports zero `node:*` imports.

- [ ] **Step 6: Commit**

```bash
git add -A packages/core packages/node
git commit -m "refactor: move fs-using files (encoder/decoder/stream-decoder/archive-fs) from core to node"
```

---

# Known gaps deferred to follow-up plans

The spec defines a few requirements that this plan does NOT implement; they need follow-up work:

1. **Per-region encryption.** Spec requires "Each file region carries its own FEC parity (if enabled) and is independently encrypted (if a key is passed)." This plan's `compressRaw` only compresses; encryption remains at the outer-image level (today's behavior). With per-region encryption, extracting one file requires only that file's per-region key/IV. Add to a Phase 5 follow-up: extend `CompressFn` to take an optional `key` and emit encrypted region bytes; mirror in `decompress`.

2. **Per-region FEC.** Same shape as encryption — current FEC applies to the outer image. Per-region FEC means each region carries its own parity bytes. Phase 5 follow-up.

3. **Streaming pack decode.** With a manifest-first layout, you can stream-extract regions as they arrive over the wire. This plan implements eager whole-image decode. Phase 6 follow-up; aligns with `IDEAS.md` Phase 1 #1.

4. **Binary delta inside `modify` ops.** Per spec, this is a Phase 5 follow-up — not included here.

5. **`pack.release()` for memory cleanup.** Per spec, deferred.

# Self-review notes

- All tasks have concrete code, exact file paths, and test commands.
- Type names used consistently across tasks (`Pack`, `FilePack`, `DirPack`, `DiffPack`, `DiffEntry`, `PackEntry`, `PackBuilder`, `NodePackBuilder`).
- Phasing order (1 → 2 → 3 → 4) matches dependency order; every phase ends with passing tests.
- Phase 4 is partly destructive (removing exports, moving files). It's last, after Phases 1-3 prove the new API works.
