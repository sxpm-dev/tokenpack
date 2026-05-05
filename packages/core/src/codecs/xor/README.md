# xor

**ID:** 6 · **Density:** 4 bytes/pixel (RGBA)

## Algorithm

XOR chain: each output byte is the XOR of the current and previous input bytes. The first byte is stored as-is (prev = 0). Unlike delta, XOR is perfectly self-inverse with no modular arithmetic.

```
encode:  out[i] = input[i] XOR input[i−1]
decode:  out[i] = pixels[i] XOR out[i−1]
```

Example:
```
input:   [0x41, 0x41, 0x41, 0x42]   ('A','A','A','B')
xor out: [0x41, 0x00, 0x00, 0x03]
                ↑     ↑ repeats → zeros
```

## Characteristics

- Repeated identical bytes → XOR delta = `0x00` → long zero runs → PNG compresses perfectly
- Best codec for uncompressed data with repeated patterns or runs
- Like delta, **hurts brotli** by destroying byte-sequence locality (+34% vs brotli alone)
- No arithmetic overflow possible (XOR is always lossless)

## When to use

Raw mode on data with many repeated byte values or long runs: binary files with zero padding, simple text with repeated characters, RLE-compressible content.

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | **6 080 B (−6.2%)** ← best raw codec |
| +brotli | 1 680 B |
| xor → brotli | 2 068 B (+34% vs brotli alone) ← avoid |
