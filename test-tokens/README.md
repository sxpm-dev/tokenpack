# Test Tokens

Benchmark fixtures for comparing token encoding vs traditional archives across different configurations and source types.

## Directory structure

```
test-tokens/
  sources/          # Original source files (inputs)
  tokens/           # Encoded token images
  archives/         # Traditional archives (zip, tar.gz, brotli)
```

## Source files

| File | Size | Type | Compressibility |
|------|------|------|-----------------|
| `react-dom-client.development.js` | 976KB | JS source (unminified) | Very high (~87% with brotli-11) |
| `react-dom-client.production.js` | 520KB | JS source (minified) | High (~86% with brotli-11) |
| `screenshot.jpg` | 2.6MB | PNG image | Very low (~5% — already compressed) |
| `fs-src-tests-docs` | 308KB | Filesystem (src+tests+docs dirs) | High (~80% with brotli-11) |

## Token naming convention

```
{preset}__{source}.webp

max    — brotli-11, linear, bpp=4, webp  (best compression, not streamable)
stream — brotli-6,  linear, bpp=4, webp  (streamable, ~15% larger than max)
```

Both use WebP with bpp=4 (falls back to bpp=3 internally — WebP alpha premultiplication makes bpp=4 unsafe, so bpp=3 is used automatically).

## Regenerating

```bash
# From project root — regenerate all tokens
cd /path/to/codeart

# Single file token
yarn tokenpack encode test-tokens/sources/react-dom-client.production.js \
  -o test-tokens/tokens/brotli11-linear-bpp3-webp__react-dom-client.production.webp \
  --algo linear --compression brotli-11 --bpp 3

# Filesystem token
yarn tokenpack pack src tests docs \
  -o test-tokens/tokens/brotli11-linear-bpp3-webp__fs-src-tests-docs.webp \
  --algo linear --compression brotli-11 --bpp 3

# Archives
zip -j test-tokens/archives/zip__react-dom-client.production.zip \
  test-tokens/sources/react-dom-client.production.js

tar -czf test-tokens/archives/targz__react-dom-client.production.tar.gz \
  -C test-tokens/sources react-dom-client.production.js

brotli -k -q 11 -o test-tokens/archives/br11__react-dom-client.production.br \
  test-tokens/sources/react-dom-client.production.js
```

## Size comparison (tokens vs archives)

### react-dom-client.development.js (976KB source)

| Format | Size |
|--------|------|
| Source | 976KB |
| zip / tar.gz | 176KB |
| brotli-11 raw | 132KB |
| **token brotli-11 webp** | **132KB** |
| token brotli-6 webp | 156KB |
| token deflate-6 png | 176KB |
| token none png | 760KB |

### react-dom-client.production.js (520KB source)

| Format | Size |
|--------|------|
| Source | 520KB |
| zip / tar.gz | 96KB |
| brotli-11 raw | 76KB |
| **token brotli-11 webp** | **76KB** |
| token brotli-6 webp | 88KB |
| token deflate-6 png | 96KB |

### screenshot.jpg (2.6MB PNG — already compressed)

| Format | Size |
|--------|------|
| Source | 2.6MB |
| zip / tar.gz | 2.5MB |
| **token brotli-11** | **2.5MB** |

### fs: src+tests+docs (308KB source)

| Format | Size |
|--------|------|
| Source (uncompressed) | 308KB |
| zip | 68KB |
| tar.gz | 52KB |
| tar.br (brotli-11) | 40KB |
| **token brotli-11 webp** | **36KB** |
| token brotli-6 webp | 40KB |

## Benchmark scenarios

These fixtures are designed for three benchmark scenarios:

1. **Fetch + decode (non-streaming)**: fetch full token/archive → decode in memory → measure total time
2. **Fetch + decode (streaming)**: pipe HTTP response bytes through pixel decoder + decompressor → measure TTFB and total time
3. **Size comparison**: token vs archive file size across content types and compression configs

See `benchmark/` for the benchmark scripts.
