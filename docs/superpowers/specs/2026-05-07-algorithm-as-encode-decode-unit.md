# Algorithm as Encode/Decode/Stream Unit — Design Spec

**Date:** 2026-05-07
**Status:** Draft, awaiting review
**Scope:** Pure architectural refactor. No behavior change for existing tokens. Unblocks future algorithms (sidechunk, partial-fetch) that don't fit the `codec + drawer` pattern.

## Goal

Make `AbstractAlgorithm` the unit of encode / decode / stream. Move the dispatch logic currently inlined in `decoder.ts` (and source-loading currently inlined in `@tokenpack/node`/`@tokenpack/browser` top-level entries) into `AbstractAlgorithm` as default implementations. Each algorithm can override any method.

After this refactor:
- Adding a new algorithm = registering it in the catalog. No edits anywhere else.
- `decoder.ts` shrinks to a thin dispatcher: detect algorithm → delegate.
- `encode()` / `decode()` in env packages become thin source-loaders → delegate.
- Streaming is first-class: `encodeStream` / `decodeStream` on every algorithm, with degraded defaults that algorithms can override.

## Non-goals

- No behavior change for existing tokens. Round-trip tests for current algorithms must pass unchanged.
- No public API surface removals. Existing exports (`decode`, `decodeFromBuffer`, `decodeToBuffer`, `encode`, `decodeStream`) keep working — they become thin wrappers around algorithm methods.
- No new algorithm in this phase. Sidechunk lands in a follow-up plan after this refactor merges.

## Current state — why a refactor is needed

`packages/core/src/decoder.ts` currently inlines:

```ts
const codecId = resolveCodecId(image.pixels)         // reads pixel header
const codec   = algorithmCatalog.getById(codecId).codec
const drawer  = pickDrawerForPixels(image.pixels)
return drawer.read(image, { codec })                  // never delegates to algorithm
```

Two coupling points:
1. **Codec ID lives only in pixels.** Any new algorithm whose data isn't in pixels can't be dispatched.
2. **Decode hardcodes `codec.decode + drawer.read`.** Algorithms with no real codec/drawer (e.g. sidechunk uses ancillary chunks) can't fit.

The fix is to push both decisions down into the algorithm. The catalog detects which algorithm owns an artifact; the algorithm owns the rest.

## New shape — `AbstractAlgorithm`

```ts
abstract class AbstractAlgorithm {
  // ── Identity (existing — unchanged) ────────────────────────────────────────
  abstract readonly id, name, title, description, options, capabilities
  abstract toCatalogEntry(): AlgorithmCatalogEntry

  // ── Source detection (new) ─────────────────────────────────────────────────
  /**
   * Optional sniffer. Default: returns true iff `resolvePixelHeaderAlgoId(buffer) === this.id`.
   * Algorithms whose ID isn't readable from pixels (sidechunk reads it from a chunk)
   * override this with a marker check.
   */
  canHandle(buffer: Buffer, ext?: string): boolean { /* default impl */ }

  // ── Encoding (file-flavored) ───────────────────────────────────────────────
  /**
   * Default: encodeBytes → write via this.surface to options.out.
   * Most algorithms inherit this. Sidechunk overrides to bypass codec/drawer.
   */
  async encode(input: EncodeInput, options: EncodeOptions): Promise<EncodeResult> {
    /* default impl */
  }

  // ── Encoding (byte-flavored, browser-safe) ─────────────────────────────────
  abstract encodeBytes(input, options): Promise<EncodedArtifact>

  // ── Decoding (file-flavored) ───────────────────────────────────────────────
  /**
   * Default: load surface pixels → decodeBytes → return buffer.
   */
  async decode(source: DecodeSource, options: DecodeOptions): Promise<Buffer> {
    /* default impl */
  }

  // ── Decoding (byte-flavored, browser-safe) ─────────────────────────────────
  abstract decodeBytes(input, key?): Promise<Buffer>

  // ── Streaming (new) ────────────────────────────────────────────────────────
  /**
   * Default: degraded — collect input, call encodeBytes, emit as a single chunk.
   * Streaming-aware algorithms (zstdpix etc.) override with true pipelining.
   */
  encodeStream(input: ReadableStream<Uint8Array>, options): ReadableStream<Uint8Array> {
    /* default impl */
  }
  decodeStream(source: ReadableStream<Uint8Array>, options): ReadableStream<{path, bytes}> {
    /* default impl */
  }
}
```

