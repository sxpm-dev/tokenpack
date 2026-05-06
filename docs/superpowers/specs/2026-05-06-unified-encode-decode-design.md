# Unified Encode/Decode + Pack Format — Design

**Date:** 2026-05-06
**Status:** Draft, awaiting review
**Owner:** Valerii Sorokobatko

## Purpose

Collapse the proliferation of encode/decode/pack/file APIs into a single coherent surface across `@tokenpack/node` and `@tokenpack/browser`, and introduce a per-file pack format that supports listing files cheaply and extracting them by name.

Outcomes:

1. **One `encode`, one `decode` per env package** — no separate file/dir variants.
2. **A single `Pack` type** returned by every `decode` call, discriminated into `FilePack | DirPack | DiffPack` via type-guard methods (`isPack()`, `isDiff()`).
3. **Per-file random-access** — pack format carries a manifest with each file's pixel region. `pack.list` and `pack.extract(path)` work without unpacking unrelated files.
4. **A fluent `PackBuilder`** for assembling pack content; node-only fs methods live on a `NodePackBuilder` subclass.
5. **Diff as methods on the pack types** — `dirPack.diffTo(other)` and `diffPack.apply(prev)`. No top-level `diff` / `applyDiff`.
6. **Cleaned-up package surfaces** — `tokenpack` (core) becomes a primitives + types package; `@tokenpack/node` and `@tokenpack/browser` become symmetric user-facing packages.

## Non-goals

