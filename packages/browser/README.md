# @tokenpack/browser

Browser/DOM/React adapter for [TokenPack](../core/README.md). Decodes via
Canvas + `createImageBitmap`, encodes via `OffscreenCanvas.convertToBlob` (or
`canvas.toBlob` fallback), and uses native `CompressionStream`/`DecompressionStream`
for inner brotli/deflate.

```bash
yarn add @tokenpack/browser   # workspace pkg, installs from local sources
```

## What you get

- `encode` / `decode` — same shape as `@tokenpack/node`, returns Blob + dataURL + objectURL + a hot `<img>`.
- `PackBuilder` for assembling pack contents (no fs methods — those live in node).
- React components: `<TokenImage>` (consume payload), `<TokenAsImage>` (render encoded image as `<img>`).
- React hook: `useTokenPack(src)`.
- Streaming PNG decode (`@tokenpack/browser/decodeStream`).
- Service Worker helper, `postMessage` transport, inline data-URI helper on dedicated subpaths.
- Router-token materialization uses the shared core contract; browser supplies
  URL/blob/image decoding plus DOM execution for JS and CSS assets.

---

## Quick examples

### Encode + decode a single payload

```ts
import { encode, decode } from '@tokenpack/browser'

const r = await encode('hello world') // string is encoded as UTF-8
const pack = await decode(r.blobs[0])
if (!pack.isPack() && !pack.isDiff()) {
  console.log(await pack.text()) // → "hello world"
}

// `r` exposes multiple ways to consume the result:
//   r.blobs       — Blob[] (one per chunk; usually one)
//   r.bytes       — Uint8Array view of blobs[0]
//   r.objectURL   — URL.createObjectURL(blobs[0])
//   r.dataURL     — base64 data:image/png URL
//   r.image       — detached HTMLImageElement; drop into the DOM
```

### Encode a multi-file pack via builder

```ts
import { encode, decode, PackBuilder } from '@tokenpack/browser'

const r = await encode(
  new PackBuilder()
    .withFile('config.json', JSON.stringify({ version: 1 }))
    .withFile('hello.txt', 'hi')
    .withDirectory('assets', sub => {
      sub.withBuffer('logo.png', logoBytes)
    }),
)

// Drop into the DOM — it's a normal PNG.
document.body.append(r.image)

// Or decode + iterate later:
const pack = await decode(r.blobs[0])
if (pack.isPack()) {
  console.log(pack.list) // ['config.json', 'hello.txt', 'assets/logo.png']
  const config = await pack.json('config.json')
}
```

### Decode anything

```ts
await decode('/api/snapshot.png') // URL → fetch + decode
await decode(blob) // Blob (e.g. <input type="file">)
await decode(uint8Array)
await decode(arrayBuffer)
await decode(htmlImageElement) // already-rendered <img>
await decode(imageBitmap)
```

### React component — consume payload

```tsx
import { TokenImage } from '@tokenpack/browser/components'

;<TokenImage
  src="/data.png"
  fallback={<Spinner />}
  onDecoded={async pack => {
    if (pack.isPack()) {
      const config = await pack.json('config.json')
      // …
    } else if (!pack.isDiff()) {
      console.log(await pack.text())
    }
  }}
/>
```

### React component — render encoded image as `<img>`

```tsx
import { TokenAsImage } from '@tokenpack/browser/components'

// Use when the payload IS itself an image (e.g. screenshot encoded as TokenPack).
;<TokenAsImage src="/encoded-screenshot.png" alt="screenshot" />
```

### React hook

```tsx
import { useTokenPack } from '@tokenpack/browser/hooks'

function Profile({ src }: { src: string }) {
  const { state, data, error } = useTokenPack(src)

  if (state === 'loading') return <Spinner />
  if (state === 'error') return <ErrorView error={error!} />
  if (data?.isPack()) return <PackTree pack={data} />
  if (data && !data.isDiff()) return <Bytes pack={data} />
  return null
}
```

### Diff round-trip in browser

