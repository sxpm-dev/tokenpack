# tokenpack-replay-harness

Playwright-driven harness for measuring TokenPack-based page-load delivery against a baseline, on any target URL.

## Usage

```bash
yarn workspace tokenpack-replay-harness run record public-demo
yarn workspace tokenpack-replay-harness run upload public-demo
yarn workspace tokenpack-replay-harness run benchmark public-demo FAST_4G 10
```

See `docs/superpowers/specs/2026-05-05-tokenpack-replay-harness-poc-design.md`.

## Variant Matrix

The harness separates **encoding family** from **runtime loading policy**. One
encoding family can support several runtime policies; this is especially true
for `pixel-range-none`, where the token is byte-addressable through HTTP Range
requests.

### Encoding families

| Family | Current variant(s) | Token algo config | Stream flag | Runtime policies |
|---|---|---|---|---|
| `linear-deflate` | `linear-deflate-c3` | `algo=linear-deflate`, `channels=3`, `packCompressor=deflate-9` | buffered | whole pack buffered fetch + decode |
| `linear-stream-deflate` | `linear-stream-deflate-c4` | `algo=linear-stream-deflate`, `channels=4`, `packCompressor=deflate-9` | streaming | whole pack fetch + streaming decode |
| `pixel-range-stream-deflate` | `pixel-range-stream-deflate-c3` | `algo=pixel-range-stream-deflate`, `channels=3`, `packCompressor=deflate-9` | streaming | whole token streaming fetch, then file extraction on demand |
| `pixel-range-none` | `pixel-range-none-*` | `algo=pixel-range-none`, `channels=3`, `packCompressor=deflate-9` | depends on runtime policy | HTTP Range access to pack file regions |

### `pixel-range-none` runtime policies

These variants use the same encoded token shape and differ only in when/how
the replay runtime fetches byte ranges.

| Runtime policy | Current variant | Fetch style | Trigger | What is fetched |
|---|---|---|---|---|
| one file on demand | `pixel-range-none-range-fetch` | buffered | app requests a tokenized file | one requested file region |
| one file on demand | `pixel-range-none-range-stream` | streaming | app requests a tokenized file | one requested file region |
| touched pack, all files | `pixel-range-none-range-fetch-all` | buffered | first app request for a pack | all file regions in that pack |
| touched pack, all files | `pixel-range-none-range-stream-all` | streaming | first app request for a pack | all file regions in that pack |
| short request window | `pixel-range-none-range-stream-batch` | streaming | app requests files close together | requested file regions grouped into shared Range streams |
| all packs in parallel | planned: `pixel-range-none-range-fetch-all-packs` | buffered | first tokenized request or explicit prewarm | all files in all split bundle packs |
| all packs in parallel | planned: `pixel-range-none-range-stream-all-packs` | streaming | first tokenized request or explicit prewarm | all files in all split bundle packs |

The `all-packs` policies are intended for split bundle fixtures such as
`--bundle-chunks=20`: they test whether several medium token chunks fetched in
parallel behave better than one very large token or purely app-driven chunk
loading.

### Runtime strategy pseudocode

Reports show this same pseudocode under the selected variant. The intent is to
make every waterfall readable from the algorithm shape, not from memory.

#### `linear-deflate-c3` / `full`

```ts
const packCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const pack = await memo(packCache, packId, async () => {
    const response = await nativeFetch(packUrl(packId))
    return decode(await response.blob())
  })

  return new Response(await pack.text(path))
}
```

#### `linear-stream-deflate-c4` / `stream`

```ts
const packCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const pack = await memo(packCache, packId, async () => {
    const response = await nativeFetch(packUrl(packId))
    return decodeStream(response.body)
  })

  return new Response(await pack.text(path))
}
```

#### `pixel-range-none-range-fetch`

```ts
const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  return new Response(await memo(fileCache, url, async () => {
    const bytes = await fetchPackFile(remote, path) // buffered Range
    return text(decompress(bytes))
  }))
}
```

#### `pixel-range-none-range-stream`

```ts
const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  return new Response(await memo(fileCache, url, async () => {
    const file = await fetchPackFileStream(remote, path) // streaming Range
    return text(await readStream(file.stream))
  }))
}
```

#### `pixel-range-none-range-fetch-all`

```ts
const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  if (!started(packId)) {
    const allFiles = fetchPackFilesCompressed(remote, remote.allPaths()) // buffered Ranges
    createLazyFilePromises(fileCache, allFiles)
    materializeRemainingFilesInRaf(fileCache)
  }

  return new Response(await fileCache.get(path)) // resolves when this file is ready
}
```

#### `pixel-range-none-range-stream-all`

```ts
const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  if (!started(packId)) {
    const streams = fetchPackFilesStream(remote, remote.allPaths()) // streaming Ranges
    createFilePromises(fileCache, streams)
  }

  return new Response(await fileCache.get(path)) // each file resolves from its stream
}
```

#### `pixel-range-none-range-stream-batch`

```ts
const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  return new Response(await memo(fileCache, url, () => {
    queueForTinyWindow(packId, path)
    return batchPromise(packId, path) // grouped fetchPackFilesStream(...)
  }))
}
```

#### `router-pixel-range-none-materialize`

```ts
let router
const fileCache = new Map()

async function fetch(url) {
  const { path } = manifest.lookup(url)
  router ??= await decodeRouter(routerTokenUrl())

  return new Response(await memo(fileCache, url, () => {
    return router.text(path, { strategy: 'auto' })
  }))
}
```

### First-pass experiment shape

For exploration runs, test every current variant across a small set of fixture
shapes, then prune to the winners. A useful first sweep is:

| Fixture shape | Purpose |
|---|---|
| service-grouped packs | closest to production ownership and natural package boundaries |
| single bundle | upper-bound stress case for one huge token |
| bundle split into 20 chunks | tests parallel medium chunks without changing captured assets |

Run enough samples to avoid one-off noise, but keep the first sweep bounded:
start with 3 samples per fixture shape, inspect the report/waterfalls, then run
10 samples only for the promising 3-4 variants and fixture shapes.

## Auth

Two mechanisms are supported.

### storageState (cookies + localStorage)

```bash
yarn workspace tokenpack-replay-harness run login <target>
```

Opens a headed Chromium pointed at `target.url`. Log in manually, then return to the terminal and press ENTER. The harness writes the auth state to `session-storages/<id>.json` (outside `fixtures/` so wiping the fixture dir doesn't take auth with it). Subsequent `record` and `benchmark` runs read it automatically.

### Extra HTTP headers

For targets that need a static `Authorization` header or similar, set `extraHeaders` on the `TargetConfig`. Values are merged via `context.setExtraHTTPHeaders` and applied to all outgoing requests for the run.

### Security

- Captured pack files are uploaded to the configured S3 bucket. Header scrubbing (allowlist in `src/encode/header-scrubber.ts`) strips `Set-Cookie`, `Authorization` echo, and any header not on the allowlist before bytes are written.
- Auth state files (`session-storages/*.json`) are gitignored.
