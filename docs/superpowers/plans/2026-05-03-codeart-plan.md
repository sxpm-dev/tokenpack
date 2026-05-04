# CodeArt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript CLI that encodes source code files into self-describing PNG images and decodes them back losslessly.

**Architecture:** Plugin-style codec registry where each algorithm implements `encode/decode`. A fixed 32-pixel (96-byte) header region always stores algorithm ID and style metadata in linear order, making any image self-decodable. Style (gradient, background) is a compositing pass applied after encoding and reversed before decoding. Phase 5 (Reed-Solomon) is deferred.

**Tech Stack:** TypeScript, tsx (zero-config TS runner), pngjs (pure-JS PNG I/O), commander (CLI), vitest (tests), yarn

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/types.ts` | `Style`, `HeaderData`, `EncodeOptions`, `DecodeOptions` |
| `src/codecs/types.ts` | `Codec` interface, `PixelBuffer` type alias |
| `src/codecs/registry.ts` | `Map<id, Codec>`, `getCodecByName`, `getCodecById`, `listCodecs` |
| `src/codecs/linear.ts` | Codec 0: byte N → pixel ⌊N/3⌋, channel N%3 |
| `src/codecs/radial.ts` | Codec 1: bytes placed in outward spiral from image center |
| `src/codecs/interleaved.ts` | Codec 2: every 3rd pixel swapped with its successor |
| `src/codecs/semantic.ts` | Codec 3: JS/TS keywords get fixed colors, raw bytes fall back to linear |
| `src/header.ts` | Read/write 96-byte header from first 32 pixels of a flat RGB buffer |
| `src/image.ts` | PNG ↔ flat RGB `Uint8Array` via pngjs (RGBA→RGB conversion) |
| `src/style.ts` | Gradient/background blend (apply + reverse), skips header pixels |
| `src/encoder.ts` | Full encode pipeline: file → PNG |
| `src/decoder.ts` | Full decode pipeline: PNG → file |
| `src/cli.ts` | Commander: `encode`, `decode`, `list` commands |
| `tests/header.test.ts` | Header encode/decode roundtrip |
| `tests/image.test.ts` | PNG write/read roundtrip |
| `tests/style.test.ts` | Style apply/reverse |
| `tests/codecs/linear.test.ts` | Linear roundtrip |
| `tests/codecs/radial.test.ts` | Radial roundtrip |
| `tests/codecs/interleaved.test.ts` | Interleaved roundtrip |
| `tests/codecs/semantic.test.ts` | Semantic roundtrip |
| `tests/encoder.test.ts` | Full encode→decode integration |

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/types.ts`
- Create: `src/codecs/types.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/valerii/Develop/codeart
yarn init -y
```

- [ ] **Step 2: Install dependencies**

