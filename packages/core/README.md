# tokenpack

> Encode files into images. Decode them back.

`tokenpack` (the core package) is the env-neutral engine behind the TokenPack
format. It carries the format primitives, codecs, compressors, drawers, and
surface adapters — but ships no fs or DOM bindings. For day-to-day use you
want an env package on top of it:

| Package                                      | Use when                                            |
| -------------------------------------------- | --------------------------------------------------- |
| [`@tokenpack/node`](../node/README.md)       | Node.js — fs / sharp / pngjs / CLI                  |
| [`@tokenpack/browser`](../browser/README.md) | Browser / React — Canvas / `<img>` / Service Worker |

This README covers what TokenPack is, why it exists, and the public API of
the core package itself (for consumers building their own env adapters).

---

## What is TokenPack?

A **container format**: arbitrary bytes are compressed (brotli/deflate) then
written into the pixel data of a PNG/WebP/AVIF. The image is a normal image —
viewable, downloadable, shareable through any pipe that handles images. The
_payload_ is your data.

```
┌──────────────────────────────────────────────────────┐
│ encode(files) → PNG                                  │
│   ┌────────┐   ┌────────┐   ┌─────────┐   ┌──────┐   │
│   │ files  │ → │ archive│ → │compress │ → │ draw │   │
│   └────────┘   └────────┘   └─────────┘   └──────┘   │
│                                                      │
│ decode(PNG) → files                                  │
│   ┌──────┐   ┌─────────┐   ┌────────┐   ┌────────┐   │
│   │ read │ → │decompress│→ │unarchive│→│ files  │   │
│   └──────┘   └─────────┘   └────────┘   └────────┘   │
└──────────────────────────────────────────────────────┘
```

### Why bother?

- **Portable container for AI agents.** Drag a single PNG into Claude Code,
  ChatGPT, or any vision-capable agent and the entire encoded payload — repo
  snapshot, bundled assets, ticket export — comes with it. One file, infinite
  destinations.
- **Streaming wire performance.** Browser-side, PNG decode happens during
  transfer. Bytes arrive → pixels decode → inner brotli inflates →
  application gets the payload, often before the last network byte lands. For
  non-HTTP paths (data URIs, Service Worker cache, IndexedDB, postMessage)
  this is a real perf win because nothing else streams brotli there.
- **Diff-versioned payloads.** A pack and its diff are both regular tokens,
  so v1 ships once as a full image and subsequent updates ship as small diff
  images. Producers and consumers both run the same library.
- **Encrypted "pretty" envelopes.** AES-256-GCM payload optionally encoded
  into a styled image — the ciphertext _is_ the image.

What TokenPack is **not**: a faster compression algorithm. The compression
is brotli/deflate — PNG is the _carrier_. The advantage is _where_ that
carrier works.

---

## Benchmark snapshot

Encoding `react-dom-client.development.js` (≈ 1 MB):

| Format                      |  Wire bytes | Encode (ms) |              Decode (ms) | Notes                                         |
| --------------------------- | ----------: | ----------: | -----------------------: | --------------------------------------------- |
| zip                         |     176,054 |        18.8 |                      4.6 |                                               |
| tar.gz                      |     175,918 |        14.0 |                      1.5 |                                               |
| brotli-11 (raw)             |     134,073 |      1135.3 |                      1.6 | wire-only — needs HTTP `Content-Encoding: br` |
| brotli-6 (raw)              |     155,526 |        12.8 |                      1.5 |                                               |
| **TokenPack `max-png3`**    | **134,447** |           — |                  **8.4** | parity with brotli-11 wire size               |
| **TokenPack `stream-png3`** |     158,099 |           — | 10.9 (first byte at 2.7) | streaming win                                 |

A streaming-PNG token's _first useful byte_ lands while bytes are still
arriving — the 2.7 ms above is time-to-first-byte-of-decoded-payload, not
total transfer + decode. For non-HTTP transports (Service Worker cache,
postMessage, inline data URIs) where brotli isn't decoded by the network
stack, that streaming-overlap is the win TokenPack actually delivers.

Run the benchmark yourself:

```bash
yarn benchmark
```

Results live in `packages/app/benchmark-results/`.

---

## Public API (core)

Most consumers should reach for `@tokenpack/node` or `@tokenpack/browser`
instead. Use `tokenpack` directly only when:

- you're building a third env adapter, or
- you need primitives the env packages don't expose (custom codec / drawer /
  surface registration).

### Top-level exports

```ts
import {
  // Pack types — the unified discriminated union returned by env decode().
  type Pack,
  type FilePack,
  type DirPack,
  type DiffPack,
  type RouterPack,
  type DiffEntry,
  type DiffOpKind,
  type PackEntryInfo,

  // Builder for assembling pack contents.
  PackBuilder,
  type BuilderIntent,
  type PackEntry,

  // Algorithm catalog — codecs registered by env packages.
  algorithmCatalog,
  AlgorithmCatalog,
  getAlgorithmById,
  getAlgorithmByName,
  listAlgorithms,
  listAlgorithmCatalog,

  // Buffer-pure CART archive primitives (env-neutral).
  packBuffers,
  unpackBuffers,
  listArchive,
  isCartArchive,

  // Web Crypto AES-256-GCM helpers.
  encryptData,
  decryptData,
  CRYPTO_OVERHEAD,

  // Per-region compress/decompress helpers (used by env adapters).
  compressRaw,
  decompressRaw,

  // Misc
  finalizeChunks,
} from 'tokenpack'
```

### Pack discriminated union

