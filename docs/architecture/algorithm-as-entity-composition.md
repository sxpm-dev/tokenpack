# Algorithm = composition of entities

## The principle

A TokenPack `Algorithm` is **not** a free-standing pipeline that knows how
to encode/decode. It is a **composition of four (or five) entities** with a
fixed contract:

```
Algorithm = function(Codec, Compressor, Drawer, Surface, [Fec])
            { encode(bytes), decode(bytes), decodeStream(stream), … }
```

Each entity owns its own implementation. The algorithm orchestrates by
delegating to entities — **never** by reaching past them or re-implementing
their job inline.

## What each entity owns

| Entity | Owns |
|---|---|
| **Codec** | Pixel layout. Maps `bytes ↔ pixel grid`. Knows nothing about file containers, compression, or HTTP. Some codecs implement `StreamingCodec` (per-row decode); others are buffered. |
| **Compressor** | Bytes-level compression. `compress(bytes) / decompress(bytes)` and the streaming variants. Knows nothing about PNG, codecs, or pixels. |
| **Drawer** | How pixels lay out in 2D space (dense rows vs dotted cells). Affects width/height calculations, never bytes. |
| **Surface** | The **container format**: PNG / WebP / AVIF / streaming-PNG / png-upng / etc. Owns `read*` / `write*` / `decodeStream`. Knows how to extract pixel data from container bytes (and vice-versa). Knows nothing about codecs or compression. |
| **Fec** *(opt)* | Forward-error-correction layer. Optional. Wraps payloads pre-write / post-read. |

## How the algorithm composes them

For **buffered decode** (`Algorithm.decode(bytes)`):

```
container bytes
  → surface.readBuffer(bytes)         // entity: Surface
  → SurfacePixels { pixels, width, fileChannels }
  → codec reads header from pixels    // entity: Codec
  → codec decodes data bytes          // entity: Codec
  → compressor.decompress(bytes)      // entity: Compressor
  → original payload
```

For **streaming decode** (`Algorithm.decodeStream(stream)`):

```
container byte stream
  → surface.decodeStream(stream)              // entity: Surface owns container parser
  → AsyncIterable<pixelRow>
  → codec.decodeChunk(row, state)             // entity: Codec — incremental
  → data byte chunks
  → compressor's streaming inflate            // entity: Compressor — streaming variant
  → original payload bytes (emitted as soon as they're ready)
```

In **both** flows the entry point per stage is the entity. The algorithm's
own code is just the wiring. If you find yourself parsing PNG chunks inside
`Algorithm.decode` or `decodeStream`, that's a smell — the parsing belongs
on the Surface.

## Anti-patterns

These are real things we've drifted into. They violate the principle:

- **Hardcoded format detection in entry points.** `decodeStream(source)` in
  `@tokenpack/browser` peeks for the PNG signature and falls back to
  buffered for non-PNG. The PNG-specific knowledge belongs on the surface;
  the entry point should just dispatch to whatever surface the algorithm
  selects.
- **Inline container parsers.** Both `packages/browser/src/decode-stream.ts`
  and `packages/core/src/stream-decoder.ts` re-implement PNG IHDR/IDAT/IEND
  parsing + scanline filter reconstruction. Two near-identical parsers
  outside the surface system.
- **Capability flags without behavior.** `AbstractSurface.streamable: boolean`
  is a flag that says "I can stream" but the surface has no streaming
  method. Streaming logic lives somewhere else, gated by the flag.
- **Algorithm bypass.** Streaming code today goes around `algorithm.decode`
  and reads the codec header itself, instantiates a `Codec` directly via
  `algorithmCatalog.getById(...).Codec`, and feeds rows to it. The
  algorithm has no chance to enforce its own composition.

## How to fix the smell

When you encounter format-specific behavior in a "general" function:

1. Find the entity that owns the format concern. (PNG container? → Surface.)
2. Add the missing method to the entity's abstract base. Make it abstract
   so every implementation has to think about it.
3. Move the format-specific code into that entity's concrete subclass.
4. Replace the entry-point inline logic with a one-line delegate to the
   appropriate entity (resolved by the algorithm's binding).
5. Non-applicable surfaces (e.g., WebP for streaming) implement the method
   by buffering — they participate in the contract even if degenerately.

## Why this matters

The benchmark / scenario story we want to tell only works if entities are
swappable:

- *"Same codec, different surface"* (Linear · PNG vs Linear · WebP vs
  Linear · PNG-via-upng-js) — meaningless if the surface isn't actually
  driving the pipeline.
- *"Streaming surface vs buffered surface"* — meaningless if the
  streaming pipeline lives outside the surface.
- *"This codec works streaming, that one doesn't"* — covered by the
  `StreamingCodec` interface, but only if the algorithm's `decodeStream`
  actually calls `codec.decodeChunk` rather than skipping the codec
  entirely.

The principle keeps the entity types load-bearing instead of decorative.
