# Streaming Compression Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four custom streaming-friendly compression algorithms (SLZ, AHUFF, LZP, CASCADE) and a new pixel codec (StreamPack) that plug into the existing `CompressorRegistry` and `AlgorithmCatalog` without altering any existing logic.

**Architecture:** New compressors extend `AbstractCompressor` and self-register via the `CompressorRegistry.register()` method. New codec follows the existing two-file pattern (`index.ts` + `metadata.ts`) and is added to the `CODECS` array. The `CompressionMode` union type is extended with four new string literals. No existing compressor, codec, algorithm, or test is modified — all changes are strictly additive.

**Tech Stack:** TypeScript (strict ESM), Vitest, Node.js `stream.Transform`, no new npm dependencies. All work lives in `packages/core/`.

---

## File Map

**Create:**
- `packages/core/src/compressors/bits.ts` — BitWriter / BitReader shared by AHUFF and LZP
- `packages/core/src/compressors/slz.ts` — SLZCompressor (level 10)
- `packages/core/src/compressors/ahuff.ts` — AHUFFCompressor (level 11)
- `packages/core/src/compressors/lzp.ts` — LZPCompressor (level 12)
- `packages/core/src/compressors/cascade.ts` — CascadeCompressor (level 13)
- `packages/core/src/codecs/streampack/metadata.ts` — StreamPack codec metadata
- `packages/core/src/codecs/streampack/index.ts` — StreamPackCodec class
- `packages/core/tests/compressors/bits.test.ts`
- `packages/core/tests/compressors/slz.test.ts`
- `packages/core/tests/compressors/ahuff.test.ts`
- `packages/core/tests/compressors/lzp.test.ts`
- `packages/core/tests/compressors/cascade.test.ts`
- `packages/core/tests/codecs/streampack.test.ts`
- `packages/core/tests/compressors/integration.test.ts`

**Modify (additive only — no existing logic changed):**
- `packages/core/src/compressors/types.ts` — extend `CompressionMode` union with `'slz' | 'ahuff' | 'lzp' | 'cascade'`
- `packages/core/src/compressors/modes.ts` — add four entries to `COMPRESSION_MODE_INFOS`
- `packages/core/src/compressors/registry.ts` — four new `this.register(...)` calls in constructor
- `packages/core/src/compressors/index.ts` — re-export four new compressor classes
- `packages/core/src/codecs/index.ts` — add `streampackCodec` to `CODECS` array and export it
- `packages/core/src/codecs/metadata.ts` — add `streampackInfo` to `CODEC_INFOS`

---

## Task 1 — Bit I/O utilities

Shared by AHUFF (Huffman bit-packing) and LZP (single-bit match/miss flags).

**Files:**
- Create: `packages/core/src/compressors/bits.ts`
- Create: `packages/core/tests/compressors/bits.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/tests/compressors/bits.test.ts
import { describe, expect, it } from 'vitest'
import { BitReader, BitWriter } from '../../src/compressors/bits'

describe('BitWriter', () => {
  it('writes bits MSB-first and flushes full byte', () => {
    const w = new BitWriter()
    // write 1,0,1,0,0,0,0,0 → 0b10100000 = 0xA0
    ;[1, 0, 1, 0, 0, 0, 0, 0].forEach(b => w.write(b, 1))
    expect(w.flush()[0]).toBe(0xa0)
  })

  it('writes multi-bit codes MSB-first', () => {
    const w = new BitWriter()
    w.write(0b101, 3) // 1,0,1
    w.write(0b01, 2)  // 0,1
    w.write(0b110, 3) // 1,1,0  → 0b10101110 = 0xAE
    expect(w.flush()[0]).toBe(0xae)
  })

  it('pads the last byte with zeros', () => {
    const w = new BitWriter()
    w.write(1, 1) // 1 bit written → padded to 0b10000000 = 0x80
    const out = w.flush()
    expect(out.length).toBe(1)
    expect(out[0]).toBe(0x80)
  })
})

describe('BitReader', () => {
  it('reads back exactly what BitWriter wrote', () => {
    const w = new BitWriter()
    w.write(0b101, 3)
    w.write(0b01, 2)
    w.write(0b110, 3)
    const r = new BitReader(w.flush())
    expect(r.read(3)).toBe(0b101)
    expect(r.read(2)).toBe(0b01)
    expect(r.read(3)).toBe(0b110)
  })

  it('peek does not advance position', () => {
    const data = Buffer.from([0b11001100])
    const r = new BitReader(data)
    expect(r.peek(4)).toBe(0b1100)
    expect(r.peek(4)).toBe(0b1100) // unchanged
    r.advance(4)
    expect(r.read(4)).toBe(0b1100) // second nibble
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "FAIL|Cannot find"
```
Expected: `Cannot find module '../../src/compressors/bits'`

- [ ] **Step 3: Implement `packages/core/src/compressors/bits.ts`**

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
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|bits"
```
Expected: `bits.test.ts` passes (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/compressors/bits.ts packages/core/tests/compressors/bits.test.ts
git commit -m "feat(core): add BitWriter/BitReader utilities for custom compressors"
```

---

## Task 2 — SLZ (Streaming LZ) compressor

Custom LZ77 variant. Encoder keeps a 64 KB hash table (one slot per 3-byte hash) and emits either a literal-run token or a back-reference token. Decoder keeps a 64 KB ring buffer and resolves each token in O(matchLen) — no lookahead, fully streaming.

**Token wire format:**
```
LITERAL_RUN  bit7=0  byte = count-1 (1..128 literals follow)
BACK_REF     bit7=1  byte = matchLen-3 (bits 0-6, range 3..130)
                     2-byte big-endian offset (1..65535)
```

**Stream header:** `[0x53 0x4C 0x5A 0x01]` magic + `uint32 BE` uncompressed length (8 bytes total).

**Header level: 10**

**Files:**
- Create: `packages/core/src/compressors/slz.ts`
- Create: `packages/core/tests/compressors/slz.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/tests/compressors/slz.test.ts
import { describe, expect, it } from 'vitest'
import { SLZCompressor } from '../../src/compressors/slz'

const slz = new SLZCompressor()

describe('SLZCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('hello world')
    expect(slz.decompress(slz.compress(input).data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    expect(slz.decompress(slz.compress(input).data)).toEqual(input)
  })

  it('compresses repetitive data smaller than original', () => {
    const input = Buffer.alloc(1000, 0x41)
    expect(slz.compress(input).data.length).toBeLessThan(input.length)
  })

  it('does not expand random data by more than 1%', () => {
    const input = Buffer.from(Array.from({ length: 512 }, (_, i) => (i * 37 + 13) & 0xff))
    expect(slz.compress(input).data.length).toBeLessThan(input.length * 1.02 + 16)
  })

  it('round-trips data larger than 64 KB window', () => {
    const chunk = Buffer.from('abcdefgh')
    const input = Buffer.concat(Array.from({ length: 9000 }, () => chunk))
    const result = slz.decompress(slz.compress(input).data)
    expect(result).toEqual(input)
  })

  it('exposes headerLevel 10', () => {
    expect(slz.headerLevel).toBe(10)
  })

  it('streaming decode matches synchronous decompress', async () => {
    const input = Buffer.from('streaming: ' + 'abcd'.repeat(200))
    const compressed = slz.compress(input).data
    const stream = slz.createDecodeStream!()
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < compressed.length; i += 16)
        stream.write(compressed.subarray(i, Math.min(i + 16, compressed.length)))
      stream.end()
    })
    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "FAIL|Cannot find"
```
Expected: `Cannot find module '../../src/compressors/slz'`

