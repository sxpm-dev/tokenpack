# delta

**ID:** 5 · **Density:** 4 bytes/pixel (RGBA)

## Algorithm

Differential encoding: each output byte stores the difference from the previous input byte, modulo 256. The first byte is stored as-is (prev = 0).

```
encode:  out[i] = (input[i] − input[i−1]) mod 256
decode:  out[i] = (pixels[i] + out[i−1])  mod 256
```

Example:
```
input:   [72, 73, 74, 75, 65, 65, 65]   ('H','I','J','K','A','A','A')
deltas:  [72,  1,  1,  1,-10,  0,  0]
         ↑ absolute          ↑ runs → zeros
```

## Characteristics

- Converts slowly-changing sequences into small delta values clustered near 0
- Repeated identical bytes become runs of `0x00` → excellent for PNG zlib
- **Hurts brotli**: delta destroys the byte-sequence patterns brotli exploits (+40% vs brotli alone)
- PNG's own `Sub` row filter does the same thing row-by-row automatically; doing it upfront lets brotli also see the delta structure

## When to use

- Raw mode on **monotonically changing** or **slowly drifting** data (sensor readings, counters, gradients)
- Not useful for source code or compressed data

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | 6 474 B (−0.1%, barely helps) |
| +brotli | 1 681 B |
| delta → brotli | 2 162 B (+40% vs brotli alone) ← avoid |
