# semantic

**ID:** 3 · **Density:** variable (keyword-dependent)

## Algorithm

Source-code-aware encoding. Scans the input for known keywords and replaces each with a compact colored marker; remaining raw bytes are packed in 3-pixel chunks.

```
keyword match  → [id, 0, 0, 0]  +  kw.pixels × [R, G, B, 0]
raw 12-byte chunk → [0, 0, 0, 0]  +  3 × [b0, b1, b2, b3]
```

**Keyword table:**

| Keyword | ID | Color | Size |
|---------|-----|-------|------|
| `function` | 1 | rgb(255,32,64) | 4px |
| `const` | 2 | rgb(255,96,96) | 1px |
| `var` | 3 | rgb(255,128,128) | 1px |
| `let` | 4 | rgb(255,160,160) | 1px |
| `for` | 5 | rgb(64,160,255) | 1px |
| `forEach` | 6 | rgb(64,160,255) | 4px |
| `class` | 7 | rgb(255,144,32) | 4px |
| `return` | 8 | rgb(32,255,128) | 1px |

Decode: read prefix pixel → if `R≠0` look up keyword by ID; if `R=0` read next 3 pixels as raw bytes.

## Characteristics

- Produces human-readable color blobs: keywords appear as distinct color patches
- **Do not combine with brotli** — brotli already compresses keywords far better; semantic encoding only wastes space on compressed input
- Pixel count varies: keyword-dense files use fewer pixels, byte-dense files use more

## When to use

Uncompressed source code where visual keyword identification matters. Good for generating visually meaningful "code portraits".

## Benchmark (encoder.ts, 6.5 KB ASCII, no brotli)

Depends on keyword density. Generally 5–15% larger than linear for the same input because keyword overhead (prefix pixel + color pixels) exceeds the saved bytes.
