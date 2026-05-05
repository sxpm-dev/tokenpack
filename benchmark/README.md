# Benchmark fixtures

Benchmark fixtures and results for comparing codec performance across sources and configurations.

## Directory structure

```
benchmark/
  sources/                    # Original input files (committed to repo)
  tokens/                     # Generated token images (git-ignored)
  archives/                   # Traditional archives for comparison (git-ignored)
  encode-times.json           # Encode timings recorded during generate (git-ignored)
  results.json                # Network benchmark results (git-ignored)
  results-extended.json       # Per-codec performance rows (git-ignored)
  archive/                    # Historical/unfiltered snapshots
```

The benchmark *scripts* live at `packages/core/benchmark/` and read/write data here.

---

## Benchmark sources

Every benchmark runs over **all 4 sources**. Each source represents a different
content type with different compressibility characteristics.

| Source name | File / origin | Size | Content type | Compressibility |
|---|---|---|---|---|
| `react-dom-client.development` | `sources/react-dom-client.development.js` | ~976 KB | Unminified JS | Very high (~87% brotli-11) |
| `react-dom-client.production`  | `sources/react-dom-client.production.js`  | ~520 KB | Minified JS   | High (~86% brotli-11) |
| `screenshot`                   | `sources/screenshot.jpg`                  | ~2.6 MB | JPEG image    | Very low (~5% — already compressed) |
| `fs-src-tests-docs`            | `src/ + tests/ + docs/` packed with CART  | ~300 KB | Filesystem archive | High (~80% brotli-11) |

The `fs-src-tests-docs` source is assembled at generate time from the live project
directories (`packDirs`), so its size will vary as the codebase grows.

---

## Token naming conventions

### Network benchmark tokens (`benchmark/run.ts` / `run-extended.ts`)

```
<preset>__<source>.<ext>

max-webp3   — linear · brotli-11 · webp · ch=3
max-png3    — linear · brotli-11 · png  · ch=3
max-png4    — linear · brotli-11 · png  · ch=4
stream-png3 — linear · brotli-6  · png  · ch=3  (streaming: true)
stream-png4 — linear · brotli-6  · png  · ch=4  (streaming: true)
stream-def3 — linear · deflate-6 · png  · ch=3  (streaming: true)
stream-def4 — linear · deflate-6 · png  · ch=4  (streaming: true)
```

Archives:
```
zip__<source>.zip
targz__<source>.tar.gz
br11__<source>.br        (or .tar.br for fs-src-tests-docs)
br6__<source>.br
```

### Extended benchmark tokens (`benchmark/generate.ts`)

```
ext-<codec>-<compression>-c<channels>__<source>.png

Examples:
  ext-linear-none-c3__react-dom-client.development.png
  ext-bitshuffle-deflate-6-c3__screenshot.png
  ext-zstdpix-none-c3__fs-src-tests-docs.png
  ext-delta-chain-brotli-6-c3__react-dom-client.production.png
```

**10 codecs × 4 compression modes × 4 sources = 160 token files.**

Codecs: linear, interleaved, bitplane, delta, xor, delta-chain, rle, predict,
bitshuffle, zstdpix.

Compression modes: `none`, `deflate-1`, `deflate-6`, `brotli-6`.

### `encode-times.json`

Written by `generate.ts` alongside the token files. Contains one entry per token:

```jsonc
[
  {
    "source": "react-dom-client.development",
    "codec": "bitshuffle",
    "compression": "deflate-6",
    "channels": 3,
    "encodeMs": 19.9,
    "tokenBytes": 148320,
    "originalBytes": 999489,
    "tokenFile": "benchmark/tokens/ext-bitshuffle-deflate-6-c3__react-dom-client.development.png"
  },
  ...
]
```

`run-extended.ts` reads this file to get encode timings, then measures decode
timings by loading and decoding the pre-generated token files.

---

## Workflow

```bash
# Step 1 — generate all token files + record encode times (run once, or after codec changes)
yarn tsx benchmark/generate.ts

# Step 2 — measure decode times + run network simulation
yarn tsx benchmark/run-extended.ts
```

`generate.ts` must be run before `run-extended.ts`.  
Re-run `generate.ts` whenever codecs change or new source files are added.

---

## Codec families

| Family | IDs | Description |
|---|---|---|
| Legacy | 0, 2, 4, 5, 6, 8, 9, 10 | Benchmark-qualified legacy codecs |
| A — Pixel Packers | 15 | Benchmark-qualified entropy-friendly transform |
| C — High-Ratio Node-Only | 21 | Benchmark-qualified Node.js codec |