```ts
type Pack = FilePack | DirPack | DiffPack | RouterPack

// Type guards for narrowing:
if (pack.isRouter()) {
  // pack is RouterPack — manifest token that routes files across chunk tokens
} else if (pack.isPack()) {
  // pack is DirPack — multi-file pack-format token
} else if (pack.isDiff()) {
  // pack is DiffPack — diff-format token, apply with basePack.apply(diffPack)
} else {
  // pack is FilePack — single-payload token
}

// FilePack — single named or anonymous payload
interface FilePack {
  list: string[] // [''] for anonymous, [name] when set
  entries: ReadonlyArray<{ path: string; size: number }>
  isPack(): this is DirPack
  isDiff(): this is DiffPack
  content(): Promise<Uint8Array>
  text(): Promise<string>
  json<T>(): Promise<T>
  blob(): Promise<Blob>
}

// DirPack — multi-file pack-format token with per-file random extract
interface DirPack {
  list: string[]
  entries: ReadonlyArray<{ path: string; size: number }>
  extract(path: string): Promise<Uint8Array>
  text(path: string): Promise<string>
  json<T>(path: string): Promise<T>
  blob(path: string): Promise<Blob>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  diffTo(other: DirPack): Promise<unknown> // env returns its own EncodeResult
  apply(diff: DiffPack): Promise<DirPack>
}

// DiffPack — diff-format token (file-level add/modify/delete/rename ops)
interface DiffPack {
  list: string[]
  entries: ReadonlyArray<DiffEntry>
  // Deprecated compatibility alias; prefer basePack.apply(diffPack).
  apply(prev: DirPack): Promise<DirPack>
}

// RouterPack — router-manifest token that resolves logical files from chunk tokens
interface RouterPack {
  list(): Promise<string[]>
  text(path?: string | string[]): Promise<string | Map<string, string>>
  blob(path?: string | string[]): Promise<Blob | Map<string, Blob>>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  materialize(path?: string | string[]): Promise<void>
  stream: {
    text(path?: string | string[]): Promise<string | Map<string, string>>
    blob(path?: string | string[]): Promise<Blob | Map<string, Blob>>
    extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
    materialize(path?: string | string[]): Promise<void>
  }
}
```

### Router tokens and materialization

Router tokens are the locked design for large browser bundles and harness
experiments. A router token is still a `Pack`: `decode()`, `decodeStream()`,
and `decodeRouter()` all resolve to the same union, and callers narrow with
`pack.isRouter()`.

The core package owns router planning semantics. `encode(new TokenPack().router())`
returns portable encoded artifacts, not filesystem writes. The router token
contains only manifest metadata; chunk PNG tokens contain raw file-segment
payload and no pack-format metadata of their own. With the current pixel-range
chunk algorithm that payload is carried in the PNG `tpAK` range chunk; the
pixels are decoration. The router manifest maps logical files to one or more
chunk segments, which lets runtime APIs choose buffered fetch, streaming fetch,
and bounded parallel loading later.

See the full contract and implementation plan in
[Router Token and Materialization](../../docs/architecture/router-token-and-materialization.md).

### PackBuilder

```ts
import { PackBuilder } from 'tokenpack'

const builder = new PackBuilder()
  .withFile('readme.md', '# title') // string → UTF-8 bytes
  .withBuffer('logo.png', new Uint8Array([0x89, 0x50])) // explicit binary
  .withDirectory('src', sub => {
    sub.withFile('a.ts', '// a')
    sub.withDirectory('utils', u => u.withFile('b.ts', '// b'))
  })

const entries = await builder.build()
// → [{path:'readme.md',bytes:…}, {path:'logo.png',…}, {path:'src/a.ts',…}, {path:'src/utils/b.ts',…}]
```

Path validation at `build()` time:

- forward slashes only (backslashes normalized)
- leading `./` stripped
- `..` segments rejected
- absolute paths rejected
- duplicate paths throw

`@tokenpack/node`'s `NodePackBuilder` extends this with `withFileSystem(path, opts?)`
and `withGlob(pattern, opts?)` for fs-backed inputs.

### Pack format on the wire

```
[ 4 bytes signature 0xc0 0xde 0xae 0x54 ]
[ 1 byte format byte: 0x01 file | 0x02 pack | 0x03 diff ]
[ 4 bytes u32 LE: manifest length ]
[ N bytes: JSON manifest ]
[ regions: per-file compressed payload bytes, sequential ]
```

Anonymous file-format tokens (no `name`) skip the wrapper entirely — they're
just raw payload bytes inside the image, for backward compat with pre-spec
tokens.

### Subpath imports for advanced consumers

| Subpath                             | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `tokenpack/algorithms`              | Algorithm registry + codec composition                               |
| `tokenpack/codecs`                  | Linear codec and codec interfaces                          |
| `tokenpack/compressors`             | Compressor interfaces — env packages register concrete impls         |
| `tokenpack/drawers`                 | Pixel drawer interfaces (dense, dot)                                 |
| `tokenpack/surfaces`                | Surface format adapters (PNG/WebP/AVIF — registered by env packages) |
| `tokenpack/fec`                     | Forward-error-correction (Reed-Solomon)                              |
| `tokenpack/pack-format/encode-pack` | Pack-format byte-stream encoder (no image, no compressor)            |
| `tokenpack/pack-format/decode-pack` | Pack-format byte-stream decoder                                      |
| `tokenpack/pack-format/encode-diff` | Diff op compute + diff-format encoder                                |
| `tokenpack/pack-format/apply-diff`  | Diff applier                                                         |
| `tokenpack/pack/from-bytes`         | Format dispatch — turn payload bytes into a `Pack` handle            |

---

## License

MIT — see [LICENSE](../../LICENSE).