```bash
yarn add pngjs commander
yarn add -D typescript tsx vitest @types/node @types/pngjs
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 5: Update package.json scripts**

Replace the scripts section:
```json
{
  "name": "codeart",
  "version": "0.1.0",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "codeart": "tsx src/cli.ts"
  }
}
```

- [ ] **Step 6: Write src/types.ts**

```ts
export interface Style {
  gradient?: {
    from: [number, number, number]
    to: [number, number, number]
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  background?: [number, number, number]
  opacity: number
}

export interface HeaderData {
  version: number
  algorithmId: number
  fileLength: number
  width: number
  height: number
  styleFlags: number
  ecLevel: number
  codecMeta: Uint8Array
  gradientFrom: [number, number, number]
  gradientTo: [number, number, number]
  gradientDirection: number
  backgroundOpacity: number
  backgroundColor: [number, number, number]
}

export interface EncodeOptions {
  algo?: string
  style?: Partial<Style>
  width?: number
  out: string
}

export interface DecodeOptions {
  out: string
}
```

- [ ] **Step 7: Write src/codecs/types.ts**

```ts
export type PixelBuffer = Uint8Array  // flat RGB, 3 bytes per pixel

export interface Codec {
  id: number
  name: string
  // dataPixelCount = width * height - 32 (data region, excludes header)
  encode(input: Buffer, dataPixelCount: number, width: number, height: number): PixelBuffer
  decode(pixels: PixelBuffer, length: number, width: number, height: number): Buffer
}
```

- [ ] **Step 8: Commit**

```bash
git init
git add package.json tsconfig.json vitest.config.ts src/types.ts src/codecs/types.ts
git commit -m "chore: scaffold project with types and build config"
```

---

## Task 2: Image I/O

**Files:**
- Create: `src/image.ts`
- Create: `tests/image.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/image.test.ts
import { describe, it, expect } from 'vitest'
import { writePNG, readPNG } from '../src/image'
import path from 'path'
import os from 'os'

describe('image', () => {
  it('roundtrips a flat RGB buffer through PNG', () => {
    const width = 4
    const height = 4
    const pixels = new Uint8Array(width * height * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = i % 256

    const tmp = path.join(os.tmpdir(), `codeart-test-${Date.now()}.png`)
    writePNG(tmp, pixels, width, height)
    const result = readPNG(tmp)

    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.pixels).toEqual(pixels)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/image.test.ts
```
Expected: FAIL — `Cannot find module '../src/image'`

- [ ] **Step 3: Write src/image.ts**

```ts
import { PNG } from 'pngjs'
import fs from 'fs'

export function writePNG(filePath: string, pixels: Uint8Array, width: number, height: number): void {
  const png = new PNG({ width, height, filterType: -1 })
  png.data = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4]     = pixels[i * 3]
    png.data[i * 4 + 1] = pixels[i * 3 + 1]
    png.data[i * 4 + 2] = pixels[i * 3 + 2]
    png.data[i * 4 + 3] = 255
  }
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

export function readPNG(filePath: string): { pixels: Uint8Array; width: number; height: number } {
  const png = PNG.sync.read(fs.readFileSync(filePath))
  const rgb = new Uint8Array(png.width * png.height * 3)
  for (let i = 0; i < png.width * png.height; i++) {
    rgb[i * 3]     = png.data[i * 4]
    rgb[i * 3 + 1] = png.data[i * 4 + 1]
    rgb[i * 3 + 2] = png.data[i * 4 + 2]
  }
  return { pixels: rgb, width: png.width, height: png.height }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn test tests/image.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/image.ts tests/image.test.ts
git commit -m "feat: PNG read/write with RGB↔RGBA conversion"
```

---

## Task 3: Header encode/decode

**Files:**
- Create: `src/header.ts`
- Create: `tests/header.test.ts`

Header layout (96 bytes = 32 pixels):

| Bytes | Field |
|-------|-------|
| 0–3 | Magic: `0xC0 0xDE 0xAE 0x54` |
| 4 | Version: `0x01` |
| 5 | Algorithm ID |
| 6–9 | File byte length (uint32 BE) |
| 10–11 | Image width (uint16 BE) |
| 12–13 | Image height (uint16 BE) |
| 14 | Style flags (bit0=gradient, bit1=background) |
| 15 | EC level |
| 16–31 | Codec metadata (16 bytes) |
| 32–34 | Gradient `from` RGB |
| 35–37 | Gradient `to` RGB |
| 38 | Gradient direction (0=none,1=h,2=v,3=diagonal) |
| 39 | Background opacity (0–255) |
| 40–42 | Background RGB |
| 43–95 | Reserved |

- [ ] **Step 1: Write the failing test**

```ts
// tests/header.test.ts
import { describe, it, expect } from 'vitest'
import { writeHeader, readHeader, HEADER_BYTES } from '../src/header'
import type { HeaderData } from '../src/types'

const sample: HeaderData = {
  version: 1,
  algorithmId: 0,
  fileLength: 123456,
  width: 200,
  height: 200,
  styleFlags: 0b00000011,
  ecLevel: 0,
  codecMeta: new Uint8Array(16).fill(0xAB),
  gradientFrom: [255, 0, 128],
  gradientTo: [0, 128, 255],
  gradientDirection: 3,
  backgroundOpacity: 128,
  backgroundColor: [10, 20, 30],
}

describe('header', () => {
  it('roundtrips HeaderData through a pixel buffer', () => {
    const buf = new Uint8Array(HEADER_BYTES)
    writeHeader(buf, sample)
    const result = readHeader(buf)
    expect(result).toEqual(sample)
  })

  it('throws on invalid magic', () => {
    const buf = new Uint8Array(HEADER_BYTES)
    expect(() => readHeader(buf)).toThrow('not a codeart image')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/header.test.ts
```
Expected: FAIL — `Cannot find module '../src/header'`

- [ ] **Step 3: Write src/header.ts**

```ts
import type { HeaderData } from './types'

export const HEADER_PIXELS = 32
export const HEADER_BYTES = HEADER_PIXELS * 3  // 96

const MAGIC = [0xC0, 0xDE, 0xAE, 0x54]

export function writeHeader(pixels: Uint8Array, d: HeaderData): void {
  pixels[0] = 0xC0; pixels[1] = 0xDE; pixels[2] = 0xAE; pixels[3] = 0x54
  pixels[4] = d.version
  pixels[5] = d.algorithmId
  pixels[6]  = (d.fileLength >>> 24) & 0xFF
  pixels[7]  = (d.fileLength >>> 16) & 0xFF
  pixels[8]  = (d.fileLength >>> 8)  & 0xFF
  pixels[9]  =  d.fileLength         & 0xFF
  pixels[10] = (d.width  >>> 8) & 0xFF
  pixels[11] =  d.width         & 0xFF
  pixels[12] = (d.height >>> 8) & 0xFF
  pixels[13] =  d.height        & 0xFF
  pixels[14] = d.styleFlags
  pixels[15] = d.ecLevel
  pixels.set(d.codecMeta.slice(0, 16), 16)
  pixels[32] = d.gradientFrom[0]; pixels[33] = d.gradientFrom[1]; pixels[34] = d.gradientFrom[2]
  pixels[35] = d.gradientTo[0];   pixels[36] = d.gradientTo[1];   pixels[37] = d.gradientTo[2]
  pixels[38] = d.gradientDirection
  pixels[39] = d.backgroundOpacity
  pixels[40] = d.backgroundColor[0]; pixels[41] = d.backgroundColor[1]; pixels[42] = d.backgroundColor[2]
}

export function readHeader(pixels: Uint8Array): HeaderData {
  if (pixels[0] !== 0xC0 || pixels[1] !== 0xDE || pixels[2] !== 0xAE || pixels[3] !== 0x54) {
    throw new Error('not a codeart image')
  }
  return {
    version: pixels[4],
    algorithmId: pixels[5],
    fileLength:
      ((pixels[6] << 24) | (pixels[7] << 16) | (pixels[8] << 8) | pixels[9]) >>> 0,
    width:  (pixels[10] << 8) | pixels[11],
    height: (pixels[12] << 8) | pixels[13],
    styleFlags: pixels[14],
    ecLevel: pixels[15],
    codecMeta: new Uint8Array(pixels.buffer, pixels.byteOffset + 16, 16).slice(),
    gradientFrom: [pixels[32], pixels[33], pixels[34]],
    gradientTo:   [pixels[35], pixels[36], pixels[37]],
    gradientDirection: pixels[38],
    backgroundOpacity: pixels[39],
    backgroundColor: [pixels[40], pixels[41], pixels[42]],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn test tests/header.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/header.ts tests/header.test.ts
git commit -m "feat: 96-byte self-describing header encode/decode"
```

---

## Task 4: Linear codec + registry

**Files:**
- Create: `src/codecs/linear.ts`
- Create: `src/codecs/registry.ts`
- Create: `tests/codecs/linear.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/codecs/linear.test.ts
import { describe, it, expect } from 'vitest'
import { linearCodec } from '../../src/codecs/linear'

describe('linearCodec', () => {
  it('encodes bytes into flat RGB pixels', () => {
    const input = Buffer.from([0xAB, 0xCD, 0xEF, 0x12])
    const result = linearCodec.encode(input, 2, 1, 2)
    // pixel 0: [0xAB, 0xCD, 0xEF], pixel 1: [0x12, 0x00, 0x00]
    expect(result[0]).toBe(0xAB)
    expect(result[1]).toBe(0xCD)
    expect(result[2]).toBe(0xEF)
    expect(result[3]).toBe(0x12)
    expect(result[4]).toBe(0x00)
    expect(result[5]).toBe(0x00)
  })

  it('decodes flat RGB pixels back to original bytes', () => {
    const input = Buffer.from([0xAB, 0xCD, 0xEF, 0x12])
    const encoded = linearCodec.encode(input, 2, 1, 2)
    const decoded = linearCodec.decode(encoded, input.length, 1, 2)
    expect(decoded).toEqual(input)
  })

  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Hello, CodeArt!')
    const dataPixelCount = Math.ceil(input.length / 3)
    const encoded = linearCodec.encode(input, dataPixelCount, 10, 10)
    const decoded = linearCodec.decode(encoded, input.length, 10, 10)
    expect(decoded).toEqual(input)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/codecs/linear.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write src/codecs/linear.ts**

```ts
import type { Codec, PixelBuffer } from './types'

export const linearCodec: Codec = {
  id: 0,
  name: 'linear',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let i = 0; i < input.length; i++) pixels[i] = input[i]
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    return Buffer.from(pixels.slice(0, length))
  },
}
```

- [ ] **Step 4: Write src/codecs/registry.ts**

```ts
import type { Codec } from './types'
import { linearCodec } from './linear'

const byId = new Map<number, Codec>([[linearCodec.id, linearCodec]])
const byName = new Map<string, Codec>([[linearCodec.name, linearCodec]])

export function registerCodec(codec: Codec): void {
  byId.set(codec.id, codec)
  byName.set(codec.name, codec)
}

export function getCodecById(id: number): Codec {
  const codec = byId.get(id)
  if (!codec) throw new Error(`Unknown codec id: ${id}`)
  return codec
}

export function getCodecByName(name: string): Codec {
  const codec = byName.get(name)
  if (!codec) throw new Error(`Unknown codec: "${name}". Run \`codeart list\` to see available codecs.`)
  return codec
}

export function listCodecs(): Codec[] {
  return [...byId.values()]
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test tests/codecs/linear.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/codecs/linear.ts src/codecs/registry.ts tests/codecs/linear.test.ts
git commit -m "feat: linear codec and codec registry"
```

---

## Task 5: Encoder orchestrator

**Files:**
- Create: `src/encoder.ts`
- Create: `tests/encoder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/encoder.test.ts
import { describe, it, expect } from 'vitest'
import { encode } from '../src/encoder'
import { readPNG } from '../src/image'
import { readHeader } from '../src/header'
import path from 'path'
import os from 'os'

function tmpPath() {
  return path.join(os.tmpdir(), `codeart-enc-${Date.now()}.png`)
}

describe('encoder', () => {
  it('produces a PNG with a valid header', () => {
    const data = Buffer.from('const x = 42;')
    const out = tmpPath()
    encode(data, { out })

    const { pixels, width, height } = readPNG(out)
    const header = readHeader(pixels)

    expect(header.version).toBe(1)
    expect(header.algorithmId).toBe(0)
    expect(header.fileLength).toBe(data.length)
    expect(header.width).toBe(width)
    expect(header.height).toBe(height)
  })

  it('image dimensions fit the data', () => {
    const data = Buffer.alloc(300, 0xAB)
    const out = tmpPath()
    encode(data, { out })

    const { width, height } = readPNG(out)
    const totalPixels = width * height
    // Must have at least 32 header pixels + ceil(300/3) data pixels
    expect(totalPixels).toBeGreaterThanOrEqual(32 + Math.ceil(300 / 3))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/encoder.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write src/encoder.ts**

```ts
import fs from 'fs'
import { getCodecByName } from './codecs/registry'
import { writeHeader, HEADER_PIXELS } from './header'
import { writePNG } from './image'
import './codecs/register-all'
import type { EncodeOptions } from './types'

export function calcDimensions(dataBytes: number, requestedWidth?: number): { width: number; height: number } {
  const totalPixels = HEADER_PIXELS + Math.ceil(dataBytes / 3)
  const side = Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1)))
  const width = requestedWidth ?? side
  const height = Math.ceil(totalPixels / width)
  return { width, height }
}

export function encode(input: Buffer, options: EncodeOptions): void {
  const codec = getCodecByName(options.algo ?? 'linear')
  const { width, height } = calcDimensions(input.length, options.width)
  const dataPixelCount = width * height - HEADER_PIXELS
  const totalPixels = width * height

  const pixels = new Uint8Array(totalPixels * 3)

  const dataRgb = codec.encode(input, dataPixelCount, width, height)
  pixels.set(dataRgb, HEADER_PIXELS * 3)

  writeHeader(pixels, {
    version: 1,
    algorithmId: codec.id,
    fileLength: input.length,
    width,
    height,
    styleFlags: 0,
    ecLevel: 0,
    codecMeta: new Uint8Array(16),
    gradientFrom: [0, 0, 0],
    gradientTo: [0, 0, 0],
    gradientDirection: 0,
    backgroundOpacity: 0,
    backgroundColor: [0, 0, 0],
  })

  writePNG(options.out, pixels, width, height)
}

export function encodeFile(inputPath: string, options: EncodeOptions): void {
  encode(fs.readFileSync(inputPath), options)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn test tests/encoder.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/encoder.ts tests/encoder.test.ts
git commit -m "feat: encoder orchestrator with auto-dimensions"
```

---

## Task 6: Decoder orchestrator

**Files:**
- Create: `src/decoder.ts`
- Update: `tests/encoder.test.ts` (add roundtrip test)

- [ ] **Step 1: Write the failing test (add to tests/encoder.test.ts)**

```ts
// Add inside describe('encoder') in tests/encoder.test.ts
import { decode } from '../src/decoder'

it('encode → decode roundtrip preserves exact bytes', () => {
  const data = Buffer.from('function hello() { return 42; }')
  const png = tmpPath()
  const recovered = tmpPath().replace('.png', '.txt')

  encode(data, { out: png })
  decode(png, { out: recovered })

  expect(fs.readFileSync(recovered)).toEqual(data)
})

it('roundtrips a large binary buffer', () => {
  const data = Buffer.alloc(10_000)
  for (let i = 0; i < data.length; i++) data[i] = i % 256

  const png = tmpPath()
  const recovered = tmpPath().replace('.png', '.bin')

  encode(data, { out: png })
  decode(png, { out: recovered })

  expect(fs.readFileSync(recovered)).toEqual(data)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/encoder.test.ts
```
Expected: FAIL — `Cannot find module '../src/decoder'`

- [ ] **Step 3: Write src/decoder.ts**

```ts
import fs from 'fs'
import { readHeader, HEADER_PIXELS } from './header'
import { readPNG } from './image'
import { getCodecById } from './codecs/registry'
import type { DecodeOptions } from './types'

export function decode(inputPath: string, options: DecodeOptions): void {
  const { pixels, width, height } = readPNG(inputPath)
  const header = readHeader(pixels)
  const codec = getCodecById(header.algorithmId)
  const dataPixels = pixels.slice(HEADER_PIXELS * 3)
  const output = codec.decode(dataPixels, header.fileLength, width, height)
  fs.writeFileSync(options.out, output)
}
```

- [ ] **Step 4: Add `import fs from 'fs'` to tests/encoder.test.ts if missing**

The test file already uses `tmpPath()` and needs `fs` for `readFileSync` in the new tests. Make sure the import is at the top:
```ts
import fs from 'fs'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test tests/encoder.test.ts
```
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/decoder.ts tests/encoder.test.ts
git commit -m "feat: decoder orchestrator + encode/decode roundtrip verified"
```

---

## Task 7: CLI

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Write src/cli.ts**

```ts
import { Command } from 'commander'
import { encodeFile } from './encoder'
import { decode } from './decoder'
import { listCodecs } from './codecs/registry'
import './codecs/register-all'

const program = new Command()

program
  .name('codeart')
  .description('Encode source files into images and decode them back')
  .version('0.1.0')

program
  .command('encode <input>')
  .description('Encode a source file into a PNG image')
  .requiredOption('-o, --out <path>', 'output PNG path')
  .option('--algo <name>', 'codec algorithm', 'linear')
  .option('--width <n>', 'override image width', (v) => parseInt(v, 10))
  .option('--style <json>', 'style config as JSON string or path to .json file')
  .action((input: string, opts: { out: string; algo: string; width?: number; style?: string }) => {
    let style
    if (opts.style) {
      try {
        style = JSON.parse(opts.style)
      } catch {
        const fs = require('fs')
        style = JSON.parse(fs.readFileSync(opts.style, 'utf8'))
      }
    }
    encodeFile(input, { out: opts.out, algo: opts.algo, width: opts.width, style })
    console.log(`Encoded → ${opts.out}`)
  })

program
  .command('decode <input>')
  .description('Decode a PNG image back to source')
  .requiredOption('-o, --out <path>', 'output file path')
  .action((input: string, opts: { out: string }) => {
    decode(input, { out: opts.out })
    console.log(`Decoded → ${opts.out}`)
  })

program
  .command('list')
  .description('List available codec algorithms')
  .action(() => {
    for (const codec of listCodecs()) {
      console.log(`  ${codec.id}  ${codec.name}`)
    }
  })

program.parse()
```

- [ ] **Step 2: Create src/codecs/register-all.ts** (side-effect import that registers all codecs)

```ts
// src/codecs/register-all.ts
// Import this once in cli.ts to register all codecs with the registry.
// New codecs: add an import here and call registerCodec().
import { registerCodec } from './registry'
import { linearCodec } from './linear'

registerCodec(linearCodec)
```

- [ ] **Step 3: Smoke test encode**

```bash
echo "const hello = () => 'world';" > /tmp/test.js
npx tsx src/cli.ts encode /tmp/test.js -o /tmp/test.png
```
Expected output: `Encoded → /tmp/test.png`

- [ ] **Step 4: Smoke test decode**

```bash
npx tsx src/cli.ts decode /tmp/test.png -o /tmp/recovered.js
cat /tmp/recovered.js
```
Expected output: `const hello = () => 'world';`

- [ ] **Step 5: Smoke test list**

```bash
npx tsx src/cli.ts list
```
Expected output:
```
  0  linear
```

- [ ] **Step 6: Commit**

```bash
git add src/cli.ts src/codecs/register-all.ts
git commit -m "feat: CLI with encode, decode, and list commands"
```

---

## Task 8: Radial codec

**Files:**
- Create: `src/codecs/radial.ts`
- Create: `tests/codecs/radial.test.ts`
- Update: `src/codecs/register-all.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/codecs/radial.test.ts
import { describe, it, expect } from 'vitest'
import { radialCodec } from '../../src/codecs/radial'

describe('radialCodec', () => {
  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Hello, radial world! This is a test of the radial codec.')
    const width = 20
    const height = 20
    const dataPixelCount = width * height - 32
    const encoded = radialCodec.encode(input, dataPixelCount, width, height)
    expect(encoded.length).toBe(dataPixelCount * 3)
    const decoded = radialCodec.decode(encoded, input.length, width, height)
    expect(decoded).toEqual(input)
  })

  it('places different bytes in different pixels than linear', () => {
    const input = Buffer.alloc(9, 0xFF)
    input[0] = 0xAA; input[3] = 0xBB; input[6] = 0xCC
    const width = 10; const height = 10
    const dataPixelCount = width * height - 32
    const linear = Buffer.alloc(dataPixelCount * 3)
    linear[0] = 0xAA; linear[9] = 0xBB; linear[18] = 0xCC
    const radial = radialCodec.encode(input, dataPixelCount, width, height)
    // radial must place data at different positions than linear
    expect(Buffer.from(radial)).not.toEqual(linear)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/codecs/radial.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write src/codecs/radial.ts**

```ts
import type { Codec, PixelBuffer } from './types'

function spiralOrder(dataPixelCount: number, width: number, height: number): number[] {
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const items = Array.from({ length: dataPixelCount }, (_, i) => {
    const imgIdx = i + 32
    const x = imgIdx % width
    const y = Math.floor(imgIdx / width)
    return { i, dist: (x - cx) ** 2 + (y - cy) ** 2 }
  })
  items.sort((a, b) => a.dist - b.dist || a.i - b.i)
  return items.map(({ i }) => i)
}

export const radialCodec: Codec = {
  id: 1,
  name: 'radial',

  encode(input: Buffer, dataPixelCount: number, width: number, height: number): PixelBuffer {
    const order = spiralOrder(dataPixelCount, width, height)
    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let byteIdx = 0; byteIdx < input.length; byteIdx++) {
      const pixelPos = order[Math.floor(byteIdx / 3)]
      pixels[pixelPos * 3 + (byteIdx % 3)] = input[byteIdx]
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, width: number, height: number): Buffer {
    const dataPixelCount = pixels.length / 3
    const order = spiralOrder(dataPixelCount, width, height)
    const output = Buffer.allocUnsafe(length)
    for (let byteIdx = 0; byteIdx < length; byteIdx++) {
      const pixelPos = order[Math.floor(byteIdx / 3)]
      output[byteIdx] = pixels[pixelPos * 3 + (byteIdx % 3)]
    }
    return output
  },
}
```

- [ ] **Step 4: Register radial codec in register-all.ts**

```ts
// src/codecs/register-all.ts
import { registerCodec } from './registry'
import { linearCodec } from './linear'
import { radialCodec } from './radial'

registerCodec(linearCodec)
registerCodec(radialCodec)
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test tests/codecs/radial.test.ts
```
Expected: PASS

- [ ] **Step 6: Smoke test via CLI**

```bash
echo "const hello = () => 'world';" > /tmp/test.js
npx tsx src/cli.ts encode /tmp/test.js -o /tmp/test-radial.png --algo radial
npx tsx src/cli.ts decode /tmp/test-radial.png -o /tmp/recovered-radial.js
cat /tmp/recovered-radial.js
```
Expected: `const hello = () => 'world';`

- [ ] **Step 7: Commit**

```bash
git add src/codecs/radial.ts src/codecs/register-all.ts tests/codecs/radial.test.ts
git commit -m "feat: radial codec — bytes placed in outward spiral from image center"
```

---

## Task 9: Interleaved codec

**Files:**
- Create: `src/codecs/interleaved.ts`
- Create: `tests/codecs/interleaved.test.ts`
- Update: `src/codecs/register-all.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/codecs/interleaved.test.ts
import { describe, it, expect } from 'vitest'
import { interleavedCodec } from '../../src/codecs/interleaved'

describe('interleavedCodec', () => {
  it('produces a different pixel order than raw bytes', () => {
    const input = Buffer.from([0xAA, 0xBB, 0xCC,  0x11, 0x22, 0x33,  0x44, 0x55, 0x66])
    const encoded = interleavedCodec.encode(input, 3, 10, 10)
    // pixel 0 and pixel 1 (i%3===0) should be swapped
    // Before swap: pixel0=[0xAA,0xBB,0xCC], pixel1=[0x11,0x22,0x33]
    // After swap:  pixel0=[0x11,0x22,0x33], pixel1=[0xAA,0xBB,0xCC]
    expect(encoded[0]).toBe(0x11)
    expect(encoded[3]).toBe(0xAA)
  })

  it('roundtrips arbitrary data', () => {
    const input = Buffer.from('Interleaved encoding test with some longer content here!')
    const dataPixelCount = Math.ceil(input.length / 3)
    const encoded = interleavedCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = interleavedCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/codecs/interleaved.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write src/codecs/interleaved.ts**

```ts
import type { Codec, PixelBuffer } from './types'

function swapEveryThird(pixels: Uint8Array, pixelCount: number): void {
  for (let i = 0; i + 1 < pixelCount; i += 3) {
    const a = i * 3
    const b = (i + 1) * 3
    const r = pixels[a]; const g = pixels[a + 1]; const bl = pixels[a + 2]
    pixels[a]     = pixels[b];     pixels[a + 1] = pixels[b + 1]; pixels[a + 2] = pixels[b + 2]
    pixels[b]     = r;             pixels[b + 1] = g;             pixels[b + 2] = bl
  }
}

export const interleavedCodec: Codec = {
  id: 2,
  name: 'interleaved',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let i = 0; i < input.length; i++) pixels[i] = input[i]
    swapEveryThird(pixels, Math.ceil(input.length / 3))
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    const copy = new Uint8Array(pixels)
    swapEveryThird(copy, Math.ceil(length / 3))
    return Buffer.from(copy.slice(0, length))
  },
}
```

- [ ] **Step 4: Register in register-all.ts**

```ts
// src/codecs/register-all.ts
import { registerCodec } from './registry'
import { linearCodec } from './linear'
import { radialCodec } from './radial'
import { interleavedCodec } from './interleaved'

registerCodec(linearCodec)
registerCodec(radialCodec)
registerCodec(interleavedCodec)
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test tests/codecs/interleaved.test.ts
```
Expected: PASS

- [ ] **Step 6: Run all tests**

```bash
yarn test
```
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add src/codecs/interleaved.ts src/codecs/register-all.ts tests/codecs/interleaved.test.ts
git commit -m "feat: interleaved codec — every 3rd pixel swapped with its successor"
```

---

## Task 10: Semantic codec

**Files:**
- Create: `src/codecs/semantic.ts`
- Create: `tests/codecs/semantic.test.ts`
- Update: `src/codecs/register-all.ts`

The semantic codec tokenizes source as UTF-8. Recognized JS/TS keywords get a fixed-color pixel encoding; other bytes fall back to linear RGB. A 1-pixel **type prefix** precedes each run:
- Prefix `R=0x00, G=0, B=0` → raw run: the next 3 pixels hold 9 bytes of data linearly
- Prefix `R=keyword_id, G=0, B=0` (id 1–255) → the next N pixels are the keyword color block (keyword text recovered from ID table)

| ID | Keyword | Color (RGB) | Pixels |
|----|---------|-------------|--------|
| 1 | `function` | `255,32,64` | 4 |
| 2 | `const` | `255,96,96` | 1 |
| 3 | `var` | `255,128,128` | 1 |
| 4 | `let` | `255,160,160` | 1 |
| 5 | `for` | `64,160,255` | 1 |
| 6 | `forEach` | `64,160,255` | 4 |
| 7 | `class` | `255,144,32` | 4 |
| 8 | `return` | `32,255,128` | 1 |

- [ ] **Step 1: Write the failing test**

```ts
// tests/codecs/semantic.test.ts
import { describe, it, expect } from 'vitest'
import { semanticCodec } from '../../src/codecs/semantic'

describe('semanticCodec', () => {
  it('roundtrips plain text with no keywords', () => {
    const input = Buffer.from('hello world 123')
    const dataPixelCount = 200
    const encoded = semanticCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = semanticCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })

  it('roundtrips source with keywords', () => {
    const input = Buffer.from('const x = function() { return 42; }')
    const dataPixelCount = 200
    const encoded = semanticCodec.encode(input, dataPixelCount, 20, 20)
    const decoded = semanticCodec.decode(encoded, input.length, 20, 20)
    expect(decoded).toEqual(input)
  })

  it('roundtrips a more complex snippet', () => {
    const input = Buffer.from(`
class Animal {
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound.\`; }
}
const dog = new Animal('Dog');
for (let i = 0; i < 3; i++) { console.log(dog.speak()); }
`.trim())
    const dataPixelCount = 1000
    const encoded = semanticCodec.encode(input, dataPixelCount, 40, 40)
    const decoded = semanticCodec.decode(encoded, input.length, 40, 40)
    expect(decoded).toEqual(input)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/codecs/semantic.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write src/codecs/semantic.ts**

```ts
import type { Codec, PixelBuffer } from './types'

interface KeywordEntry {
  id: number
  text: string
  color: [number, number, number]
  pixels: number
}

const KEYWORDS: KeywordEntry[] = [
  { id: 1, text: 'function', color: [255,  32,  64], pixels: 4 },
  { id: 2, text: 'const',    color: [255,  96,  96], pixels: 1 },
  { id: 3, text: 'var',      color: [255, 128, 128], pixels: 1 },
  { id: 4, text: 'let',      color: [255, 160, 160], pixels: 1 },
  { id: 5, text: 'for',      color: [ 64, 160, 255], pixels: 1 },
  { id: 6, text: 'forEach',  color: [ 64, 160, 255], pixels: 4 },
  { id: 7, text: 'class',    color: [255, 144,  32], pixels: 4 },
  { id: 8, text: 'return',   color: [ 32, 255, 128], pixels: 1 },
]

const BY_ID = new Map(KEYWORDS.map(k => [k.id, k]))

// Sort longest-first so 'forEach' matches before 'for'
const SORTED = [...KEYWORDS].sort((a, b) => b.text.length - a.text.length)

function matchKeyword(src: Buffer, offset: number): KeywordEntry | null {
  for (const kw of SORTED) {
    if (src.slice(offset, offset + kw.text.length).toString() === kw.text) {
      const after = offset + kw.text.length
      const isBoundary = after >= src.length || !/\w/.test(String.fromCharCode(src[after]))
      if (isBoundary) return kw
    }
  }
  return null
}

export const semanticCodec: Codec = {
  id: 3,
  name: 'semantic',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number): PixelBuffer {
    const out: number[] = []

    let i = 0
    while (i < input.length) {
      const kw = matchKeyword(input, i)
      if (kw) {
        // Keyword prefix pixel
        out.push(kw.id, 0, 0)
        // Color pixels (all same color)
        for (let p = 0; p < kw.pixels; p++) out.push(...kw.color)
        i += kw.text.length
      } else {
        // Raw prefix pixel
        out.push(0, 0, 0)
        // Up to 9 bytes of data in 3 pixels
        for (let p = 0; p < 3; p++) {
          for (let c = 0; c < 3; c++) {
            out.push(i < input.length ? input[i++] : 0)
          }
        }
      }
    }

    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let j = 0; j < Math.min(out.length, pixels.length); j++) pixels[j] = out[j]
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    const out: number[] = []
    let i = 0

    while (out.length < length && i + 3 <= pixels.length) {
      const prefixR = pixels[i]
      const prefixG = pixels[i + 1]
      const prefixB = pixels[i + 2]
      i += 3

      if (prefixR === 0 && prefixG === 0 && prefixB === 0) {
        // Raw run: next 3 pixels = 9 bytes
        for (let p = 0; p < 3 && out.length < length; p++) {
          for (let c = 0; c < 3 && out.length < length; c++) {
            if (i < pixels.length) out.push(pixels[i++])
          }
        }
      } else {
        const kw = BY_ID.get(prefixR)
        if (!kw) throw new Error(`Unknown keyword id: ${prefixR}`)
        // Skip color pixels
        i += kw.pixels * 3
        // Emit keyword text bytes
        for (const ch of kw.text) out.push(ch.charCodeAt(0))
      }
    }

    return Buffer.from(out.slice(0, length))
  },
}
```

- [ ] **Step 4: Register in register-all.ts**

```ts
// src/codecs/register-all.ts
import { registerCodec } from './registry'
import { linearCodec } from './linear'
import { radialCodec } from './radial'
import { interleavedCodec } from './interleaved'
import { semanticCodec } from './semantic'

registerCodec(linearCodec)
registerCodec(radialCodec)
registerCodec(interleavedCodec)
registerCodec(semanticCodec)
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test tests/codecs/semantic.test.ts
```
Expected: PASS

- [ ] **Step 6: Run all tests**

```bash
yarn test
```
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add src/codecs/semantic.ts src/codecs/register-all.ts tests/codecs/semantic.test.ts
git commit -m "feat: semantic codec — keyword-aware encoding with type prefix pixels"
```

---

## Task 11: Style layer

**Files:**
- Create: `src/style.ts`
- Create: `tests/style.test.ts`
- Update: `src/encoder.ts`
- Update: `src/decoder.ts`

Style blend formula (integer, reversible when parameters are known):
```
blended = round(data * opacity + gradient_at_pos * (1 - opacity))
reversed = round((blended - gradient_at_pos * (1 - opacity)) / opacity)
```
The header pixels (indices 0–31) are never touched by the style layer.

- [ ] **Step 1: Write the failing test**

```ts
// tests/style.test.ts
import { describe, it, expect } from 'vitest'
import { applyStyle, reverseStyle } from '../src/style'
import type { HeaderData } from '../src/types'

function makeHeader(overrides: Partial<HeaderData> = {}): HeaderData {
  return {
    version: 1, algorithmId: 0, fileLength: 100,
    width: 10, height: 10, styleFlags: 0, ecLevel: 0,
    codecMeta: new Uint8Array(16),
    gradientFrom: [255, 0, 0], gradientTo: [0, 0, 255],
    gradientDirection: 1, backgroundOpacity: 0,
    backgroundColor: [0, 0, 0],
    ...overrides,
  }
}

describe('style', () => {
  it('does not modify header pixels (first 32)', () => {
    const pixels = new Uint8Array(10 * 10 * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = 0xAB
    const header = makeHeader({ styleFlags: 0b01 })
    applyStyle(pixels, 10, 10, header, 0.5)
    // First 32 pixels (96 bytes) must be unchanged
    for (let i = 0; i < 96; i++) expect(pixels[i]).toBe(0xAB)
  })

  it('roundtrips with opacity=1.0 (pure data, no blend)', () => {
    const pixels = new Uint8Array(10 * 10 * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 13) % 256
    const original = new Uint8Array(pixels)
    const header = makeHeader({ styleFlags: 0b01 })
    applyStyle(pixels, 10, 10, header, 1.0)
    expect(pixels).toEqual(original)
    reverseStyle(pixels, 10, 10, header, 1.0)
    expect(pixels).toEqual(original)
  })

  it('apply then reverse recovers original within ±1 (opacity=0.8)', () => {
    const pixels = new Uint8Array(10 * 10 * 3)
    for (let i = 96; i < pixels.length; i++) pixels[i] = (i * 7 + 50) % 200
    const original = new Uint8Array(pixels)
    const header = makeHeader({ styleFlags: 0b01 })
    applyStyle(pixels, 10, 10, header, 0.8)
    reverseStyle(pixels, 10, 10, header, 0.8)
    for (let i = 96; i < pixels.length; i++) {
      expect(Math.abs(pixels[i] - original[i])).toBeLessThanOrEqual(1)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test tests/style.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write src/style.ts**

```ts
import type { HeaderData } from './types'

function gradientColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  channel: number
): number {
  return Math.round(from[channel] + (to[channel] - from[channel]) * t)
}

function blendFactor(x: number, y: number, width: number, height: number, direction: number): number {
  if (direction === 1) return x / Math.max(width - 1, 1)
  if (direction === 2) return y / Math.max(height - 1, 1)
  if (direction === 3) return (x / Math.max(width - 1, 1) + y / Math.max(height - 1, 1)) / 2
  return 0
}

export function applyStyle(
  pixels: Uint8Array,
  width: number,
  height: number,
  header: HeaderData,
  opacity: number
): void {
  if (opacity >= 1.0) return
  const hasGradient = (header.styleFlags & 0b01) !== 0
  if (!hasGradient) return

  for (let pixelIdx = 32; pixelIdx < width * height; pixelIdx++) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)
    const t = blendFactor(x, y, width, height, header.gradientDirection)
    for (let c = 0; c < 3; c++) {
      const dataVal = pixels[pixelIdx * 3 + c]
      const gradVal = gradientColor(header.gradientFrom, header.gradientTo, t, c)
      pixels[pixelIdx * 3 + c] = Math.round(dataVal * opacity + gradVal * (1 - opacity))
    }
  }
}

export function reverseStyle(
  pixels: Uint8Array,
  width: number,
  height: number,
  header: HeaderData,
  opacity: number
): void {
  if (opacity >= 1.0) return
  const hasGradient = (header.styleFlags & 0b01) !== 0
  if (!hasGradient) return

  for (let pixelIdx = 32; pixelIdx < width * height; pixelIdx++) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)
    const t = blendFactor(x, y, width, height, header.gradientDirection)
    for (let c = 0; c < 3; c++) {
      const blended = pixels[pixelIdx * 3 + c]
      const gradVal = gradientColor(header.gradientFrom, header.gradientTo, t, c)
      pixels[pixelIdx * 3 + c] = Math.min(255, Math.max(0, Math.round((blended - gradVal * (1 - opacity)) / opacity)))
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn test tests/style.test.ts
```
Expected: PASS

- [ ] **Step 5: Wire style into encoder.ts**

Replace the `encode` function body in `src/encoder.ts` to add style support:

```ts
import fs from 'fs'
import { getCodecByName } from './codecs/registry'
import { writeHeader, HEADER_PIXELS } from './header'
import { writePNG } from './image'
import { applyStyle } from './style'
import type { EncodeOptions, Style } from './types'

export function calcDimensions(dataBytes: number, requestedWidth?: number): { width: number; height: number } {
  const totalPixels = HEADER_PIXELS + Math.ceil(dataBytes / 3)
  const side = Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1)))
  const width = requestedWidth ?? side
  const height = Math.ceil(totalPixels / width)
  return { width, height }
}

export function encode(input: Buffer, options: EncodeOptions): void {
  const codec = getCodecByName(options.algo ?? 'linear')
  const { width, height } = calcDimensions(input.length, options.width)
  const dataPixelCount = width * height - HEADER_PIXELS
  const totalPixels = width * height

  const pixels = new Uint8Array(totalPixels * 3)
  const dataRgb = codec.encode(input, dataPixelCount, width, height)
  pixels.set(dataRgb, HEADER_PIXELS * 3)

  const style = options.style
  const hasGradient = !!(style?.gradient)
  const gradFrom = style?.gradient?.from ?? [0, 0, 0]
  const gradTo = style?.gradient?.to ?? [0, 0, 0]
  const dirMap: Record<string, number> = { horizontal: 1, vertical: 2, diagonal: 3 }
  const gradDir = style?.gradient ? (dirMap[style.gradient.direction] ?? 0) : 0
  const bgColor = style?.background ?? [0, 0, 0]

  // Quantize opacity to 8-bit so apply and reverse use the exact same value
  const rawOpacity = style?.opacity ?? 1.0
  const blendAmount = hasGradient ? Math.round((1 - rawOpacity) * 255) : 0
  const opacity = 1 - blendAmount / 255  // quantized opacity used for both apply and stored

  const headerData = {
    version: 1,
    algorithmId: codec.id,
    fileLength: input.length,
    width,
    height,
    styleFlags: (hasGradient ? 0b01 : 0) | (style?.background ? 0b10 : 0),
    ecLevel: 0,
    codecMeta: new Uint8Array(16),
    gradientFrom: gradFrom as [number, number, number],
    gradientTo: gradTo as [number, number, number],
    gradientDirection: gradDir,
    backgroundOpacity: blendAmount,  // stores (1 - opacity) * 255 for gradient blend
    backgroundColor: bgColor as [number, number, number],
  }

  writeHeader(pixels, headerData)

  if (hasGradient && blendAmount > 0) applyStyle(pixels, width, height, headerData, opacity)

  writePNG(options.out, pixels, width, height)
}

export function encodeFile(inputPath: string, options: EncodeOptions): void {
  encode(fs.readFileSync(inputPath), options)
}
```

- [ ] **Step 6: Wire style into decoder.ts**

```ts
import fs from 'fs'
import { readHeader, HEADER_PIXELS } from './header'
import { readPNG } from './image'
import { getCodecById } from './codecs/registry'
import { reverseStyle } from './style'
import type { DecodeOptions } from './types'

export function decode(inputPath: string, options: DecodeOptions): void {
  const { pixels, width, height } = readPNG(inputPath)
  const header = readHeader(pixels)
  const codec = getCodecById(header.algorithmId)

  if (header.styleFlags & 0b01) {
    const opacity = header.backgroundOpacity === 0 ? 1.0 : 1 - (header.backgroundOpacity / 255)
    reverseStyle(pixels, width, height, header, opacity)
  }

  const dataPixels = pixels.slice(HEADER_PIXELS * 3)
  const output = codec.decode(dataPixels, header.fileLength, width, height)
  fs.writeFileSync(options.out, output)
}
```

- [ ] **Step 7: Run all tests**

```bash
yarn test
```
Expected: all PASS

- [ ] **Step 8: Smoke test with gradient style**

```bash
echo "const hello = () => 'world';" > /tmp/test.js
npx tsx src/cli.ts encode /tmp/test.js -o /tmp/styled.png --style '{"gradient":{"from":[255,0,0],"to":[0,0,255],"direction":"diagonal"},"opacity":0.8}'
npx tsx src/cli.ts decode /tmp/styled.png -o /tmp/recovered-styled.js
cat /tmp/recovered-styled.js
```
Expected: output matches input (within ±1 rounding tolerance per byte)

- [ ] **Step 9: Commit**

```bash
git add src/style.ts src/encoder.ts src/decoder.ts tests/style.test.ts
git commit -m "feat: style layer — gradient compositing applied after encode, reversed before decode"
```

---

## Task 12: Final smoke test with a real source file

- [ ] **Step 1: Run full encode → decode on a real JS file**

```bash
# Create a sample source file if you don't have one
cat > /tmp/sample.js << 'EOF'
function fibonacci(n) {
  const memo = {};
  function fib(n) {
    if (n <= 1) return n;
    if (memo[n]) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
  }
  return fib(n);
}

const results = [];
for (let i = 0; i < 20; i++) {
  results.push(fibonacci(i));
}
console.log(results);
EOF

# Test all codecs
for algo in linear radial interleaved semantic; do
  npx tsx src/cli.ts encode /tmp/sample.js -o /tmp/sample-$algo.png --algo $algo
  npx tsx src/cli.ts decode /tmp/sample-$algo.png -o /tmp/recovered-$algo.js
  diff /tmp/sample.js /tmp/recovered-$algo.js && echo "$algo: OK" || echo "$algo: MISMATCH"
done
```
Expected: all four print `OK`

- [ ] **Step 2: Run full test suite one final time**

```bash
yarn test
```
Expected: all PASS

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify all codecs roundtrip a real source file"
```
