# CodeArt — Design Spec
Date: 2026-05-03

## Overview

A TypeScript CLI tool that encodes source code files into PNG images and decodes them back losslessly. Images are self-describing (all metadata needed to decode is embedded in a fixed header region). Visual style is a configurable compositing layer, separate from data encoding.

```
encode:  source bytes → [codec.encode] → pixel buffer → [header.write] → [style.apply] → PNG
decode:  PNG → [header.read] → lookup codec → [codec.decode] → source bytes
```

---

## Project Structure

```
codeart/
├── src/
│   ├── cli.ts              ← entry point, arg parsing
│   ├── encoder.ts          ← orchestrates encode pipeline
│   ├── decoder.ts          ← orchestrates decode pipeline
│   ├── header.ts           ← read/write self-describing header pixels
│   ├── image.ts            ← PNG read/write (wraps pngjs)
│   ├── style.ts            ← render layer (gradients, backgrounds)
│   ├── codecs/
│   │   ├── registry.ts     ← Map<id, Codec>
│   │   ├── linear.ts       ← algo 0: raw bytes → RGB, L→R T→B
│   │   ├── radial.ts       ← algo 1: bytes spiral from center outward
│   │   ├── interleaved.ts  ← algo 2: every 3rd pixel swapped
│   │   └── semantic.ts     ← algo 3: keyword-aware coloring
│   └── types.ts            ← shared interfaces
├── docs/superpowers/specs/
└── package.json
```

---

## Image Header Format

The header is always the **first 32 pixels (96 bytes)** of the PNG, encoded as raw RGB regardless of the active codec. This guarantees any image can be decoded without external config.

| Offset | Size | Field |
|--------|------|-------|
| 0      | 4    | Magic bytes: `0xC0 0xDE 0xAE 0x54` |
| 4      | 1    | Version: `0x01` |
| 5      | 1    | Algorithm ID (0=linear, 1=radial, 2=interleaved, 3=semantic) |
| 6      | 4    | Original file byte length (uint32 BE) |
| 10     | 2    | Image width in pixels (uint16 BE) |
| 12     | 2    | Image height in pixels (uint16 BE) |
| 14     | 1    | Style flags (bit 0 = gradient, bit 1 = background) |
| 15     | 1    | Error correction level (0=none, 1=Reed-Solomon, reserved) |
| 16     | 16   | Codec-specific metadata (e.g. keyword map version for semantic) |
| 32     | 3    | Gradient `from` color (RGB bytes) |
| 35     | 3    | Gradient `to` color (RGB bytes) |
| 38     | 1    | Gradient direction (0=none, 1=horizontal, 2=vertical, 3=diagonal) |
| 39     | 1    | Background color opacity (0–255, stored as `round(opacity * 255)`) |
| 40     | 3    | Background color (RGB bytes) |
| 43     | 53   | Reserved / padding |

Data pixels begin at pixel index 32 (byte offset 96).

---

## Codec Interface

```ts
interface Codec {
  id: number
  name: string
  encode(input: Buffer): PixelBuffer
  decode(pixels: PixelBuffer, length: number): Buffer
}

type PixelBuffer = Uint8Array  // flat RGB, length = width * height * 3
```

### Linear (ID 0)
Byte `N` maps to pixel `floor(N/3)`, channel `N % 3`. Trivial bijection. Reference implementation all other codecs are tested against.

### Radial (ID 1)
Pixels are visited in an outward spiral from the center. Byte→RGB mapping is identical to linear; only the pixel visit order changes. Decoder reconstructs the spiral and reads in reverse order.

### Interleaved (ID 2)
Every 3rd pixel is swapped with its successor (`pixel[i] ↔ pixel[i+1]` where `i % 3 === 0`). Creates a shuffled visual pattern. Decoder applies the inverse swap before reading bytes.

### Semantic (ID 3)
Source is tokenized as UTF-8. Recognized JS/TS keywords are assigned hardcoded colors and cell sizes:

| Token | Color | Cell |
|-------|-------|------|
| `function` | `#FF2040` | 2×2 |
| `const` | `#FF6060` | 1×1 |
| `var` | `#FF8080` | 1×1 |
| `let` | `#FFA0A0` | 1×1 |
| `for` | `#40A0FF` | 1×1 |
| `forEach` | `#40A0FF` | 2×2 |
| `class` | `#FF9020` | 2×2 |
| `return` | `#20FF80` | 1×1 |

Unrecognized bytes fall back to linear RGB encoding. To avoid ambiguity between keyword pixels and raw-byte pixels, the encoded pixel stream uses a **1-pixel type prefix** before each token:
- Type byte `0x00` → next 3 pixels are raw linear RGB (9 bytes of source)
- Type byte `0x01`–`0xFF` → keyword ID; next N pixels are the keyword's color block (size from table above)

The decoder reads the type prefix at each position and dispatches accordingly. The keyword→color table version is stored in the header metadata block so the decoder is fully self-contained.

---

## Style Layer

Applied after encoding, as a compositing pass over the pixel buffer. The header region (first 32 pixels) is never touched by the style layer.

```ts
interface Style {
  gradient?: {
    from: string           // hex color
    to: string             // hex color
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  background?: string      // hex color blended under data pixels
  opacity?: number         // 1.0 = pure data, <1.0 = artistic blend
}
```

At `opacity: 1.0` the image is pure data — pixel values are exactly as encoded, fully decodable. At lower opacity, the gradient/background is blended in using integer arithmetic: `out = round(data * opacity + gradient_at_pos * (1 - opacity))`. The decoder reads the gradient parameters from the header and reverses the blend: `data = round((out - gradient_at_pos * (1 - opacity)) / opacity)`. Rounding errors of ±1 are possible at intermediate opacity values; use `opacity: 1.0` for guaranteed exact roundtrip.

---

## CLI Interface

```bash
# Encode
node ./codeart encode ./source/react.dist.js -o output.png
node ./codeart encode ./source/react.dist.js -o output.png --algo semantic
node ./codeart encode ./source/react.dist.js -o output.png --style '{"gradient":{"from":"#FF0000","to":"#0000FF","direction":"diagonal"}}'

# Decode
node ./codeart decode output.png -o recovered.js

# List available algorithms
node ./codeart list
```

### Options
| Flag | Description | Default |
|------|-------------|---------|
| `--algo <name>` | Codec to use | `linear` |
| `--style <json\|path>` | Style config (inline JSON or path to .json file) | none |
| `--width <n>` | Override auto-calculated image width | auto |
| `-o, --out <path>` | Output file path | required |

### Auto-dimensions
```
side = ceil(sqrt((fileBytes + 96) / 3))
```
Produces the smallest square image that fits the data plus header.

---

## Build Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | CLI skeleton + linear codec + encode/decode roundtrip verified |
| 2 | Radial + interleaved codecs |
| 3 | Semantic codec (JS/TS keyword tokenizer + color map) |
| 4 | Style layer (gradient, background, opacity compositing) |
| 5 | Reed-Solomon error correction (level 1) |

---

## Dependencies

- `pngjs` — pure-JS PNG read/write (no native binaries, works in Node without build step)
- `commander` — CLI arg parsing
- TypeScript + `tsx` for zero-config TS execution

No other runtime dependencies. Keep it lean.
