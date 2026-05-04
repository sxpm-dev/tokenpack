# interleaved

**ID:** 2 · **Density:** 4 bytes/pixel (RGBA)

## Algorithm

Linear packing followed by a pixel-swap shuffle: within each group of three consecutive pixels, the first and second pixels are swapped.

```
linear pixels: [p0, p1, p2, p3, p4, p5, ...]
after swap:    [p1, p0, p2, p4, p3, p5, ...]
                ↑    ↑       ↑    ↑
              swapped     swapped
```

Decode applies the same swap (it's its own inverse).

## Characteristics

- Creates a mild "salt-and-pepper" visual shuffle without changing byte distribution
- Negligible effect on compression; the swap is too local to help or hurt brotli
- Lossless and trivially reversible

## When to use

When you want a visually different layout from linear but still need near-linear performance. Produces a slightly "scrambled" texture compared to raw linear output.

## Benchmark (encoder.ts, 6.5 KB ASCII)

| Mode | Size |
|------|------|
| raw | 6 241 B |
| +brotli | 1 678 B |