```ts
import { encode, decode, PackBuilder } from '@tokenpack/browser'

const v1 = await encode(new PackBuilder().withFile('a.js', 'aa').withFile('b.js', 'bb'))
const v2 = await encode(new PackBuilder().withFile('a.js', 'AA').withFile('c.js', 'cc'))

const prev = await decode(v1.blobs[0])
const next = await decode(v2.blobs[0])

if (prev.isPack() && next.isPack()) {
  const diffResult = await prev.diffTo(next) // EncodeResult — same shape as encode()
  // ship diffResult.blobs[0] over the wire; on the receiver:
  const diffPack = await decode((diffResult as { blobs: Blob[] }).blobs[0])
  if (diffPack.isDiff()) {
    const reconstructed = await prev.apply(diffPack)
  }
}
```

### Streaming PNG decode

```ts
import { decodeStream } from '@tokenpack/browser'

const response = await fetch('/big-pack.png')
const pack = await decodeStream(response.body!) // pulls bytes as they arrive
```

For non-PNG (WebP/AVIF) the helper transparently falls back to the buffered
`decode()` path (no streaming WebP decoder exists in browsers today).

### Router tokens and materialization (locked target contract)

Router tokens let the browser load a bundle entry token plus related chunk
tokens from the same base URL. The router is still a `Pack`, so normal decode
entry points return the same union and callers narrow with `pack.isRouter()`:

```ts
const pack = await decode('/bundle/router.png')
const streamed = await decodeStream('/bundle/router.png')
const router = await decodeRouter('/bundle/router.png')
```

`decodeRouter()` is explicit: it fetches/processes the router entry token,
throws if it is not a router token, and resolves chunk hrefs relative to the
router URL. Blob, buffer, image, and bitmap router sources need an explicit
base URL when relative chunks are present.

Router chunk files are still PNG artifacts. For the current pixel-range chunk
algorithm, the segment payload is stored in the PNG `tpAK` range chunk; pixels
are decoration and the router manifest remains the only file metadata owner.

Router packs expose the materialization API that gives TokenPack control over
how assets are loaded and decoded:

```ts
await router.list()
await router.text('/app.js')
await router.blob('/styles.css')
await router.extractAll()
await router.materialize()
await router.stream.text('/big.js')
await router.stream.extractAll()
await router.stream.materialize(['/app.js', '/styles.css'])
```

`materialize()` executes frontend assets: CSS is inserted into the document,
and JS is executed by the runtime. `text()`, `blob()`, and `extractAll()`
return content without execution. The `stream.*` facade streams chunk tokens
where useful; it does not change whether the router entry token itself was
decoded by `decode()` or `decodeStream()`.

See the canonical design in
[Router Token and Materialization](../../docs/architecture/router-token-and-materialization.md).

---

## API surface

### Top-level

| Symbol                              | Notes                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `encode(content \| builder, opts?)` | string / Uint8Array / ArrayBuffer / Blob / `PackBuilder`                              |
| `decode(source, opts?)`             | URL string / Blob / Uint8Array / ArrayBuffer / HTMLImageElement / ImageBitmap         |
| `decodeStream(source, opts?)`       | ReadableStream / Blob / URL string                                                    |
| `inspect(source, opts?)`            | Returns the algorithm binding + (optional) pixel-header info for a token              |
| `PackBuilder`                       | re-exported from core                                                                 |
| Pack types                          | `Pack`, `FilePack`, `DirPack`, `DiffPack`, `RouterPack`, `DiffEntry`, `DiffOpKind`, `PackEntryInfo` |

### Subpath imports

| Subpath                         | Exports                          |
| ------------------------------- | -------------------------------- |
| `@tokenpack/browser/components` | `<TokenImage>`, `<TokenAsImage>` |
| `@tokenpack/browser/hooks`      | `useTokenPack`                   |

### Encode options

```ts
interface EncodeBrowserOptions {
  algo?: string // catalog algorithm name; default 'linear'
  compressor?: string // per-file compressor for PackBuilder; default 'deflate-9'
  algoOptions?: {
    // nested per-component overrides
    compressor?: { level?: number }
    surface?: { channels?: 1 | 2 | 3 | 4 }
  }
  key?: string // AES-256-GCM passphrase
  name?: string // file-format only — wraps payload with name
}
```

### Decode options

```ts
interface DecodeOptions {
  key?: string
  compressor?: string // used when produced pack later calls diffTo()
}
```

### Browser-safety

The package is bundle-clean: zero `node:*` imports. Verify locally:

```bash
yarn workspace @tokenpack/browser verify:browser
```

---

## License

MIT — see [LICENSE](../../LICENSE).