- Not changing the underlying compressors, codecs, drawers, or surfaces.
- Not rewriting the streaming PNG decoder (Phase 1 #1 in `IDEAS.md`); it slots in unchanged.
- Not adding binary file deltas (bsdiff / xdelta style). Diff phase 1 is replace-only at file granularity.
- Not adding diff support for single-file (anonymous) tokens. Diff is a pack-format feature; users wrap content in a single-entry pack if they want diffability.
- Not changing the React component or hook APIs.

---

## API surface

### Top-level (symmetric across `@tokenpack/node` and `@tokenpack/browser`)

```ts
encode(content: string | Uint8Array | ArrayBuffer | Blob, opts?: EncodeOptions): Promise<EncodeResult>
encode(builder: PackBuilder, opts?: EncodeOptions): Promise<EncodeResult>

decode(source: DecodeSource, opts?: DecodeOptions): Promise<Pack>
```

Dispatch on `instanceof PackBuilder` selects the file-format vs pack-format encode path internally.

`EncodeOptions` is the existing core options shape (algorithm choice, encryption key, etc.) plus one new field for file-format encodes:

```ts
interface EncodeOptions {
  // ...existing fields (algo, key, …)
  name?: string                  // file-format only: overrides the empty path on decode
                                 //   default: '' (FilePack.list = [''])
                                 //   ignored when encoding a builder
}
```

`EncodeResult` is env-specific (node returns file paths / Buffers; browser returns blobs / object URLs / image elements) but the input shape and option contract are identical.

### `Pack` discriminated union

```ts
type Pack = FilePack | DirPack | DiffPack

interface PackBase {
  list: string[]                                              // sync; available immediately after decode
  entries: ReadonlyArray<{ path: string; size: number }>      // sync; richer than list
  isPack(): this is DirPack
  isDiff(): this is DiffPack
}

interface FilePack extends PackBase {
  // list = ['']  (or [name] when an explicit name was given to encode())
  content(): Promise<Uint8Array>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
  blob(): Promise<Blob>
}

interface DirPack extends PackBase {
  extract(path: string): Promise<Uint8Array>
  text(path: string): Promise<string>
  json<T = unknown>(path: string): Promise<T>
  blob(path: string): Promise<Blob>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  diffTo(other: DirPack): Promise<EncodeResult>
}

interface DiffEntry {
  path: string
  op: 'add' | 'modify' | 'delete' | 'rename'
  size?: number                                               // present for add | modify
  fromPath?: string                                           // present for rename
}

interface DiffPack extends PackBase {
  // entries narrows to ReadonlyArray<DiffEntry>
  // list contains every path mentioned by any op (add | modify | delete | rename)
  apply(prev: DirPack): Promise<DirPack>
}
```

Consumer pattern:

```ts
const pack = await decode(source)

if (pack.isDiff()) {
  // pack: DiffPack
  for (const entry of pack.entries) console.log(entry.op, entry.path)
} else if (pack.isPack()) {
  // pack: DirPack
  for (const path of pack.list) {
    const bytes = await pack.extract(path)
  }
} else {
  // pack: FilePack
  const text = await pack.text()
}
```

### `PackBuilder`

Lives in `tokenpack` (core), env-neutral:

```ts
class PackBuilder {
  withFile(path: string, content: Uint8Array | string): this
  withBuffer(path: string, buffer: Uint8Array): this
  withDirectory(path: string, fn: (sub: PackBuilder) => void): this
  build(): Promise<PackEntry[]>
}
```

`NodePackBuilder` lives in `@tokenpack/node`, extends `PackBuilder`:

```ts
class NodePackBuilder extends PackBuilder {
  withFileSystem(fsPath: string, options?: FsOptions): this
  withGlob(pattern: string, options?: GlobOptions): this
}

interface FsOptions {
  cwd?: string                  // default: process.cwd()
  as?: string                   // remap to a different path inside the pack
  exclude?: string[]            // glob patterns to skip
}

interface GlobOptions extends FsOptions {
  // (cwd / as / exclude apply; pattern itself is the positional arg)
}
```

Builder semantics:

- **Mutable + fluent.** `return this` after each call. The output of `build()` is what's immutable.
- **`build()` is async** because `withFileSystem` / `withGlob` collect intents synchronously and resolve them at build time. Keeps the fluent chain readable.
- **Path normalization** at `build()` time: forward slashes only, leading `./` stripped, `..` segments rejected, absolute paths rejected.
- **Path conflicts throw** at `build()`. No silent last-wins.
- **`withDirectory(path, fn)` scoping**: `fn` receives a fresh sub-builder. On exit, sub-builder entries are prefixed with the parent path and merged into the parent. Sub-builder cannot see or affect entries outside its prefix.

### Decode source types

| Source | Node | Browser | Notes |
|---|---|---|---|
| `string` | file path or URL (sniff `http://`/`https://`/`file://`) | URL only | Browser has no fs |
| `URL` | ✅ | ✅ | Explicit URL — bypasses sniff |
| `Buffer` | ✅ | — | Node-only |
| `Uint8Array` | ✅ | ✅ | |
| `ArrayBuffer` | ✅ | ✅ | |
| `Blob` | — | ✅ | |
| `HTMLImageElement` | — | ✅ | Already-rendered `<img>` |
| `ImageBitmap` | — | ✅ | |
| `ReadableStream` (Web) | ✅ | ✅ | Streaming decode |
| `Readable` (Node) | ✅ | — | Power user |

Network errors on URL sources throw.

---

## Pack format

### Header

Every token starts with the existing TokenPack signature, then a one-byte format discriminator:

| Byte | Meaning |
|---|---|
| `0x01` | File format — single anonymous compressed payload (today's behavior) |
| `0x02` | Pack format — manifest + per-file regions (new) |
| `0x03` | Diff format — manifest of ops + per-add/modify regions (new) |

Decoder reads the discriminator after the signature and dispatches to the right reader. Old single-file tokens (no discriminator written today) continue to decode through the file-format path; the format byte is always written for new tokens.

### Pack-format layout

```
[ signature ][ 0x02 ][ manifest size: u32 LE ][ manifest bytes ][ region 0 ][ region 1 ]...[ region N-1 ]
```

The whole layout is then serialized to pixels via the existing drawer/surface pipeline.

**Manifest** — JSON or a small binary record (decision: JSON for v1, easy to debug; switch to binary if profiling shows the parse cost matters):

```json
{
  "version": 1,
  "files": [
    {
      "path": "src/a.js",
      "codecId": 12,
      "compressedSize": 4218,
      "originalSize": 11034,
      "offset": 0,
      "x": 0, "y": 0, "w": 256, "h": 17
    }
  ]
}
```

`offset` is the byte offset from the start of the regions block. `x`/`y`/`w`/`h` describe the pixel rectangle for the region — used when the consumer wants to extract by pixel slice without reading the whole image.

**Regions** — each region is an independently-compressed file, drawn into its own pixel rectangle. Every region is its own compressor invocation; no cross-file dictionary sharing. This is the cost of true per-file extraction.

### Diff-format layout

```
[ signature ][ 0x03 ][ manifest size: u32 LE ][ diff manifest bytes ][ region 0 ][ region 1 ]...
```

Diff manifest:

```json
{
  "version": 1,
  "ops": [
    { "op": "add",    "path": "new.js",   "codecId": 12, "compressedSize": 800, "offset": 0,    ... },
    { "op": "modify", "path": "old.js",   "codecId": 12, "compressedSize": 200, "offset": 800,  ... },
    { "op": "delete", "path": "gone.js" },
    { "op": "rename", "path": "moved.js", "fromPath": "src/old.js" }
  ]
}
```

Regions are present only for `add` and `modify` ops.

### Compression boundary

Every extractable unit is its own compressed stream:

- File format: one stream over the whole content.
- Pack format: one stream per file region.
- Diff format: one stream per `add` / `modify` region.

This is the design constraint that enables `pack.extract(path)` to decode just one file's bytes. Compression ratio drops vs cross-file shared dictionary — known cost, accepted.

### FEC and crypto

Per-region. Each file region carries its own FEC parity (if enabled) and is independently encrypted (if a key is passed). Justification: extracting one file shouldn't require decrypting the others.

This is a slight overhead vs whole-blob FEC/crypto, but matches the per-region independence we need.

---

## Per-package API

### `tokenpack` (core) — slim primitives + types

**Top-level exports:**

| API | Type | Purpose |
|---|---|---|
| `PackBuilder` | class | Env-neutral builder |
| `Pack`, `FilePack`, `DirPack`, `DiffPack`, `DiffEntry`, `PackEntry` | types | Public type contract |
| `EncodeOptions`, `DecodeOptions`, `HeaderData`, `ImageFormat`, `Style` | types | |
| `algorithmCatalog`, `getAlgorithmById`, `getAlgorithmByName`, `listAlgorithms`, `listAlgorithmCatalog` | catalog | Already exposed |
| `packBuffers`, `unpackBuffers`, `listArchive`, `isCartArchive`, `PackEntry` | CART primitives | Env-neutral; existing |
| `writePackManifest`, `readPackManifest` | NEW | Pack-format manifest reader/writer for plugin authors |
| `encryptData`, `decryptData`, `CRYPTO_OVERHEAD` | crypto | Existing |

**Subpaths kept** (advanced — for users registering custom plugins):

`/algorithms`, `/codecs`, `/compressors`, `/drawers`, `/surfaces`, `/fec`

**Subpaths removed from public exports:**

| Subpath | Why | Where it goes |
|---|---|---|
| `tokenpack/encoder`, `tokenpack/decoder` | fs-touching, not env-neutral | Move to `@tokenpack/node` internals |
| `tokenpack/archive` | fs wrappers (deprecated; `archive-buffers` is the env-neutral one) | Move fs wrappers to `@tokenpack/node`; remove from core's `package.json#exports` |
| `tokenpack/diff`, `tokenpack/diff-pack` | Logic stays in core but not as public subpaths | Surface only via methods on `Pack` types |
| `tokenpack/decode-result` | Internal helper; the `Pack` type is the public contract | Inline into core's `index.ts`; remove from `package.json#exports` |
| `tokenpack/stream-decoder` | Node-specific (Duplex) | Move to `@tokenpack/node` (top-level export per user decision below) |
| `tokenpack/presets`, `tokenpack/style` | Niche; fold into `EncodeOptions` documentation | Demote to options doc; remove from public exports |
| `tokenpack/header` | Internal | Remove from `package.json#exports` |
| `tokenpack/types` | Re-exported from main index | Remove from `package.json#exports` |
| `tokenpack/crypto` | Re-exported from main index | Remove from `package.json#exports` |

### `@tokenpack/node` — Node user-facing

**Top-level (everything users need is here per project decision):**

| API | Notes |
|---|---|
| `encode`, `decode` | Symmetric with browser |
| `PackBuilder`, `NodePackBuilder` | Builder + node-only fs methods |
| `decodeStream`, `encodeStream` | Node Duplex streaming (top-level per user decision) |
| `PngSurface`, `WebpSurface`, `AvifSurface`, `StreamingPngSurface` | sharp/pngjs-backed; top-level |
| `BrotliCompressor`, `DeflateCompressor` | Node zlib-backed; top-level |
| `ZstdpixCodec`, `hasZstd` | Node-only codec; top-level |
| `registerNodeDefaults` | Manual registration entry-point |
| Types: `Pack`, `FilePack`, `DirPack`, `DiffPack`, `DiffEntry`, `PackEntry`, `EncodeOptions`, `DecodeOptions`, `EncodeResult`, `DecodeSource` | Re-exported from core (explicit; no `export * from 'tokenpack'`) |

**Removed:**
- `export * from 'tokenpack'` — replaced with explicit named re-exports.
- `extract` (top-level) — covered by `pack.extract(path)` method.
- `diff`, `applyDiff` (top-level) — covered by `dirPack.diffTo(other)` and `diffPack.apply(prev)` methods.
- `diffText`, `diffTokens`, `FileDiff` (file-based heatmap helpers) — kept under a subpath if still needed for the dashboard, otherwise removed (review before deleting).

### `@tokenpack/browser` — Browser user-facing

**Top-level:**

| API | Notes |
|---|---|
| `encode`, `decode` | Symmetric with node |
| `PackBuilder` | Base — no fs methods |
| `decodeStream`, `encodeStream` | Web Streams (top-level) |
| `registerBrowserDefaults` | Manual registration entry-point |
| Types: `Pack`, `FilePack`, `DirPack`, `DiffPack`, `DiffEntry`, `PackEntry`, `EncodeOptions`, `DecodeOptions`, `EncodeResult`, `DecodeSource` | Re-exported from core |

**Subpaths (DX helpers — already exist):**

| Subpath | Purpose |
|---|---|
| `@tokenpack/browser/components` | `<TokenImage>`, `<TokenAsImage>` |
| `@tokenpack/browser/hooks` | `useTokenPack` |
| `@tokenpack/browser/sw` | Service Worker helper |
| `@tokenpack/browser/postMessage` | Cross-context transport |
| `@tokenpack/browser/inline` | Data-URI helper |

**Removed from top-level (folded into `pack` methods):** the existing `useTokenPack` hook and `<TokenImage>` / `<TokenAsImage>` components stay where they are; only encode/decode/pack-related top-level surface changes.

---

## Backward compatibility

- **Old tokens (file-format, no manifest discriminator byte):** continue to decode through the file-format path. The decoder treats absence of the format byte as `0x01`. `pack.list = ['']`, `pack.content()` returns the bytes.
- **Old `decode()` consumers** that did `if (result.type === 'file')` need to migrate to `if (!pack.isPack())`. There is no compatibility shim — clean break in the API; old format reads still work.
- **`packBuffers` / `unpackBuffers` (CART)** stay as buffer primitives in core. The new pack format does NOT use CART; it's a different layout. CART remains for callers using it directly.
- **Existing `diffPack` / `applyDiff` exports in core** become internal — replaced by methods on `Pack` types. Anyone consuming them directly is internal to the repo (re-export removal is safe).

---

## Cleanup plan per package

### `tokenpack` (core)

1. Add `PackBuilder` class.
2. Add new pack-format encoder/decoder modules: `pack-format/encode.ts`, `pack-format/decode.ts`, `pack-format/manifest.ts`.
3. Add new diff-format encoder/decoder + `Pack.diffTo` / `DiffPack.apply` implementations.
4. Update `decode-result.ts` → expose the new `Pack` type as the public contract; inline into `index.ts` and remove the `decode-result` subpath.
5. Move fs-using files (`encoder.ts`, `decoder.ts`, `archive.ts`'s fs wrappers, `stream-decoder.ts`) to `@tokenpack/node`. Update `package.json#exports` to drop those subpaths.
6. Drop subpaths: `header`, `types`, `crypto`, `presets`, `style`, `diff`, `diff-pack`, `decode-result`. Their content stays internal or re-exports from `index.ts`.
7. Slim `index.ts` to the table above.

### `@tokenpack/node`

1. Replace `export * from 'tokenpack'` with explicit named re-exports (types + `PackBuilder`).
2. Add `NodePackBuilder` (extends core `PackBuilder`).
3. Update top-level `encode` to dispatch on `instanceof PackBuilder`.
4. Update top-level `decode` to return the new `Pack` (with `isPack` / `isDiff` discriminators).
5. Remove top-level `extract`, `diff`, `applyDiff` (moved to pack methods).
6. Decide on `diffText` / `diffTokens` / `FileDiff` (the file-based heatmap diff used by the dashboard): keep on a `/diff-heatmap` subpath if still needed, else remove. Spec checkbox; not blocking.
7. Receive moved files from core (`encoder.ts`, `decoder.ts`, `archive.ts` fs wrappers, `stream-decoder.ts`). They become internal; only `decodeStream` / `encodeStream` are top-level re-exports.

### `@tokenpack/browser`

1. Update `encode` to accept `string | Uint8Array | ArrayBuffer | Blob | PackBuilder`.
2. Update `decode` to return the new `Pack` (with `isPack` / `isDiff` discriminators).
3. Re-export `PackBuilder` from core.
4. Add `decodeStream` / `encodeStream` (Web Streams). Phase 1 #1 from `IDEAS.md`.
5. Remove the `decode-result` re-export (`Pack` is now in core's `index.ts`).

---

## Unit test plan

Tests live in each package's existing `tests/` directory using vitest. Coverage target: 80%+.

### Core (`tokenpack`)

**`PackBuilder`:**
- `withFile(path, string)` → entry with UTF-8-encoded bytes.
- `withFile(path, Uint8Array)` → entry with raw bytes.
- `withBuffer(path, bytes)` → equivalent to `withFile` with Uint8Array.
- `withDirectory(path, fn)` — sub-builder entries get prefixed; nested `withDirectory` produces deeper paths.
- `build()` rejects on duplicate path.
- `build()` rejects on `..` path segment, absolute path, leading slash.
- `build()` strips leading `./`.
- Empty builder builds to `[]` (degenerate; `encode([])` → empty pack).

**Pack format — manifest layer:**
- `writePackManifest` + `readPackManifest` round-trip preserves all fields.
- Manifest version mismatch throws a clear error.

**Pack format — encode/decode round-trip:**
- 1 file → 1 region → decode `list = [path]`, `extract(path)` returns identical bytes.
- N files (varied sizes) → decode all, every `extract(path)` returns identical bytes.
- Files with paths containing slashes (`src/a.js`) round-trip.
- Empty file (`bytes.length === 0`) round-trips.
- Large file (1 MB) round-trips correctly across the pixel boundary.

**`Pack` type guards:**
- `FilePack.isPack()` returns `false`; `isDiff()` returns `false`.
- `DirPack.isPack()` returns `true`; `isDiff()` returns `false`.
- `DiffPack.isDiff()` returns `true`; `isPack()` returns `false`.
- TypeScript narrowing works: assigning to the narrowed type after `if (pack.isPack())` compiles cleanly (compile-time test via `tsd` or a manual `// @ts-expect-error` in a test file).

**Convenience methods:**
- `pack.text(path)` returns UTF-8 decoded string.
- `pack.json(path)` parses JSON.
- `pack.blob(path)` returns a Blob with correct byte length.
- `pack.extractAll()` returns all entries; bytes match individual `extract()` calls.

**Diff:**
- `dirPack.diffTo(identical)` produces a diff with no `add` / `modify` ops (only no-op or empty manifest).
- `dirPack.diffTo(modifiedOneFile)` produces exactly one `modify` op.
- `dirPack.diffTo(addedFile)` → one `add` op.
- `dirPack.diffTo(removedFile)` → one `delete` op.
- `dirPack.diffTo(renamedFile)` → one `rename` op (detected by content hash match across paths).
- `diffPack.apply(prev)` reconstructs `next` byte-identical to the original.
- Apply against wrong `prev` (file referenced by `modify` op missing) throws a clear error.

### `@tokenpack/node`

**Encode dispatch:**
- `encode('string content')` → file-format token.
- `encode(uint8array)` → file-format token.
- `encode(builder)` → pack-format token.
- `decode()` of each round-trips correctly.

**`NodePackBuilder`:**
- `withFileSystem('./fixture-file.txt')` → single-file entry with original path.
- `withFileSystem('./fixture-dir')` → all files under dir, recursive.
- `withFileSystem(..., { as: 'renamed' })` → entries appear under remapped path.
- `withFileSystem(..., { exclude: ['*.log'] })` → exclusions honored.
- `withGlob('src/**/*.ts')` → matching files only.
- Mixed: `withFile(..)`+ `withFileSystem(..)` + `withGlob(..)` chained → all entries in result.

**Decode source dispatch:**
- `decode('/path/to/file.png')` → file path read from fs.
- `decode('https://...')` → URL fetched.
- `decode(Buffer)` / `decode(Uint8Array)` / `decode(ArrayBuffer)` → raw bytes.
- `decode(Readable)` → streaming decode.
- `decode(URL)` → explicit URL bypass of sniff.

**Streaming:**
- `decodeStream` consumes a `Readable` and emits `{path, bytes}` events for pack tokens.
- `encodeStream` accepts a builder, emits PNG bytes incrementally.

### `@tokenpack/browser`

**Encode/decode round-trip:**
- `encode('hello')` → `Blob` decode returns `'hello'`.
- `encode(builder)` with multi-file → `decode` returns `DirPack` with correct entries.

**Decode source dispatch:**
- `decode('https://...')` → fetch.
- `decode(blob)` → direct.
- `decode(Uint8Array)` → wrapped in Blob internally.
- `decode(HTMLImageElement)` → canvas extraction.
- `decode(ImageBitmap)` → canvas extraction.
- `decode(ReadableStream)` → streaming decode.

**Pack methods in browser env:**
- `pack.text()` / `pack.json()` / `pack.blob()` work the same as in node.
- `pack.diffTo(other)` returns an `EncodeResult` with browser-specific fields (`blobs`, `objectURL`, `dataURL`, `image`).

### Backward compat

- An old single-file token (no `0x02` discriminator) decodes via the file-format path; `pack.isPack()` is `false`; `pack.content()` returns identical bytes.
- A pre-existing pack-format CART blob (using `packBuffers` / `unpackBuffers`) continues to decode — these are CART format, distinct from the new pack format. Verify a fixture from before the change still decodes via `unpackBuffers`.

---

## Phasing

| Phase | What | Done when |
|---|---|---|
| **1** | New pack format encode/decode + `Pack` type + `PackBuilder` (core) + symmetric `encode` / `decode` (node + browser) | Round-trip tests green; old tokens still decode |
| **2** | `NodePackBuilder` (`withFileSystem` / `withGlob`) | Node fixture tests green |
| **3** | Diff format + `dirPack.diffTo` + `diffPack.apply` (replace-only ops) | Diff tests green; apply produces byte-identical reconstruction |
| **4** | Package surface cleanup (drop subpaths, replace `export *`, rename top-level) | `package.json#exports` matches spec; consumers updated |
| **5** *(deferred)* | Binary delta inside `modify` ops | Opt-in via encoder flag |
| **6** *(deferred, independent track)* | Web Streams `decodeStream` / `encodeStream` | Phase 1 #1 from `IDEAS.md` |

Phase 4 happens after Phases 1–3 because the consumer update (app, benchmark, runtime-experiments) needs the new API to be in place.

---

## Known follow-ups (out of scope for this spec)

- Binary delta algorithm choice (bsdiff vs zstd-dict vs xdelta).
- Pack memory release helper (`pack.release()`) for very large packs where holding decoded pixels is wasteful.
- Optional binary manifest format (replacing JSON) if profiling shows JSON parse cost matters.
- Diff format compaction for many small `delete` / `rename` ops.
- 2D bin packing for region layout (current plan: vertical stack per region).
- The `diffText` / `diffTokens` file-heatmap helpers in `@tokenpack/node`'s top-level — decision punted to cleanup phase (move to `/diff-heatmap` subpath or remove based on dashboard usage).