## New shape — top-level entry points

`packages/core/src/decoder.ts` shrinks to:

```ts
export async function decodeFromBuffer(buffer: Buffer, key?: string, ext = '.png'): Promise<Buffer> {
  const algo = algorithmCatalog.detectFromBuffer(buffer, ext)
  return algo.decode(buffer, { key, ext })
}
```

`packages/node/src/decode.ts` shrinks similarly:

```ts
export async function decode(source: DecodeSource, options = {}): Promise<Pack> {
  const { bytes, ext } = await loadSource(source)
  const algo = algorithmCatalog.detectFromBuffer(bytes, ext)
  const payload = await algo.decode(bytes, { ...options, ext })
  return fromBytes(payload, /* ... existing wiring ... */)
}
```

`algorithmCatalog.detectFromBuffer(buffer, ext)`:
1. Try `resolvePixelHeaderAlgoId(buffer, ext)` — fast path for existing pixel-header tokens.
2. If that fails or returns an unknown ID, iterate registered algorithms and return the first whose `canHandle(buffer, ext)` returns `true`.
3. Throw with a clear "no algorithm matched this artifact" message.

## What `Algorithm` (existing concrete class) does in the new world

The concrete `Algorithm` class in `packages/core/src/algorithms/algorithm.ts` implements the new defaults using its current logic:
- `decode()`: calls existing `readChunkFromBuffer` + `finalizeChunks` (the old `decoder.ts` content, hoisted into the class).
- `encode()`: calls existing `encodeBytes` + `surface.write` per chunk (the old fs wrapper).
- `canHandle(buffer)`: reads pixel header, matches `algoId`.
- `encodeStream` / `decodeStream`: degraded defaults (collect → encode/decode → emit single chunk).

**No behavior change for any existing algorithm.** Existing tests pass byte-identical.

## Streaming-aware algorithms

`zstdpix` (and any other `isStreamingCodec`) overrides `encodeStream` / `decodeStream` with true pipelined implementations. The byte-level streaming code currently in `tokenpack/stream-decoder` ports to be the override implementation for streaming codecs. Non-streaming algorithms inherit the degraded default (which is fine — `capabilities.streamable === false` already signals this to consumers).

## Migration plan (covered in detail by the implementation plan)

1. Add new methods to `AbstractAlgorithm` with defaults.
2. Hoist current `decoder.ts` logic into `Algorithm.decode` default.
3. Hoist current `algorithm.ts` `encode` logic into `Algorithm.encode` default (already exists as `encode` — minimal change).
4. Add `algorithmCatalog.detectFromBuffer(buffer, ext)`.
5. Rewrite `decoder.ts` exports as thin wrappers calling `algorithm.decode`.
6. Rewrite `@tokenpack/node` `decode()` and `@tokenpack/browser` `decode()` to call `algorithm.decode`.
7. Add `encodeStream` / `decodeStream` defaults; port `zstdpix` streaming code to override.
8. Existing test suites pass — no test changes other than additions.

## Out of scope (covered later)

- The actual sidechunk plugin lands in a separate plan after this merges.
- Range-fetch partial decode (Phase B) lands later still.

## Risks / open questions

1. **`detectFromBuffer` cost** — iterating `canHandle` over many algorithms could be slow. Mitigation: pixel-header check stays as the fast path; per-algorithm sniff is fallback only (currently 1 future algorithm needs it).
2. **Streaming default semantics** — degraded "collect → encode → emit" is technically a stream but defeats the point. Document this clearly so consumers know `capabilities.streamable === false` means "the default isn't a real stream."
3. **Browser `decode.ts` already partially uses algorithm methods** — `algorithm.decodeBytes(pixels, key)`. Confirm this stays working through the refactor.
4. **`decode-stream.ts` is currently free-standing in `@tokenpack/browser`** — needs to migrate into `algorithm.decodeStream` overrides for streaming algorithms.
