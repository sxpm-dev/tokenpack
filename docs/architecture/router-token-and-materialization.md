# Router Token and Materialization

Status: locked design, pending implementation.
Date: 2026-05-13

## Goal

Router tokens let TokenPack represent a browser asset graph as one entry token plus
one or more chunk tokens. The router owns all placement metadata. Chunk tokens are
raw byte segment containers. Decode/materialization APIs then decide how to load,
decode, concatenate, and execute routed assets.

This feature is intended to be implemented in the core/node/browser packages first.
Replay harness integration is explicitly deferred until the feature implementation
is complete.

## Public Encode Model

The user-facing encode entry remains:

```ts
await encode(new TokenPack().router())
await encode(new TokenPack().router({ chunks }))
```

`encode(new TokenPack().router(...))` returns portable artifacts:

```ts
type EncodedTokenArtifact = {
  filename: string
  mimetype: string
  blob: Blob
}
```

`encode` is not filesystem-bound. Node callers may write artifacts to disk.
Browser callers may create object URLs, upload blobs, or keep artifacts in memory.

Core owns the router planning semantics. Node and browser may expose environment
adapters, but they must not duplicate chunking policy.

## Router Defaults

For now, router encode is self-driven. Callers should not need to pass algorithm
options for the default path.

Default router entry token:

```ts
routerAlgo: 'linear-stream-deflate'
routerChannels: 3
```

The router token is fetched as a whole entry token. It contains metadata only, so
pixel-range does not provide meaningful value for the router token itself.

Default chunk token:

```ts
chunkAlgo: 'pixel-range-none'
chunkChannels: 3
chunkDecoration: {
  kind: 'gradient',
  size: 8,
  colorFrom: '#ff5050',
  colorTo: '#5050ff',
}
```

Chunk tokens are stream-capable so runtime can choose fetch or stream at decode
time. The token format should not force that decision.

## Chunk Tokens Have No Metadata

Router chunk tokens store only raw segment bytes. They are not `PackBuilder`
directory packs and do not contain pack-format file metadata.

All file routing metadata belongs to the router manifest.

Because the chunk algorithm is hardcoded for now, the router manifest does not
need to store per-chunk algorithm metadata.

Minimal chunk entry:

```ts
interface RouterChunkManifestEntry {
  id: string
  href: string
  byteLength?: number
}
```

File metadata owns segment placement:

```ts
interface RouterFileManifestEntry {
  url: string
  path: string
  status: number
  headers: Readonly<Record<string, string>>
  byteLength: number
  segments: RouterFileSegment[]
}

interface RouterFileSegment {
  chunkId: string
  offset: number
  length: number
  fileOffset: number
}
```

For the first implementation, each chunk token usually contains exactly one
segment, so `offset` is normally `0`. Keeping `offset` in the manifest preserves
room to pack multiple small segments into one chunk token later.

## Chunk Planning Policy

Default policy:

```ts
targetChunkBytes = 1 * 1024 * 1024
maxSegmentsPerFile = 5
```

The target is measured in raw decoded source bytes before chunk-token compression.

Effective segment size:

```ts
segmentBytes = Math.max(
  targetChunkBytes,
  Math.ceil(fileBytes / maxSegmentsPerFile),
)

segmentBytes = roundUpToNiceSize(segmentBytes)
```

This prevents a very large logical file from producing too many requests. For
example, a roughly 50 MiB file should produce about five chunk-token requests,
not fifty.

Small files may share chunk boxes up to `targetChunkBytes`. Large files are split
into at most `maxSegmentsPerFile` segments by default.

The first implementation can keep the planner simple:

1. Preserve source/build order.
2. Split large files by the adaptive segment size.
3. Fill shared chunk boxes with small files up to `targetChunkBytes`.
4. Emit one raw-byte chunk token per chunk box.
5. Record every logical file's segment list in the router manifest.

## Public Decode Model

`RouterPack` is a `Pack` implementation, not a separate top-level response type:

```ts
type Pack = FilePack | DirPack | DiffPack | RouterPack
```

All decode functions return `Promise<Pack>`:

```ts
decode(source): Promise<Pack>
decodeStream(source): Promise<Pack>
decodeRouter(source): Promise<Pack>
```

