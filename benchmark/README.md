# Benchmark

Scripts and fixtures for measuring tokenpack codec performance against
traditional archive formats (zip, tar.gz, brotli).

## Layout

```
benchmark/
  sources/                      # input files (committed)
  tokens/                       # generated outputs — tokens AND archives (gitignored)
  generate.ts                   # produces tokens + archives + encode-times + archive-times
  run.ts                        # network simulation benchmark → results.json
  run-extended.ts               # per-codec perf benchmark → results-extended.json
  package.json                  # workspace: tokenpack-benchmark
  eslint.config.js              # extends shared house style + disables no-console

packages/app/benchmark-results/   # all bench output JSONs (one place)
  results.json                    # network simulation rows           (committed → ships to Vercel)
  results-extended.json           # per-codec perf rows                (committed → ships to Vercel)
  archive-times.json              # archive encode/decode timings      (committed → ships to Vercel)
  encode-times.json               # intermediate, consumed by run-extended.ts (gitignored)
```

The benchmark *scripts* live here. The *result JSONs* live in
`packages/app/benchmark-results/` so the Next.js API routes can read them at
runtime without escaping the deploy root. Generated tokens (PNG/WebP images +
zip/tar.gz/brotli archives for comparison) all live in `benchmark/tokens/` and
are gitignored — re-run `yarn benchmark:generate` to recreate them.

## Sources

The benchmark runs over **4 sources**, each with different compressibility.

### Static sources (committed in `sources/`)

| Source id                       | File                                       | Approx size | Content type    | Compressibility    |
|---------------------------------|--------------------------------------------|-------------|-----------------|--------------------|
| `react-dom-client.development`  | `sources/react-dom-client.development.js`  | ~976 KB     | Unminified JS   | Very high (~87%)   |
| `react-dom-client.production`   | `sources/react-dom-client.production.js`   | ~520 KB     | Minified JS     | High (~86%)        |
| `screenshot`                    | `sources/screenshot.jpg`                   | ~2.6 MB     | JPEG image      | Very low (~5%)     |

### Dynamic source (built on the fly)

| Source id     | What it packs                                 | Why                                                   |
|---------------|-----------------------------------------------|-------------------------------------------------------|
| `fs-app-core` | `packages/app/src/` + `packages/core/src/`    | Realistic in-tree codebase fixture; cannot be committed because it changes whenever code changes. Built from the live filesystem at every `yarn benchmark:generate` run via `tokenpack/archive`'s `packDirs`. |

The FS source's size varies as the codebase grows. Source name is
`fs-app-core`; archive extension is `.tar.br` instead of `.br`.

## Workflow

```bash
# 1. Generate token files + archive comparisons + encode-times.json
#    (Slow — encodes every codec × every compression mode × every source.)
yarn benchmark:generate

# 2. Codec perf — decode each generated token, record decode timing.
#    Writes packages/app/benchmark-results/results-extended.json.
yarn benchmark:run:extended

# 3. Network simulation — throttled HTTP server measuring TTFB / decode / total.
#    Writes packages/app/benchmark-results/results.json.
yarn benchmark:run
```

`generate.ts` must run before `run.ts` / `run-extended.ts`. Re-run it whenever
codecs change or sources are updated.

## Token naming

### Network benchmark tokens (used by `run.ts` / `run-extended.ts`)

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

### Archive comparisons (also in `tokens/`)

```
zip__<source>.zip
targz__<source>.tar.gz
br11__<source>.br        (or .tar.br for fs-app-core)
br6__<source>.br
```

### Extended benchmark tokens

```
ext-<codec>-<compression>-c<channels>__<source>.png
```

10 codecs × 5 compression modes × 4 sources = **200 tokens**.

Codecs: linear, interleaved, bitplane, delta, xor, delta-chain, rle, predict,
bitshuffle, zstdpix.
Compression modes: `none`, `deflate-1`, `deflate-6`, `brotli-6`, `brotli-11`.

### `encode-times.json`

Produced by `generate.ts`. One entry per token:

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
    "tokenFile": "tokens/ext-bitshuffle-deflate-6-c3__react-dom-client.development.png"
  }
]
```

`tokenFile` paths are relative to the `benchmark/` directory.
