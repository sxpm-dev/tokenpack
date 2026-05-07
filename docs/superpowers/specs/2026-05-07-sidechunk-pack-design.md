# Sidechunk Pack — Design Spec

**Date:** 2026-05-07
**Status:** Draft, awaiting review
**Scope:** Phase A only (round-trip + dashboard playground integration). Partial-fetch demo deferred to Phase B.

## Goal

Add a new pack format that stores TokenPack data in a custom **ancillary chunk** of the carrier image (PNG / WebP / AVIF) instead of inside the pixel stream. The carrier becomes a normal image with an arbitrary visible content; the pack data rides alongside as a side channel.

This unlocks **byte-addressable partial fetch** over HTTP Range requests in a future iteration: the manifest sits at a known offset near the start of the file, each per-file region's compressed bytes have known absolute offsets in the artifact, and there is no zlib/IDAT layer to decode through.

Phase A scope is bounded: ship the format, wire it into the dashboard encode page as selectable algorithm options, and verify encode/decode round-trip on real values. Size/perf comparison against existing formats is the user's manual exercise.

## Non-goals (Phase A)

- Partial-fetch consumer (Range-fetch + extract one file). Deferred to Phase B.
- Modifying any existing algorithm, drawer, codec, surface, or pipeline behavior. The work is **purely additive** — a plugin.
- Backward compatibility with existing tokens (these are new-format files; old decoders won't recognize them, that's fine).
- Auto-rendered "thumbnail of pack contents" decoration. Future option, not v1.

## Architecture — three new entities

All registered through the existing append-only registries. No core changes.

### 1. New `SidechunkSurface` interface + three implementations

The plugin must not modify `AbstractSurface`. Define a **new sibling interface** in the new entity's own files. Existing pixel-mode surfaces are untouched.

```ts
// packages/core/src/surfaces/sidechunk-surface.ts (NEW FILE — no edits to existing surfaces/)
export interface SidechunkSurface {
  readonly id: 'png-sidechunk' | 'webp-sidechunk' | 'avif-sidechunk'
  readonly format: ImageFormat
  readonly extension: string
  readonly mimeType: string
  writeData(filePath: string, data: Uint8Array, decoration: DecorationConfig): Promise<void>
  readData(buffer: Buffer): Promise<Uint8Array>
}
```

Sidechunk surface implementations live in `@tokenpack/node` next to the existing surfaces but in their own files (`png-sidechunk.ts`, `webp-sidechunk.ts`, `avif-sidechunk.ts`). They are not registered in `surfaceRegistry` (which is typed for `AbstractSurface`). `SidechunkAlgorithm` holds its own private map of sidechunk surfaces keyed by `ImageFormat`, populated at construction.

This keeps the plugin truly additive — zero edits to `AbstractSurface`, `surfaceRegistry`, or any existing surface class.

**Encoding** (per format):

| Format | Side-channel mechanism | Magic / chunk type |
|---|---|---|
| PNG  | Custom ancillary chunk after IHDR, before IDAT | `tpAK` (lowercase first letter = ancillary, ignorable per PNG spec) |
| WebP | Custom RIFF chunk inside `WEBP` form | `TPAK` (4-char FourCC) |
| AVIF | Custom HEIF item with mime type `application/x-tokenpack` | item type `tpak` |

The chunk/box body is the entire pack-format `Uint8Array` produced by `encodePack(...)` — sig + format byte + manifest length + manifest JSON + per-file compressed regions. Self-describing; one chunk holds everything.

**Decoding:** scan chunks/boxes for the marker, return the body bytes. Pixels are not consulted.

### 2. New algorithm — `SidechunkAlgorithm`

A subclass of `AbstractAlgorithm`. Lives in `@tokenpack/core/src/algorithms/sidechunk-algorithm.ts`. Registered via `algorithmRegistry.register(...)` from the env packages (alongside existing algorithms).

```ts
class SidechunkAlgorithm extends AbstractAlgorithm {
  readonly id = <next available algo id>
  readonly name = 'sidechunk'
  readonly title = 'Sidechunk Pack'
  readonly description = 'Pack data in custom image chunk; pixels are decoration'
  readonly codec = NoopCodec       // stub, never used
  readonly drawer = NoopDrawer     // stub, never used
  readonly compressor = ...        // brotli or per-file as configured
  readonly surface = NullSurface   // stub satisfying AbstractAlgorithm.surface contract

  // private — keyed by ImageFormat; populated by env package
  private readonly dataSurfaces: Record<ImageFormat, SidechunkSurface>
  readonly capabilities = { streaming: false, decodeOnFlight: false, environments: ['node', 'browser'] }
  readonly options = [...]

  async encode(input: Buffer, opts) {
    // 1. parse input as one or more entries (existing pack-builder logic)
    // 2. encodePack(entries, perFileCompress) → Uint8Array
    // 3. surface.writeData(outPath, packBytes, decoration)
  }

  async decode(images, key?) {
    // 1. surface.readData(buffer) → packBytes
    // 2. decodePack(packBytes, perFileDecompress) → entries
    // 3. return entries
  }

  async encodeBytes / decodeBytes  // browser-friendly variants without fs
}
```

Stub `NoopCodec`, `NoopDrawer`, `NullSurface` exist purely to satisfy the abstract `codec` / `drawer` / `surface` fields on `AbstractAlgorithm`. Their methods throw if anything tries to use them — they shouldn't be reached because `SidechunkAlgorithm.encode/decode` bypass codec / drawer / surface entirely and call `dataSurfaces[format].writeData / readData` directly.

### 3. Dashboard encode page — Decoration section

New `DecorationSection.tsx` in `packages/app/src/components/EncodeForm/components/`. Rendered conditionally when the active algorithm is `sidechunk`. Wires four controls:

| Control | Field | Values | Default |
|---|---|---|---|
| Decoration | `decoration` | `placeholder` / `gradient` / `data-art` | `gradient` |
| Decoration size | `decorationSize` | `1`, `64`, `128`, `256`, `512` | `64` |
| Gradient from | `decorationGradientFrom` | color picker | reuse existing default |
| Gradient to | `decorationGradientTo` | color picker | reuse existing default |

Decoration semantics:

- **placeholder** — a solid-color image at `decorationSize × decorationSize` (smallest meaningful PNG). Result: file size ≈ `pack bytes + ~200 B framing`.
- **gradient** — render the existing TokenPack gradient style at `decorationSize × decorationSize`, no data encoded. Cheap, looks deliberate. Result: file size ≈ `pack bytes + a few KB`.
- **data-art** — re-render the pack data as pixel art using the existing `dense-drawer` (or whatever the user picks via existing drawer selection). Result: file size ≈ `2 × pack bytes` (data stored twice — once raw in chunk, once as decorative pixels). Useful for the visceral demo.

The four existing sections (Algorithm/Compressor/Drawer/Surface/Fec) remain visible and functional; when `sidechunk` is the active algorithm, drawer/codec controls are disabled (or hidden) since they don't apply, except when `decoration === 'data-art'` which routes through the chosen drawer.

### Algorithm options exposed on `SidechunkAlgorithm.options`

```ts
options = [
  { name: 'compressionMode', label: 'Compression', type: 'select', defaultValue: 'brotli-11', values: <listModes> },
  { name: 'format',          label: 'Surface',     type: 'select', defaultValue: 'png',       values: ['png', 'webp', 'avif'] },
  { name: 'decoration',      label: 'Decoration',  type: 'select', defaultValue: 'gradient',  values: ['placeholder', 'gradient', 'data-art'] },
  { name: 'decorationSize',  label: 'Decoration size', type: 'select', defaultValue: 64, values: [1, 64, 128, 256, 512] },
]
```

`channels` / `fecMode` are not in the options because they don't apply to the chunk-stored data (pack-format already handles per-file integrity at the manifest level).

## Data flow

### Encode

```
input files
  │
  ▼
pack-builder → PackEntry[]
  │
  ▼
encodePack(entries, brotliPerFile) → packBytes (Uint8Array)
  │
  ▼
renderDecoration(decoration, size, gradientColors, packBytes?) → SurfacePixels
  │             │
  │             └─ for 'data-art': calls existing drawer/codec on packBytes
  ▼
sidechunkSurface.writeData(path, packBytes, { decorationPixels })
  │
  ▼
artifact: a valid PNG/WebP/AVIF whose visible content is the decoration,
          plus a tpAK chunk holding packBytes
```

### Decode

```
artifact (PNG/WebP/AVIF)
  │
  ▼
sidechunkSurface.readData(buffer) → packBytes
  │
  ▼
decodePack(packBytes, brotliPerFile) → PackEntry[]
  │
  ▼
output files
```

## Testing

Existing test patterns:
- Unit tests for each new surface's chunk encode/decode round-trip (Uint8Array → write → read → identical bytes back).
- Unit tests for `SidechunkAlgorithm.encode/decode` round-trip with multi-file packs.
- Each decoration mode renders a valid image (verifiable by reading IHDR back).
- Existing decoders correctly reject sidechunk artifacts (no algoId match) without crashing.

E2E test on the dashboard encode page: configure sidechunk + each decoration mode, encode a small file, decode the result, verify byte-identical output.

Coverage target: 80% per project standard. New code lives in:
- `packages/core/src/algorithms/sidechunk-algorithm.ts`
- `packages/core/src/algorithms/stubs/noop-codec.ts`, `noop-drawer.ts`
- `packages/node/src/surfaces/png-sidechunk.ts`, `webp-sidechunk.ts`, `avif-sidechunk.ts`
- `packages/app/src/components/EncodeForm/components/DecorationSection.tsx`

## Risks / open questions

1. **Algorithm ID assignment** — sidechunk needs a fresh numeric `id` not colliding with existing algos. Pick the next free integer at registration time.
2. **`encode/decode` signatures** — `AbstractAlgorithm.encode` is `(Buffer, opts) => Promise<string[]>` (returns file paths). Sidechunk fits this fine — returns the path of the written artifact.
3. **Default decoration** — recommendation is `gradient` (smallest "deliberate-looking" image, keeps file size tight). User can flip to `data-art` to see the size double.
4. **WebP / AVIF custom-chunk emission** — current pixel-mode WebP/AVIF surfaces use sharp. Sharp embeds XMP/EXIF cleanly but custom RIFF chunks for WebP and custom HEIF items for AVIF may need a lower-level emitter. If unmanageable in v1, ship `png-sidechunk` only and gate the WebP/AVIF format options in the dashboard accordingly. Verify during implementation.
5. **`data-art` decoration interaction with drawer/codec sections** — when `decoration === 'data-art'`, the drawer/codec/channels controls become live (they govern the pixel rendering of the data-art duplicate). When `decoration === 'placeholder' | 'gradient'`, those controls are disabled. UI must reflect this conditionally.

## Phase B (deferred)

After Phase A is solid, add a partial-fetch playground page (matches the "Pack explorer" idea in TODO.md):
- Paste URL of a sidechunk artifact on a CDN.
- Range-fetch first ~64 KB → parse chunks → extract manifest.
- Show file list. User clicks a file → Range-fetch its byte range → per-file decompress → display.
- Network counter showing "fetched X KB out of Y MB total."

Phase B requires CORS-friendly Range-supporting hosting and a partial-fetch decoder API in `@tokenpack/browser`. Out of scope here.
