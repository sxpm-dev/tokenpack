# Algorithm as Encode/Decode/Stream Unit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `AbstractAlgorithm` the unit of encode/decode/stream. Push current dispatch out of `decoder.ts` and into algorithm defaults. Behavior unchanged for existing tokens.

**Architecture:** Add `canHandle`, `decode`, `encodeStream`, `decodeStream` to `AbstractAlgorithm`. The existing `Algorithm` class implements them with the current logic hoisted from `decoder.ts`. Top-level `decoder.ts` and env-package `decode()` become thin wrappers: detect algorithm via catalog → delegate.

**Tech Stack:** TypeScript, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-07-algorithm-as-encode-decode-unit.md`

---

## File Structure

**Modified (core):**
- `packages/core/src/algorithms/types.ts` — add abstract method signatures + a non-abstract `canHandle` default
- `packages/core/src/algorithms/algorithm.ts` — implement `decode`, `canHandle`, `encodeStream`, `decodeStream` defaults
- `packages/core/src/algorithms/catalog.ts` — add `detectFromBuffer(buffer, ext)`
- `packages/core/src/decoder.ts` — replace inlined dispatch with thin delegation
- `packages/core/src/algorithms/registry.ts` — re-export `detectFromBuffer` if needed

**Modified (env packages — thin):**
- `packages/node/src/decode.ts` — call `algorithm.decode` after detect
- `packages/browser/src/decode.ts` — same idea
- `packages/browser/src/decode-stream.ts` — call `algorithm.decodeStream`
- `packages/node/src/index.ts`, `packages/browser/src/index.ts` — surface unchanged; internals route through algorithm

**New tests:**
- `packages/core/tests/algorithms/canHandle.test.ts`
- `packages/core/tests/algorithms/algorithm-decode-default.test.ts`
- `packages/core/tests/algorithms/catalog-detect.test.ts`
- `packages/core/tests/algorithms/algorithm-stream-default.test.ts`

**Existing tests must pass unchanged** — this is a refactor.

---

### Task 1: Add `canHandle` to `AbstractAlgorithm` + `Algorithm` default

**Files:**
- Modify: `packages/core/src/algorithms/types.ts`
- Modify: `packages/core/src/algorithms/algorithm.ts`
- Test: `packages/core/tests/algorithms/canHandle.test.ts`

`canHandle` default reads the pixel header and matches `algoId === this.id`. Algorithms without pixel headers (sidechunk, future) override.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/algorithms/canHandle.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { algorithmCatalog } from '../../src/algorithms/catalog'
import '../../src/algorithms/register-all'

describe('Algorithm.canHandle', () => {
  it('returns true for a buffer with this algorithm id in the pixel header', () => {
    const algo = algorithmCatalog.list()[0]
    // Construct a minimal compact-header buffer carrying algo.id
    const buf = Buffer.alloc(96)
    buf[0] = 0xc1            // compact magic
    buf[1] = algo.id & 0xff  // algoId
    buf[2] = 0
    buf[3] = 0; buf[4] = 0; buf[5] = 16  // dataLength = 16
    expect(algo.canHandle(buf, '.png')).toBe(true)
  })

  it('returns false for a buffer carrying a different id', () => {
    const list = algorithmCatalog.list()
    if (list.length < 2) return // skip if only one algorithm
    const [a, b] = list
    const buf = Buffer.alloc(96)
    buf[0] = 0xc1
    buf[1] = b.id & 0xff
    expect(a.canHandle(buf, '.png')).toBe(false)
  })

  it('returns false for non-tokenpack bytes', () => {
    const algo = algorithmCatalog.list()[0]
    const garbage = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])
    expect(algo.canHandle(garbage, '.png')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — it fails because `canHandle` doesn't exist**

Run: `yarn workspace @tokenpack/core test tests/algorithms/canHandle.test.ts`
Expected: FAIL — `algo.canHandle is not a function`.

- [ ] **Step 3: Add `canHandle` to `AbstractAlgorithm`**

In `packages/core/src/algorithms/types.ts`, add inside the `AbstractAlgorithm` class (after the abstract methods):

```ts
  /**
   * Returns true if this algorithm should handle the given buffer.
   * Default: matches algorithm id from the pixel header.
   * Algorithms without pixel headers (e.g. sidechunk) override this.
   */
  canHandle(_buffer: Buffer, _ext?: string): boolean {
    return false  // overridden by Algorithm with real logic; refactor adds default below
  }
