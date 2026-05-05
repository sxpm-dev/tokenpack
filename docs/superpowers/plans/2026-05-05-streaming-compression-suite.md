# Streaming Compression Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four custom streaming-friendly compression algorithms (SLZ, AHUFF, LZP, CASCADE) and a new pixel codec (StreamPack) without changing any existing code paths.

**Architecture:** New compressor classes extend the existing `AbstractCompressor` base and plug into `getCompressorByMode`/`getCompressorByHeaderLevel` in `src/compressors/index.ts`. The StreamPack codec registers via the existing `registerCodec` mechanism. All additions are additive — existing behavior for any existing `compressionMode` or codec name is unchanged.

**Tech Stack:** TypeScript (ESM, strict), Vitest, Node.js Buffers, no new npm dependencies.

---

## File Map

**Create:**
- `src/compressors/bits.ts` — BitWriter / BitReader (shared by AHUFF and LZP)
- `src/compressors/slz.ts` — SLZCompressor: LZ77-style, 64 KB ring buffer, streaming decode
- `src/compressors/ahuff.ts` — AHUFFCompressor: per-block adaptive Huffman, 16 KB blocks
- `src/compressors/lzp.ts` — LZPCompressor: 3-byte context prediction, 1-bit per match
- `src/compressors/cascade.ts` — CascadeCompressor: SLZ → AHUFF two-pass
- `src/codecs/streampack/index.ts` — StreamPack codec with 1 KB sync markers
- `tests/compressors/bits.test.ts`
- `tests/compressors/slz.test.ts`
- `tests/compressors/ahuff.test.ts`
- `tests/compressors/lzp.test.ts`
- `tests/compressors/cascade.test.ts`
- `tests/codecs/streampack.test.ts`

**Modify (additive only):**
- `src/compressors/index.ts` — add new `case` branches in `getCompressorByMode` and `getCompressorByHeaderLevel`; no existing case touched
- `src/codecs/register-all.ts` — one additional `registerCodec(streampackCodec)` line

---

## Task 1 — Bit I/O utilities

**Files:**
- Create: `src/compressors/bits.ts`
- Create: `tests/compressors/bits.test.ts`

### Step 1: Write the failing tests

```typescript
// tests/compressors/bits.test.ts
import { describe, it, expect } from 'vitest'
import { BitWriter, BitReader } from '../../src/compressors/bits'

describe('BitWriter', () => {
  it('writes single bits and flushes to bytes', () => {
    const w = new BitWriter()
    w.write(1, 1) // bit = 1
    w.write(0, 1) // bit = 0
    w.write(1, 1) // bit = 1
    w.write(0, 1) // bit = 0
    w.write(0, 1)
    w.write(0, 1)
    w.write(0, 1)
    w.write(0, 1)
    const out = w.flush()
    expect(out[0]).toBe(0b10100000)
  })

  it('writes multi-bit codes MSB-first', () => {
    const w = new BitWriter()
    w.write(0b101, 3)  // 1,0,1
    w.write(0b01,  2)  // 0,1
    w.write(0b110, 3)  // 1,1,0
    const out = w.flush()
    // bits: 1,0,1,0,1,1,1,0 = 0b10101110 = 0xAE
    expect(out[0]).toBe(0xAE)
  })

  it('pads the final byte with zero bits', () => {
    const w = new BitWriter()
    w.write(1, 1)   // 1 bit written; 7 padding zeros
    const out = w.flush()
    expect(out.length).toBe(1)
    expect(out[0]).toBe(0b10000000)
  })
})

describe('BitReader', () => {
  it('reads bits written by BitWriter', () => {
    const w = new BitWriter()
    w.write(0b101, 3)
    w.write(0b01,  2)
    w.write(0b110, 3)
    const data = w.flush()
    const r = new BitReader(data)
    expect(r.read(3)).toBe(0b101)
    expect(r.read(2)).toBe(0b01)
    expect(r.read(3)).toBe(0b110)
  })

  it('peek does not advance position', () => {
    const data = Buffer.from([0b11001100])
    const r = new BitReader(data)
    expect(r.peek(4)).toBe(0b1100)
    expect(r.peek(4)).toBe(0b1100) // same
    r.advance(4)
    expect(r.read(4)).toBe(0b1100) // second nibble
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/bits.test.ts
```
Expected: `Cannot find module '../../src/compressors/bits'`

- [ ] **Step 3: Implement `src/compressors/bits.ts`**

```typescript
export class BitWriter {
  private buf: number[] = []
  private cur = 0
  private bits = 0

  write(code: number, len: number): void {
    for (let i = len - 1; i >= 0; i--) {
      this.cur = (this.cur << 1) | ((code >>> i) & 1)
      if (++this.bits === 8) {
        this.buf.push(this.cur)
        this.cur = 0
        this.bits = 0
      }
    }
  }

  flush(): Buffer {
    if (this.bits > 0) this.buf.push(this.cur << (8 - this.bits))
    return Buffer.from(this.buf)
  }
}

export class BitReader {
  private pos = 0
  private cur = 0
  private avail = 0

  constructor(private readonly data: Buffer) {}

  peek(n: number): number {
    while (this.avail < n && this.pos < this.data.length) {
      this.cur = (this.cur << 8) | this.data[this.pos++]
      this.avail += 8
    }
    return (this.cur >>> (this.avail - n)) & ((1 << n) - 1)
  }

  advance(n: number): void {
    this.avail -= n
  }

  read(n: number): number {
    const v = this.peek(n)
    this.advance(n)
    return v
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/bits.test.ts
```
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/compressors/bits.ts tests/compressors/bits.test.ts
git commit -m "feat: add BitWriter/BitReader utilities for custom compressors"
```

---

## Task 2 — SLZ (Streaming LZ) compressor

SLZ is a custom LZ77 variant with a 64 KB ring buffer. Tokens are either a literal run (≤128 bytes) or a back-reference (3–130 bytes, offset 1–65535). The decoder keeps only a 64 KB ring buffer in memory and emits each matched byte immediately — fully streaming.

**Header level ID: `10`**

**Token wire format:**
```
LITERAL_RUN  bit7=0  byte: (count-1) & 0x7F  → followed by count literal bytes
BACK_REF     bit7=1  byte: (matchLen-3) & 0x7F  → 2 bytes big-endian offset (1-65535)
```

**Stream format:**
```
[0x53 0x4C 0x5A 0x01]  4-byte magic "SLZ\x01"
[uint32 BE]            uncompressed length
... tokens ...
```

**Files:**
- Create: `src/compressors/slz.ts`
- Create: `tests/compressors/slz.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/compressors/slz.test.ts
import { describe, it, expect } from 'vitest'
import { SLZCompressor } from '../../src/compressors/slz'

const slz = new SLZCompressor()

