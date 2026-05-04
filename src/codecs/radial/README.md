# radial

**ID:** 1 · **Density:** 4 bytes/pixel (RGBA)

## Algorithm

Writes bytes in spiral order starting from the image center outward, so the most-recently-written bytes cluster at the edges.

```
pixel positions sorted by distance² from image center:
  [(cx,cy), (cx±1,cy), (cx,cy±1), ...]

byte[i] → pixel at spiral_order[i // 4], channel i % 4
```

Encode: sort pixel indices by `(x-cx)² + (y-cy)²`, assign bytes along that order.  
Decode: inverse lookup using the same sort.

## Characteristics

- Visually: data concentrates at center, padding/zeros at edges → concentric rings
- No compression benefit over linear; the sort permutation doesn't change byte values
- Slightly larger than linear for brotli output (permutation disrupts LZ backreferences)

## When to use

Visual / artistic effect. The spiral layout creates a distinctive look where data-dense content appears at the center. Not recommended when file size matters.

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | 6 410 B |
| +brotli | 1 725 B |