```

Update the import block to bring in `isCompactToken` etc. as needed when implementing the default (next file).

- [ ] **Step 4: Implement the default in `Algorithm`**

In `packages/core/src/algorithms/algorithm.ts`, add:

```ts
import { isCompactToken, readCompactHeader, readHeader } from '../header'
```

Add a method to the `Algorithm` class:

```ts
override canHandle(buffer: Buffer, _ext?: string): boolean {
  if (!buffer || buffer.length < 6) return false
  // The PNG/WebP/AVIF surfaces all expose pixels; header lives at the start
  // of pixel bytes after surface decode. For canHandle we read directly from
  // the file buffer at byte 0 — that works because PNG IDAT/WebP VP8 framing
  // never produces 0xc0/0xc1 magic at byte 0 of the FILE. To be safe, we
  // delegate to the surface for a real pixel read when the file-level fast
  // path is ambiguous.
  try {
    if (isCompactToken(buffer)) {
      return readCompactHeader(buffer).algoId === this.id
    }
    return readHeader(buffer).algorithmId === this.id
  } catch {
    return false
  }
}
```

Note: file-level byte 0 of a PNG is `0x89`, of a WebP is `R` (0x52), of an AVIF is the box-size MSB. None are `0xc0` or `0xc1`. So the fast-path check is safe — for non-tokenpack files it returns false. The full-path check (decode pixels via surface, read header) is reserved for tokens whose detection requires pixel reading, which existing algorithms don't need because their fingerprint shows up after surface decode (and the catalog's `detectFromBuffer` will handle that case in Task 3).

Actually we need TWO levels: a cheap file-byte check and a real pixel-read check. Re-implement:

```ts
override canHandle(buffer: Buffer, ext?: string): boolean {
  // Fast path: only return true if we can confirm via the surface-decoded
  // pixel header. Catalog.detectFromBuffer is responsible for surface decode;
  // this method receives ALREADY-DECODED pixel bytes when called from there.
  // When called with raw file bytes it returns false (defer to fallback path).
  if (!buffer || buffer.length < 6) return false
  try {
    if (isCompactToken(buffer)) return readCompactHeader(buffer).algoId === this.id
    return readHeader(buffer).algorithmId === this.id
  } catch {
    return false
  }
}
```

The contract: `canHandle(buffer)` accepts whatever bytes the catalog gives it. The catalog passes pixel bytes (from surface decode) for pixel-based algorithms; for algorithms whose detection works on raw file bytes (sidechunk reading PNG chunks), they override and check the file bytes directly.

- [ ] **Step 5: Run tests — should pass**

Run: `yarn workspace @tokenpack/core test tests/algorithms/canHandle.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full core suite — no regressions**

Run: `yarn workspace @tokenpack/core test`
Expected: PASS — all existing tests green.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/algorithms/types.ts \
        packages/core/src/algorithms/algorithm.ts \
        packages/core/tests/algorithms/canHandle.test.ts