Semantics:

```ts
decode(source)
```

Fetch/read the full entry token, decode it, and return the discovered pack.

```ts
decodeStream(source)
```

Stream the entry token where supported, decode it, and return the discovered pack.

```ts
decodeRouter(source)
```

Decode the entry token and require it to be a router. Throw if the decoded token
is not a router token.

This keeps the API explicit while still returning the same `Pack` family from all
decode paths.

## Decode Sources and Router Base

Current source shapes remain sensible:

Browser:

```ts
decode(stringUrl)
decode(Blob)
decode(ArrayBuffer)
decode(Uint8Array)
decode(HTMLImageElement)
decode(ImageBitmap)
```

Node:

```ts
decode(pathString)
decode(urlString)
decode(URL)
decode(Buffer)
decode(Uint8Array)
```

Router decode requires a base location so chunk `href` values can be resolved:

```ts
decodeRouter('/bundle/router.png')
decodeRouter('https://example.com/bundle/router.png')
decodeRouter(routerBlob, { baseUrl: '/bundle/router.png' })
decodeRouter(routerBytes, { baseUrl: 'file:///tmp/bundle/router.png' })
```

URL strings, node filesystem paths, and `file://` URLs have natural bases. Blob,
buffer, image, and bitmap sources must provide `baseUrl` when used as router
entry tokens.

## Pack Methods and Streaming Facade

Pack methods stay ergonomic:

```ts
const p = await decodeRouter('/bundle/router.png')

await p.list()
await p.text('/big.js')
await p.blob('/style.css')
await p.extractAll()
await p.materialize()
```

Streaming is exposed as a pack capability, not only as a top-level decoder:

```ts
await p.stream.text('/big.js')
await p.stream.blob('/style.css')
await p.stream.extractAll()
await p.stream.materialize()
```

For router packs, `p.stream.*` streams routed chunk tokens. It does not mean the
router entry token itself was streamed.

## Router Chunk Loading Strategy

The chunk token format is stream-capable. Runtime decides whether to fetch or
stream each chunk.

Initial auto policy:

```ts
if (!DecompressionStream) use fetch
if chunk is small use fetch
if chunk is large use stream
if many chunks are loaded, use bounded parallel streaming
```

Initial runtime knobs:

```ts
streamDecodedChunkBytesThreshold = 512 * 1024
maxParallelChunks = 6
maxParallelPerFile = 5
```

Fast/local networks often make fetch competitive for small chunks. Slow networks
and large chunks benefit from streaming because decode can overlap download and
peak memory is lower. High latency primarily punishes request count, which is why
`maxSegmentsPerFile = 5` is part of the encode policy.

## Adaptive Router Load Planner

Router tokens should not mean "parallel everything". A router token is a control
plane: the pack runtime owns the loading plan and chooses the cheapest shape for
the current request, payload, and environment.

The benchmark harness and app pages must call normal pack APIs:

```ts
await p.text()
await p.text(['/app.js', '/style.css'])
await p.stream.text()
await p.materialize()
```

They must not encode custom router loading policy. The router pack should plan
internally from the requested paths, manifest, compressed byte sizes, chunk
layout, runtime capabilities, and eventually measured benchmark/profile data.

Planner output should be explicit and inspectable:

```ts
type RouterLoadPlan =
  | {
      kind: 'whole-chunks'
      chunks: RouterChunkManifestEntry[]
    }
  | {
      kind: 'merged-ranges'
      ranges: RouterChunkRange[]
    }
  | {
      kind: 'parallel-segments'
      segments: RouterPlannedSegment[]
      concurrency: number
    }
  | {
      kind: 'single-merged'
      ranges: RouterChunkRange[]
    }
```

Initial adaptive rules:

```ts
if (allFilesRequested && selectedCompressedBytes < 512 * 1024) {
  return planSingleMergedOrWholeChunks()
}

if (allFilesRequested && manyFilesShareChunks) {
  return planWholeChunksOnceAndSliceLocally()
}

if (selectedCompressedBytes > 2 * 1024 * 1024 && networkIsParallelFriendly) {
  return planParallelSegments({ concurrency: 4 })
}

if (segmentsAreAdjacentOrClose) {
  return planMergedRanges()
}

return planFewestWholeChunks()
```

