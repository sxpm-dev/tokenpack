# bitplane

**ID:** 4 · **Density:** 4 bytes/pixel (RGBA, same as linear)

## Algorithm

Bit-plane transposition: groups 8 consecutive source bytes and redistributes their bits so that all bits at the same position end up in the same channel slot.

```
source group (8 bytes):  b0 b1 b2 b3 b4 b5 b6 b7

slot[bitPos] = b0[bitPos]<<7 | b1[bitPos]<<6 | … | b7[bitPos]<<0

pixel 0:  R=slot[7]  G=slot[6]  B=slot[5]  A=slot[4]
pixel 1:  R=slot[3]  G=slot[2]  B=slot[1]  A=slot[0]
```

Decode is the transpose of encode.

## ASCII advantage

For ASCII source code, bit-7 of every byte is `0`:

```
slot[7] = 0<<7 | 0<<6 | … | 0<<0 = 0x00
```

Every even pixel's R channel is `0x00` → a solid wall of zeros that PNG's internal zlib compresses near-perfectly. In theory this saves ~12% of the pixel data for pure ASCII.

## Why it underperforms with brotli

Bitplane scrambles byte locality: consecutive source bytes end up in completely different pixel locations. Brotli's LZ77 backreference engine relies on byte sequences being spatially coherent. Applying bitplane before brotli **increases size by ~190%** because brotli can no longer find its usual back-references.

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | 6 109 B (−5.8%) |
| +brotli | 1 681 B (same as linear) |
| bitplane → brotli | 4 463 B (+190% vs brotli alone) ← avoid |