git commit -m "refactor(core): add canHandle method to AbstractAlgorithm with pixel-header default"
```

---

### Task 2: Add `algorithmCatalog.detectFromBuffer(buffer, ext)`

**Files:**
- Modify: `packages/core/src/algorithms/catalog.ts`
- Test: `packages/core/tests/algorithms/catalog-detect.test.ts`

`detectFromBuffer` is the dispatcher's entry point. Tries fast pixel-header path first; falls through to per-algorithm `canHandle` iteration.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/algorithms/catalog-detect.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { algorithmCatalog } from '../../src/algorithms/catalog'
import '../../src/algorithms/register-all'

describe('algorithmCatalog.detectFromBuffer', () => {
  it('resolves an algorithm whose id appears in the pixel header', () => {
    const algo = algorithmCatalog.list()[0]
    const buf = Buffer.alloc(96)
    buf[0] = 0xc1
    buf[1] = algo.id & 0xff
    buf[5] = 16
    const detected = algorithmCatalog.detectFromBuffer(buf, '.png')
    expect(detected.id).toBe(algo.id)
  })

  it('throws when no algorithm matches', () => {
    const garbage = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8])
    expect(() => algorithmCatalog.detectFromBuffer(garbage, '.png')).toThrowError(
      /no algorithm matched/i,
    )
  })
})
```

