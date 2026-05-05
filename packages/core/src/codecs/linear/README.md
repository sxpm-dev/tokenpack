# linear

**ID:** 0 · **Density:** 4 bytes/pixel (RGBA)

## Algorithm

Sequential byte packing. Each source byte maps directly to the next available channel slot in the pixel array, reading left-to-right, top-to-bottom.

```
input:  [b0, b1, b2, b3, b4, b5, b6, b7, ...]
pixel0: R=b0  G=b1  B=b2  A=b3
pixel1: R=b4  G=b5  B=b6  A=b7
...
```

Encode: `for i in 0..N: pixels[i] = input[i]`  
Decode: `return pixels[0..length]`

## Characteristics

- **Zero overhead** — no transformation, no metadata
- **Brotli-friendly** — preserves all byte-sequence patterns that brotli exploits
- **Worst raw**: random-looking pixel colors give PNG's internal zlib nothing to compress
- **Best with brotli**: brotli output (already near-random) packs perfectly

## When to use

Default for everything. With brotli enabled, linear is optimal — any pixel-level codec transformation on top of brotli output is either neutral or harmful.

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | 6 204 B |
| +brotli | **1 670 B** |