- [ ] **Step 3: Implement `packages/core/src/compressors/slz.ts`**

```typescript
import { Transform } from 'stream'
import { AbstractCompressor, type CompressionMode, type CompressionResult } from './types'

const MAGIC = Buffer.from([0x53, 0x4c, 0x5a, 0x01])
const WIN = 65536
const WIN_MASK = WIN - 1
const MIN_MATCH = 3
const MAX_MATCH = 130
const MAX_LIT = 128
const HEADER_LEVEL = 10

function hash3(a: number, b: number, c: number): number {
  return ((a * 16777619) ^ (b * 2166136261) ^ c) & 0xffff
}

function compress(input: Buffer): Buffer {
  const out: number[] = [0x53, 0x4c, 0x5a, 0x01,
    (input.length >>> 24) & 0xff, (input.length >>> 16) & 0xff,
    (input.length >>> 8) & 0xff, input.length & 0xff]

  const table = new Int32Array(65536).fill(-1)
  const lits: number[] = []

  const flushLits = () => {
    for (let i = 0; i < lits.length; ) {
      const n = Math.min(lits.length - i, MAX_LIT)
      out.push(n - 1)
      for (let j = 0; j < n; j++) out.push(lits[i++])
    }
    lits.length = 0
  }

  let pos = 0
  while (pos < input.length) {
    if (pos + MIN_MATCH <= input.length) {
      const h = hash3(input[pos], input[pos + 1], input[pos + 2])
      const cand = table[h]
      table[h] = pos
      if (cand >= 0) {
        const off = pos - cand
        if (off >= 1 && off <= 65535) {
          let len = 0
          const max = Math.min(MAX_MATCH, input.length - pos)
          while (len < max && input[cand + len] === input[pos + len]) len++
          if (len >= MIN_MATCH) {
            flushLits()
            out.push(0x80 | (len - MIN_MATCH))
            out.push((off >>> 8) & 0xff, off & 0xff)
            pos += len
            continue
          }
        }
      }
    }
    lits.push(input[pos++])
    if (lits.length === MAX_LIT) flushLits()
  }
  flushLits()
  return Buffer.from(out)
}

function decompress(input: Buffer): Buffer {
  if (!input.subarray(0, 4).equals(MAGIC)) throw new Error('SLZ: bad magic')
  const total = input.readUInt32BE(4)
  const out = Buffer.allocUnsafe(total)
  const ring = new Uint8Array(WIN)
  let head = 0, inPos = 8, outPos = 0

  while (inPos < input.length && outPos < total) {
    const tok = input[inPos++]
    if ((tok & 0x80) === 0) {
      const n = (tok & 0x7f) + 1
      for (let i = 0; i < n; i++) {
        const b = input[inPos++]
        ring[head] = b; head = (head + 1) & WIN_MASK
        out[outPos++] = b
      }
    } else {
      const len = (tok & 0x7f) + MIN_MATCH
      const off = (input[inPos] << 8) | input[inPos + 1]; inPos += 2
      let src = (head - off + WIN) & WIN_MASK
      for (let i = 0; i < len; i++) {
        const b = ring[src]; src = (src + 1) & WIN_MASK
        ring[head] = b; head = (head + 1) & WIN_MASK
        out[outPos++] = b
      }
    }
  }
  return out.subarray(0, outPos)
}

export class SLZCompressor extends AbstractCompressor {
  readonly id = 'slz' as CompressionMode
  readonly label = 'StreamLZ'
  readonly headerLevel = HEADER_LEVEL
  readonly streamableDecode = true
  readonly requiresFullHeader = true

  compress(input: Buffer): CompressionResult {
    return { data: compress(input), level: HEADER_LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer): Buffer {
    return decompress(input)
  }

  createDecodeStream(): Transform {
    const ring = new Uint8Array(WIN)
    let head = 0, headerDone = false, total = 0, outBytes = 0
    let pending = Buffer.alloc(0)

    return new Transform({
      transform(chunk: Buffer, _enc, cb) {
        pending = Buffer.concat([pending, chunk])

        if (!headerDone) {
          if (pending.length < 8) { cb(); return }
          if (!pending.subarray(0, 4).equals(MAGIC)) { cb(new Error('SLZ: bad magic')); return }
          total = pending.readUInt32BE(4)
          pending = pending.subarray(8)
          headerDone = true
        }

        const parts: Buffer[] = []
        let pos = 0

        while (pos < pending.length && outBytes < total) {
          const tok = pending[pos]
          if ((tok & 0x80) === 0) {
            const n = (tok & 0x7f) + 1
            if (pos + 1 + n > pending.length) break
            pos++
            const slice = Buffer.allocUnsafe(n)
            for (let i = 0; i < n; i++) {
              const b = pending[pos++]
              ring[head] = b; head = (head + 1) & WIN_MASK; slice[i] = b
            }
            parts.push(slice); outBytes += n
          } else {
            if (pos + 3 > pending.length) break
            const len = (tok & 0x7f) + MIN_MATCH
            const off = (pending[pos + 1] << 8) | pending[pos + 2]; pos += 3
            let src = (head - off + WIN) & WIN_MASK
            const slice = Buffer.allocUnsafe(len)
            for (let i = 0; i < len; i++) {
              const b = ring[src]; src = (src + 1) & WIN_MASK
              ring[head] = b; head = (head + 1) & WIN_MASK; slice[i] = b
            }
            parts.push(slice); outBytes += len
          }
        }

        pending = pending.subarray(pos)
        if (parts.length) this.push(Buffer.concat(parts))
        cb()
      },
      flush(cb) { cb() },
    })
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|slz"
```
Expected: `slz.test.ts` passes (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/compressors/slz.ts packages/core/tests/compressors/slz.test.ts
git commit -m "feat(core): add SLZ streaming LZ compressor (headerLevel 10)"
```

---

## Task 3 — AHUFF (Adaptive Block Huffman) compressor

Splits input into 16 KB blocks. Each block carries a 512-byte frequency table so the Huffman tree can be rebuilt independently — no cross-block state in the decoder, making it safe to seek into any block boundary.

**Block wire format:**
```
[uint32 BE]        uncompressed block length (0 = end sentinel)
[uint32 BE]        compressed bit-stream byte count
[256 × uint16 BE]  symbol frequencies (512 bytes)
<bit stream>       Huffman-coded bytes, padded to byte boundary
```

**Stream header:** `[0x41 0x48 0x46 0x01]` + `uint32 BE` total length (8 bytes).

**Header level: 11**

**Files:**
- Create: `packages/core/src/compressors/ahuff.ts`
- Create: `packages/core/tests/compressors/ahuff.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/tests/compressors/ahuff.test.ts
import { describe, expect, it } from 'vitest'
import { AHUFFCompressor } from '../../src/compressors/ahuff'

const ahuff = new AHUFFCompressor()

describe('AHUFFCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('hello world')
    expect(ahuff.decompress(ahuff.compress(input).data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    expect(ahuff.decompress(ahuff.compress(input).data)).toEqual(input)
  })

  it('round-trips single-symbol data (edge case)', () => {
    const input = Buffer.alloc(200, 0x00)
    expect(ahuff.decompress(ahuff.compress(input).data)).toEqual(input)
  })

  it('round-trips multi-block data (> 16 KB)', () => {
    const input = Buffer.from(Array.from({ length: 40000 }, (_, i) => (i * 37 + 99) & 0xff))
    expect(ahuff.decompress(ahuff.compress(input).data)).toEqual(input)
  })

  it('compresses source-code-like data by at least 25%', () => {
    const src = 'const x = 1;\nfunction hello() {\n  return "hello world";\n}\n'.repeat(100)
    const input = Buffer.from(src)
    expect(ahuff.compress(input).data.length).toBeLessThan(input.length * 0.75)
  })

  it('exposes headerLevel 11', () => {
    expect(ahuff.headerLevel).toBe(11)
  })

  it('streaming decode matches synchronous decompress', async () => {
    const input = Buffer.from('abcdefg'.repeat(500))
    const compressed = ahuff.compress(input).data
    const stream = ahuff.createDecodeStream!()
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < compressed.length; i += 32)
        stream.write(compressed.subarray(i, Math.min(i + 32, compressed.length)))
      stream.end()
    })
    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "FAIL|Cannot find"
```
Expected: `Cannot find module '../../src/compressors/ahuff'`

- [ ] **Step 3: Implement `packages/core/src/compressors/ahuff.ts`**

```typescript
import { Transform } from 'stream'
import { BitReader, BitWriter } from './bits'
import { AbstractCompressor, type CompressionMode, type CompressionResult } from './types'

const MAGIC = Buffer.from([0x41, 0x48, 0x46, 0x01])
const BLOCK = 16384
const SYMS = 256
const MAX_BITS = 16
const HEADER_LEVEL = 11

// ── Min-heap ─────────────────────────────────────────────────────────────────

function heapify(h: number[], nodes: { freq: number }[]): void {
  for (let i = (h.length >> 1) - 1; i >= 0; i--) siftDown(h, nodes, i)
}

function siftDown(h: number[], nodes: { freq: number }[], i: number): void {
  while (true) {
    let s = i; const l = 2 * i + 1, r = l + 1
    if (l < h.length && nodes[h[l]].freq < nodes[h[s]].freq) s = l
    if (r < h.length && nodes[h[r]].freq < nodes[h[s]].freq) s = r
    if (s === i) break
    ;[h[i], h[s]] = [h[s], h[i]]; i = s
  }
}

function hpop(h: number[], nodes: { freq: number }[]): number {
  const top = h[0]; const last = h.pop()!
  if (h.length) { h[0] = last; siftDown(h, nodes, 0) }
  return top
}

function hpush(h: number[], nodes: { freq: number }[], idx: number): void {
  h.push(idx)
  let i = h.length - 1
  while (i > 0) {
    const p = (i - 1) >> 1
    if (nodes[h[i]].freq >= nodes[h[p]].freq) break
    ;[h[i], h[p]] = [h[p], h[i]]; i = p
  }
}

// ── Huffman codes ─────────────────────────────────────────────────────────────

interface HNode { freq: number; sym: number; left: number; right: number }

function buildCodes(freqs: Uint16Array): { codes: Uint32Array; lens: Uint8Array } {
  const nodes: HNode[] = []
  const heap: number[] = []

  for (let s = 0; s < SYMS; s++) {
    if (freqs[s] > 0) { nodes.push({ freq: freqs[s], sym: s, left: -1, right: -1 }); heap.push(nodes.length - 1) }
  }

  if (heap.length === 0) return { codes: new Uint32Array(SYMS), lens: new Uint8Array(SYMS) }
  if (heap.length === 1) {
    const codes = new Uint32Array(SYMS); const lens = new Uint8Array(SYMS)
    lens[nodes[0].sym] = 1; return { codes, lens }
  }

  heapify(heap, nodes)

  while (heap.length > 1) {
    const L = hpop(heap, nodes), R = hpop(heap, nodes)
    nodes.push({ freq: nodes[L].freq + nodes[R].freq, sym: -1, left: L, right: R })
    hpush(heap, nodes, nodes.length - 1)
  }

  const lens = new Uint8Array(SYMS)
  const stack: [number, number][] = [[heap[0], 0]]
  while (stack.length) {
    const [idx, depth] = stack.pop()!; const n = nodes[idx]
    if (n.sym >= 0) lens[n.sym] = Math.min(depth || 1, MAX_BITS)
    else { stack.push([n.left, depth + 1], [n.right, depth + 1]) }
  }

  // canonical codes
  const count = new Uint32Array(MAX_BITS + 1)
  for (let s = 0; s < SYMS; s++) if (lens[s]) count[lens[s]]++
  const next = new Uint32Array(MAX_BITS + 1)
  let code = 0
  for (let b = 1; b <= MAX_BITS; b++) { code = (code + count[b - 1]) << 1; next[b] = code }
  const codes = new Uint32Array(SYMS)
  for (let s = 0; s < SYMS; s++) if (lens[s]) codes[s] = next[lens[s]]++

  return { codes, lens }
}

function buildDecodeTable(codes: Uint32Array, lens: Uint8Array): Int32Array {
  const table = new Int32Array(1 << MAX_BITS).fill(-1)
  for (let s = 0; s < SYMS; s++) {
    const l = lens[s]; if (!l) continue
    const stride = 1 << (MAX_BITS - l), start = codes[s] << (MAX_BITS - l)
    const entry = (l << 8) | s
    for (let i = 0; i < stride; i++) table[start + i] = entry
  }
  return table
}

// ── Block encode / decode ─────────────────────────────────────────────────────

function encodeBlock(block: Buffer): { freqBuf: Buffer; bitsBuf: Buffer } {
  const freqs = new Uint16Array(SYMS)
  for (const b of block) freqs[b] = Math.min(freqs[b] + 1, 65535)
  const { codes, lens } = buildCodes(freqs)
  const w = new BitWriter()
  for (const b of block) w.write(codes[b], lens[b])
  const bitsBuf = w.flush()
  const freqBuf = Buffer.allocUnsafe(SYMS * 2)
  for (let i = 0; i < SYMS; i++) freqBuf.writeUInt16BE(freqs[i], i * 2)
  return { freqBuf, bitsBuf }
}

function decodeBlock(freqBuf: Buffer, bitsBuf: Buffer, blockLen: number): Buffer {
  const freqs = new Uint16Array(SYMS)
  for (let i = 0; i < SYMS; i++) freqs[i] = freqBuf.readUInt16BE(i * 2)
  const { codes, lens } = buildCodes(freqs)
  const table = buildDecodeTable(codes, lens)
  const r = new BitReader(bitsBuf)
  const out = Buffer.allocUnsafe(blockLen)
  for (let i = 0; i < blockLen; i++) {
    const entry = table[r.peek(MAX_BITS)]
    if (entry === -1) throw new Error('AHUFF: bad code')
    r.advance(entry >>> 8); out[i] = entry & 0xff
  }
  return out
}

// ── Compressor ────────────────────────────────────────────────────────────────

function ahuffCompress(input: Buffer): Buffer {
  const parts: Buffer[] = [MAGIC, Buffer.from([
    (input.length >>> 24) & 0xff, (input.length >>> 16) & 0xff,
    (input.length >>> 8) & 0xff, input.length & 0xff])]

  for (let off = 0; off < input.length || off === 0; off += BLOCK) {
    const block = input.subarray(off, Math.min(off + BLOCK, input.length))
    if (block.length === 0) break
    const { freqBuf, bitsBuf } = encodeBlock(block)
    const hdr = Buffer.allocUnsafe(8)
    hdr.writeUInt32BE(block.length, 0); hdr.writeUInt32BE(bitsBuf.length, 4)
    parts.push(hdr, freqBuf, bitsBuf)
  }
  parts.push(Buffer.alloc(8))
  return Buffer.concat(parts)
}

function ahuffDecompress(input: Buffer): Buffer {
  if (!input.subarray(0, 4).equals(MAGIC)) throw new Error('AHUFF: bad magic')
  const total = input.readUInt32BE(4)
  const out = Buffer.allocUnsafe(total)
  let outPos = 0, pos = 8

  while (pos + 8 <= input.length) {
    const blockLen = input.readUInt32BE(pos), compLen = input.readUInt32BE(pos + 4); pos += 8
    if (blockLen === 0) break
    const freqBuf = input.subarray(pos, pos + SYMS * 2); pos += SYMS * 2
    const bitsBuf = input.subarray(pos, pos + compLen); pos += compLen
    decodeBlock(freqBuf, bitsBuf, blockLen).copy(out, outPos); outPos += blockLen
  }
  return out.subarray(0, outPos)
}

export class AHUFFCompressor extends AbstractCompressor {
  readonly id = 'ahuff' as CompressionMode
  readonly label = 'Adaptive Block Huffman'
  readonly headerLevel = HEADER_LEVEL
  readonly streamableDecode = true
  readonly requiresFullHeader = true

  compress(input: Buffer): CompressionResult {
    return { data: ahuffCompress(input), level: HEADER_LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer): Buffer {
    return ahuffDecompress(input)
  }

  createDecodeStream(): Transform {
    let pending = Buffer.alloc(0)
    let headerDone = false

    return new Transform({
      transform(chunk: Buffer, _enc, cb) {
        pending = Buffer.concat([pending, chunk])

        if (!headerDone) {
          if (pending.length < 8) { cb(); return }
          if (!pending.subarray(0, 4).equals(MAGIC)) { cb(new Error('AHUFF: bad magic')); return }
          pending = pending.subarray(8); headerDone = true
        }

        while (pending.length >= 8) {
          const blockLen = pending.readUInt32BE(0), compLen = pending.readUInt32BE(4)
          if (blockLen === 0) break
          const needed = 8 + SYMS * 2 + compLen
          if (pending.length < needed) break
          const freqBuf = pending.subarray(8, 8 + SYMS * 2)
          const bitsBuf = pending.subarray(8 + SYMS * 2, needed)
          this.push(decodeBlock(freqBuf, bitsBuf, blockLen))
          pending = pending.subarray(needed)
        }
        cb()
      },
      flush(cb) { cb() },
    })
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|ahuff"
```
Expected: `ahuff.test.ts` passes (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/compressors/ahuff.ts packages/core/tests/compressors/ahuff.test.ts
git commit -m "feat(core): add AHUFF adaptive block Huffman compressor (headerLevel 11)"
```

---

## Task 4 — LZP (LZ Prediction) compressor

For each byte, a 3-byte context hashes to a predicted next byte stored in a 64 KB table. Output is 1 bit if the prediction matches, or 9 bits (flag + literal) if not. On repetitive structured data, the match rate approaches 100% → near 1 bit per byte. The table resets to zero at every 32 KB block boundary — giving the decoder a deterministic sync point and enabling streaming.

**Block wire format:**
```
[uint32 BE]  uncompressed block length (0 = end sentinel)
[uint32 BE]  compressed byte count
<bit stream>
```

**Stream header:** `[0x4C 0x5A 0x50 0x01]` + `uint32 BE` total length (8 bytes).

**Header level: 12**

**Files:**
- Create: `packages/core/src/compressors/lzp.ts`
- Create: `packages/core/tests/compressors/lzp.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/tests/compressors/lzp.test.ts
import { describe, expect, it } from 'vitest'
import { LZPCompressor } from '../../src/compressors/lzp'

const lzp = new LZPCompressor()

describe('LZPCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('hello world')
    expect(lzp.decompress(lzp.compress(input).data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    expect(lzp.decompress(lzp.compress(input).data)).toEqual(input)
  })

  it('heavily compresses repetitive structured data', () => {
    const pattern = '{"key":"value","n":42}\n'
    const input = Buffer.from(pattern.repeat(500))
    expect(lzp.compress(input).data.length).toBeLessThan(input.length * 0.4)
  })

  it('round-trips data larger than one block (> 32 KB)', () => {
    const input = Buffer.from(Array.from({ length: 70000 }, (_, i) => (i * 13 + 7) & 0xff))
    expect(lzp.decompress(lzp.compress(input).data)).toEqual(input)
  })

  it('exposes headerLevel 12', () => {
    expect(lzp.headerLevel).toBe(12)
  })

  it('streaming decode matches synchronous decompress', async () => {
    const input = Buffer.from('lzp: ' + 'xyz'.repeat(300))
    const compressed = lzp.compress(input).data
    const stream = lzp.createDecodeStream!()
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < compressed.length; i += 20)
        stream.write(compressed.subarray(i, Math.min(i + 20, compressed.length)))
      stream.end()
    })
    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "FAIL|Cannot find"
```
Expected: `Cannot find module '../../src/compressors/lzp'`

- [ ] **Step 3: Implement `packages/core/src/compressors/lzp.ts`**

```typescript
import { Transform } from 'stream'
import { BitReader, BitWriter } from './bits'
import { AbstractCompressor, type CompressionMode, type CompressionResult } from './types'

const MAGIC = Buffer.from([0x4c, 0x5a, 0x50, 0x01])
const HASH_SIZE = 65536
const BLOCK = 32768
const HEADER_LEVEL = 12

function lzpHash(a: number, b: number, c: number): number {
  return ((a * 31337 + b * 6271 + c * 1031) & 0xffff)
}

function compressBlock(
  input: Buffer, start: number, end: number,
  table: Uint8Array, ctx: [number, number, number],
): Buffer {
  const w = new BitWriter()
  for (let i = start; i < end; i++) {
    const b = input[i], h = lzpHash(ctx[0], ctx[1], ctx[2])
    if (table[h] === b) { w.write(0, 1) } else { w.write(1, 1); w.write(b, 8) }
    table[h] = b; ctx[0] = ctx[1]; ctx[1] = ctx[2]; ctx[2] = b
  }
  return w.flush()
}

function decompressBlock(
  bits: Buffer, blockLen: number,
  table: Uint8Array, ctx: [number, number, number],
): Buffer {
  const r = new BitReader(bits), out = Buffer.allocUnsafe(blockLen)
  for (let i = 0; i < blockLen; i++) {
    const h = lzpHash(ctx[0], ctx[1], ctx[2])
    const b = r.read(1) === 0 ? table[h] : r.read(8)
    table[h] = b; ctx[0] = ctx[1]; ctx[1] = ctx[2]; ctx[2] = b; out[i] = b
  }
  return out
}

function lzpCompress(input: Buffer): Buffer {
  const parts: Buffer[] = [MAGIC, Buffer.from([
    (input.length >>> 24) & 0xff, (input.length >>> 16) & 0xff,
    (input.length >>> 8) & 0xff, input.length & 0xff])]

  const table = new Uint8Array(HASH_SIZE)
  const ctx: [number, number, number] = [0, 0, 0]

  for (let off = 0; off < input.length || off === 0; off += BLOCK) {
    const end = Math.min(off + BLOCK, input.length)
    const blockLen = end - off; if (blockLen === 0) break
    const bits = compressBlock(input, off, end, table, ctx)
    const hdr = Buffer.allocUnsafe(8)
    hdr.writeUInt32BE(blockLen, 0); hdr.writeUInt32BE(bits.length, 4)
    parts.push(hdr, bits)
    table.fill(0); ctx[0] = 0; ctx[1] = 0; ctx[2] = 0
  }
  parts.push(Buffer.alloc(8))
  return Buffer.concat(parts)
}

function lzpDecompress(input: Buffer): Buffer {
  if (!input.subarray(0, 4).equals(MAGIC)) throw new Error('LZP: bad magic')
  const total = input.readUInt32BE(4)
  const out = Buffer.allocUnsafe(total)
  let outPos = 0, pos = 8
  const table = new Uint8Array(HASH_SIZE)
  const ctx: [number, number, number] = [0, 0, 0]

  while (pos + 8 <= input.length) {
    const blockLen = input.readUInt32BE(pos), compLen = input.readUInt32BE(pos + 4); pos += 8
    if (blockLen === 0) break
    decompressBlock(input.subarray(pos, pos + compLen), blockLen, table, ctx).copy(out, outPos)
    outPos += blockLen; pos += compLen
    table.fill(0); ctx[0] = 0; ctx[1] = 0; ctx[2] = 0
  }
  return out.subarray(0, outPos)
}

export class LZPCompressor extends AbstractCompressor {
  readonly id = 'lzp' as CompressionMode
  readonly label = 'LZ Prediction'
  readonly headerLevel = HEADER_LEVEL
  readonly streamableDecode = true
  readonly requiresFullHeader = true

  compress(input: Buffer): CompressionResult {
    return { data: lzpCompress(input), level: HEADER_LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer): Buffer {
    return lzpDecompress(input)
  }

  createDecodeStream(): Transform {
    let pending = Buffer.alloc(0), headerDone = false
    const table = new Uint8Array(HASH_SIZE)
    const ctx: [number, number, number] = [0, 0, 0]

    return new Transform({
      transform(chunk: Buffer, _enc, cb) {
        pending = Buffer.concat([pending, chunk])

        if (!headerDone) {
          if (pending.length < 8) { cb(); return }
          if (!pending.subarray(0, 4).equals(MAGIC)) { cb(new Error('LZP: bad magic')); return }
          pending = pending.subarray(8); headerDone = true
        }

        while (pending.length >= 8) {
          const blockLen = pending.readUInt32BE(0), compLen = pending.readUInt32BE(4)
          if (blockLen === 0) break
          if (pending.length < 8 + compLen) break
          const bits = pending.subarray(8, 8 + compLen)
          this.push(decompressBlock(bits, blockLen, table, ctx))
          pending = pending.subarray(8 + compLen)
          table.fill(0); ctx[0] = 0; ctx[1] = 0; ctx[2] = 0
        }
        cb()
      },
      flush(cb) { cb() },
    })
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|lzp"
```
Expected: `lzp.test.ts` passes (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/compressors/lzp.ts packages/core/tests/compressors/lzp.test.ts
git commit -m "feat(core): add LZP context-prediction compressor (headerLevel 12)"
```

---

## Task 5 — CASCADE compressor

Two-pass: SLZ reduces literal repetition into a compact token stream; AHUFF entropy-codes that already-reduced stream. Decompression reverses in order: AHUFF → SLZ. Both passes are streaming-compatible — the streaming decode chains two Transform streams.

**Header level: 13**

**Files:**
- Create: `packages/core/src/compressors/cascade.ts`
- Create: `packages/core/tests/compressors/cascade.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/tests/compressors/cascade.test.ts
import { describe, expect, it } from 'vitest'
import { AHUFFCompressor } from '../../src/compressors/ahuff'
import { CascadeCompressor } from '../../src/compressors/cascade'
import { SLZCompressor } from '../../src/compressors/slz'

const cascade = new CascadeCompressor()

describe('CascadeCompressor', () => {
  it('round-trips short data', () => {
    const input = Buffer.from('cascade round-trip')
    expect(cascade.decompress(cascade.compress(input).data)).toEqual(input)
  })

  it('round-trips empty buffer', () => {
    const input = Buffer.alloc(0)
    expect(cascade.decompress(cascade.compress(input).data)).toEqual(input)
  })

  it('round-trips multi-block data (> 50 KB)', () => {
    const input = Buffer.from(Array.from({ length: 50000 }, (_, i) => (i * 17 + 3) & 0xff))
    expect(cascade.decompress(cascade.compress(input).data)).toEqual(input)
  })

  it('beats SLZ alone on source-code-like data', () => {
    const src = 'export function f(x: number): number {\n  return x * 2;\n}\n'.repeat(200)
    const input = Buffer.from(src)
    const slz = new SLZCompressor()
    expect(cascade.compress(input).data.length).toBeLessThan(slz.compress(input).data.length)
  })

  it('exposes headerLevel 13', () => {
    expect(cascade.headerLevel).toBe(13)
  })

  it('streaming decode matches synchronous decompress', async () => {
    const input = Buffer.from('cascade streaming: ' + 'hello '.repeat(100))
    const compressed = cascade.compress(input).data
    const stream = cascade.createDecodeStream!()
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', resolve)
      stream.on('error', reject)
      for (let i = 0; i < compressed.length; i += 48)
        stream.write(compressed.subarray(i, Math.min(i + 48, compressed.length)))
      stream.end()
    })
    expect(Buffer.concat(chunks)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "FAIL|Cannot find"
```
Expected: `Cannot find module '../../src/compressors/cascade'`

- [ ] **Step 3: Implement `packages/core/src/compressors/cascade.ts`**

```typescript
import { Transform } from 'stream'
import { AHUFFCompressor } from './ahuff'
import { SLZCompressor } from './slz'
import { AbstractCompressor, type CompressionMode, type CompressionResult } from './types'

const slz = new SLZCompressor()
const ahuff = new AHUFFCompressor()
const HEADER_LEVEL = 13

export class CascadeCompressor extends AbstractCompressor {
  readonly id = 'cascade' as CompressionMode
  readonly label = 'Cascade (SLZ→AHUFF)'
  readonly headerLevel = HEADER_LEVEL
  readonly streamableDecode = true
  readonly requiresFullHeader = true

  compress(input: Buffer): CompressionResult {
    const slzOut = slz.compress(input)
    const ahuffOut = ahuff.compress(slzOut.data)
    return { data: ahuffOut.data, level: HEADER_LEVEL, uncompressedLength: input.length }
  }

  decompress(input: Buffer): Buffer {
    return slz.decompress(ahuff.decompress(input))
  }

  createDecodeStream(): Transform {
    const ahuffStream = ahuff.createDecodeStream!()
    const slzStream = slz.createDecodeStream!()
    let flushCb: ((err?: Error | null) => void) | null = null

    ahuffStream.pipe(slzStream)
    slzStream.on('data', (c: Buffer) => pass.push(c))
    slzStream.on('end', () => { flushCb?.(); flushCb = null })
    slzStream.on('error', (e: Error) => pass.destroy(e))
    ahuffStream.on('error', (e: Error) => pass.destroy(e))

    const pass = new Transform({
      transform(chunk, _enc, cb) { ahuffStream.write(chunk); cb() },
      flush(cb) { flushCb = cb; ahuffStream.end() },
    })

    return pass
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|cascade"
```
Expected: `cascade.test.ts` passes (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/compressors/cascade.ts packages/core/tests/compressors/cascade.test.ts
git commit -m "feat(core): add CASCADE SLZ→AHUFF two-pass compressor (headerLevel 13)"
```

---

## Task 6 — Wire new compressors into the registry

Four additive changes to existing files: extend the `CompressionMode` union, add metadata entries, register factories, and re-export classes. No existing line is altered.

**Files:**
- Modify: `packages/core/src/compressors/types.ts`
- Modify: `packages/core/src/compressors/modes.ts`
- Modify: `packages/core/src/compressors/registry.ts`
- Modify: `packages/core/src/compressors/index.ts`

- [ ] **Step 1: Verify full test suite passes before touching files**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all existing tests pass.

- [ ] **Step 2: Extend `CompressionMode` in `packages/core/src/compressors/types.ts`**

Append four new string literals to the `CompressionMode` union (after `'brotli-11'`):
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

- [ ] **Step 3: Add metadata to `packages/core/src/compressors/modes.ts`**

Append four entries to `COMPRESSION_MODE_INFOS` (after the `brotli-11` entry):
```typescript
  { id: 'slz',     label: 'StreamLZ',             headerLevel: 10, streamableDecode: true, requiresFullHeader: true },
  { id: 'ahuff',   label: 'Adaptive Block Huffman', headerLevel: 11, streamableDecode: true, requiresFullHeader: true },
  { id: 'lzp',     label: 'LZ Prediction',          headerLevel: 12, streamableDecode: true, requiresFullHeader: true },
  { id: 'cascade', label: 'Cascade (SLZ→AHUFF)',     headerLevel: 13, streamableDecode: true, requiresFullHeader: true },
```

- [ ] **Step 4: Register factories in `packages/core/src/compressors/registry.ts`**

Add four imports at the top (after existing imports):
```typescript
import { SLZCompressor } from './slz'
import { AHUFFCompressor } from './ahuff'
import { LZPCompressor } from './lzp'
import { CascadeCompressor } from './cascade'
```

Add four `this.register(...)` calls in the `CompressorRegistry` constructor (after the `brotli-11` line):
```typescript
    this.register('slz',     () => new SLZCompressor())
    this.register('ahuff',   () => new AHUFFCompressor())
    this.register('lzp',     () => new LZPCompressor())
    this.register('cascade', () => new CascadeCompressor())
```

- [ ] **Step 5: Re-export from `packages/core/src/compressors/index.ts`**

Append four exports (after existing exports):
```typescript
export { SLZCompressor } from './slz'
export { AHUFFCompressor } from './ahuff'
export { LZPCompressor } from './lzp'
export { CascadeCompressor } from './cascade'
```

- [ ] **Step 6: Run full test suite — no regressions**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all tests pass.

- [ ] **Step 7: Smoke-test registry lookup**

```bash
cd /Users/valerii/Develop/codeart/packages/core && node --input-type=module <<'EOF'
import { compressorRegistry } from './src/compressors/registry.js'
;['slz','ahuff','lzp','cascade'].forEach(m => {
  const c = compressorRegistry.byMode(m)
  console.log(c.label, 'headerLevel', c.headerLevel)
  const c2 = compressorRegistry.byHeaderLevel(c.headerLevel)
  console.log('  reverse lookup:', c2.label)
})
EOF
```
Expected:
```
StreamLZ headerLevel 10
  reverse lookup: StreamLZ
Adaptive Block Huffman headerLevel 11
  reverse lookup: Adaptive Block Huffman
LZ Prediction headerLevel 12
  reverse lookup: LZ Prediction
Cascade (SLZ→AHUFF) headerLevel 13
  reverse lookup: Cascade (SLZ→AHUFF)
```

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/compressors/types.ts \
        packages/core/src/compressors/modes.ts \
        packages/core/src/compressors/registry.ts \
        packages/core/src/compressors/index.ts
git commit -m "feat(core): register SLZ/AHUFF/LZP/CASCADE in CompressorRegistry"
```

---

## Task 7 — StreamPack codec

New pixel codec (id=20) that embeds 12-byte sync markers every 1024 data bytes in the flat byte stream before pixelisation. Sync markers contain a magic word, a monotone segment index, and a CRC-16 — enabling an HTTP range-request consumer to locate the nearest sync point and begin decoding mid-stream without the file's start.

**Sync marker (12 bytes):**
```
[0xDE 0xAD 0xBE 0xEF]  magic
[uint32 BE]             segment index (0, 1, 2…)
[uint16 BE]             CRC-16/CCITT of the preceding 1024 data bytes
[0x00 0x00]             reserved
```

**Files:**
- Create: `packages/core/src/codecs/streampack/metadata.ts`
- Create: `packages/core/src/codecs/streampack/index.ts`
- Create: `packages/core/tests/codecs/streampack.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/core/tests/codecs/streampack.test.ts
import { describe, expect, it } from 'vitest'
import { streampackCodec } from '../../src/codecs/streampack'

const EST = (n: number) => streampackCodec.estimateDataPixels!(Buffer.alloc(n), 3)

describe('streampackCodec', () => {
  it('has id=20 and name="streampack"', () => {
    expect(streampackCodec.id).toBe(20)
    expect(streampackCodec.name).toBe('streampack')
  })

  it('round-trips data shorter than one segment', () => {
    const input = Buffer.from('hello streampack world')
    const px = streampackCodec.encode(input, EST(input.length), 10, 10, 3)
    expect(streampackCodec.decode(px, input.length, 10, 10, 3)).toEqual(input)
  })

  it('round-trips data spanning multiple segments', () => {
    const input = Buffer.alloc(3000, 0x42)
    const px = streampackCodec.encode(input, EST(input.length), 100, 100, 3)
    expect(streampackCodec.decode(px, input.length, 100, 100, 3)).toEqual(input)
  })

  it('places sync markers at correct byte offsets', () => {
    const input = Buffer.alloc(1024 + 500)
    const px = streampackCodec.encode(input, EST(input.length), 100, 100, 3)
    // First marker starts at byte 1024 in the flat pixel array
    expect(px[1024]).toBe(0xde)
    expect(px[1025]).toBe(0xad)
    expect(px[1026]).toBe(0xbe)
    expect(px[1027]).toBe(0xef)
    // segment index 0
    expect(px[1028]).toBe(0); expect(px[1029]).toBe(0)
    expect(px[1030]).toBe(0); expect(px[1031]).toBe(0)
  })

  it('estimateDataPixels accounts for marker overhead', () => {
    // 1024 data bytes → 1 marker → (1024 + 12) / 3 = ceil(1036/3) = 346 pixels
    expect(EST(1024)).toBe(Math.ceil((1024 + 12) / 3))
  })

  it('round-trips arbitrary binary data across multiple segments', () => {
    const input = Buffer.from(Array.from({ length: 2048 }, (_, i) => (i * 37 + 13) & 0xff))
    const px = streampackCodec.encode(input, EST(input.length), 100, 100, 3)
    expect(streampackCodec.decode(px, input.length, 100, 100, 3)).toEqual(input)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "FAIL|Cannot find"
```
Expected: `Cannot find module '../../src/codecs/streampack'`

- [ ] **Step 3: Create `packages/core/src/codecs/streampack/metadata.ts`**

```typescript
import type { CodecMetadata } from '../types'

export const streampackMetadata: CodecMetadata = {
  pixelLayout: 'RGB · sequential with 12-byte sync markers every 1 KB',
  writeStyle: 'sequential + sync markers',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'partial',
  streamFriendly: 'yes',
  approxRatio: 'same as linear (sync overhead <1.2%)',
  description:
    'Linear layout with 12-byte sync markers injected every 1024 data bytes. ' +
    'Enables HTTP range-request streaming: a client can seek to the nearest ' +
    'sync marker (identified by 0xDEADBEEF magic) and begin decoding ' +
    'without the start of the stream.',
}

export const streampackInfo = { id: 20, name: 'streampack', metadata: streampackMetadata } as const
```

- [ ] **Step 4: Create `packages/core/src/codecs/streampack/index.ts`**

```typescript
import { AbstractCodec, type PixelBuffer } from '../types'
import { streampackInfo } from './metadata'

export { StreamPackCodec, streampackCodec } from './index'

const SEGMENT = 1024
const SYNC = 12

function crc16(data: Uint8Array, start: number, len: number): number {
  let crc = 0xffff
  for (let i = start; i < start + len && i < data.length; i++) {
    crc ^= data[i] << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xffff
  }
  return crc
}

export class StreamPackCodec extends AbstractCodec {
  readonly id = streampackInfo.id
  readonly name = streampackInfo.name
  readonly metadata = streampackInfo.metadata

  estimateDataPixels(input: Buffer, channels = 3): number {
    const markers = Math.ceil(input.length / SEGMENT)
    return Math.ceil((input.length + markers * SYNC) / channels)
  }

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const out = new Uint8Array(dataPixelCount * channels)
    let inPos = 0, outPos = 0, segIdx = 0

    while (inPos < input.length) {
      const segEnd = Math.min(inPos + SEGMENT, input.length)
      const segLen = segEnd - inPos
      const segStart = outPos

      for (let i = inPos; i < segEnd; i++) out[outPos++] = input[i]

      const crc = crc16(out, segStart, segLen)
      out[outPos++] = 0xde; out[outPos++] = 0xad; out[outPos++] = 0xbe; out[outPos++] = 0xef
      out[outPos++] = (segIdx >>> 24) & 0xff; out[outPos++] = (segIdx >>> 16) & 0xff
      out[outPos++] = (segIdx >>> 8) & 0xff;  out[outPos++] = segIdx & 0xff
      out[outPos++] = (crc >>> 8) & 0xff;     out[outPos++] = crc & 0xff
      out[outPos++] = 0x00; out[outPos++] = 0x00

      inPos = segEnd; segIdx++
    }

    return out
  }

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    const out = Buffer.allocUnsafe(length)
    let inPos = 0, outPos = 0, bytesUntilMarker = SEGMENT

    while (inPos < pixels.length && outPos < length) {
      if (bytesUntilMarker === 0) { inPos += SYNC; bytesUntilMarker = SEGMENT; continue }
      out[outPos++] = pixels[inPos++]
      bytesUntilMarker--
    }

    return out.subarray(0, outPos)
  }
}

export const streampackCodec = new StreamPackCodec()
```

- [ ] **Step 5: Run — expect pass**

```bash
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|streampack"
```
Expected: `streampack.test.ts` passes (6 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/codecs/streampack/ packages/core/tests/codecs/streampack.test.ts
git commit -m "feat(core): add StreamPack codec with 1 KB sync markers (id 20)"
```

---

## Task 8 — Register StreamPack in the codec catalog

Add `streampackCodec` to the two arrays that drive the algorithm catalog and API info surface. No existing entry is altered.

**Files:**
- Modify: `packages/core/src/codecs/index.ts`
- Modify: `packages/core/src/codecs/metadata.ts`

- [ ] **Step 1: Add to `packages/core/src/codecs/index.ts`**

Add the import alongside existing codec imports:
```typescript
import { streampackCodec } from './streampack'
```

Add an export alongside existing codec exports:
```typescript
export { StreamPackCodec, streampackCodec } from './streampack'
```

Add `streampackCodec` to the end of the `CODECS` array:
```typescript
export const CODECS: readonly AbstractCodec[] = [
  linearCodec,
  interleavedCodec,
  bitplaneCodec,
  deltaCodec,
  xorCodec,
  deltaChainCodec,
  rleCodec,
  predictCodec,
  bitshuffleCodec,
  zstdpixCodec,
  streampackCodec,   // ← new
]
```

- [ ] **Step 2: Add to `packages/core/src/codecs/metadata.ts`**

Add the import alongside existing info imports:
```typescript
import { streampackInfo } from './streampack/metadata'
```

Add `streampackInfo` to the end of `CODEC_INFOS`:
```typescript
export const CODEC_INFOS: readonly CodecInfo[] = [
  linearInfo,
  interleavedInfo,
  bitplaneInfo,
  deltaInfo,
  xorInfo,
  deltaChainInfo,
  rleInfo,
  predictInfo,
  bitshuffleInfo,
  zstdpixInfo,
  streampackInfo,   // ← new
]
```

- [ ] **Step 3: Run full test suite — no regressions**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/codecs/index.ts packages/core/src/codecs/metadata.ts
git commit -m "feat(core): register StreamPack codec in algorithm catalog (id 20)"
```

---

## Task 9 — Integration tests

Verify each new compressor round-trips through the full encode→image→decode pipeline, the StreamPack codec works combined with new compressors, and the old brotli-11 default is completely unaffected.

**Files:**
- Create: `packages/core/tests/compressors/integration.test.ts`

- [ ] **Step 1: Write the integration tests**

```typescript
// packages/core/tests/compressors/integration.test.ts
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import '../../src/algorithms/register-all'
import { algorithmCatalog } from '../../src/algorithms/catalog'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokenpack-integration-'))
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }))

const SAMPLE = Buffer.from(
  'export function add(a: number, b: number): number {\n  return a + b;\n}\n'.repeat(50),
)

async function roundTrip(compressionMode: string, algo = 'linear'): Promise<Buffer> {
  const out = path.join(tmp, `test-${compressionMode}-${algo}.png`)
  const algorithm = algorithmCatalog.getByName(algo)
  await algorithm.encode(SAMPLE, { out, compressionMode })
  return algorithm.decodeToBuffer(out)
}

describe('end-to-end encode→image→decode', () => {
  it('slz: round-trips through real PNG', async () => {
    expect(await roundTrip('slz')).toEqual(SAMPLE)
  })

  it('ahuff: round-trips through real PNG', async () => {
    expect(await roundTrip('ahuff')).toEqual(SAMPLE)
  })

  it('lzp: round-trips through real PNG', async () => {
    expect(await roundTrip('lzp')).toEqual(SAMPLE)
  })

  it('cascade: round-trips through real PNG', async () => {
    expect(await roundTrip('cascade')).toEqual(SAMPLE)
  })

  it('streampack codec + slz: round-trips through real PNG', async () => {
    expect(await roundTrip('slz', 'streampack')).toEqual(SAMPLE)
  })

  it('streampack codec + none: round-trips through real PNG', async () => {
    expect(await roundTrip('none', 'streampack')).toEqual(SAMPLE)
  })

  it('brotli-11 still works (no regression)', async () => {
    expect(await roundTrip('brotli-11')).toEqual(SAMPLE)
  })

  it('new compressors produce smaller images than none for repetitive data', async () => {
    const sizes: Record<string, number> = {}
    for (const mode of ['none', 'slz', 'ahuff', 'lzp', 'cascade']) {
      const out = path.join(tmp, `size-${mode}.png`)
      await algorithmCatalog.getByName('linear').encode(SAMPLE, { out, compressionMode: mode })
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
cd /Users/valerii/Develop/codeart && yarn test 2>&1 | grep -E "PASS|integration"
```
Expected: `integration.test.ts` passes (8 tests).

- [ ] **Step 3: Run full suite one final time**

```bash
cd /Users/valerii/Develop/codeart && yarn test
```
Expected: all tests pass, zero regressions.

- [ ] **Step 4: Commit**

```bash
git add packages/core/tests/compressors/integration.test.ts
git commit -m "test(core): end-to-end integration tests for all new compressors and StreamPack"
```

---

## Self-Review

**Spec coverage:**
- ✅ SLZ — speed champion, streaming decode via `createDecodeStream()` — Task 2
- ✅ AHUFF — compression champion for code/text, block-streaming — Task 3
- ✅ LZP — ratio champion for structured data, 1-bit/matched-byte — Task 4
- ✅ CASCADE — SLZ→AHUFF two-pass, best overall, streaming — Task 5
- ✅ All new compressors expose `createDecodeStream()` for HTTP chunked streaming
- ✅ StreamPack codec with 1 KB sync markers and CRC-16 — Task 7
- ✅ Zero changes to existing compressor logic, codec logic, or tests — Tasks 6, 8
- ✅ Registered via `CompressorRegistry.register()` / `CODECS` array — Tasks 6, 8
- ✅ Header levels 10–13 correctly wired for decode path — Task 6
- ✅ Integration tests cover all new modes + regression check for brotli-11 — Task 9

**Placeholder scan:** None found. Every step has complete, runnable code.

**Type consistency:**
- `SLZCompressor`, `AHUFFCompressor`, `LZPCompressor`, `CascadeCompressor` all use `as CompressionMode` cast (required because new string literals are added to the union in Task 6 — after that task, the cast is no longer needed but harmless)
- `StreamPackCodec` extends `AbstractCodec` from `../types` — same pattern as `LinearCodec`
- `BitWriter`/`BitReader` imported as `{ BitWriter, BitReader }` from `./bits` in both `ahuff.ts` and `lzp.ts`
- `streampackInfo` exported from `./metadata` and consumed by `./index.ts` and `codecs/metadata.ts`
- `CODEC_INFOS` and `CODECS` both updated in Task 8 keeping them in sync