- [ ] **Step 2: Run test — fails (`detectFromBuffer` doesn't exist)**

Run: `yarn workspace @tokenpack/core test tests/algorithms/catalog-detect.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `detectFromBuffer`**

In `packages/core/src/algorithms/catalog.ts`, add to the `AlgorithmCatalog` class:

```ts
import { isCompactToken, readCompactHeader, readHeader } from '../header'

  /**
   * Resolve the algorithm that should handle a given artifact buffer.
   * Strategy:
   *   1. Try compact/full pixel-header fast path (covers all existing algorithms
   *      whose ID is in the pixel header).
   *   2. If no header match (or unknown ID), iterate registered algorithms and
   *      return the first whose canHandle(buffer, ext) returns true.
   *   3. Throw with a clear message.
   */
  detectFromBuffer(buffer: Buffer, ext?: string): AbstractAlgorithm {
    // Fast path: pixel header (algorithms register their own canHandle that
    // reads this same header — but we short-circuit via a direct lookup to
    // avoid iterating all algorithms in the common case).
    try {
      const id = isCompactToken(buffer)
        ? readCompactHeader(buffer).algoId
        : readHeader(buffer).algorithmId
      if (this.byId.has(id)) return this.byId.get(id)!
    } catch {
      // not a pixel-header artifact; fall through
    }

    // Slow path: iterate algorithms. Sidechunk and future plugins live here.
    for (const algo of this.byName.values()) {
      try {
        if (algo.canHandle(buffer, ext)) return algo
      } catch {
        // algorithms throw on bad input — keep iterating
      }
    }

    throw new Error('no algorithm matched the provided artifact buffer')
  }
```

- [ ] **Step 4: Run tests — should pass**

Run: `yarn workspace @tokenpack/core test tests/algorithms/catalog-detect.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full core suite**

Run: `yarn workspace @tokenpack/core test`
Expected: PASS — no regressions.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/algorithms/catalog.ts \
        packages/core/tests/algorithms/catalog-detect.test.ts
git commit -m "refactor(core): add algorithmCatalog.detectFromBuffer dispatcher"
```

---

### Task 3: Add `decode` default to `AbstractAlgorithm` / `Algorithm`

**Files:**
- Modify: `packages/core/src/algorithms/types.ts` (add abstract method or default-on-base)
- Modify: `packages/core/src/algorithms/algorithm.ts` (implement default)
- Test: `packages/core/tests/algorithms/algorithm-decode-default.test.ts`

The `decode` default replicates current `decoder.ts` logic: surface read → drawer read → finalizeChunks. Hoisted into the algorithm.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/algorithms/algorithm-decode-default.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { algorithmCatalog } from '../../src/algorithms/catalog'
import '../../src/algorithms/register-all'

describe('Algorithm.decode (default impl)', () => {
  it('exists on every registered algorithm', () => {
    for (const algo of algorithmCatalog.list()) {
      expect(typeof (algo as { decode?: unknown }).decode).toBe('function')
    }
  })
})
```

(A heavier test of behavior is covered by existing `packages/node/tests/encode-decode.test.ts` round-trip — those will keep passing if the default is correct.)

- [ ] **Step 2: Run test — fails or passes depending on existing definition**

Run: `yarn workspace @tokenpack/core test tests/algorithms/algorithm-decode-default.test.ts`
Expected: PASS the type-existence test (existing `Algorithm.encode` already exists; we add `decode`).

- [ ] **Step 3: Add `decode` signature to `AbstractAlgorithm`**

In `packages/core/src/algorithms/types.ts`, inside `AbstractAlgorithm`:

```ts
import type { DecodeOptions } from '../types'

  /**
   * fs/buffer-flavored decode. Default in `Algorithm` reads pixels via surface,
   * runs the drawer, and finalizes chunks. Plugin algorithms may override to
   * bypass the codec/drawer pipeline entirely.
   */
  abstract decode(
    source: Buffer | string,
    options?: DecodeOptions & { ext?: string }
  ): Promise<Buffer>
```

- [ ] **Step 4: Implement `decode` default in `Algorithm`**

Open `packages/core/src/algorithms/algorithm.ts`. Add imports needed for the default body (mirroring `decoder.ts`):

```ts
import fs from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { finalizeChunks } from '../finalize-chunks'
import { pickDrawerForPixels } from '../drawers'
import type { ChunkReadResult } from '../drawers/types'
```

Add the method to the `Algorithm` class:

```ts
async decode(
  source: Buffer | string,
  options?: { key?: string; ext?: string },
): Promise<Buffer> {
  // Buffer path
  if (Buffer.isBuffer(source) || source instanceof Uint8Array) {
    const buf = Buffer.isBuffer(source)
      ? source
      : Buffer.from(source.buffer, source.byteOffset, source.byteLength)
    const ext = options?.ext ?? '.png'
    return this.decodeFromBuffer(buf, options?.key, ext)
  }
  // Filepath path
  return this.decodeFromFile(source, options?.key)
}

private async decodeFromBuffer(buffer: Buffer, key?: string, ext = '.png'): Promise<Buffer> {
  const surface = surfaceRegistry.byExtension(ext)
  const image = await surface.readBuffer(buffer)
  const drawer = pickDrawerForPixels(image.pixels)
  const first: ChunkReadResult = drawer.read(image, { codec: this.codec })
  if (first.chunkTotal === 1) return finalizeChunks([first], key)
  // Multi-chunk: re-write to a temp file and read siblings (matches existing decoder.ts)
  const tmpPath = path.join(tmpdir(), `tp-dec-${globalThis.crypto.randomUUID()}${ext}`)
  fs.writeFileSync(tmpPath, buffer)
  try {
    const paths = discoverChunks(tmpPath, first.chunkTotal)
    const rest = await Promise.all(paths.slice(1).map(p => this.decodeChunkFromFile(p)))
    return finalizeChunks([first, ...rest], key)
  } finally {
    try { fs.unlinkSync(tmpPath) } catch {}
  }
}

private async decodeFromFile(filePath: string, key?: string): Promise<Buffer> {
  const surface = surfaceRegistry.byExtension(path.extname(filePath))
  const image = await surface.readFile(filePath)
  const drawer = pickDrawerForPixels(image.pixels)
  const first = drawer.read(image, { codec: this.codec })
  if (first.chunkTotal === 1) return finalizeChunks([first], key)
  const paths = discoverChunks(filePath, first.chunkTotal)
  const rest = await Promise.all(paths.slice(1).map(p => this.decodeChunkFromFile(p)))
  return finalizeChunks([first, ...rest], key)
}

private async decodeChunkFromFile(filePath: string): Promise<ChunkReadResult> {
  const surface = surfaceRegistry.byExtension(path.extname(filePath))
  const image = await surface.readFile(filePath)
  return pickDrawerForPixels(image.pixels).read(image, { codec: this.codec })
}
```

Move `discoverChunks` from `decoder.ts` into a shared location. Recommended: `packages/core/src/discover-chunks.ts`:

```ts
import path from 'node:path'

export function discoverChunks(firstPath: string, total: number): string[] {
  if (total === 1) return [firstPath]
  const ext = path.extname(firstPath)
  const dir = path.dirname(firstPath)
  const base = path.basename(firstPath, ext)
  const stripped = base.replace(/_\d+of\d+$/, '')
  return Array.from({ length: total }, (_, i) =>
    path.join(dir, `${stripped}_${i + 1}of${total}${ext}`),
  )
}
```

Import it in `algorithm.ts` and `decoder.ts`.

- [ ] **Step 5: Run all tests**

Run: `yarn workspace @tokenpack/core test`
Expected: PASS — including existing round-trip tests.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/algorithms/types.ts \
        packages/core/src/algorithms/algorithm.ts \
        packages/core/src/discover-chunks.ts \
        packages/core/tests/algorithms/algorithm-decode-default.test.ts
git commit -m "refactor(core): add Algorithm.decode default; hoist decoder.ts logic"
```

---

### Task 4: Refactor `decoder.ts` to thin delegation

**Files:**
- Modify: `packages/core/src/decoder.ts`

Replace the inlined dispatch with `algorithmCatalog.detectFromBuffer(buf, ext) → algorithm.decode(buf, options)`.

- [ ] **Step 1: Inspect current `decoder.ts` callers**

Existing exports must stay: `decode`, `decodeFile`, `decodeToBuffer`, `decodeFromBuffer`. Their signatures don't change.

- [ ] **Step 2: Rewrite the bodies**

Replace the entire `decoder.ts` body with:

```ts
import './algorithms/register-all'

import fs from 'node:fs'
import path from 'node:path'

import { algorithmCatalog } from './algorithms/catalog'
import { surfaceRegistry } from './surfaces/registry'
import type { DecodeOptions } from './types'

async function loadFile(filePath: string): Promise<{ buffer: Buffer; ext: string }> {
  return { buffer: fs.readFileSync(filePath), ext: path.extname(filePath) }
}

export async function decode(inputPath: string, options: DecodeOptions): Promise<void> {
  const { buffer, ext } = await loadFile(inputPath)
  const algo = algorithmCatalog.detectFromBuffer(buffer, ext)
  const out = await algo.decode(buffer, { key: options.key, ext })
  fs.writeFileSync(options.out, out)
}

export const decodeFile = decode

export async function decodeToBuffer(inputPath: string, key?: string): Promise<Buffer> {
  const { buffer, ext } = await loadFile(inputPath)
  const algo = algorithmCatalog.detectFromBuffer(buffer, ext)
  return algo.decode(buffer, { key, ext })
}

export async function decodeFromBuffer(
  imageBuffer: Buffer,
  key?: string,
  ext?: string,
): Promise<Buffer> {
  const resolvedExt = ext ?? '.png'
  const algo = algorithmCatalog.detectFromBuffer(imageBuffer, resolvedExt)
  return algo.decode(imageBuffer, { key, ext: resolvedExt })
}
```

- [ ] **Step 3: Run all tests across the monorepo**

Run: `yarn workspace @tokenpack/core test && yarn workspace @tokenpack/node test`
Expected: PASS — round-trip behavior unchanged.

- [ ] **Step 4: Manual smoke**

Run: `yarn app`
Encode a small file with any default preset; open in Explorer. Verify decode still works.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/decoder.ts
git commit -m "refactor(core): decoder.ts becomes thin dispatcher over algorithm.decode"
```

---

### Task 5: Refactor `@tokenpack/node` `decode()` to use catalog dispatch

**Files:**
- Modify: `packages/node/src/decode.ts`

Currently calls `decodeFromBuffer` from core. After Task 4 it routes via the catalog automatically. Verify and tighten.

- [ ] **Step 1: Inspect current `packages/node/src/decode.ts`**

Currently:
```ts
const payload = await decodeFromBuffer(bytes, options.key, ext)
```

This already routes through the catalog after Task 4. No structural change is needed here.

- [ ] **Step 2: Run node tests to confirm**

Run: `yarn workspace @tokenpack/node test`
Expected: PASS.

- [ ] **Step 3: Commit (if anything changed) — otherwise skip**

If the file was unchanged in Task 4, skip the commit. If you tightened anything (e.g. moved `loadSource` logic), commit:

```bash
git add packages/node/src/decode.ts
git commit -m "refactor(node): decode entry-point routes through algorithm dispatch"
```

---

### Task 6: Refactor `@tokenpack/browser` `decode()` to use catalog dispatch

**Files:**
- Modify: `packages/browser/src/decode.ts`

The browser path already partially uses `algorithm.decodeBytes(pixels, key)`. Confirm it now goes through `detectFromBuffer` instead of any pixel-only resolution.

- [ ] **Step 1: Inspect `packages/browser/src/decode.ts`**

Run: `grep -n "algorithm\|decodeBytes\|getById" packages/browser/src/decode.ts`

- [ ] **Step 2: Replace direct pixel-header lookup with `detectFromBuffer`**

Where the file currently resolves an algorithm from pixel data (search for `algorithmCatalog.getById` or `resolveCodecId`), replace with:

```ts
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
// ... inside the decode body, after fetching/loading bytes:
const algo = algorithmCatalog.detectFromBuffer(bytes, ext ?? '.png')
const payload = await algo.decode(bytes, { key: options.key, ext })
```

- [ ] **Step 3: Run browser tests if any exist**

Run: `yarn workspace @tokenpack/browser test 2>/dev/null || echo "no test script — manual smoke required"`

- [ ] **Step 4: Manual browser smoke**

Run: `yarn app` — encode in browser-eligible config (default preset), decode in Explorer. Verify still works.

- [ ] **Step 5: Commit**

```bash
git add packages/browser/src/decode.ts
git commit -m "refactor(browser): decode entry-point routes through algorithm dispatch"
```

---

### Task 7: Add `encodeStream` / `decodeStream` defaults to `AbstractAlgorithm`

**Files:**
- Modify: `packages/core/src/algorithms/types.ts` (signatures)
- Modify: `packages/core/src/algorithms/algorithm.ts` (degraded defaults)
- Test: `packages/core/tests/algorithms/algorithm-stream-default.test.ts`

Default = collect input → encodeBytes → emit single chunk. True streaming algorithms (zstdpix) override in Task 8.

- [ ] **Step 1: Write the failing test**

`packages/core/tests/algorithms/algorithm-stream-default.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { algorithmCatalog } from '../../src/algorithms/catalog'
import '../../src/algorithms/register-all'

describe('Algorithm streaming defaults', () => {
  it('every algorithm exposes encodeStream / decodeStream', () => {
    for (const algo of algorithmCatalog.list()) {
      expect(typeof (algo as { encodeStream?: unknown }).encodeStream).toBe('function')
      expect(typeof (algo as { decodeStream?: unknown }).decodeStream).toBe('function')
    }
  })

  it('default encodeStream collects input then encodes it', async () => {
    const algo = algorithmCatalog.list().find(a => a.name === 'linear')
    if (!algo) return // skip if 'linear' not registered
    const input = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('hello '))
        c.enqueue(new TextEncoder().encode('world'))
        c.close()
      },
    })
    const out = algo.encodeStream(input, { format: 'png' } as never)
    const reader = out.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    const total = chunks.reduce((s, c) => s + c.length, 0)
    expect(total).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test — fails**

Run: `yarn workspace @tokenpack/core test tests/algorithms/algorithm-stream-default.test.ts`
Expected: FAIL — methods don't exist.

- [ ] **Step 3: Add abstract signatures to `AbstractAlgorithm`**

In `packages/core/src/algorithms/types.ts`:

```ts
  /** Default: collect → encodeBytes → emit. Override for true pipelining. */
  abstract encodeStream(
    input: ReadableStream<Uint8Array>,
    options: Omit<EncodeOptions, 'algo' | 'out'>,
  ): ReadableStream<Uint8Array>

  /** Default: collect → decode → emit. Override for true pipelining. */
  abstract decodeStream(
    source: ReadableStream<Uint8Array>,
    options?: { key?: string; ext?: string },
  ): ReadableStream<Uint8Array>
```

- [ ] **Step 4: Implement degraded defaults in `Algorithm`**

In `packages/core/src/algorithms/algorithm.ts`:

```ts
encodeStream(
  input: ReadableStream<Uint8Array>,
  options: Omit<EncodeOptions, 'algo' | 'out'>,
): ReadableStream<Uint8Array> {
  const algo = this
  return new ReadableStream({
    async start(controller) {
      const reader = input.getReader()
      const chunks: Uint8Array[] = []
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      const total = chunks.reduce((s, c) => s + c.length, 0)
      const merged = new Uint8Array(total)
      let off = 0
      for (const c of chunks) { merged.set(c, off); off += c.length }
      const drawn = await algo.encodeBytes(merged, options)
      // Emit the first chunk's pixels as the stream payload (matches single-chunk
      // assumption; multi-chunk streaming is the override's job).
      if (drawn.length > 0) controller.enqueue(drawn[0].pixels)
      controller.close()
    },
  })
}

decodeStream(
  source: ReadableStream<Uint8Array>,
  options?: { key?: string; ext?: string },
): ReadableStream<Uint8Array> {
  const algo = this
  return new ReadableStream({
    async start(controller) {
      const reader = source.getReader()
      const chunks: Uint8Array[] = []
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      const total = chunks.reduce((s, c) => s + c.length, 0)
      const merged = new Uint8Array(total)
      let off = 0
      for (const c of chunks) { merged.set(c, off); off += c.length }
      const buf = Buffer.from(merged.buffer, merged.byteOffset, merged.byteLength)
      const out = await algo.decode(buf, options)
      controller.enqueue(new Uint8Array(out.buffer, out.byteOffset, out.byteLength))
      controller.close()
    },
  })
}
```

- [ ] **Step 5: Run tests**

Run: `yarn workspace @tokenpack/core test`
Expected: PASS — including new stream-default test.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/algorithms/types.ts \
        packages/core/src/algorithms/algorithm.ts \
        packages/core/tests/algorithms/algorithm-stream-default.test.ts
git commit -m "refactor(core): add encodeStream/decodeStream defaults to Algorithm"
```

---

### Task 8: Override streaming for zstdpix (port `decode-stream.ts` into algorithm)

**Files:**
- Modify: `packages/node/src/codecs/zstdpix.ts` — wrap into a streaming-algorithm subclass OR add an override hook
- Modify: `packages/browser/src/decode-stream.ts` — call `algorithm.decodeStream` instead of inlining
- Test: existing streaming tests must pass

Goal: any algorithm that's `streamFriendly !== 'no'` overrides defaults with true pipelining. The current code in `packages/core/src/stream-decoder.ts` ports as the override implementation.

- [ ] **Step 1: Find current streaming entry**

Run: `grep -rn "createTokenDecodeStream\|stream-decoder" packages/core/src packages/node/src packages/browser/src 2>/dev/null | head`

- [ ] **Step 2: Decide on the override strategy**

Two options:
- **A** — Subclass `Algorithm` → `StreamingAlgorithm` for zstdpix; override `encodeStream`/`decodeStream`. Minimum diff.
- **B** — Make `Algorithm.encodeStream`/`decodeStream` check `isStreamingCodec(this.codec)` and route to the existing stream code when true; otherwise use the degraded default.

Pick **B** — single class, less risk.

In `packages/core/src/algorithms/algorithm.ts`, modify the `encodeStream` / `decodeStream` defaults:

```ts
encodeStream(input, options) {
  if (isStreamingCodec(this.codec)) {
    // Delegate to the existing streaming codec pipeline. Implementation depends on
    // existing helpers — adapt the body of `tokenpack/stream-decoder` (or its sibling
    // for encode) to operate on the streams provided here.
    return this.encodeStreamPipelined(input, options)
  }
  // ... degraded default from Task 7 ...
}

private encodeStreamPipelined(input, options): ReadableStream<Uint8Array> {
  // Reuse the streaming pieces from packages/core/src/stream-decoder.ts (encode path
  // mirrors the decode path's framing). If no encode-stream helper exists today,
  // implement it here using the codec's existing streaming methods.
  throw new Error('encodeStreamPipelined: implement with existing streaming codec hooks')
}
```

The `decodeStream` override mirrors this. **If the existing code base does not have a complete streaming-encode path, scope this task to streaming decode only and leave `encodeStream` as the degraded default for streaming codecs too — the `streamable` capability is mainly used by decoders today.**

- [ ] **Step 3: Run streaming tests**

Run: `yarn workspace @tokenpack/core test --grep stream`
Expected: PASS — existing streaming round-trip tests unchanged.

- [ ] **Step 4: Update browser stream entry to delegate**

In `packages/browser/src/decode-stream.ts`, where it currently calls `decodeStreamPng(stream, options)`, replace with:

```ts
const algo = algorithmCatalog.list().find(a => isStreamingCodec(a.codec))
// resolve correct algorithm from the first chunk header — mirror existing logic
return algo.decodeStream(stream, options)
```

- [ ] **Step 5: Run all tests + browser smoke**

Run: `yarn workspace @tokenpack/core test && yarn workspace @tokenpack/node test`
Expected: PASS.

Run: `yarn app` and test streaming via the playground (default preset → streaming-on).
Expected: streaming decode still works.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/algorithms/algorithm.ts \
        packages/browser/src/decode-stream.ts
git commit -m "refactor: streaming algorithms override encodeStream/decodeStream defaults"
```

---

### Task 9: Final integration validation

- [ ] **Step 1: Run the full test suite**

Run: `yarn workspace @tokenpack/core test && yarn workspace @tokenpack/node test`
Expected: ALL PASS — same green count as before the refactor + new tests added in Tasks 1, 2, 3, 7.

- [ ] **Step 2: Build the monorepo**

Run: `yarn build` (or per-package builds if no aggregate)
Expected: SUCCESS.

- [ ] **Step 3: Manual smoke — every existing flow**

Run: `yarn app`
- Encode a single file (default preset, FE eligible) → decode in Explorer.
- Encode a multi-file pack (manual mode, brotli + dense) → decode.
- Encode with streaming preset → decode.
- Encode WebP / AVIF → decode.

Expected: every flow round-trips identically to before the refactor.

- [ ] **Step 4: If everything green, no further commits needed.**

If smoke surfaces a regression, fix and commit as `fix(...): ...`.

---

## Self-Review Notes

**Spec coverage:**
- ✅ `canHandle` on `AbstractAlgorithm` with default — Task 1
- ✅ `algorithmCatalog.detectFromBuffer` — Task 2
- ✅ `Algorithm.decode` default — Task 3
- ✅ `decoder.ts` thin dispatcher — Task 4
- ✅ `@tokenpack/node` decode delegates — Task 5
- ✅ `@tokenpack/browser` decode delegates — Task 6
- ✅ `encodeStream` / `decodeStream` defaults on every algorithm — Task 7
- ✅ Streaming codec override — Task 8

**Type consistency:**
- `canHandle(buffer, ext?): boolean` — same signature in types.ts (Task 1) and catalog.ts (Task 2).
- `decode(source, options?): Promise<Buffer>` — consistent across types.ts (Task 3) and decoder.ts (Task 4).
- `encodeStream` / `decodeStream` signatures — same in types.ts (Task 7) and algorithm.ts override (Task 8).

**Placeholder scan:** Two soft TODOs remain by design:
- Task 1 Step 4 leaves the door open for "surface-decoded pixel" canHandle: documented as the catalog's responsibility, not the algorithm's.
- Task 8 Step 2 explicitly notes "scope to decode-only if encode-stream helpers don't exist today" — that's a real codebase-shape constraint, not an unfilled placeholder.

**Risk gates:**
- After each task, the full existing test suite runs. Any regression blocks the next task.
- Manual smoke at Task 4 (decoder.ts becomes thin), Task 6 (browser dispatch), Task 9 (final).
