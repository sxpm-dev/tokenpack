# @tokenpack/node

Node.js adapter for [TokenPack](../core/README.md). Adds fs / sharp / pngjs
bindings on top of the env-neutral core, plus a CLI binary.

```bash
yarn add @tokenpack/node      # workspace pkg, installs from local sources
```

## What you get

- `encode` / `decode` — single entry points handling files, paths, URLs, builders.
- `PackBuilder` (re-exported) + `NodePackBuilder` with fs/glob methods.
- Pack-format diff via `dirPack.diffTo(other)` and `basePack.apply(diffPack)`.
- AVIF/WebP encoding via [sharp](https://sharp.pixelplumbing.com/).
- PNG (including streaming-PNG) via [pngjs](https://www.npmjs.com/package/pngjs).
- Per-region brotli/deflate via Node's `zlib`.
- Router-token work uses the shared core contract; node only supplies fs/URL
  resolution and optional writes around portable encoded artifacts.

---

## Quick examples

### Encode a single file

```ts
import { encode, decode } from '@tokenpack/node'

// Anonymous bytes — list[0] is empty string on decode.
const r = await encode(Buffer.from('hello world'))
const pack = await decode(r.bytes)
if (!pack.isPack() && !pack.isDiff()) {
  console.log(await pack.text()) // → "hello world"
}

// Named single-file token — list[0] is your name.
const named = await encode(Buffer.from('hi'), { name: 'greeting.txt' })
const namedPack = await decode(named.bytes)
if (!namedPack.isPack()) {
  console.log(namedPack.list) // → ['greeting.txt']
}
```

### Encode a directory (legacy CART path)

```ts
const r = await encode('./src') // string = fs path; reads dir, packs as CART
await fs.promises.writeFile('./src.png', r)
```

### Encode with the builder (per-file random access)

```ts
import { encode, decode, NodePackBuilder } from '@tokenpack/node'

const r = await encode(
  new NodePackBuilder()
    .withFile('readme.md', '# my pack')
    .withFileSystem('./src', { exclude: ['*.test.ts'] })
    .withGlob('docs/**/*.md'),
)

const pack = await decode(r.bytes)
if (pack.isPack()) {
  console.log(pack.list) // every file path
  const main = await pack.text('readme.md') // → '# my pack'
  const config = await pack.json<{ port: number }>('config.json')
  for (const path of pack.list) {
    const bytes = await pack.extract(path)
    // …do something with each file
  }
}
```

### Decode a URL or file

```ts
const remote = await decode('https://example.com/asset.png')
const local = await decode('./tokens/snapshot.png')
const fileURL = await decode(new URL('file:///abs/path/x.png'))
const buf = await decode(Buffer.from(/* …token bytes… */))
```

### Diff two pack tokens

```ts
import { encode, decode, PackBuilder } from '@tokenpack/node'

const v1 = await encode(new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'))
const v2 = await encode(new PackBuilder().withFile('a.js', 'AA').withFile('c.js', 'cc'))

const prev = await decode(v1.bytes)
const next = await decode(v2.bytes)

if (!prev.isPack() || !next.isPack()) throw new Error('expected DirPacks')

const diffResult = await prev.diffTo(next) // EncodeResult
const diffPack = await decode((diffResult as { bytes: Uint8Array }).bytes)
if (diffPack.isDiff()) {
  console.log(diffPack.entries.map(e => `${e.op} ${e.path}`))
  // → ['modify a.js', 'add c.js', 'delete b.js']

  // Apply the diff against the original prev to reconstruct next:
  const reconstructed = await prev.apply(diffPack)
}
```

### Encrypted packs

```ts
const r = await encode(new PackBuilder().withFile('secret.txt', 'classified'), {
  key: 'super-secret-passphrase',
})

const pack = await decode(r.bytes, { key: 'super-secret-passphrase' })
```

(Wrong key throws; not passing one when required throws.)

### Streaming decode (Node Duplex)

```ts
import { decodeStream } from '@tokenpack/node'
import { createReadStream } from 'node:fs'

const stream = createReadStream('./snapshot.png').pipe(decodeStream())
stream.on('data', chunk => /* … */ undefined)
```

### Router tokens (locked target contract)

Router tokens are designed in core and exposed by env adapters without custom
chunking policy in node. Encoding a routed pack returns portable artifacts:

```ts
const artifacts = await encode(new TokenPack().router())
// → Array<{ filename: string; mimetype: string; blob: Blob }>
```

The node adapter can write those artifacts to disk, but the encode result is
not filesystem-bound. Decode entry points stay explicit:

```ts
const pack = await decode('/bundle/router.png')
const streamed = await decodeStream('/bundle/router.png')
const router = await decodeRouter('/bundle/router.png')
```

All three return the same `Pack` union. `decodeRouter()` requires the entry
token to be a router token and uses the source path or URL as the base for
relative chunk hrefs.

Router chunks are PNG artifacts, but they are not full pack-format file
tokens. The router manifest owns the file metadata; pixel-range chunks carry
only the raw segment payload in the PNG range chunk.

See the canonical design in
[Router Token and Materialization](../../docs/architecture/router-token-and-materialization.md).

---

## API surface

### Top-level

| Symbol                              | Notes                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `encode(content \| builder, opts?)` | string=fs path / Buffer / Uint8Array / `PackBuilder`                                                |
| `decode(source, opts?)`             | string=fs path or http/https/file URL / Buffer / Uint8Array / URL                                   |
| `PackBuilder`                       | re-exported from core                                                                               |
| `NodePackBuilder`                   | adds `withFileSystem(path, opts?)` + `withGlob(pattern, opts?)`                                     |
| `decodeStream`                      | Node Duplex streaming decoder (PNG-only)                                                            |
| Pack types                          | `Pack`, `FilePack`, `DirPack`, `DiffPack`, `RouterPack`, `DiffEntry`, `DiffOpKind`, `PackEntryInfo` |
| Codecs / surfaces / compressors     | `ZstdpixCodec`, `PngSurface`, `WebpSurface`, `AvifSurface`, `BrotliCompressor`, `DeflateCompressor` |
| Diff helpers (heatmap)              | `diff(a, b).text() / .token(out)`                                                                   |

### Encode options

```ts
interface EncodeNodeOptions {
  algo?: string // catalog algorithm name; default 'linear'
  out?: string // also write to disk
  algoOptions?: {
    // nested per-component overrides
    compressor?: { level?: number }
    surface?: { channels?: 1 | 2 | 3 | 4 }
  }
  key?: string // AES-256-GCM passphrase

  // Pack-format only (when input is PackBuilder):
  compressor?: string // per-file compressor; default 'brotli-11'

  // File-format only:
  name?: string // wraps payload so decode surfaces this name
}
```

### Decode options

```ts
interface DecodeOptions {
  key?: string // decryption key for encrypted tokens
  compressor?: string // used when produced pack later calls diffTo()
}
```

---

## CLI

```bash
yarn workspace tokenpack-cli run tokenpack pack ./src -o my.png
yarn workspace tokenpack-cli run tokenpack open my.png ./extracted/
yarn workspace tokenpack-cli run tokenpack diff-pack v1.png v2.png -o diff.png
yarn workspace tokenpack-cli run tokenpack apply-diff <id> diff.png
```

---

## License

MIT — see [LICENSE](../../LICENSE).