describe('SLZCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('hello world')
    const { data } = slz.compress(input)
    expect(slz.decompress(data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    const { data } = slz.compress(input)
    expect(slz.decompress(data)).toEqual(input)
  })

  it('compresses repetitive data smaller than original', () => {
    const input = Buffer.alloc(1000, 0x41) // 1000 "A"s
    const { data } = slz.compress(input)
    expect(data.length).toBeLessThan(input.length)
  })

  it('handles random data without expansion beyond 1.02x', () => {
    // worst case: 1 flag byte per 128 literals
    const input = Buffer.from(Array.from({ length: 512 }, (_, i) => (i * 37 + 13) & 0xFF))
    const { data } = slz.compress(input)
    expect(data.length).toBeLessThan(input.length * 1.02 + 16)
  })

  it('round-trips data larger than 64 KB window', () => {
    // 70 KB of patterned data
    const chunk = Buffer.from('abcdefgh')
    const parts: Buffer[] = []
    for (let i = 0; i < 9000; i++) parts.push(chunk)
    const input = Buffer.concat(parts)
    const { data } = slz.compress(input)
    expect(slz.decompress(data)).toEqual(input)
    expect(data.length).toBeLessThan(input.length)
  })

  it('compression level is 10', () => {
    const { level } = slz.compress(Buffer.from('test'))
    expect(level).toBe(10)
  })

  it('streaming decode via createDecodeStream matches decompress', async () => {
    const input = Buffer.from('streaming test: ' + 'abcd'.repeat(200))
    const { data } = slz.compress(input)
    const stream = slz.createDecodeStream()

    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      // Feed in small pieces to stress the incremental path
      for (let i = 0; i < data.length; i += 16) {
        stream.write(data.subarray(i, Math.min(i + 16, data.length)))
      }
      stream.end()
    })

    const result = Buffer.concat(chunks)
    expect(result).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/slz.test.ts
```
Expected: `Cannot find module '../../src/compressors/slz'`

- [ ] **Step 3: Implement `src/compressors/slz.ts`**

```typescript
import { Transform } from 'stream'
import { AbstractCompressor, type CompressionResult, type CompressionMeta } from './types'

const MAGIC = Buffer.from([0x53, 0x4C, 0x5A, 0x01])
const WINDOW_SIZE = 65536
const WINDOW_MASK = WINDOW_SIZE - 1
const MIN_MATCH = 3
const MAX_MATCH = 130
const MAX_LIT_RUN = 128
const LEVEL = 10

function hash3(a: number, b: number, c: number): number {
  return ((a * 16777619) ^ (b * 2166136261) ^ c) & 0xFFFF
}

function slzCompress(input: Buffer): Buffer {
  const out: number[] = [0x53, 0x4C, 0x5A, 0x01,
    (input.length >>> 24) & 0xFF,
    (input.length >>> 16) & 0xFF,
    (input.length >>> 8) & 0xFF,
    input.length & 0xFF,
  ]

  const table = new Int32Array(65536).fill(-1)
  const litBuf: number[] = []

  function flushLiterals(): void {
    let i = 0
    while (i < litBuf.length) {
      const count = Math.min(litBuf.length - i, MAX_LIT_RUN)
      out.push(count - 1)
      for (let j = 0; j < count; j++) out.push(litBuf[i++])
    }
    litBuf.length = 0
  }

  let pos = 0
  while (pos < input.length) {
    if (pos + MIN_MATCH <= input.length) {
      const h = hash3(input[pos], input[pos + 1], input[pos + 2])
      const candidate = table[h]
      table[h] = pos

      if (candidate >= 0) {
        const offset = pos - candidate
        if (offset >= 1 && offset <= 65535) {
          let len = 0
          const maxLen = Math.min(MAX_MATCH, input.length - pos)
          while (len < maxLen && input[candidate + len] === input[pos + len]) len++
          if (len >= MIN_MATCH) {
            flushLiterals()
            out.push(0x80 | (len - MIN_MATCH))
            out.push((offset >>> 8) & 0xFF)
            out.push(offset & 0xFF)
            pos += len
            continue
          }
        }
      }
    }

    litBuf.push(input[pos++])
    if (litBuf.length === MAX_LIT_RUN) flushLiterals()
  }
  flushLiterals()

  return Buffer.from(out)
}

function slzDecompress(input: Buffer): Buffer {
  if (!input.subarray(0, 4).equals(MAGIC)) throw new Error('SLZ: invalid magic')
  const totalLen = input.readUInt32BE(4)
  const out = Buffer.allocUnsafe(totalLen)
  let outPos = 0
  let inPos = 8

  const ring = new Uint8Array(WINDOW_SIZE)
  let head = 0

  while (inPos < input.length && outPos < totalLen) {
    const token = input[inPos++]

    if ((token & 0x80) === 0) {
      const count = (token & 0x7F) + 1
      for (let i = 0; i < count; i++) {
        const b = input[inPos++]
        ring[head] = b; head = (head + 1) & WINDOW_MASK
        out[outPos++] = b
      }
    } else {
      const matchLen = (token & 0x7F) + MIN_MATCH
      const offset = (input[inPos] << 8) | input[inPos + 1]
      inPos += 2
      let src = (head - offset + WINDOW_SIZE) & WINDOW_MASK
      for (let i = 0; i < matchLen; i++) {
        const b = ring[src]; src = (src + 1) & WINDOW_MASK
        ring[head] = b; head = (head + 1) & WINDOW_MASK
        out[outPos++] = b
      }
    }
  }

  return out.subarray(0, outPos)
}

export class SLZCompressor extends AbstractCompressor {
  readonly id = 'slz'
  readonly label = 'StreamLZ'
  readonly streamableDecode = true

  compress(input: Buffer): CompressionResult {
    return { data: slzCompress(input), level: LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer, _meta?: CompressionMeta): Buffer {
    return slzDecompress(input)
  }

  createDecodeStream(): Transform {
    const ring = new Uint8Array(WINDOW_SIZE)
    let head = 0
    let headerParsed = false
    let totalBytes = 0
    let outBytes = 0
    let pending = Buffer.alloc(0)

    return new Transform({
      transform(chunk: Buffer, _enc, callback) {
        pending = Buffer.concat([pending, chunk])

        if (!headerParsed) {
          if (pending.length < 8) { callback(); return }
          if (!pending.subarray(0, 4).equals(MAGIC)) {
            callback(new Error('SLZ stream: invalid magic')); return
          }
          totalBytes = pending.readUInt32BE(4)
          pending = pending.subarray(8)
          headerParsed = true
        }

        const outChunks: Buffer[] = []
        let pos = 0

        while (pos < pending.length && outBytes < totalBytes) {
          const token = pending[pos]

          if ((token & 0x80) === 0) {
            const count = (token & 0x7F) + 1
            if (pos + 1 + count > pending.length) break
            pos++
            const slice = Buffer.allocUnsafe(count)
            for (let i = 0; i < count; i++) {
              const b = pending[pos++]
              ring[head] = b; head = (head + 1) & WINDOW_MASK
              slice[i] = b
            }
            outChunks.push(slice); outBytes += count

          } else {
            if (pos + 3 > pending.length) break
            const matchLen = (token & 0x7F) + MIN_MATCH
            const offset = (pending[pos + 1] << 8) | pending[pos + 2]
            pos += 3
            let src = (head - offset + WINDOW_SIZE) & WINDOW_MASK
            const slice = Buffer.allocUnsafe(matchLen)
            for (let i = 0; i < matchLen; i++) {
              const b = ring[src]; src = (src + 1) & WINDOW_MASK
              ring[head] = b; head = (head + 1) & WINDOW_MASK
              slice[i] = b
            }
            outChunks.push(slice); outBytes += matchLen
          }
        }

        pending = pending.subarray(pos)
        if (outChunks.length > 0) this.push(Buffer.concat(outChunks))
        callback()
      },
      flush(callback) { callback() }
    })
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/slz.test.ts
```
Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/compressors/slz.ts tests/compressors/slz.test.ts
git commit -m "feat: add SLZ streaming LZ compressor (level 10)"
```

---

## Task 3 — AHUFF (Adaptive Block Huffman) compressor

Each 16 KB block carries its own 512-byte frequency table so the Huffman tree can be rebuilt independently. Blocks are fully self-contained: the decoder never looks back across block boundaries, making it suitable for streaming and HTTP range requests.

**Header level ID: `11`**

**Stream format:**
```
[0x41 0x48 0x46 0x01]  magic "AHF\x01"
[uint32 BE]            total uncompressed length
per block (repeat):
  [uint32 BE]  uncompressed block length  (0 = end sentinel)
  [uint32 BE]  compressed block byte count
  [256 × uint16 BE]  symbol frequencies (512 bytes)
  <compressed bit stream — exactly "compressed block byte count" bytes>
```

**Files:**
- Create: `src/compressors/ahuff.ts`
- Create: `tests/compressors/ahuff.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/compressors/ahuff.test.ts
import { describe, it, expect } from 'vitest'
import { AHUFFCompressor } from '../../src/compressors/ahuff'

const ahuff = new AHUFFCompressor()

describe('AHUFFCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('hello world')
    const { data } = ahuff.compress(input)
    expect(ahuff.decompress(data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    const { data } = ahuff.compress(input)
    expect(ahuff.decompress(data)).toEqual(input)
  })

  it('round-trips single-symbol data (edge case)', () => {
    const input = Buffer.alloc(200, 0x00)
    const { data } = ahuff.compress(input)
    expect(ahuff.decompress(data)).toEqual(input)
  })

  it('round-trips multi-block data (> 16 KB)', () => {
    const input = Buffer.from(Buffer.alloc(40000).fill(0).map((_, i) => (i * 37 + 99) & 0xFF))
    const { data } = ahuff.compress(input)
    expect(ahuff.decompress(data)).toEqual(input)
  })

  it('compresses source-code-like data smaller than original', () => {
    const src = 'const x = 1;\nfunction hello() {\n  return "hello world";\n}\n'.repeat(100)
    const input = Buffer.from(src)
    const { data } = ahuff.compress(input)
    expect(data.length).toBeLessThan(input.length * 0.75)
  })

  it('compression level is 11', () => {
    const { level } = ahuff.compress(Buffer.from('test'))
    expect(level).toBe(11)
  })

  it('streaming decode via createDecodeStream matches decompress', async () => {
    const input = Buffer.from('abcdefg'.repeat(500))
    const { data } = ahuff.compress(input)
    const stream = ahuff.createDecodeStream()

    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < data.length; i += 32) {
        stream.write(data.subarray(i, Math.min(i + 32, data.length)))
      }
      stream.end()
    })

    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/ahuff.test.ts
```
Expected: `Cannot find module '../../src/compressors/ahuff'`

- [ ] **Step 3: Implement `src/compressors/ahuff.ts`**

```typescript
import { Transform } from 'stream'
import { AbstractCompressor, type CompressionResult, type CompressionMeta } from './types'
import { BitWriter, BitReader } from './bits'

const MAGIC = Buffer.from([0x41, 0x48, 0x46, 0x01])
const BLOCK_SIZE = 16384
const NUM_SYMS = 256
const LEVEL = 11
const MAX_CODE_BITS = 16

// ── Huffman tree build ────────────────────────────────────────────────────────

interface HNode { freq: number; sym: number; left: number; right: number }

function buildCodes(freqs: Uint16Array): { codes: Uint32Array; lens: Uint8Array } {
  const nodes: HNode[] = []
  const heap: number[] = []

  for (let s = 0; s < NUM_SYMS; s++) {
    if (freqs[s] > 0) { nodes.push({ freq: freqs[s], sym: s, left: -1, right: -1 }); heap.push(nodes.length - 1) }
  }

  // single-symbol edge case
  if (heap.length === 1) {
    const codes = new Uint32Array(NUM_SYMS)
    const lens = new Uint8Array(NUM_SYMS)
    lens[nodes[0].sym] = 1; codes[nodes[0].sym] = 0
    return { codes, lens }
  }
  if (heap.length === 0) return { codes: new Uint32Array(NUM_SYMS), lens: new Uint8Array(NUM_SYMS) }

  const cmp = (a: number, b: number) => nodes[a].freq - nodes[b].freq

  function hpush(idx: number): void {
    heap.push(idx)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (cmp(heap[i], heap[p]) < 0) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p } else break
    }
  }

  function hpop(): number {
    const top = heap[0]; const last = heap.pop()!
    if (heap.length > 0) {
      heap[0] = last
      let i = 0
      while (true) {
        let s = i; const l = 2 * i + 1; const r = l + 1
        if (l < heap.length && cmp(heap[l], heap[s]) < 0) s = l
        if (r < heap.length && cmp(heap[r], heap[s]) < 0) s = r
        if (s !== i) { [heap[i], heap[s]] = [heap[s], heap[i]]; i = s } else break
      }
    }
    return top
  }

  // re-heap with proper order after initial fill
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
    let j = i
    while (true) {
      let s = j; const l = 2 * j + 1; const r = l + 1
      if (l < heap.length && cmp(heap[l], heap[s]) < 0) s = l
      if (r < heap.length && cmp(heap[r], heap[s]) < 0) s = r
      if (s !== j) { [heap[j], heap[s]] = [heap[s], heap[j]]; j = s } else break
    }
  }

  while (heap.length > 1) {
    const L = hpop(); const R = hpop()
    nodes.push({ freq: nodes[L].freq + nodes[R].freq, sym: -1, left: L, right: R })
    hpush(nodes.length - 1)
  }

  // DFS assign lengths
  const lens = new Uint8Array(NUM_SYMS)
  const stack: [number, number][] = [[heap[0], 0]]
  while (stack.length) {
    const [idx, depth] = stack.pop()!
    const n = nodes[idx]
    if (n.sym >= 0) { lens[n.sym] = Math.min(depth || 1, MAX_CODE_BITS) }
    else { stack.push([n.left, depth + 1], [n.right, depth + 1]) }
  }

  // Canonical codes
  const count = new Uint32Array(MAX_CODE_BITS + 1)
  for (let s = 0; s < NUM_SYMS; s++) if (lens[s]) count[lens[s]]++
  const nextCode = new Uint32Array(MAX_CODE_BITS + 1)
  let code = 0
  for (let bits = 1; bits <= MAX_CODE_BITS; bits++) {
    code = (code + count[bits - 1]) << 1
    nextCode[bits] = code
  }
  const codes = new Uint32Array(NUM_SYMS)
  for (let s = 0; s < NUM_SYMS; s++) if (lens[s]) codes[s] = nextCode[lens[s]]++

  return { codes, lens }
}

// Flat decode table: table[peek16bits] = (codeLen << 8) | sym
function buildDecodeTable(codes: Uint32Array, lens: Uint8Array): Int32Array {
  const TABLE_BITS = MAX_CODE_BITS
  const table = new Int32Array(1 << TABLE_BITS).fill(-1)
  for (let s = 0; s < NUM_SYMS; s++) {
    const l = lens[s]
    if (!l) continue
    const stride = 1 << (TABLE_BITS - l)
    const start = codes[s] << (TABLE_BITS - l)
    const entry = (l << 8) | s
    for (let i = 0; i < stride; i++) table[start + i] = entry
  }
  return table
}

// ── Block encode / decode ─────────────────────────────────────────────────────

function encodeBlock(block: Buffer): { freqBuf: Buffer; bitsBuf: Buffer } {
  const freqs = new Uint16Array(NUM_SYMS)
  for (const b of block) freqs[b] = Math.min(freqs[b] + 1, 65535)

  const { codes, lens } = buildCodes(freqs)

  const writer = new BitWriter()
  for (const b of block) writer.write(codes[b], lens[b])
  const bitsBuf = writer.flush()

  const freqBuf = Buffer.allocUnsafe(NUM_SYMS * 2)
  for (let i = 0; i < NUM_SYMS; i++) freqBuf.writeUInt16BE(freqs[i], i * 2)

  return { freqBuf, bitsBuf }
}

function decodeBlock(freqBuf: Buffer, bitsBuf: Buffer, blockLen: number): Buffer {
  const freqs = new Uint16Array(NUM_SYMS)
  for (let i = 0; i < NUM_SYMS; i++) freqs[i] = freqBuf.readUInt16BE(i * 2)

  const { codes, lens } = buildCodes(freqs)
  const table = buildDecodeTable(codes, lens)

  const reader = new BitReader(bitsBuf)
  const out = Buffer.allocUnsafe(blockLen)
  for (let i = 0; i < blockLen; i++) {
    const peek = reader.peek(MAX_CODE_BITS)
    const entry = table[peek]
    if (entry === -1) throw new Error('AHUFF: invalid code in stream')
    reader.advance(entry >>> 8)
    out[i] = entry & 0xFF
  }
  return out
}

// ── Compressor class ──────────────────────────────────────────────────────────

function ahuffCompress(input: Buffer): Buffer {
  const parts: Buffer[] = [MAGIC]
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(input.length, 0)
  parts.push(lenBuf)

  for (let offset = 0; offset < input.length || offset === 0; offset += BLOCK_SIZE) {
    const block = input.subarray(offset, Math.min(offset + BLOCK_SIZE, input.length))
    if (block.length === 0) break
    const { freqBuf, bitsBuf } = encodeBlock(block)
    const hdr = Buffer.allocUnsafe(8)
    hdr.writeUInt32BE(block.length, 0)
    hdr.writeUInt32BE(bitsBuf.length, 4)
    parts.push(hdr, freqBuf, bitsBuf)
  }

  // end sentinel
  parts.push(Buffer.alloc(8))
  return Buffer.concat(parts)
}

function ahuffDecompress(input: Buffer): Buffer {
  if (!input.subarray(0, 4).equals(MAGIC)) throw new Error('AHUFF: invalid magic')
  const totalLen = input.readUInt32BE(4)
  const out = Buffer.allocUnsafe(totalLen)
  let outPos = 0
  let pos = 8

  while (pos + 8 <= input.length) {
    const blockLen = input.readUInt32BE(pos)
    const compLen = input.readUInt32BE(pos + 4)
    pos += 8
    if (blockLen === 0) break

    const freqBuf = input.subarray(pos, pos + NUM_SYMS * 2)
    pos += NUM_SYMS * 2
    const bitsBuf = input.subarray(pos, pos + compLen)
    pos += compLen

    const decoded = decodeBlock(freqBuf, bitsBuf, blockLen)
    decoded.copy(out, outPos)
    outPos += blockLen
  }

  return out.subarray(0, outPos)
}

export class AHUFFCompressor extends AbstractCompressor {
  readonly id = 'ahuff'
  readonly label = 'Adaptive Block Huffman'
  readonly streamableDecode = true

  compress(input: Buffer): CompressionResult {
    return { data: ahuffCompress(input), level: LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer, _meta?: CompressionMeta): Buffer {
    return ahuffDecompress(input)
  }

  createDecodeStream(): Transform {
    let pending = Buffer.alloc(0)
    let headerDone = false
    // totalLen from header — used only for early exit
    let totalOut = 0

    return new Transform({
      transform(chunk: Buffer, _enc, callback) {
        pending = Buffer.concat([pending, chunk])

        if (!headerDone) {
          if (pending.length < 8) { callback(); return }
          if (!pending.subarray(0, 4).equals(MAGIC)) { callback(new Error('AHUFF stream: invalid magic')); return }
          // totalLen stored at bytes 4-7, skip
          pending = pending.subarray(8)
          headerDone = true
        }

        while (pending.length >= 8) {
          const blockLen = pending.readUInt32BE(0)
          const compLen = pending.readUInt32BE(4)
          if (blockLen === 0) break // sentinel

          const needed = 8 + NUM_SYMS * 2 + compLen
          if (pending.length < needed) break

          const freqBuf = pending.subarray(8, 8 + NUM_SYMS * 2)
          const bitsBuf = pending.subarray(8 + NUM_SYMS * 2, needed)
          const decoded = decodeBlock(freqBuf, bitsBuf, blockLen)
          this.push(decoded)
          totalOut += blockLen
          pending = pending.subarray(needed)
        }

        callback()
      },
      flush(callback) { callback() }
    })
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/ahuff.test.ts
```
Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/compressors/ahuff.ts tests/compressors/ahuff.test.ts
git commit -m "feat: add AHUFF adaptive block Huffman compressor (level 11)"
```

---

## Task 4 — LZP (LZ Prediction) compressor

For each byte, a 3-byte context hashes to a predicted next byte. Output is 1 bit if the prediction is correct (match), or 9 bits (1 flag + 8 data) if wrong. On structured data (source code, JSON, binary structs) where the same context reliably predicts the same next byte, this approaches 1 bit per matched byte — far better than Huffman alone.

**Header level ID: `12`**

**Stream format:**
```
[0x4C 0x5A 0x50 0x01]  magic "LZP\x01"
[uint32 BE]            total uncompressed length
per block (repeat):
  [uint32 BE]  uncompressed block length  (0 = end sentinel)
  [uint32 BE]  compressed block byte count
  <bit stream>
```

The prediction table (64 KB) resets to zero at each block boundary, giving the decoder a deterministic sync point. The decoder never needs state from previous blocks.

**Files:**
- Create: `src/compressors/lzp.ts`
- Create: `tests/compressors/lzp.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/compressors/lzp.test.ts
import { describe, it, expect } from 'vitest'
import { LZPCompressor } from '../../src/compressors/lzp'

const lzp = new LZPCompressor()

describe('LZPCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('hello world')
    const { data } = lzp.compress(input)
    expect(lzp.decompress(data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    const { data } = lzp.compress(input)
    expect(lzp.decompress(data)).toEqual(input)
  })

  it('compresses highly repetitive structured data (matches >> misses)', () => {
    // JSON-like repeating structure — high context hit rate after warm-up
    const pattern = '{"key":"value","n":42}\n'
    const input = Buffer.from(pattern.repeat(500))
    const { data } = lzp.compress(input)
    // Expect significant compression
    expect(data.length).toBeLessThan(input.length * 0.4)
  })

  it('round-trips data larger than one block (> 32 KB)', () => {
    const input = Buffer.from(Buffer.alloc(70000).map((_, i) => (i * 13 + 7) & 0xFF))
    const { data } = lzp.compress(input)
    expect(lzp.decompress(data)).toEqual(input)
  })

  it('compression level is 12', () => {
    const { level } = lzp.compress(Buffer.from('test'))
    expect(level).toBe(12)
  })

  it('streaming decode via createDecodeStream matches decompress', async () => {
    const input = Buffer.from('lzp streaming: ' + 'xyz'.repeat(300))
    const { data } = lzp.compress(input)
    const stream = lzp.createDecodeStream()

    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < data.length; i += 20) {
        stream.write(data.subarray(i, Math.min(i + 20, data.length)))
      }
      stream.end()
    })

    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/lzp.test.ts
```
Expected: `Cannot find module '../../src/compressors/lzp'`

- [ ] **Step 3: Implement `src/compressors/lzp.ts`**

```typescript
import { Transform } from 'stream'
import { AbstractCompressor, type CompressionResult, type CompressionMeta } from './types'
import { BitWriter, BitReader } from './bits'

const MAGIC = Buffer.from([0x4C, 0x5A, 0x50, 0x01])
const HASH_SIZE = 65536
const BLOCK_SIZE = 32768
const LEVEL = 12

function lzpHash(a: number, b: number, c: number): number {
  return ((a * 31337 + b * 6271 + c * 1031) & 0xFFFF)
}

function lzpCompressBlock(
  input: Buffer, start: number, end: number,
  table: Uint8Array, ctx: [number, number, number],
): Buffer {
  const writer = new BitWriter()
  for (let i = start; i < end; i++) {
    const b = input[i]
    const h = lzpHash(ctx[0], ctx[1], ctx[2])
    if (table[h] === b) {
      writer.write(0, 1)
    } else {
      writer.write(1, 1)
      writer.write(b, 8)
    }
    table[h] = b
    ctx[0] = ctx[1]; ctx[1] = ctx[2]; ctx[2] = b
  }
  return writer.flush()
}

function lzpDecompressBlock(
  bits: Buffer, blockLen: number,
  table: Uint8Array, ctx: [number, number, number],
): Buffer {
  const reader = new BitReader(bits)
  const out = Buffer.allocUnsafe(blockLen)
  for (let i = 0; i < blockLen; i++) {
    const h = lzpHash(ctx[0], ctx[1], ctx[2])
    const flag = reader.read(1)
    const b = flag === 0 ? table[h] : reader.read(8)
    table[h] = b
    ctx[0] = ctx[1]; ctx[1] = ctx[2]; ctx[2] = b
    out[i] = b
  }
  return out
}

function lzpCompress(input: Buffer): Buffer {
  const parts: Buffer[] = [MAGIC]
  const lenBuf = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(input.length, 0)
  parts.push(lenBuf)

  const table = new Uint8Array(HASH_SIZE)
  const ctx: [number, number, number] = [0, 0, 0]

  for (let off = 0; off < input.length || off === 0; off += BLOCK_SIZE) {
    const end = Math.min(off + BLOCK_SIZE, input.length)
    const blockLen = end - off
    if (blockLen === 0) break

    const bits = lzpCompressBlock(input, off, end, table, ctx)
    const hdr = Buffer.allocUnsafe(8)
    hdr.writeUInt32BE(blockLen, 0); hdr.writeUInt32BE(bits.length, 4)
    parts.push(hdr, bits)

    // reset for next block (streaming sync point)
    table.fill(0); ctx[0] = 0; ctx[1] = 0; ctx[2] = 0
  }

  parts.push(Buffer.alloc(8)) // sentinel
  return Buffer.concat(parts)
}

function lzpDecompress(input: Buffer): Buffer {
  if (!input.subarray(0, 4).equals(MAGIC)) throw new Error('LZP: invalid magic')
  const totalLen = input.readUInt32BE(4)
  const out = Buffer.allocUnsafe(totalLen)
  let outPos = 0; let pos = 8

  const table = new Uint8Array(HASH_SIZE)
  const ctx: [number, number, number] = [0, 0, 0]

  while (pos + 8 <= input.length) {
    const blockLen = input.readUInt32BE(pos)
    const compLen = input.readUInt32BE(pos + 4); pos += 8
    if (blockLen === 0) break

    const bits = input.subarray(pos, pos + compLen); pos += compLen
    const decoded = lzpDecompressBlock(bits, blockLen, table, ctx)
    decoded.copy(out, outPos); outPos += blockLen

    table.fill(0); ctx[0] = 0; ctx[1] = 0; ctx[2] = 0
  }

  return out.subarray(0, outPos)
}

export class LZPCompressor extends AbstractCompressor {
  readonly id = 'lzp'
  readonly label = 'LZ Prediction'
  readonly streamableDecode = true

  compress(input: Buffer): CompressionResult {
    return { data: lzpCompress(input), level: LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer, _meta?: CompressionMeta): Buffer {
    return lzpDecompress(input)
  }

  createDecodeStream(): Transform {
    let pending = Buffer.alloc(0)
    let headerDone = false
    const table = new Uint8Array(HASH_SIZE)
    const ctx: [number, number, number] = [0, 0, 0]

    return new Transform({
      transform(chunk: Buffer, _enc, callback) {
        pending = Buffer.concat([pending, chunk])

        if (!headerDone) {
          if (pending.length < 8) { callback(); return }
          if (!pending.subarray(0, 4).equals(MAGIC)) { callback(new Error('LZP stream: invalid magic')); return }
          pending = pending.subarray(8)
          headerDone = true
        }

        while (pending.length >= 8) {
          const blockLen = pending.readUInt32BE(0)
          const compLen = pending.readUInt32BE(4)
          if (blockLen === 0) break

          const needed = 8 + compLen
          if (pending.length < needed) break

          const bits = pending.subarray(8, needed)
          const decoded = lzpDecompressBlock(bits, blockLen, table, ctx)
          this.push(decoded)
          pending = pending.subarray(needed)

          table.fill(0); ctx[0] = 0; ctx[1] = 0; ctx[2] = 0
        }

        callback()
      },
      flush(callback) { callback() }
    })
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/lzp.test.ts
```
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/compressors/lzp.ts tests/compressors/lzp.test.ts
git commit -m "feat: add LZP context-prediction compressor (level 12)"
```

---

## Task 5 — CASCADE compressor

Two passes: SLZ compresses the raw data, then AHUFF compresses the SLZ token stream. SLZ finds literal repetitions and turns them into short back-reference tokens; AHUFF entropy-codes that already-reduced token stream. Together they achieve better compression than either alone, comparable to a simplified DEFLATE, but with streaming-compatible block boundaries.

**Header level ID: `13`**

**Files:**
- Create: `src/compressors/cascade.ts`
- Create: `tests/compressors/cascade.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/compressors/cascade.test.ts
import { describe, it, expect } from 'vitest'
import { CascadeCompressor } from '../../src/compressors/cascade'
import { SLZCompressor } from '../../src/compressors/slz'
import { AHUFFCompressor } from '../../src/compressors/ahuff'

const cascade = new CascadeCompressor()
const slz = new SLZCompressor()
const ahuff = new AHUFFCompressor()

describe('CascadeCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('cascade round-trip test')
    const { data } = cascade.compress(input)
    expect(cascade.decompress(data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    const { data } = cascade.compress(input)
    expect(cascade.decompress(data)).toEqual(input)
  })

  it('round-trips multi-block data', () => {
    const input = Buffer.alloc(50000).map((_, i) => (i * 17 + 3) & 0xFF)
    const { data } = cascade.compress(input)
    expect(cascade.decompress(data)).toEqual(input)
  })

  it('beats SLZ alone on source-code-like data', () => {
    const src = 'export function transform(x: number): number {\n  return x * 2;\n}\n'.repeat(200)
    const input = Buffer.from(src)
    const { data: cascadeData } = cascade.compress(input)
    const { data: slzData } = slz.compress(input)
    expect(cascadeData.length).toBeLessThan(slzData.length)
  })

  it('compression level is 13', () => {
    const { level } = cascade.compress(Buffer.from('test'))
    expect(level).toBe(13)
  })

  it('streaming decode via createDecodeStream matches decompress', async () => {
    const input = Buffer.from('cascade streaming: ' + 'hello world '.repeat(100))
    const { data } = cascade.compress(input)
    const stream = cascade.createDecodeStream()

    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < data.length; i += 48) {
        stream.write(data.subarray(i, Math.min(i + 48, data.length)))
      }
      stream.end()
    })

    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/cascade.test.ts
```
Expected: `Cannot find module '../../src/compressors/cascade'`

- [ ] **Step 3: Implement `src/compressors/cascade.ts`**

```typescript
import { Transform, pipeline } from 'stream'
import { promisify } from 'util'
import { AbstractCompressor, type CompressionResult, type CompressionMeta } from './types'
import { SLZCompressor } from './slz'
import { AHUFFCompressor } from './ahuff'

const slz = new SLZCompressor()
const ahuff = new AHUFFCompressor()
const LEVEL = 13

export class CascadeCompressor extends AbstractCompressor {
  readonly id = 'cascade'
  readonly label = 'Cascade (SLZ→AHUFF)'
  readonly streamableDecode = true

  compress(input: Buffer): CompressionResult {
    const slzOut = slz.compress(input)
    const ahuffOut = ahuff.compress(slzOut.data)
    return { data: ahuffOut.data, level: LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer, _meta?: CompressionMeta): Buffer {
    const slzData = ahuff.decompress(input)
    return slz.decompress(slzData)
  }

  createDecodeStream(): Transform {
    // AHUFF streaming → buffer → SLZ decompress
    // We collect all AHUFF output first (it is block-streaming),
    // then feed the complete SLZ stream into the SLZ stream decoder.
    const ahuffStream = ahuff.createDecodeStream()
    const slzStream = slz.createDecodeStream()

    const pass = new Transform({
      transform(chunk, _enc, cb) { ahuffStream.write(chunk); cb() },
      flush(cb) { ahuffStream.end(); cb() }
    })

    ahuffStream.on('data', (c: Buffer) => slzStream.write(c))
    ahuffStream.on('end', () => slzStream.end())
    ahuffStream.on('error', (e) => pass.destroy(e))
    slzStream.on('data', (c: Buffer) => pass.push(c))
    slzStream.on('error', (e) => pass.destroy(e))

    return pass
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/cascade.test.ts
```
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/compressors/cascade.ts tests/compressors/cascade.test.ts
git commit -m "feat: add CASCADE two-pass SLZ→AHUFF compressor (level 13)"
```

---

## Task 6 — Wire new compressors into the registry

Add four new `case` branches to `getCompressorByMode` and `getCompressorByHeaderLevel` in `src/compressors/index.ts`. No existing case is altered.

**Files:**
- Modify: `src/compressors/index.ts`

- [ ] **Step 1: Verify current test suite still passes before touching the file**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all existing tests pass.

- [ ] **Step 2: Add imports and new cases to `src/compressors/index.ts`**

At the top of the file, after the existing imports, add:
```typescript
import { SLZCompressor } from './slz'
import { AHUFFCompressor } from './ahuff'
import { LZPCompressor } from './lzp'
import { CascadeCompressor } from './cascade'
```

In `getCompressorByMode`, add before the `default` case:
```typescript
    case 'slz':    return new SLZCompressor()
    case 'ahuff':  return new AHUFFCompressor()
    case 'lzp':    return new LZPCompressor()
    case 'cascade': return new CascadeCompressor()
```

In `getCompressorByHeaderLevel`, add before the final `return new NoneCompressor()` line:
```typescript
  if (level === 10) return new SLZCompressor()
  if (level === 11) return new AHUFFCompressor()
  if (level === 12) return new LZPCompressor()
  if (level === 13) return new CascadeCompressor()
```

Also extend the `CompressionMode` type alias at the top of the file:
```typescript
export type CompressionMode =
  | 'none'
  | 'deflate-1'
  | 'deflate-6'
  | 'deflate-9'
  | 'brotli-4'
  | 'brotli-6'
  | 'brotli-11'
  | 'slz'
  | 'ahuff'
  | 'lzp'
  | 'cascade'
```

- [ ] **Step 3: Run full test suite — all must still pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all tests pass (no regressions).

- [ ] **Step 4: Verify new modes are accessible**

```bash
cd /Users/valerii/Develop/codeart && node --input-type=module <<'EOF'
import { getCompressorByMode, getCompressorByHeaderLevel } from './src/compressors/index.js'
const slz = getCompressorByMode('slz')
const ahuff = getCompressorByMode('ahuff')
const lzp = getCompressorByMode('lzp')
const cascade = getCompressorByMode('cascade')
console.log(slz.label, ahuff.label, lzp.label, cascade.label)
console.log(getCompressorByHeaderLevel(10).label)
console.log(getCompressorByHeaderLevel(11).label)
console.log(getCompressorByHeaderLevel(12).label)
console.log(getCompressorByHeaderLevel(13).label)
EOF
```
Expected output:
```
StreamLZ Adaptive Block Huffman LZ Prediction Cascade (SLZ→AHUFF)
StreamLZ
Adaptive Block Huffman
LZ Prediction
Cascade (SLZ→AHUFF)
```

- [ ] **Step 5: Commit**

```bash
git add src/compressors/index.ts
git commit -m "feat: register SLZ/AHUFF/LZP/CASCADE in compressor registry (levels 10-13)"
```

---

## Task 7 — StreamPack codec

A new pixel codec (ID 20) that embeds 12-byte sync markers every 1024 data bytes in the pixel byte stream. The markers carry a segment index and a CRC-16, giving HTTP range-request clients a way to seek to the nearest sync point and start decoding without the beginning of the stream.

**Sync marker (12 bytes, inline in pixel byte stream):**
```
[0xDE 0xAD 0xBE 0xEF]  4-byte magic
[uint32 BE]             segment index
[uint16 BE]             CRC-16/CCITT of the preceding 1024 data bytes
[0x00 0x00]             reserved
```

**Files:**
- Create: `src/codecs/streampack/index.ts`
- Create: `tests/codecs/streampack.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/codecs/streampack.test.ts
import { describe, it, expect } from 'vitest'
import { streampackCodec } from '../../src/codecs/streampack/index'

describe('streampackCodec', () => {
  it('has id=20 and name="streampack"', () => {
    expect(streampackCodec.id).toBe(20)
    expect(streampackCodec.name).toBe('streampack')
  })

  it('round-trips short data (< 1 segment)', () => {
    const input = Buffer.from('hello streampack world')
    const pixels = streampackCodec.encode(input, streampackCodec.estimateDataPixels!(input, 3), 10, 10, 3)
    const decoded = streampackCodec.decode(pixels, input.length, 10, 10, 3)
    expect(decoded).toEqual(input)
  })

  it('round-trips data spanning multiple segments', () => {
    const input = Buffer.alloc(3000, 0x42)
    const pixCount = streampackCodec.estimateDataPixels!(input, 3)
    const pixels = streampackCodec.encode(input, pixCount, 100, 100, 3)
    const decoded = streampackCodec.decode(pixels, input.length, 100, 100, 3)
    expect(decoded).toEqual(input)
  })

  it('sync markers present at 1024-byte boundaries in byte stream', () => {
    const input = Buffer.alloc(1024 + 500, 0x00)
    const pixCount = streampackCodec.estimateDataPixels!(input, 3)
    const pixels = streampackCodec.encode(input, pixCount, 100, 100, 3)
    // first marker starts at byte offset 1024 in the flat pixel array
    expect(pixels[1024]).toBe(0xDE)
    expect(pixels[1025]).toBe(0xAD)
    expect(pixels[1026]).toBe(0xBE)
    expect(pixels[1027]).toBe(0xEF)
    // segment index 0
    expect(pixels[1028]).toBe(0)
    expect(pixels[1029]).toBe(0)
    expect(pixels[1030]).toBe(0)
    expect(pixels[1031]).toBe(0)
  })

  it('round-trips arbitrary binary data', () => {
    const input = Buffer.from(Array.from({ length: 2048 }, (_, i) => (i * 37 + 13) & 0xFF))
    const pixCount = streampackCodec.estimateDataPixels!(input, 3)
    const pixels = streampackCodec.encode(input, pixCount, 100, 100, 3)
    const decoded = streampackCodec.decode(pixels, input.length, 100, 100, 3)
    expect(decoded).toEqual(input)
  })

  it('estimateDataPixels accounts for sync marker overhead', () => {
    const input = Buffer.alloc(1024) // exactly 1 segment → 1 marker
    const est = streampackCodec.estimateDataPixels!(input, 3)
    // 1024 data bytes + 12 marker bytes = 1036 bytes → ceil(1036/3) = 346 pixels
    expect(est).toBe(Math.ceil((1024 + 12) / 3))
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/codecs/streampack.test.ts
```
Expected: `Cannot find module '../../src/codecs/streampack/index'`

- [ ] **Step 3: Implement `src/codecs/streampack/index.ts`**

```typescript
import type { Codec, PixelBuffer } from '../types'

const SEGMENT_BYTES = 1024
const SYNC_TOTAL = 12
const SYNC_MAGIC = [0xDE, 0xAD, 0xBE, 0xEF]

function crc16(data: PixelBuffer, start: number, len: number): number {
  let crc = 0xFFFF
  for (let i = start; i < start + len && i < data.length; i++) {
    crc ^= data[i] << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xFFFF
  }
  return crc
}

export const streampackCodec: Codec = {
  id: 20,
  name: 'streampack',

  estimateDataPixels(input: Buffer, channels = 3): number {
    const numMarkers = Math.ceil(input.length / SEGMENT_BYTES)
    return Math.ceil((input.length + numMarkers * SYNC_TOTAL) / channels)
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out = new Uint8Array(dataPixelCount * channels)
    let inPos = 0
    let outPos = 0
    let segIdx = 0

    while (inPos < input.length) {
      const segStart = inPos
      const segEnd = Math.min(inPos + SEGMENT_BYTES, input.length)
      const segLen = segEnd - segStart

      // copy segment data
      for (let i = segStart; i < segEnd; i++) out[outPos++] = input[i]

      // compute CRC over segment bytes just written
      const crc = crc16(out, outPos - segLen, segLen)

      // write 12-byte sync marker
      out[outPos++] = 0xDE; out[outPos++] = 0xAD
      out[outPos++] = 0xBE; out[outPos++] = 0xEF
      out[outPos++] = (segIdx >>> 24) & 0xFF
      out[outPos++] = (segIdx >>> 16) & 0xFF
      out[outPos++] = (segIdx >>> 8) & 0xFF
      out[outPos++] = segIdx & 0xFF
      out[outPos++] = (crc >>> 8) & 0xFF
      out[outPos++] = crc & 0xFF
      out[outPos++] = 0x00; out[outPos++] = 0x00

      inPos = segEnd
      segIdx++
    }

    return out
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    const out = Buffer.allocUnsafe(length)
    let inPos = 0
    let outPos = 0
    let bytesUntilMarker = SEGMENT_BYTES

    while (inPos < pixels.length && outPos < length) {
      if (bytesUntilMarker === 0) {
        inPos += SYNC_TOTAL    // skip sync marker at known position
        bytesUntilMarker = SEGMENT_BYTES
        continue
      }
      out[outPos++] = pixels[inPos++]
      bytesUntilMarker--
    }

    return out.subarray(0, outPos)
  },
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/codecs/streampack.test.ts
```
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/codecs/streampack/index.ts tests/codecs/streampack.test.ts
git commit -m "feat: add StreamPack codec with 1 KB sync markers (codec id 20)"
```

---

## Task 8 — Register StreamPack codec

Add one line to `src/codecs/register-all.ts` so the codec is available by name and ID through the existing registry.

**Files:**
- Modify: `src/codecs/register-all.ts`

- [ ] **Step 1: Add import and registration**

In `src/codecs/register-all.ts`, add at the bottom:

```typescript
import { streampackCodec } from './streampack/index'
// ...existing registerCodec calls...
registerCodec(streampackCodec)
```

- [ ] **Step 2: Run full test suite — no regressions**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all tests pass.

- [ ] **Step 3: Verify codec is reachable by name and ID**

```bash
cd /Users/valerii/Develop/codeart && node --input-type=module <<'EOF'
import './src/codecs/register-all.js'
import { getCodecByName, getCodecById } from './src/codecs/registry.js'
const byName = getCodecByName('streampack')
const byId = getCodecById(20)
console.log('by name:', byName.name, byName.id)
console.log('by id:', byId.name, byId.id)
EOF
```
Expected:
```
by name: streampack 20
by id: streampack 20
```

- [ ] **Step 4: Commit**

```bash
git add src/codecs/register-all.ts
git commit -m "feat: register StreamPack codec in codec registry"
```

---

## Task 9 — Integration tests

End-to-end tests verifying each new compressor works through the full encode→decode pipeline (real image files), and that the old brotli-11 default remains unchanged.

**Files:**
- Create: `tests/compressors/integration.test.ts`

- [ ] **Step 1: Write the integration tests**

```typescript
// tests/compressors/integration.test.ts
import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { encode } from '../../src/encoder'
import { decode } from '../../src/decoder'
import '../../src/codecs/register-all'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokenpack-integration-'))

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

const SAMPLE = Buffer.from(
  'export function add(a: number, b: number): number {\n  return a + b;\n}\n'.repeat(50)
)

async function roundTrip(compressionMode: string, algo = 'linear'): Promise<Buffer> {
  const out = path.join(tmp, `test-${compressionMode}.png`)
  await encode(SAMPLE, { out, algo, compressionMode, channels: 3 })
  return decode(out)
}

describe('end-to-end encode→decode', () => {
  it('slz: round-trips source code through real PNG', async () => {
    const result = await roundTrip('slz')
    expect(result).toEqual(SAMPLE)
  })

  it('ahuff: round-trips source code through real PNG', async () => {
    const result = await roundTrip('ahuff')
    expect(result).toEqual(SAMPLE)
  })

  it('lzp: round-trips source code through real PNG', async () => {
    const result = await roundTrip('lzp')
    expect(result).toEqual(SAMPLE)
  })

  it('cascade: round-trips source code through real PNG', async () => {
    const result = await roundTrip('cascade')
    expect(result).toEqual(SAMPLE)
  })

  it('streampack codec: round-trips with linear compressor', async () => {
    const out = path.join(tmp, 'streampack-codec.png')
    await encode(SAMPLE, { out, algo: 'streampack', compressionMode: 'none', channels: 3 })
    const result = await decode(out)
    expect(result).toEqual(SAMPLE)
  })

  it('streampack codec + slz compression: round-trips', async () => {
    const out = path.join(tmp, 'streampack-slz.png')
    await encode(SAMPLE, { out, algo: 'streampack', compressionMode: 'slz', channels: 3 })
    const result = await decode(out)
    expect(result).toEqual(SAMPLE)
  })

  it('brotli-11 default still works (no regression)', async () => {
    const result = await roundTrip('brotli-11')
    expect(result).toEqual(SAMPLE)
  })

  it('none compression still works (no regression)', async () => {
    const result = await roundTrip('none')
    expect(result).toEqual(SAMPLE)
  })

  it('new compressors produce smaller output than none for repetitive data', async () => {
    const sizes: Record<string, number> = {}
    for (const mode of ['none', 'slz', 'ahuff', 'lzp', 'cascade']) {
      const out = path.join(tmp, `size-${mode}.png`)
      await encode(SAMPLE, { out, algo: 'linear', compressionMode: mode, channels: 3 })
      sizes[mode] = fs.statSync(out).size
    }
    expect(sizes['slz']).toBeLessThan(sizes['none'])
    expect(sizes['ahuff']).toBeLessThan(sizes['none'])
    expect(sizes['lzp']).toBeLessThan(sizes['none'])
    expect(sizes['cascade']).toBeLessThan(sizes['none'])
  })
})
```

- [ ] **Step 2: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test tests/compressors/integration.test.ts
```
Expected: all 9 integration tests pass.

- [ ] **Step 3: Run full suite one final time**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all tests pass, zero regressions.

- [ ] **Step 4: Commit**

```bash
git add tests/compressors/integration.test.ts
git commit -m "test: end-to-end integration tests for SLZ/AHUFF/LZP/CASCADE/StreamPack"
```

---

## Self-Review

**Spec coverage:**
- ✅ SLZ (speed champion) — Task 2
- ✅ AHUFF (compression ratio champion for text/code) — Task 3
- ✅ LZP (best ratio for structured/repetitive data) — Task 4
- ✅ CASCADE (SLZ→AHUFF two-pass, best overall) — Task 5
- ✅ All algorithms expose `createDecodeStream()` for true HTTP streaming — Tasks 2–5
- ✅ StreamPack codec with sync markers — Task 7
- ✅ Zero changes to existing code paths; additive only — Tasks 6, 8
- ✅ Registered in existing registry, accessible via `compressionMode: 'slz'` etc. — Task 6
- ✅ Integration tests verify old compressors still work — Task 9

**Placeholder scan:** None found. All code blocks are complete and runnable.

**Type consistency:**
- `SLZCompressor`, `AHUFFCompressor`, `LZPCompressor`, `CascadeCompressor` all extend `AbstractCompressor` from `./types` — same import path across all files.
- `streampackCodec` uses `Codec` and `PixelBuffer` from `../types` — consistent with all other codecs.
- `BitWriter`/`BitReader` imported from `./bits` in `ahuff.ts` and `lzp.ts` — same names and paths.
- `CompressionResult`, `CompressionMeta` imported from `./types` — consistent.
