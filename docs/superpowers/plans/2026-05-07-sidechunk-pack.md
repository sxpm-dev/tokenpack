# Sidechunk Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new pack format that stores TokenPack data in a custom ancillary chunk of a PNG/WebP/AVIF artifact, alongside an arbitrary visible image. Wire it into the dashboard encode page with decoration controls.

**Architecture:** Pure plugin — three new entities (`SidechunkSurface` interface + concrete PNG/WebP/AVIF surfaces, `SidechunkAlgorithm`, decoration renderer) live in their own files. Stubs (`NoopCodec`/`NoopDrawer`/`NullSurface`) satisfy `AbstractAlgorithm`'s required fields without touching the central pipeline. Registration uses the existing `algorithmCatalog.register()` API.

**Tech Stack:** TypeScript, Yarn workspaces, Vitest. Node-side: `pngjs` (existing) for PNG chunk surgery, `sharp` (existing) for WebP/AVIF baseline + manual RIFF/HEIF chunk splicing. Browser side is out of scope for Phase A — sidechunk algorithm capabilities = `['node']` only.

**Spec:** `docs/superpowers/specs/2026-05-07-sidechunk-pack-design.md`

---

## File Structure

**New files (core):**
- `packages/core/src/algorithms/sidechunk/sidechunk-algorithm.ts` — the `SidechunkAlgorithm` class
- `packages/core/src/algorithms/sidechunk/index.ts` — barrel export
- `packages/core/src/algorithms/sidechunk/stubs.ts` — `NoopCodec`, `NoopDrawer`, `NullSurface`
- `packages/core/src/surfaces/sidechunk-surface.ts` — `SidechunkSurface` interface + `DecorationConfig` type
- `packages/core/src/surfaces/decoration-renderer.ts` — placeholder/gradient/data-art renderer

**New files (node):**
- `packages/node/src/surfaces/png-sidechunk.ts` — PNG sidechunk surface (custom ancillary chunk)
- `packages/node/src/surfaces/webp-sidechunk.ts` — WebP sidechunk surface (RIFF custom chunk)
- `packages/node/src/surfaces/avif-sidechunk.ts` — AVIF sidechunk surface (HEIF custom item)
- `packages/node/src/sidechunk.ts` — top-level `encodeSidechunk` / `decodeSidechunk` helpers

**New files (app):**
- `packages/app/src/components/EncodeForm/components/DecorationSection.tsx` — UI controls
- `packages/app/src/components/BuildToken/utils/sidechunk-encode.ts` — server-encode dispatch helper

**New tests:**
- `packages/core/tests/algorithms/sidechunk-algorithm.test.ts`
- `packages/core/tests/surfaces/decoration-renderer.test.ts`
- `packages/node/tests/surfaces/png-sidechunk.test.ts`
- `packages/node/tests/surfaces/webp-sidechunk.test.ts`
- `packages/node/tests/surfaces/avif-sidechunk.test.ts`
- `packages/node/tests/sidechunk-roundtrip.test.ts`

**Modified files (purely additive — additions only, no edits to existing logic):**
- `packages/node/src/register.ts` — one new import + one new `algorithmCatalog.register()` call
- `packages/node/src/index.ts` — re-export `encodeSidechunk` / `decodeSidechunk`
- `packages/app/src/components/EncodeForm/types.ts` — add `decoration`, `decorationSize` fields to `EncodeConfig`
- `packages/app/src/components/EncodeForm/EncodeForm.tsx` — render `DecorationSection` when `algo === 'sidechunk'`
- `packages/app/src/components/BuildToken/hooks/useSmartEncode.ts` — branch on sidechunk algo
- `packages/app/src/app/api/pack/route.ts` — branch on `algo === 'sidechunk'` and dispatch to `encodeSidechunk`

---

## Constants — algorithm ID + chunk markers

These are referenced across multiple tasks. **Use these exact values.**

```ts
// New algorithm
SIDECHUNK_ALGO_ID = 100  // first free integer above existing IDs
SIDECHUNK_ALGO_NAME = 'sidechunk'

// PNG ancillary chunk type — first letter lowercase = ancillary, ignorable per PNG spec
PNG_SIDECHUNK_TYPE = 'tpAK'  // 0x74 0x70 0x41 0x4B

// WebP RIFF FourCC
WEBP_SIDECHUNK_FOURCC = 'TPAK'  // 0x54 0x50 0x41 0x4B

// AVIF / HEIF custom item type (4 chars, lowercase)
AVIF_SIDECHUNK_ITEM_TYPE = 'tpak'
AVIF_SIDECHUNK_MIME = 'application/x-tokenpack'
```

---

### Task 1: Add stubs (`NoopCodec`, `NoopDrawer`, `NullSurface`)

**Files:**
- Create: `packages/core/src/algorithms/sidechunk/stubs.ts`
- Test: `packages/core/tests/algorithms/sidechunk/stubs.test.ts`

These satisfy the abstract fields on `AbstractAlgorithm` without altering it. Their methods throw — they should never be called because `SidechunkAlgorithm.encode/decode/encodeBytes/decodeBytes` bypass them.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/algorithms/sidechunk/stubs.test.ts`:
```ts
import { describe, expect, it } from 'vitest'

import { NoopCodec, NoopDrawer, NullSurface } from '../../../src/algorithms/sidechunk/stubs'

