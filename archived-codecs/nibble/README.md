# nibble

**ID:** 7 · **Density:** 2 bytes/pixel (half of linear)

## Algorithm

Splits each source byte into two 4-bit nibbles and scales each to the 0–255 range by multiplying by 17 (= 255 ÷ 15). Two source bytes fill one RGBA pixel.

```
source byte b:  hi = (b >> 4) & 0xF    lo = b & 0xF

pixel layout (2 source bytes → 1 RGBA pixel):
  R = hi(b[2i])   × 17
  G = lo(b[2i])   × 17
  B = hi(b[2i+1]) × 17
  A = lo(b[2i+1]) × 17
```

All channel values are multiples of 17: `{0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204, 221, 238, 255}` — only 16 possible values per channel.

Decode: `b = (round(R/17) << 4) | round(G/17)`

## Characteristics

- **16-level palette per channel** → PNG's zlib compresses a quantized color grid far better than raw byte noise
- **Half density**: 2× more pixels needed for the same input → 2× larger image
- At small sizes PNG compression wins; at large sizes the extra pixels lose
- The "stepped" color palette is visually distinctive — smooth gradients per channel

## Trade-off

| Aspect | Nibble | Linear |
|--------|--------|--------|
| Pixels for N bytes | N/2 | N/4 |
| Values per channel | 16 | 256 |
| PNG zlib efficiency | High | Low |
| Net file size | **Larger** | Smaller |

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | 8 502 B (+31%) |
| +brotli | 2 300 B (+38% vs linear+brotli) |

Nibble consistently loses on file size. Its value is visual: the limited palette creates an aesthetically distinct "pixelated mosaic" appearance.