Important rules:

- Fetch a chunk only once for all-files reads, then slice file segments locally.
- Merge adjacent ranges when the gap is cheaper than another request.
- Use bounded parallelism, not unlimited per-file or per-segment requests.
- If a requested range covers the whole chunk payload, use a normal full GET
  instead of a byte-range request.
- Keep exact-file reads as exact as possible unless the planner can prove a
  cheaper equivalent plan.
- Keep strategy selection inside pack, not in Browser Fetch Bench or replay
  harness code.

First strategy thresholds are deliberately conservative:

```ts
smallCompressedBytes = 512 * 1024
largeCompressedBytes = 2 * 1024 * 1024
maxParallelChunkRequests = 4
maxParallelChunkRequestsOnFastLocal = 2
mergeRangeGapBytes = 16 * 1024
```

These are not API contracts. They are starter heuristics that should be tuned by
Browser Fetch Bench and replay-harness results. The public contract is that pack
chooses and executes the plan.

## Router Decode Algorithm

To read one logical file:

1. Decode the router entry token.
2. Resolve the logical file by URL or path.
3. Read its ordered `segments`.
4. Fetch/decode required chunk tokens.
5. Slice `offset:length` from each decoded chunk.
6. Place each segment at `fileOffset`.
7. Return or materialize the assembled logical file bytes.

Path lookup must handle overlapping file names. A path is valid only when it maps
to one routed file. If multiple routed files share the same path, callers must use
the full URL.

## Implementation Plan

### Phase 1: Core Manifest and Planning

- Update router manifest types to segment-based file metadata.
- Add core planner defaults:
  - `targetChunkBytes = 1 MiB`
  - `maxSegmentsPerFile = 5`
  - router token algorithm default metadata
  - chunk token algorithm/decor defaults
- Implement planner that converts `TokenPack` entries or explicit chunks into
  router chunks plus file segment metadata.
- Keep chunk algorithm hardcoded out of manifest for now.

### Phase 2: Node Encode Adapter

- Make node router encode call the core planner.
- Encode router entry token with `linear-stream-deflate`, `channels: 3`.
- Encode each raw chunk byte box with `pixel-range-none`, `channels: 3`,
  `8x8` gradient decoration. The logical file bytes are already compressed
  before segmentation, so the chunk PNG must not add outer compression; that
  keeps segment offsets equal to byte ranges inside the PNG `tpAK` payload.
- Return `EncodedTokenArtifact[]`.
- Do not write files inside `encode`.

### Phase 3: Browser Decode Adapter

- Ensure `decode`, `decodeStream`, and `decodeRouter` all return `Promise<Pack>`.
- Implement `RouterPack` as a `Pack` variant.
- Implement segment-based `text`, `blob`, `content`, `load`, `loadAll`, and
  `materialize`.
- Add `p.stream.*` facade for forced stream loading.
- Keep default `p.text`/`p.blob` on auto strategy.

### Phase 4: Node Decode Adapter

- Add/align `decodeRouter` for node sources.
- Resolve chunk hrefs relative to URL, `file://`, or filesystem path sources.
- Implement segment assembly for node buffers/files/URLs.

### Phase 5: Tests

- Core planner tests:
  - small files group into chunk boxes
  - large files split into at most five segments
  - segment metadata reconstructs original bytes
  - overlapping paths require URL disambiguation
- Node encode/decode tests:
  - router artifacts are filesystem-free
  - chunk artifacts contain raw segment bytes, not pack metadata
  - decodeRouter reconstructs large split files
- Browser tests:
  - `decodeRouter(url).text(path)`
  - `decodeRouter(url).stream.text(path)`
  - `materialize()` executes JS and inserts CSS
  - blob/buffer router sources require `baseUrl`

### Phase 6: App Playground and Browser Fetch Bench

- Update Browser Fetch Bench router group to use the new public router API.
- Add a small playground page for inspecting router manifests, segment counts,
  chosen strategy, and per-file reconstruction timing.
- Do not regenerate fixtures automatically in implementation scripts.

### Deferred: Replay Harness

Do not update replay harness implementation until the core/node/browser feature
is complete and verified.