describe('sidechunk stubs', () => {
  it('NoopCodec throws on encode', () => {
    const codec = new NoopCodec()
    expect(() => codec.encode(Buffer.from(''), 0, 0, 0, 3)).toThrowError(/sidechunk/i)
  })
  it('NoopCodec throws on decode', () => {
    const codec = new NoopCodec()
    expect(() => codec.decode(new Uint8Array(), 0, 0, 0, 3)).toThrowError(/sidechunk/i)
  })
  it('NoopDrawer throws on write', () => {
    const drawer = new NoopDrawer()
    expect(() => drawer.write(Buffer.from(''), {} as never)).toThrowError(/sidechunk/i)
  })
  it('NoopDrawer throws on read', () => {
    const drawer = new NoopDrawer()
    expect(() => drawer.read({} as never, {} as never)).toThrowError(/sidechunk/i)
  })
  it('NullSurface throws on write', async () => {
    const surface = new NullSurface()
    await expect(surface.write('', {} as never)).rejects.toThrowError(/sidechunk/i)
  })
  it('NullSurface has correct id', () => {
    expect(new NullSurface().id).toBe('null')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/core test tests/algorithms/sidechunk/stubs.test.ts`
Expected: FAIL — file `stubs.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`packages/core/src/algorithms/sidechunk/stubs.ts`:
```ts
import { AbstractCodec, type CodecMetadata, type PixelBuffer } from '../../codecs/types'
import {
  AbstractDrawer,
  type DrawContext,
  type DrawerCapabilities,
  type DrawnArtifact,
  type ChunkReadResult,
  type ReadContext,
} from '../../drawers/types'
import { AbstractSurface, type SurfacePixels, type SurfaceId } from '../../surfaces/types'
import type { ImageFormat } from '../../types'

const ERR = 'sidechunk algorithm does not use codec/drawer/surface — this stub should never be called'

export class NoopCodec extends AbstractCodec {
  id = -1
  name = 'noop'
  metadata: CodecMetadata = {
    pixelLayout: 'n/a',
    writeStyle: 'n/a',
    dependencies: 'n/a',
    beFriendly: 'no',
    feFriendly: 'no',
    streamFriendly: 'no',
    approxRatio: 'n/a',
    description: 'sidechunk stub codec — never executed',
  }
  encode(): PixelBuffer { throw new Error(ERR) }
  decode(): Buffer { throw new Error(ERR) }
}

export class NoopDrawer extends AbstractDrawer {
  readonly id = 'noop'
  readonly label = 'noop'
  readonly outputKind = 'raster-pixels' as const
  readonly capabilities: DrawerCapabilities = {
    streamable: false,
    decodeOnFlight: false,
    requiresLosslessSurface: false,
    requiresAlpha: false,
    supportedChannels: new Set([3]),
  }
  write(_input: Buffer, _ctx: DrawContext): DrawnArtifact { throw new Error(ERR) }
  read(_image: SurfacePixels, _ctx: ReadContext): ChunkReadResult { throw new Error(ERR) }
}

export class NullSurface extends AbstractSurface {
  readonly id: SurfaceId = 'null' as SurfaceId
  readonly label = 'null'
  readonly format: ImageFormat = 'png'
  readonly extension = ''
  readonly mimeType = 'application/x-null'
  readonly inputKind = 'raster-pixels' as const
  readonly lossless = true
  readonly streamable = false
  readonly supportedChannels = new Set<3 | 4>([3])
  readonly preservesAlpha = false
  readonly maxBpp = 3 as const
  async write(): Promise<void> { throw new Error(ERR) }
  async readFile(): Promise<SurfacePixels> { throw new Error(ERR) }
  async readBuffer(): Promise<SurfacePixels> { throw new Error(ERR) }
}
```

Note: `SurfaceId` is currently typed as `ImageFormat | 'png-stream'`. The cast to `'null' as SurfaceId` is intentional — `NullSurface` is never registered in `surfaceRegistry` (it lives only on `SidechunkAlgorithm.surface`), so the cast does no harm. If TypeScript strict mode rejects the cast, change `id` to `'png'` instead — the field is unused in the sidechunk path.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @tokenpack/core test tests/algorithms/sidechunk/stubs.test.ts`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/algorithms/sidechunk/stubs.ts \
        packages/core/tests/algorithms/sidechunk/stubs.test.ts
git commit -m "feat(core): add sidechunk algorithm stubs (NoopCodec/NoopDrawer/NullSurface)"
```

---

### Task 2: Define `SidechunkSurface` interface + `DecorationConfig` type

**Files:**
- Create: `packages/core/src/surfaces/sidechunk-surface.ts`

This is a type-only addition, no tests.

- [ ] **Step 1: Create the interface file**

`packages/core/src/surfaces/sidechunk-surface.ts`:
```ts
import type { ImageFormat } from '../types'

export type DecorationKind = 'placeholder' | 'gradient' | 'data-art'

export interface DecorationConfig {
  kind: DecorationKind
  /** Pixel size of the decoration image (width and height — square). */
  size: number
  /** RGB triple. Used by 'placeholder' (solid fill) and 'gradient' (start color). */
  colorFrom: [number, number, number]
  /** RGB triple. Used by 'gradient' (end color). Ignored by 'placeholder'. */
  colorTo: [number, number, number]
  /** Pre-rendered pixels passed by the algorithm when kind === 'data-art'. */
  dataArtPixels?: {
    pixels: Uint8Array
    width: number
    height: number
    fileChannels: 3 | 4
  }
}

export interface SidechunkSurface {
  readonly id: 'png-sidechunk' | 'webp-sidechunk' | 'avif-sidechunk'
  readonly format: ImageFormat
  readonly extension: string
  readonly mimeType: string
  /** Writes a valid image carrying `data` as a custom chunk + decoration as visible pixels. */
  writeData(filePath: string, data: Uint8Array, decoration: DecorationConfig): Promise<void>
  /** Extracts the custom-chunk bytes from an artifact buffer. Throws if marker missing. */
  readData(buffer: Buffer): Promise<Uint8Array>
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `yarn workspace @tokenpack/core build`
Expected: SUCCESS — no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/surfaces/sidechunk-surface.ts
git commit -m "feat(core): add SidechunkSurface interface and DecorationConfig type"
```

---

### Task 3: Decoration renderer (`renderDecoration`)

**Files:**
- Create: `packages/core/src/surfaces/decoration-renderer.ts`
- Test: `packages/core/tests/surfaces/decoration-renderer.test.ts`

Returns `SurfacePixels` ready to hand to a normal image encoder. Pure function, env-neutral.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/surfaces/decoration-renderer.test.ts`:
```ts
import { describe, expect, it } from 'vitest'

import { renderDecoration } from '../../src/surfaces/decoration-renderer'
import type { DecorationConfig } from '../../src/surfaces/sidechunk-surface'

describe('renderDecoration', () => {
  it('placeholder fills with colorFrom', () => {
    const cfg: DecorationConfig = {
      kind: 'placeholder',
      size: 4,
      colorFrom: [10, 20, 30],
      colorTo: [0, 0, 0],
    }
    const out = renderDecoration(cfg)
    expect(out.width).toBe(4)
    expect(out.height).toBe(4)
    expect(out.fileChannels).toBe(3)
    expect(out.pixels.length).toBe(4 * 4 * 3)
    for (let i = 0; i < out.pixels.length; i += 3) {
      expect(out.pixels[i]).toBe(10)
      expect(out.pixels[i + 1]).toBe(20)
      expect(out.pixels[i + 2]).toBe(30)
    }
  })

  it('gradient interpolates left-to-right', () => {
    const cfg: DecorationConfig = {
      kind: 'gradient',
      size: 4,
      colorFrom: [0, 0, 0],
      colorTo: [255, 0, 0],
    }
    const out = renderDecoration(cfg)
    // Top-left pixel ≈ from
    expect(out.pixels[0]).toBe(0)
    // Top-right pixel ≈ to
    const lastIdx = (4 - 1) * 3
    expect(out.pixels[lastIdx]).toBeGreaterThan(150)
  })

  it('data-art returns the provided pixels verbatim', () => {
    const dataArt = {
      pixels: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      width: 2,
      height: 2,
      fileChannels: 3 as const,
    }
    const cfg: DecorationConfig = {
      kind: 'data-art',
      size: 0, // ignored
      colorFrom: [0, 0, 0],
      colorTo: [0, 0, 0],
      dataArtPixels: dataArt,
    }
    const out = renderDecoration(cfg)
    expect(out.width).toBe(2)
    expect(out.height).toBe(2)
    expect(Array.from(out.pixels)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('data-art throws when dataArtPixels missing', () => {
    const cfg: DecorationConfig = {
      kind: 'data-art',
      size: 0,
      colorFrom: [0, 0, 0],
      colorTo: [0, 0, 0],
    }
    expect(() => renderDecoration(cfg)).toThrowError(/dataArtPixels/)
  })

  it('placeholder size=1 produces 1×1 image', () => {
    const out = renderDecoration({
      kind: 'placeholder', size: 1, colorFrom: [128, 64, 32], colorTo: [0, 0, 0],
    })
    expect(out.width).toBe(1)
    expect(out.height).toBe(1)
    expect(Array.from(out.pixels)).toEqual([128, 64, 32])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/core test tests/surfaces/decoration-renderer.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Write minimal implementation**

`packages/core/src/surfaces/decoration-renderer.ts`:
```ts
import type { SurfacePixels } from './types'
import type { DecorationConfig } from './sidechunk-surface'

export function renderDecoration(cfg: DecorationConfig): SurfacePixels {
  if (cfg.kind === 'data-art') {
    if (!cfg.dataArtPixels) {
      throw new Error('renderDecoration: dataArtPixels required when kind === "data-art"')
    }
    const { pixels, width, height, fileChannels } = cfg.dataArtPixels
    return { pixels, width, height, fileChannels }
  }

  const size = Math.max(1, cfg.size | 0)
  const fileChannels: 3 = 3
  const pixels = new Uint8Array(size * size * 3)

  if (cfg.kind === 'placeholder') {
    const [r, g, b] = cfg.colorFrom
    for (let i = 0; i < size * size; i++) {
      pixels[i * 3] = r
      pixels[i * 3 + 1] = g
      pixels[i * 3 + 2] = b
    }
    return { pixels, width: size, height: size, fileChannels }
  }

  // gradient — left-to-right interpolation
  const [r0, g0, b0] = cfg.colorFrom
  const [r1, g1, b1] = cfg.colorTo
  const denom = size > 1 ? size - 1 : 1
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = x / denom
      const idx = (y * size + x) * 3
      pixels[idx] = Math.round(r0 + (r1 - r0) * t)
      pixels[idx + 1] = Math.round(g0 + (g1 - g0) * t)
      pixels[idx + 2] = Math.round(b0 + (b1 - b0) * t)
    }
  }
  return { pixels, width: size, height: size, fileChannels }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @tokenpack/core test tests/surfaces/decoration-renderer.test.ts`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/surfaces/decoration-renderer.ts \
        packages/core/tests/surfaces/decoration-renderer.test.ts
git commit -m "feat(core): add decoration renderer (placeholder/gradient/data-art)"
```

---

### Task 4: PNG sidechunk surface

**Files:**
- Create: `packages/node/src/surfaces/png-sidechunk.ts`
- Test: `packages/node/tests/surfaces/png-sidechunk.test.ts`

Implements `SidechunkSurface`. Encodes a normal PNG via `pngjs`, then splices in a `tpAK` ancillary chunk before the first IDAT. Decodes by scanning chunk headers for `tpAK`.

PNG chunk structure: `[4-byte length BE][4-byte type ASCII][data][4-byte CRC32 BE]`. CRC covers `type + data`. PNG signature is 8 bytes (`89 50 4E 47 0D 0A 1A 0A`). Chunks must come after the signature, in order, ending with `IEND`. `IHDR` is always first.

- [ ] **Step 1: Write the failing test**

`packages/node/tests/surfaces/png-sidechunk.test.ts`:
```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { renderDecoration } from 'tokenpack/surfaces/decoration-renderer'
import { PngSidechunkSurface } from '../../src/surfaces/png-sidechunk'

describe('PngSidechunkSurface', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tp-png-sidechunk-'))
  })
  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it('writeData + readData round-trip', async () => {
    const surface = new PngSidechunkSurface()
    const data = new Uint8Array(1024)
    for (let i = 0; i < data.length; i++) data[i] = i & 0xff
    const decoration = {
      kind: 'placeholder' as const,
      size: 8,
      colorFrom: [200, 100, 50] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    const out = join(dir, 'roundtrip.png')
    await surface.writeData(out, data, decoration)
    const buf = await readFile(out)
    const recovered = await surface.readData(buf)
    expect(recovered.length).toBe(data.length)
    expect(Array.from(recovered)).toEqual(Array.from(data))
  })

  it('produces a valid PNG (magic bytes + IHDR + IEND)', async () => {
    const surface = new PngSidechunkSurface()
    const data = new Uint8Array(8)
    const decoration = {
      kind: 'placeholder' as const,
      size: 4,
      colorFrom: [0, 0, 0] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    const out = join(dir, 'valid.png')
    await surface.writeData(out, data, decoration)
    const buf = await readFile(out)
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    for (let i = 0; i < 8; i++) expect(buf[i]).toBe(sig[i])
    expect(buf.toString('ascii', 12, 16)).toBe('IHDR')
    expect(buf.toString('ascii', buf.length - 8, buf.length - 4)).toBe('IEND')
  })

  it('readData throws when no tpAK chunk present', async () => {
    const surface = new PngSidechunkSurface()
    const decoration = {
      kind: 'placeholder' as const,
      size: 1,
      colorFrom: [0, 0, 0] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    // Render a normal PNG by skipping writeData and using pngjs directly via renderDecoration
    const pixels = renderDecoration(decoration)
    // Use the existing PngSurface (not sidechunk) to write a PNG without tpAK
    const { PngSurface } = await import('../../src/surfaces/png')
    const plainSurface = new PngSurface()
    const out = join(dir, 'plain.png')
    await plainSurface.write(out, pixels)
    const buf = await readFile(out)
    await expect(surface.readData(buf)).rejects.toThrowError(/tpAK/i)
  })

  it('handles a 1×1 placeholder (smallest decoration)', async () => {
    const surface = new PngSidechunkSurface()
    const data = new Uint8Array([1, 2, 3, 4, 5])
    const decoration = {
      kind: 'placeholder' as const,
      size: 1,
      colorFrom: [255, 255, 255] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    const out = join(dir, 'tiny.png')
    await surface.writeData(out, data, decoration)
    const buf = await readFile(out)
    const recovered = await surface.readData(buf)
    expect(Array.from(recovered)).toEqual([1, 2, 3, 4, 5])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/node test tests/surfaces/png-sidechunk.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Write minimal implementation**

`packages/node/src/surfaces/png-sidechunk.ts`:
```ts
import fs from 'node:fs'
import { PNG } from 'pngjs'

import { renderDecoration } from 'tokenpack/surfaces/decoration-renderer'
import type {
  DecorationConfig,
  SidechunkSurface,
} from 'tokenpack/surfaces/sidechunk-surface'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const TPAK_TYPE = Buffer.from('tpAK', 'ascii')

// CRC32 — IEEE 802.3 polynomial, same as PNG spec.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function buildChunk(type: Buffer, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([type, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([length, type, data, crc])
}

function packRgba(target: Buffer, pixels: Uint8Array, n: number, fileChannels: 3 | 4): void {
  if (fileChannels === 4) {
    for (let i = 0; i < n; i++) {
      target[i * 4] = pixels[i * 4]
      target[i * 4 + 1] = pixels[i * 4 + 1]
      target[i * 4 + 2] = pixels[i * 4 + 2]
      target[i * 4 + 3] = pixels[i * 4 + 3]
    }
    return
  }
  for (let i = 0; i < n; i++) {
    target[i * 4] = pixels[i * 3]
    target[i * 4 + 1] = pixels[i * 3 + 1]
    target[i * 4 + 2] = pixels[i * 3 + 2]
    target[i * 4 + 3] = 255
  }
}

function renderPngBytes(decoration: DecorationConfig): Buffer {
  const image = renderDecoration(decoration)
  const png = new PNG({ width: image.width, height: image.height, filterType: -1 })
  png.data = Buffer.alloc(image.width * image.height * 4)
  packRgba(png.data, image.pixels, image.width * image.height, image.fileChannels)
  return PNG.sync.write(png, { colorType: image.fileChannels === 4 ? 6 : 2, inputColorType: 6 })
}

/**
 * Insert a `tpAK` chunk into a PNG byte buffer, immediately after the IHDR chunk.
 * Returns the new buffer; original is not modified.
 */
function insertTpakChunk(pngBytes: Buffer, data: Uint8Array): Buffer {
  // PNG signature is 8 bytes; IHDR is always the first chunk and is 25 bytes total
  // (4 length + 4 type + 13 data + 4 crc). Insert after byte 33.
  const ihdrEnd = 8 + 25
  const dataBuf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  const chunk = buildChunk(TPAK_TYPE, dataBuf)
  return Buffer.concat([
    pngBytes.subarray(0, ihdrEnd),
    chunk,
    pngBytes.subarray(ihdrEnd),
  ])
}

/**
 * Scans chunks and returns the data bytes of the first `tpAK` chunk found.
 * Throws if none.
 */
function extractTpakChunk(pngBytes: Buffer): Buffer {
  if (pngBytes.length < 8 || !pngBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG (missing signature)')
  }
  let pos = 8
  while (pos + 8 <= pngBytes.length) {
    const length = pngBytes.readUInt32BE(pos)
    const type = pngBytes.subarray(pos + 4, pos + 8).toString('ascii')
    const dataStart = pos + 8
    const dataEnd = dataStart + length
    if (type === 'tpAK') {
      return Buffer.from(pngBytes.subarray(dataStart, dataEnd))
    }
    if (type === 'IEND') break
    pos = dataEnd + 4 // advance past CRC
  }
  throw new Error('no tpAK chunk found in PNG')
}

export class PngSidechunkSurface implements SidechunkSurface {
  readonly id = 'png-sidechunk' as const
  readonly format = 'png' as const
  readonly extension = '.png'
  readonly mimeType = 'image/png'

  async writeData(filePath: string, data: Uint8Array, decoration: DecorationConfig): Promise<void> {
    const pngBytes = renderPngBytes(decoration)
    const withChunk = insertTpakChunk(pngBytes, data)
    fs.writeFileSync(filePath, withChunk)
  }

  async readData(buffer: Buffer): Promise<Uint8Array> {
    const data = extractTpakChunk(buffer)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @tokenpack/node test tests/surfaces/png-sidechunk.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/node/src/surfaces/png-sidechunk.ts \
        packages/node/tests/surfaces/png-sidechunk.test.ts
git commit -m "feat(node): add PNG sidechunk surface (tpAK custom chunk)"
```

---

### Task 5: WebP sidechunk surface

**Files:**
- Create: `packages/node/src/surfaces/webp-sidechunk.ts`
- Test: `packages/node/tests/surfaces/webp-sidechunk.test.ts`

WebP is a RIFF container. Structure: `RIFF<u32 LE length>WEBP<chunks>`. Each chunk: `<4-char FourCC><u32 LE length><data>` plus optional 1-byte pad if length is odd. We render via `sharp`, then post-process: insert a `TPAK` chunk before EOF, and update the outer `RIFF` length.

- [ ] **Step 1: Write the failing test**

`packages/node/tests/surfaces/webp-sidechunk.test.ts`:
```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { WebpSidechunkSurface } from '../../src/surfaces/webp-sidechunk'

describe('WebpSidechunkSurface', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tp-webp-sidechunk-'))
  })
  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it('writeData + readData round-trip', async () => {
    const surface = new WebpSidechunkSurface()
    const data = new Uint8Array(2048)
    for (let i = 0; i < data.length; i++) data[i] = (i * 7) & 0xff
    const decoration = {
      kind: 'gradient' as const,
      size: 16,
      colorFrom: [255, 0, 0] as [number, number, number],
      colorTo: [0, 0, 255] as [number, number, number],
    }
    const out = join(dir, 'roundtrip.webp')
    await surface.writeData(out, data, decoration)
    const buf = await readFile(out)
    const recovered = await surface.readData(buf)
    expect(recovered.length).toBe(data.length)
    expect(Array.from(recovered)).toEqual(Array.from(data))
  })

  it('produces a valid WebP (RIFF + WEBP magic)', async () => {
    const surface = new WebpSidechunkSurface()
    const decoration = {
      kind: 'placeholder' as const,
      size: 4,
      colorFrom: [128, 128, 128] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    const out = join(dir, 'valid.webp')
    await surface.writeData(out, new Uint8Array(16), decoration)
    const buf = await readFile(out)
    expect(buf.subarray(0, 4).toString('ascii')).toBe('RIFF')
    expect(buf.subarray(8, 12).toString('ascii')).toBe('WEBP')
  })

  it('outer RIFF length matches actual file body length', async () => {
    const surface = new WebpSidechunkSurface()
    const decoration = {
      kind: 'placeholder' as const,
      size: 2,
      colorFrom: [0, 0, 0] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    const out = join(dir, 'length-check.webp')
    await surface.writeData(out, new Uint8Array(64), decoration)
    const buf = await readFile(out)
    const declaredLength = buf.readUInt32LE(4)
    // RIFF length excludes the first 8 bytes (RIFF + length field itself)
    expect(declaredLength).toBe(buf.length - 8)
  })

  it('readData throws when TPAK chunk missing', async () => {
    const surface = new WebpSidechunkSurface()
    const { WebpSurface } = await import('../../src/surfaces/webp')
    const plain = new WebpSurface()
    const out = join(dir, 'plain.webp')
    await plain.write(out, {
      pixels: new Uint8Array([0, 0, 0, 255, 255, 255]),
      width: 1,
      height: 2,
      fileChannels: 3,
    })
    const buf = await readFile(out)
    await expect(surface.readData(buf)).rejects.toThrowError(/TPAK/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/node test tests/surfaces/webp-sidechunk.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Write minimal implementation**

`packages/node/src/surfaces/webp-sidechunk.ts`:
```ts
import fs from 'node:fs'
import sharp from 'sharp'

import { renderDecoration } from 'tokenpack/surfaces/decoration-renderer'
import type {
  DecorationConfig,
  SidechunkSurface,
} from 'tokenpack/surfaces/sidechunk-surface'

const TPAK_FOURCC = Buffer.from('TPAK', 'ascii')

async function renderWebpBytes(decoration: DecorationConfig): Promise<Buffer> {
  const image = renderDecoration(decoration)
  return sharp(Buffer.from(image.pixels.buffer, image.pixels.byteOffset, image.pixels.byteLength), {
    raw: { width: image.width, height: image.height, channels: image.fileChannels },
  })
    .webp({ lossless: true, quality: 100 })
    .toBuffer()
}

/**
 * Append a TPAK chunk before EOF and update the outer RIFF length.
 * RIFF chunk structure: <FourCC 4><u32 LE length><data>[<u8 pad if odd>].
 */
function insertTpakChunk(webpBytes: Buffer, data: Uint8Array): Buffer {
  if (webpBytes.subarray(0, 4).toString('ascii') !== 'RIFF') {
    throw new Error('not a WebP (missing RIFF header)')
  }
  if (webpBytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error('not a WebP (missing WEBP marker)')
  }
  const dataLen = data.length
  const padded = dataLen % 2 === 1 ? 1 : 0
  const chunkSize = 4 + 4 + dataLen + padded
  const chunk = Buffer.alloc(chunkSize)
  TPAK_FOURCC.copy(chunk, 0)
  chunk.writeUInt32LE(dataLen, 4)
  Buffer.from(data.buffer, data.byteOffset, data.byteLength).copy(chunk, 8)
  // pad byte already zero from Buffer.alloc
  const out = Buffer.concat([webpBytes, chunk])
  out.writeUInt32LE(out.length - 8, 4) // update RIFF length (file size minus 'RIFF' + length field)
  return out
}

function extractTpakChunk(webpBytes: Buffer): Buffer {
  if (webpBytes.subarray(0, 4).toString('ascii') !== 'RIFF') {
    throw new Error('not a WebP (missing RIFF header)')
  }
  let pos = 12
  while (pos + 8 <= webpBytes.length) {
    const fourcc = webpBytes.subarray(pos, pos + 4).toString('ascii')
    const len = webpBytes.readUInt32LE(pos + 4)
    const dataStart = pos + 8
    const dataEnd = dataStart + len
    if (fourcc === 'TPAK') return Buffer.from(webpBytes.subarray(dataStart, dataEnd))
    pos = dataEnd + (len % 2 === 1 ? 1 : 0)
  }
  throw new Error('no TPAK chunk found in WebP')
}

export class WebpSidechunkSurface implements SidechunkSurface {
  readonly id = 'webp-sidechunk' as const
  readonly format = 'webp' as const
  readonly extension = '.webp'
  readonly mimeType = 'image/webp'

  async writeData(filePath: string, data: Uint8Array, decoration: DecorationConfig): Promise<void> {
    const webpBytes = await renderWebpBytes(decoration)
    const withChunk = insertTpakChunk(webpBytes, data)
    fs.writeFileSync(filePath, withChunk)
  }

  async readData(buffer: Buffer): Promise<Uint8Array> {
    const data = extractTpakChunk(buffer)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @tokenpack/node test tests/surfaces/webp-sidechunk.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/node/src/surfaces/webp-sidechunk.ts \
        packages/node/tests/surfaces/webp-sidechunk.test.ts
git commit -m "feat(node): add WebP sidechunk surface (TPAK RIFF chunk)"
```

---

### Task 6: AVIF sidechunk surface (with feasibility gate)

**Files:**
- Create: `packages/node/src/surfaces/avif-sidechunk.ts`
- Test: `packages/node/tests/surfaces/avif-sidechunk.test.ts`

AVIF uses ISO Base Media File Format (ISO BMFF) — same box structure as MP4. Adding a custom HEIF item that survives sharp's output is non-trivial. **Strategy for v1: spike a simpler approach — append a custom `tpak` top-level box at the END of the file.**

ISO BMFF box structure: `<u32 BE size><4-char type><data>`. Players ignore unknown top-level boxes outside the moov/meta hierarchy. Sharp produces an `ftyp` + `meta` + `mdat` (and friends) sequence; our custom box appended at the end won't break decode and is locatable by box-walking.

If post-processing turns out to corrupt sharp's AVIF output in your environment, follow the fallback in Step 4.

- [ ] **Step 1: Write the failing test**

`packages/node/tests/surfaces/avif-sidechunk.test.ts`:
```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AvifSidechunkSurface } from '../../src/surfaces/avif-sidechunk'

describe('AvifSidechunkSurface', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tp-avif-sidechunk-'))
  })
  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it('writeData + readData round-trip', async () => {
    const surface = new AvifSidechunkSurface()
    const data = new Uint8Array(1024)
    for (let i = 0; i < data.length; i++) data[i] = (i * 11) & 0xff
    const decoration = {
      kind: 'gradient' as const,
      size: 16,
      colorFrom: [10, 200, 30] as [number, number, number],
      colorTo: [200, 10, 200] as [number, number, number],
    }
    const out = join(dir, 'roundtrip.avif')
    await surface.writeData(out, data, decoration)
    const buf = await readFile(out)
    const recovered = await surface.readData(buf)
    expect(recovered.length).toBe(data.length)
    expect(Array.from(recovered)).toEqual(Array.from(data))
  })

  it('produces a valid AVIF (ftyp box first)', async () => {
    const surface = new AvifSidechunkSurface()
    const decoration = {
      kind: 'placeholder' as const,
      size: 4,
      colorFrom: [0, 0, 0] as [number, number, number],
      colorTo: [0, 0, 0] as [number, number, number],
    }
    const out = join(dir, 'valid.avif')
    await surface.writeData(out, new Uint8Array(16), decoration)
    const buf = await readFile(out)
    // First 4 bytes are box size, next 4 are box type — should be 'ftyp'
    expect(buf.subarray(4, 8).toString('ascii')).toBe('ftyp')
  })

  it('readData throws when tpak box missing', async () => {
    const surface = new AvifSidechunkSurface()
    const { AvifSurface } = await import('../../src/surfaces/avif')
    const plain = new AvifSurface()
    const out = join(dir, 'plain.avif')
    await plain.write(out, {
      pixels: new Uint8Array([0, 0, 0, 255, 255, 255]),
      width: 1,
      height: 2,
      fileChannels: 3,
    })
    const buf = await readFile(out)
    await expect(surface.readData(buf)).rejects.toThrowError(/tpak/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/node test tests/surfaces/avif-sidechunk.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Write minimal implementation**

`packages/node/src/surfaces/avif-sidechunk.ts`:
```ts
import fs from 'node:fs'
import sharp from 'sharp'

import { renderDecoration } from 'tokenpack/surfaces/decoration-renderer'
import type {
  DecorationConfig,
  SidechunkSurface,
} from 'tokenpack/surfaces/sidechunk-surface'

const TPAK_BOX_TYPE = Buffer.from('tpak', 'ascii')

async function renderAvifBytes(decoration: DecorationConfig): Promise<Buffer> {
  const image = renderDecoration(decoration)
  return sharp(Buffer.from(image.pixels.buffer, image.pixels.byteOffset, image.pixels.byteLength), {
    raw: { width: image.width, height: image.height, channels: image.fileChannels },
  })
    .avif({ lossless: true, quality: 100 })
    .toBuffer()
}

/** Append a custom `tpak` ISO BMFF box at the end. Box: <u32 BE size><4-char type><data>. */
function appendTpakBox(avifBytes: Buffer, data: Uint8Array): Buffer {
  const dataBuf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  const boxSize = 8 + dataBuf.length
  const box = Buffer.alloc(boxSize)
  box.writeUInt32BE(boxSize, 0)
  TPAK_BOX_TYPE.copy(box, 4)
  dataBuf.copy(box, 8)
  return Buffer.concat([avifBytes, box])
}

function extractTpakBox(avifBytes: Buffer): Buffer {
  let pos = 0
  while (pos + 8 <= avifBytes.length) {
    const size = avifBytes.readUInt32BE(pos)
    if (size < 8) throw new Error(`invalid box size ${size} at ${pos}`)
    const type = avifBytes.subarray(pos + 4, pos + 8).toString('ascii')
    if (type === 'tpak') {
      return Buffer.from(avifBytes.subarray(pos + 8, pos + size))
    }
    pos += size
  }
  throw new Error('no tpak box found in AVIF')
}

export class AvifSidechunkSurface implements SidechunkSurface {
  readonly id = 'avif-sidechunk' as const
  readonly format = 'avif' as const
  readonly extension = '.avif'
  readonly mimeType = 'image/avif'

  async writeData(filePath: string, data: Uint8Array, decoration: DecorationConfig): Promise<void> {
    const avifBytes = await renderAvifBytes(decoration)
    const withBox = appendTpakBox(avifBytes, data)
    fs.writeFileSync(filePath, withBox)
  }

  async readData(buffer: Buffer): Promise<Uint8Array> {
    const data = extractTpakBox(buffer)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
}
```

**Fallback if Step 4 fails (corruption):** image viewers may reject the modified file. If the round-trip test in Step 4 fails with a "not a valid AVIF" error from sharp/imagemagick during verification — but the box-walking still recovers the data — the format-correctness test (`'produces a valid AVIF'`) still passes since we only inspect the `ftyp` prefix. If even basic sharp re-decode breaks, drop AVIF from v1: delete this surface file and its test, and gate the format option in Task 11 to `['png', 'webp']` only.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @tokenpack/node test tests/surfaces/avif-sidechunk.test.ts`
Expected: PASS — all 3 tests green. If the round-trip test fails, follow the fallback above.

- [ ] **Step 5: Commit**

```bash
git add packages/node/src/surfaces/avif-sidechunk.ts \
        packages/node/tests/surfaces/avif-sidechunk.test.ts
git commit -m "feat(node): add AVIF sidechunk surface (tpak custom box)"
```

---

### Task 7: SidechunkAlgorithm class

**Files:**
- Create: `packages/core/src/algorithms/sidechunk/sidechunk-algorithm.ts`
- Create: `packages/core/src/algorithms/sidechunk/index.ts`

The algorithm holds its own `dataSurfaces` map (keyed by ImageFormat). It exposes the standard `AbstractAlgorithm` API. Its `encode` / `decode` bypass codec/drawer/surface — instead they call `pack-format/encodePack` and `pack-format/decodePack` directly, then route bytes through `dataSurfaces[format]`.

For v1 we keep `encodeBytes` / `decodeBytes` simple (throw "use encode/decode" — the byte-level API doesn't naturally fit when output is a multi-format image, not a raw pixel chunk). This makes sidechunk node-only for now, matching the spec.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/algorithms/sidechunk-algorithm.test.ts`:
```ts
import { describe, expect, it } from 'vitest'

import { SidechunkAlgorithm } from '../../src/algorithms/sidechunk'
import type { SidechunkSurface } from '../../src/surfaces/sidechunk-surface'
import type { CompressRawResult } from '../../src/compressors'

class FakeSurface implements SidechunkSurface {
  readonly id = 'png-sidechunk' as const
  readonly format = 'png' as const
  readonly extension = '.png'
  readonly mimeType = 'image/png'
  store = new Map<string, Uint8Array>()
  async writeData(filePath: string, data: Uint8Array): Promise<void> {
    this.store.set(filePath, new Uint8Array(data))
  }
  async readData(buffer: Buffer): Promise<Uint8Array> {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  }
}

const noopCompress = async (bytes: Uint8Array): Promise<CompressRawResult> => ({
  bytes: new Uint8Array(bytes),
  compressor: 'none',
  level: 0,
  originalSize: bytes.length,
})
const noopDecompress = async (bytes: Uint8Array): Promise<Uint8Array> => bytes

describe('SidechunkAlgorithm', () => {
  it('exposes the expected metadata', () => {
    const surface = new FakeSurface()
    const algo = new SidechunkAlgorithm({
      dataSurfaces: { png: surface, webp: surface, avif: surface },
      compress: noopCompress,
      decompress: noopDecompress,
    })
    expect(algo.id).toBe(100)
    expect(algo.name).toBe('sidechunk')
    expect(algo.title).toBe('Sidechunk Pack')
  })

  it('round-trips multiple files through encodePack/decodePack', async () => {
    const surface = new FakeSurface()
    const algo = new SidechunkAlgorithm({
      dataSurfaces: { png: surface, webp: surface, avif: surface },
      compress: noopCompress,
      decompress: noopDecompress,
    })
    // The algorithm's encode signature is fs-flavored. Test the pure helper directly.
    const entries = [
      { path: 'a.txt', bytes: new TextEncoder().encode('hello') },
      { path: 'b.json', bytes: new TextEncoder().encode('{"x":1}') },
    ]
    const packBytes = await algo.encodeEntries(entries)
    const decoded = await algo.decodeEntries(packBytes)
    expect(decoded).toHaveLength(2)
    expect(decoded[0].path).toBe('a.txt')
    expect(new TextDecoder().decode(decoded[0].bytes)).toBe('hello')
    expect(decoded[1].path).toBe('b.json')
    expect(new TextDecoder().decode(decoded[1].bytes)).toBe('{"x":1}')
  })

  it('encodeBytes / decodeBytes throw (not supported in v1)', async () => {
    const surface = new FakeSurface()
    const algo = new SidechunkAlgorithm({
      dataSurfaces: { png: surface, webp: surface, avif: surface },
      compress: noopCompress,
      decompress: noopDecompress,
    })
    await expect(algo.encodeBytes(new Uint8Array(), { out: 'x' } as never)).rejects.toThrowError(/encodeBytes/)
    await expect(algo.decodeBytes([])).rejects.toThrowError(/decodeBytes/)
  })

  it('toCatalogEntry returns a node-only entry', () => {
    const surface = new FakeSurface()
    const algo = new SidechunkAlgorithm({
      dataSurfaces: { png: surface, webp: surface, avif: surface },
      compress: noopCompress,
      decompress: noopDecompress,
    })
    const entry = algo.toCatalogEntry()
    expect(entry.id).toBe(100)
    expect(entry.name).toBe('sidechunk')
    expect(entry.capabilities.environments).toEqual(['node'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/core test tests/algorithms/sidechunk-algorithm.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`packages/core/src/algorithms/sidechunk/sidechunk-algorithm.ts`:
```ts
import type { PackEntry } from '../../archive-buffers'
import type { CompressRawResult } from '../../compressors'
import { encodePack } from '../../pack-format/encode-pack'
import { decodePack } from '../../pack-format/decode-pack'
import type { SidechunkSurface, DecorationConfig } from '../../surfaces/sidechunk-surface'
import type { SurfacePixels } from '../../surfaces/types'
import type { EncodeOptions, ImageFormat } from '../../types'
import { AbstractAlgorithm, type AlgorithmCapabilities, type AlgorithmCatalogEntry, type AlgorithmOption } from '../types'

import { NoopCodec, NoopDrawer, NullSurface } from './stubs'

export const SIDECHUNK_ALGO_ID = 100
export const SIDECHUNK_ALGO_NAME = 'sidechunk'

export type CompressFn = (bytes: Uint8Array) => Promise<CompressRawResult>
export type DecompressFn = (
  bytes: Uint8Array,
  meta: { compressor: string; level: number; originalSize: number },
) => Promise<Uint8Array>

export interface SidechunkAlgorithmInit {
  dataSurfaces: Record<ImageFormat, SidechunkSurface>
  compress: CompressFn
  decompress: DecompressFn
}

export interface SidechunkEncodeOptions extends Omit<EncodeOptions, 'algo'> {
  decoration?: DecorationConfig
}

const noopCompressorFromInit = {
  id: 'none',
  label: 'none',
  headerLevel: 0,
  streamableDecode: false,
  requiresFullHeader: false,
  async compress(buf: Buffer) {
    return { data: buf, level: 0, uncompressedLength: 0 }
  },
  async decompress(buf: Buffer) {
    return buf
  },
} as never

export class SidechunkAlgorithm extends AbstractAlgorithm {
  readonly id = SIDECHUNK_ALGO_ID
  readonly name = SIDECHUNK_ALGO_NAME
  readonly title = 'Sidechunk Pack'
  readonly description = 'Pack data in custom image chunk; pixels are decoration'
  readonly codec = new NoopCodec()
  readonly drawer = new NoopDrawer()
  readonly compressor = noopCompressorFromInit
  readonly surface = new NullSurface()
  readonly capabilities: AlgorithmCapabilities = {
    streamable: false,
    decodeOnFlight: false,
    browserFriendly: false,
    nodeOnly: true,
    environments: ['node'],
  }
  readonly options: AlgorithmOption[] = [
    { name: 'compressionMode', label: 'Compression', type: 'select', defaultValue: 'brotli-11',
      values: ['none', 'deflate-1', 'deflate-6', 'deflate-9', 'brotli-4', 'brotli-6', 'brotli-11'] },
    { name: 'format', label: 'Surface', type: 'select', defaultValue: 'png',
      values: ['png', 'webp', 'avif'] },
    { name: 'decoration', label: 'Decoration', type: 'select', defaultValue: 'gradient',
      values: ['placeholder', 'gradient', 'data-art'] },
    { name: 'decorationSize', label: 'Decoration size', type: 'select', defaultValue: 64,
      values: [1, 64, 128, 256, 512] },
  ]

  private readonly dataSurfaces: Record<ImageFormat, SidechunkSurface>
  private readonly compressFn: CompressFn
  private readonly decompressFn: DecompressFn

  constructor(init: SidechunkAlgorithmInit) {
    super()
    this.dataSurfaces = init.dataSurfaces
    this.compressFn = init.compress
    this.decompressFn = init.decompress
  }

  /** Pure helper exposed for tests + browser-side reuse: pack entries → packBytes. */
  async encodeEntries(entries: readonly PackEntry[]): Promise<Uint8Array> {
    return encodePack(entries, async bytes => {
      const r = await this.compressFn(bytes)
      return { bytes: r.bytes, compressor: r.compressor, level: r.level, originalSize: r.originalSize }
    })
  }

  /** Pure helper: packBytes → entries (decompressed). */
  async decodeEntries(packBytes: Uint8Array): Promise<PackEntry[]> {
    const decoded = decodePack(packBytes)
    const out: PackEntry[] = []
    for (const file of decoded.manifest.files) {
      const region = decoded.extractRegion(file.path)
      const decompressed = await this.decompressFn(region, {
        compressor: file.compressor,
        level: file.level,
        originalSize: file.originalSize,
      })
      out.push({ path: file.path, bytes: decompressed })
    }
    return out
  }

  /** fs-flavored encode: writes a single image to `options.out`. */
  async encode(_input: Buffer, _options: Omit<EncodeOptions, 'algo'>): Promise<string[]> {
    throw new Error(
      'SidechunkAlgorithm.encode requires entries + decoration; use encodeArtifact() from @tokenpack/node',
    )
  }

  async encodeBytes(): Promise<never> {
    throw new Error('SidechunkAlgorithm.encodeBytes is not supported in v1; use encodeEntries() + a sidechunk surface')
  }

  async decodeBytes(_images: SurfacePixels[]): Promise<Buffer> {
    throw new Error('SidechunkAlgorithm.decodeBytes is not supported in v1; use decodeEntries() with chunk bytes from a surface')
  }

  /** Convenience for env-package wrappers — write artifact to disk. */
  async writeArtifact(filePath: string, packBytes: Uint8Array, format: ImageFormat, decoration: DecorationConfig): Promise<void> {
    const surface = this.dataSurfaces[format]
    if (!surface) throw new Error(`SidechunkAlgorithm: no surface registered for format ${format}`)
    await surface.writeData(filePath, packBytes, decoration)
  }

  async readArtifact(buffer: Buffer, format: ImageFormat): Promise<Uint8Array> {
    const surface = this.dataSurfaces[format]
    if (!surface) throw new Error(`SidechunkAlgorithm: no surface registered for format ${format}`)
    return surface.readData(buffer)
  }

  toCatalogEntry(): AlgorithmCatalogEntry {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      description: this.description,
      composition: `sidechunk (no codec/drawer/surface — chunk-stored)`,
      pixelLayout: 'n/a — pixels are decoration',
      writeStyle: 'side-channel chunk',
      dependencies: 'none (Node only)',
      beFriendly: 'yes',
      feFriendly: 'no',
      streamFriendly: 'no',
      approxRatio: 'pack-size + decoration',
      capabilities: this.capabilities,
      options: this.options,
      optionLabels: ['side-channel chunk', 'decoration: placeholder/gradient/data-art'],
    }
  }
}
```

`packages/core/src/algorithms/sidechunk/index.ts`:
```ts
export { SidechunkAlgorithm, SIDECHUNK_ALGO_ID, SIDECHUNK_ALGO_NAME } from './sidechunk-algorithm'
export type { SidechunkAlgorithmInit, SidechunkEncodeOptions, CompressFn, DecompressFn } from './sidechunk-algorithm'
export { NoopCodec, NoopDrawer, NullSurface } from './stubs'
```

- [ ] **Step 4: Run tests**

Run: `yarn workspace @tokenpack/core test tests/algorithms/sidechunk-algorithm.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/algorithms/sidechunk/sidechunk-algorithm.ts \
        packages/core/src/algorithms/sidechunk/index.ts \
        packages/core/tests/algorithms/sidechunk-algorithm.test.ts
git commit -m "feat(core): add SidechunkAlgorithm class"
```

---

### Task 8: Top-level `encodeSidechunk` / `decodeSidechunk` helpers in @tokenpack/node

**Files:**
- Create: `packages/node/src/sidechunk.ts`
- Test: `packages/node/tests/sidechunk-roundtrip.test.ts`
- Modify: `packages/node/src/register.ts` (additive only — register the algorithm)
- Modify: `packages/node/src/index.ts` (re-export new helpers)

These wire the SidechunkAlgorithm to brotli/deflate compressors from @tokenpack/node and to the three node sidechunk surfaces. They're the consumer-facing API for the playground/server.

- [ ] **Step 1: Write the failing test**

`packages/node/tests/sidechunk-roundtrip.test.ts`:
```ts
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { decodeSidechunk, encodeSidechunk, PackBuilder } from '../src'

describe('encodeSidechunk + decodeSidechunk', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tp-sidechunk-roundtrip-'))
  })
  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  it('round-trips a multi-file pack via PNG + placeholder', async () => {
    const builder = new PackBuilder()
      .withFile('a.txt', 'hello a')
      .withFile('nested/b.json', JSON.stringify({ x: 42 }))
    const out = join(dir, 'rt.png')
    await encodeSidechunk(builder, {
      out,
      format: 'png',
      compressionMode: 'brotli-11',
      decoration: { kind: 'placeholder', size: 4, colorFrom: [10, 20, 30], colorTo: [0, 0, 0] },
    })
    const entries = await decodeSidechunk(out)
    expect(entries.map(e => e.path).sort()).toEqual(['a.txt', 'nested/b.json'])
    const a = entries.find(e => e.path === 'a.txt')!
    expect(new TextDecoder().decode(a.bytes)).toBe('hello a')
    const b = entries.find(e => e.path === 'nested/b.json')!
    expect(new TextDecoder().decode(b.bytes)).toBe('{"x":42}')
  })

  it('round-trips through WebP', async () => {
    const builder = new PackBuilder().withFile('x.bin', new Uint8Array([1, 2, 3, 4, 5]))
    const out = join(dir, 'rt.webp')
    await encodeSidechunk(builder, {
      out,
      format: 'webp',
      compressionMode: 'none',
      decoration: { kind: 'gradient', size: 8, colorFrom: [255, 0, 0], colorTo: [0, 0, 255] },
    })
    const entries = await decodeSidechunk(out)
    expect(entries).toHaveLength(1)
    expect(Array.from(entries[0].bytes)).toEqual([1, 2, 3, 4, 5])
  })

  it('algorithmCatalog has sidechunk registered after import', async () => {
    const { algorithmCatalog } = await import('tokenpack/algorithms/catalog')
    expect(() => algorithmCatalog.getByName('sidechunk')).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @tokenpack/node test tests/sidechunk-roundtrip.test.ts`
Expected: FAIL — `decodeSidechunk` / `encodeSidechunk` not exported.

- [ ] **Step 3: Implement the helpers + register the algorithm**

`packages/node/src/sidechunk.ts`:
```ts
import fs from 'node:fs'
import path from 'node:path'

import { compressRaw, decompressRaw } from 'tokenpack/compressors'
import type { ImageFormat } from 'tokenpack/types'
import { SidechunkAlgorithm } from 'tokenpack/algorithms/sidechunk'
import type { DecorationConfig } from 'tokenpack/surfaces/sidechunk-surface'

import { PackBuilder } from 'tokenpack/pack-builder'
import { AvifSidechunkSurface } from './surfaces/avif-sidechunk'
import { PngSidechunkSurface } from './surfaces/png-sidechunk'
import { WebpSidechunkSurface } from './surfaces/webp-sidechunk'

export interface EncodeSidechunkOptions {
  out: string
  format?: ImageFormat
  compressionMode?: string
  decoration?: DecorationConfig
}

const DEFAULT_DECORATION: DecorationConfig = {
  kind: 'gradient',
  size: 64,
  colorFrom: [255, 80, 80],
  colorTo: [80, 80, 255],
}

let cachedAlgo: SidechunkAlgorithm | null = null

export function getSidechunkAlgorithm(): SidechunkAlgorithm {
  if (cachedAlgo) return cachedAlgo
  cachedAlgo = new SidechunkAlgorithm({
    dataSurfaces: {
      png: new PngSidechunkSurface(),
      webp: new WebpSidechunkSurface(),
      avif: new AvifSidechunkSurface(),
    },
    compress: bytes => compressRaw(bytes, 'brotli-11'),
    decompress: async (bytes, meta) =>
      decompressRaw(bytes, meta.compressor, { level: meta.level, uncompressedLength: meta.originalSize }),
  })
  return cachedAlgo
}

export async function encodeSidechunk(
  builder: PackBuilder,
  options: EncodeSidechunkOptions,
): Promise<string> {
  const algo = getSidechunkAlgorithm()
  const compressionMode = options.compressionMode ?? 'brotli-11'
  // Override the algorithm's compress fn for this call (cheap — recreate per call).
  const tunedAlgo = new SidechunkAlgorithm({
    dataSurfaces: (algo as unknown as { dataSurfaces: SidechunkAlgorithm['dataSurfaces' & keyof SidechunkAlgorithm] }).dataSurfaces ?? {
      png: new PngSidechunkSurface(),
      webp: new WebpSidechunkSurface(),
      avif: new AvifSidechunkSurface(),
    },
    compress: bytes => compressRaw(bytes, compressionMode),
    decompress: async (bytes, meta) =>
      decompressRaw(bytes, meta.compressor, { level: meta.level, uncompressedLength: meta.originalSize }),
  })
  const entries = await builder.build()
  const packBytes = await tunedAlgo.encodeEntries(entries)
  const format = options.format ?? 'png'
  await tunedAlgo.writeArtifact(options.out, packBytes, format, options.decoration ?? DEFAULT_DECORATION)
  return options.out
}

export async function decodeSidechunk(filePath: string): Promise<Array<{ path: string; bytes: Uint8Array }>> {
  const algo = getSidechunkAlgorithm()
  const ext = path.extname(filePath).toLowerCase()
  const format: ImageFormat = ext === '.webp' ? 'webp' : ext === '.avif' ? 'avif' : 'png'
  const buf = fs.readFileSync(filePath)
  const packBytes = await algo.readArtifact(buf, format)
  return algo.decodeEntries(packBytes)
}
```

`packages/node/src/register.ts` — add the new lines below to the bottom of the existing file (do not edit existing logic):

```ts
// Sidechunk plugin registration — additive, after existing surfaces/compressors.
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { getSidechunkAlgorithm } from './sidechunk'

try {
  algorithmCatalog.register(getSidechunkAlgorithm())
} catch {
  // already registered (HMR / re-import); ignore — register() is idempotent
}
```

`packages/node/src/index.ts` — add the export below; do not edit existing exports:

```ts
export { encodeSidechunk, decodeSidechunk, getSidechunkAlgorithm } from './sidechunk'
export type { EncodeSidechunkOptions } from './sidechunk'
```

- [ ] **Step 4: Run tests**

Run: `yarn workspace @tokenpack/node test tests/sidechunk-roundtrip.test.ts`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Run all node tests to confirm no regressions**

Run: `yarn workspace @tokenpack/node test`
Expected: PASS — all existing tests still green; new tests added.

- [ ] **Step 6: Commit**

```bash
git add packages/node/src/sidechunk.ts \
        packages/node/src/register.ts \
        packages/node/src/index.ts \
        packages/node/tests/sidechunk-roundtrip.test.ts
git commit -m "feat(node): wire sidechunk algorithm + encodeSidechunk/decodeSidechunk helpers"
```

---

### Task 9: Extend `EncodeConfig` with decoration fields (app)

**Files:**
- Modify: `packages/app/src/components/EncodeForm/types.ts`

Additive — add new fields with defaults that match the spec.

- [ ] **Step 1: Add fields to `EncodeConfig` and `DEFAULT_ENCODE_CONFIG`**

In `packages/app/src/components/EncodeForm/types.ts`, add the three new fields to the `EncodeConfig` interface (after the existing fields, before `key`) and to `DEFAULT_ENCODE_CONFIG`.

```ts
// Add to EncodeConfig:
  decoration: 'placeholder' | 'gradient' | 'data-art'
  decorationSize: 1 | 64 | 128 | 256 | 512

// Add to DEFAULT_ENCODE_CONFIG (just before `key`):
  decoration: 'gradient',
  decorationSize: 64,
```

- [ ] **Step 2: Build app to verify no type errors**

Run: `yarn workspace tokenpack-app typecheck` (or `yarn workspace tokenpack-app build` if no typecheck script exists)
Expected: SUCCESS — no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/components/EncodeForm/types.ts
git commit -m "feat(app): add decoration fields to EncodeConfig"
```

---

### Task 10: `DecorationSection.tsx` component

**Files:**
- Create: `packages/app/src/components/EncodeForm/components/DecorationSection.tsx`

A new section sibling to `AlgorithmSection`/`CompressorSection`/etc. Reuses `Section` + `SelectField` for visual consistency.

- [ ] **Step 1: Create the component**

`packages/app/src/components/EncodeForm/components/DecorationSection.tsx`:
```tsx
'use client'

import type { EncodeConfig } from '../types'
import { Section } from './Section'
import { SelectField } from './SelectField'

interface DecorationSectionProps {
  decoration: EncodeConfig['decoration']
  decorationSize: EncodeConfig['decorationSize']
  onDecorationChange: (v: EncodeConfig['decoration']) => void
  onDecorationSizeChange: (v: EncodeConfig['decorationSize']) => void
}

const DECORATION_OPTIONS = ['placeholder', 'gradient', 'data-art'] as const
const SIZE_OPTIONS = ['1', '64', '128', '256', '512'] as const

export function DecorationSection({
  decoration,
  decorationSize,
  onDecorationChange,
  onDecorationSizeChange,
}: DecorationSectionProps) {
  return (
    <Section
      className="lg:col-span-2"
      description="Visible image content for sidechunk packs. Pack data lives in a side-channel chunk regardless."
      title="Decoration"
    >
      <SelectField
        label="Mode"
        value={decoration}
        values={DECORATION_OPTIONS as unknown as readonly string[]}
        onChange={v => onDecorationChange(v as EncodeConfig['decoration'])}
      />
      <SelectField
        label="Size (pixels)"
        value={String(decorationSize)}
        values={SIZE_OPTIONS as unknown as readonly string[]}
        onChange={v => onDecorationSizeChange(Number(v) as EncodeConfig['decorationSize'])}
      />
    </Section>
  )
}
```

- [ ] **Step 2: Build to verify no type/lint errors**

Run: `yarn workspace tokenpack-app build` (or `lint`)
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/components/EncodeForm/components/DecorationSection.tsx
git commit -m "feat(app): add DecorationSection component"
```

---

### Task 11: Render `DecorationSection` conditionally in EncodeForm

**Files:**
- Modify: `packages/app/src/components/EncodeForm/EncodeForm.tsx` (additive: import + conditional render)

- [ ] **Step 1: Add import + conditional render**

In `packages/app/src/components/EncodeForm/EncodeForm.tsx`:

Add the import (after existing component imports):
```tsx
import { DecorationSection } from './components/DecorationSection'
```

Inside `<Tabs.Panel id="manual">` → `<div className="grid gap-3 lg:grid-cols-2">`, after `FecSection`, add:
```tsx
{value.algo === 'sidechunk' && (
  <DecorationSection
    decoration={value.decoration}
    decorationSize={value.decorationSize}
    onDecorationChange={v => patch('decoration', v)}
    onDecorationSizeChange={v => patch('decorationSize', v)}
  />
)}
```

- [ ] **Step 2: Manual smoke check**

Run: `yarn app` (or `yarn workspace tokenpack-app dev`)
Open: http://localhost:3001
Switch to Manual tab, change algorithm to `sidechunk`. The Decoration section should appear with two selects (Mode, Size). Switching to a non-sidechunk algorithm should hide it.

Expected: section appears/disappears based on algorithm.

- [ ] **Step 3: Commit**

```bash
git add packages/app/src/components/EncodeForm/EncodeForm.tsx
git commit -m "feat(app): conditionally render DecorationSection for sidechunk algorithm"
```

---

### Task 12: Wire sidechunk encode dispatch in `/api/pack`

**Files:**
- Modify: `packages/app/src/app/api/pack/route.ts` (additive branch)

The existing route handles algorithm-driven pack encoding. Add a branch: if `algo === 'sidechunk'`, dispatch to `encodeSidechunk` instead of the existing pixel-based encode.

- [ ] **Step 1: Inspect existing route to find the dispatch point**

Run: `grep -n "encode\|algo\|sidechunk" packages/app/src/app/api/pack/route.ts`
Use this to locate the place after `readEntries` runs (where the existing `encode(...)` call lives) — that's where the new branch goes.

- [ ] **Step 2: Add the sidechunk branch**

In `packages/app/src/app/api/pack/route.ts`, where the existing flow calls `encode(builder, options)` (after assembling `builder` and `resolved`):

Add the import at top:
```ts
import { encodeSidechunk } from '@tokenpack/node'
```

Add a branch BEFORE the existing `encode(...)` call:
```ts
if (resolved.algo === 'sidechunk') {
  const decoration = (form.get('decoration') as string | null) ?? 'gradient'
  const decorationSize = parseInt((form.get('decorationSize') as string | null) ?? '64', 10)
  const fromHex = (form.get('gradientFrom') as string | null) ?? '#ff5050'
  const toHex = (form.get('gradientTo') as string | null) ?? '#5050ff'
  const hexToRgb = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
  ]
  const tmp = path.join(os.tmpdir(), `tp-sc-${Date.now()}.${resolved.format ?? 'png'}`)
  await encodeSidechunk(builder, {
    out: tmp,
    format: (resolved.format ?? 'png') as 'png' | 'webp' | 'avif',
    compressionMode: resolved.compressionMode,
    decoration: {
      kind: decoration as 'placeholder' | 'gradient' | 'data-art',
      size: decorationSize,
      colorFrom: hexToRgb(fromHex),
      colorTo: hexToRgb(toHex),
    },
  })
  const buf = await fs.promises.readFile(tmp)
  await fs.promises.unlink(tmp).catch(() => {})
  // Return the same shape the existing route returns (replace with whatever the existing
  // success-response branch returns — usually a JSON with base64-encoded `bytes` or a
  // binary stream). Match the existing format exactly; do not invent a new response shape.
  return new NextResponse(buf, {
    status: 200,
    headers: { 'Content-Type': `image/${resolved.format ?? 'png'}` },
  })
}
```

If the existing route returns JSON-with-base64 instead of binary, match that shape — do not introduce a new response format. The point is: the branch produces the same output type as the existing pixel-mode branch.

Add `os`/`path`/`fs` imports if not already present:
```ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
```

- [ ] **Step 3: Manual smoke check**

Run: `yarn app`
In the playground: add a small text entry, switch algo to `sidechunk`, click Encode.
Expected: encoding succeeds, result shows in TokenResult panel as a normal image.

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/app/api/pack/route.ts
git commit -m "feat(app): dispatch sidechunk algorithm in /api/pack route"
```

---

### Task 13: Surface sidechunk in `useSmartEncode` form-data builder

**Files:**
- Modify: `packages/app/src/components/BuildToken/hooks/useSmartEncode.ts` OR the form-data builder it calls (`packages/app/src/components/BuildToken/utils/server-encode.ts`)

The browser-side hook needs to send `decoration` and `decorationSize` form fields when sidechunk is selected, plus mark sidechunk as "server-only" so the FE-encode path is skipped.

- [ ] **Step 1: Inspect current form-data assembly**

Run: `grep -n "FormData\|append" packages/app/src/components/BuildToken/utils/server-encode.ts packages/app/src/components/BuildToken/hooks/useSmartEncode.ts`

- [ ] **Step 2: Add sidechunk-aware fields**

In `packages/app/src/components/BuildToken/utils/server-encode.ts` (or wherever `FormData` is assembled), append the decoration fields when `config.algo === 'sidechunk'`:

```ts
if (config.algo === 'sidechunk') {
  formData.append('decoration', config.decoration)
  formData.append('decorationSize', String(config.decorationSize))
  formData.append('gradientFrom', config.gradientFrom)
  formData.append('gradientTo', config.gradientTo)
}
```

In `packages/app/src/components/BuildToken/utils/fe-eligibility.ts`, add a check that disables FE encoding for sidechunk:
```ts
if (config.algo === 'sidechunk') {
  return { ok: false, reason: 'sidechunk requires server' }
}
```

(Place this check at the top of the function, before existing checks.)

- [ ] **Step 3: Manual smoke check**

Run: `yarn app`
Encode a 2-file pack with sidechunk + each decoration mode (placeholder, gradient — `data-art` is OK to defer if not yet wired). Verify download works for each format (png/webp/avif).

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/components/BuildToken/utils/server-encode.ts \
        packages/app/src/components/BuildToken/utils/fe-eligibility.ts
git commit -m "feat(app): send decoration fields for sidechunk encodes; force server path"
```

---

### Task 14: Wire sidechunk decode in Explorer

**Files:**
- Modify: `packages/app/src/components/Explorer/...` (find where decode happens)

The existing decode flow uses the central `decode()` from `@tokenpack/browser` (or via `@tokenpack/node` server-side). For sidechunk artifacts, server-side dispatch needs a parallel branch: detect sidechunk by extension AND by tpAK chunk presence.

- [ ] **Step 1: Locate the decode entry**

Run: `grep -rn "decode\|DecodeSource" packages/app/src/components/Explorer/ packages/app/src/app/api/decode/ 2>/dev/null | head`
Identify where bytes arrive and decode is called.

- [ ] **Step 2: Add sidechunk detection + branch**

If decode happens server-side via an API route, branch on the buffer's first chunk: scan for `tpAK` (PNG) / `TPAK` (WebP) / `tpak` (AVIF) before consulting the standard pixel decoder. If found, call `decodeSidechunk(buffer)` (you may need to expose a buffer-overload of `decodeSidechunk` — extend the signature in `packages/node/src/sidechunk.ts` to accept `Buffer | string`):

```ts
// In packages/node/src/sidechunk.ts — extend decodeSidechunk:
export async function decodeSidechunk(
  source: string | Buffer,
  formatHint?: ImageFormat,
): Promise<Array<{ path: string; bytes: Uint8Array }>> {
  const algo = getSidechunkAlgorithm()
  let buf: Buffer
  let format: ImageFormat
  if (typeof source === 'string') {
    const ext = path.extname(source).toLowerCase()
    format = formatHint ?? (ext === '.webp' ? 'webp' : ext === '.avif' ? 'avif' : 'png')
    buf = fs.readFileSync(source)
  } else {
    buf = source
    format = formatHint ?? detectFormat(buf)
  }
  const packBytes = await algo.readArtifact(buf, format)
  return algo.decodeEntries(packBytes)
}

function detectFormat(buf: Buffer): ImageFormat {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return 'png'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF') return 'webp'
  return 'avif'
}

export function isSidechunkArtifact(buf: Buffer): boolean {
  // Check for tpAK / TPAK / tpak markers in the first few KB.
  const window = buf.subarray(0, Math.min(buf.length, 8192)).toString('binary')
  return window.includes('tpAK') || window.includes('TPAK') || window.includes('tpak')
}
```

In the relevant decode API route (or Explorer-loading component), branch on `isSidechunkArtifact(buffer)` and call `decodeSidechunk(buffer)`. Display entries via the same UI used for normal packs.

- [ ] **Step 3: Manual smoke check**

Run: `yarn app`
Encode a pack with sidechunk. Open it in Explorer. Verify file list shows correctly and you can extract individual files.

- [ ] **Step 4: Commit**

```bash
git add packages/app/src/... packages/node/src/sidechunk.ts
git commit -m "feat(app): decode sidechunk artifacts in Explorer"
```

---

### Task 15: Final round-trip integration test + dev smoke

- [ ] **Step 1: Run full test suite**

Run: `yarn workspace @tokenpack/core test && yarn workspace @tokenpack/node test`
Expected: ALL PASS.

- [ ] **Step 2: Build the whole monorepo**

Run: `yarn build` (root) — or each workspace's build, if there is no aggregate.
Expected: SUCCESS.

- [ ] **Step 3: Manual end-to-end smoke**

Run: `yarn app` and `yarn workspace tokenpack-runtime-experiments dev` if used.
In the playground:
1. Add 2-3 file entries (mix of text + small file).
2. Switch to Manual tab.
3. Set algorithm = `sidechunk`.
4. Try each decoration mode (`placeholder`, `gradient`).
5. Try each format (`png`, `webp`, `avif`).
6. Click Encode → verify TokenResult shows.
7. Click Open in Explorer → verify file list + extract.

Expected: every combination round-trips cleanly.

- [ ] **Step 4: Commit anything pending**

If smoke testing surfaced bugs, fix them in their own commits with `fix(scope): ...` messages. Otherwise, no further commit needed.

- [ ] **Step 5: Update IDEAS.md / TODO.md if appropriate**

Move the "Partial fetch" TODO entry into a "Phase B" subsection of IDEAS.md (or leave for the user). Optional — not required for plan completion.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ `SidechunkSurface` interface — Task 2
- ✅ PNG/WebP/AVIF surfaces — Tasks 4/5/6
- ✅ `SidechunkAlgorithm` class — Task 7
- ✅ Stubs (NoopCodec/NoopDrawer/NullSurface) — Task 1
- ✅ Decoration renderer (placeholder/gradient/data-art) — Task 3
- ✅ Algorithm options exposed (compressionMode, format, decoration, decorationSize) — Task 7
- ✅ `DecorationSection.tsx` in encode page — Task 10/11
- ✅ Conditional render based on algorithm — Task 11
- ✅ Algorithm registration via `algorithmCatalog.register()` — Task 8
- ✅ Tests for round-trip — Tasks 4/5/6/7/8
- ⚠️  `data-art` mode UI integration is partially covered — the renderer accepts `dataArtPixels` (Task 3) but Task 10's `DecorationSection` doesn't pipe drawer/codec config through. **Phase A scope cutoff:** ship `placeholder` + `gradient` working end-to-end; `data-art` is selectable in the dropdown but throws "not yet wired" if used. Add this gating in Task 13 alongside the FE eligibility check.
- ✅ Phase B (partial-fetch demo) explicitly out of scope — confirmed in spec.

**Type consistency check:**
- `SIDECHUNK_ALGO_ID = 100` — used identically in Task 7 + Task 8.
- `DecorationConfig` shape — same field names across Tasks 2, 3, 4, 5, 6, 7, 8.
- `EncodeConfig.decoration` literal type matches `DecorationKind` — Tasks 9, 10, 12, 13.
- `dataSurfaces: Record<ImageFormat, SidechunkSurface>` — same shape in Task 7 (algorithm) and Task 8 (helper).
- Method names: `writeData` / `readData` (surface), `encodeEntries` / `decodeEntries` / `writeArtifact` / `readArtifact` (algorithm) — used consistently.

**Placeholder scan:** No "TBD"/"TODO"/"implement later" placeholders in implementation steps. Code blocks are complete and self-contained. Task 12 calls out an inspection step to find the existing route's response shape (acceptable — reading existing code is required, not invented).

**Risk flags surfaced in tasks:**
- Task 6 documents an explicit fallback path (drop AVIF if sharp's output gets corrupted by chunk append).
- Task 7 explicitly throws for `encodeBytes`/`decodeBytes` — node-only is honored.
- Task 13 disables FE encoding for sidechunk — server path only.
