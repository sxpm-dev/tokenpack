import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// Adaptive Huffman codec using periodic frequency-table rebuild.
//
// Both encoder and decoder maintain an identical frequency table `freq[256]`.
// A canonical Huffman code table is rebuilt from `freq` every REBUILD_INTERVAL
// bytes. This guarantees that encoder and decoder always share the same code
// table at the same position in the stream.
//
// Bit layout: codes packed MSB-first. The pixel length is determined by an
// exact trial-encode in `estimateDataPixels`.
//
// Initial state: `freq[i] = 1` for all 256 symbols (prevents zero-length codes).
// After encoding/decoding each byte `b`, `freq[b]` is incremented.

// 4096 bytes between rebuilds: ~240 rebuilds per 1MB instead of ~15,000 at 64.
// Decoder uses the same interval so both sides stay in sync.
const REBUILD_INTERVAL = 4096

// ─── Min-heap ─────────────────────────────────────────────────────────────────

interface HeapNode {
  freq: number
  sym: number   // -1 for internal
  left: HeapNode | null
  right: HeapNode | null
}

function heapPush(h: HeapNode[], n: HeapNode): void {
  h.push(n)
  let i = h.length - 1
  while (i > 0) {
    const p = (i - 1) >> 1
    if (h[p].freq <= h[i].freq) break
    ;[h[p], h[i]] = [h[i], h[p]]
    i = p
  }
}

function heapPop(h: HeapNode[]): HeapNode {
  const top = h[0]
  const last = h.pop()!
  if (h.length > 0) {
    h[0] = last
    let i = 0
    for (;;) {
      const l = 2 * i + 1
      const r = 2 * i + 2
      let s = i
      if (l < h.length && h[l].freq < h[s].freq) s = l
      if (r < h.length && h[r].freq < h[s].freq) s = r
      if (s === i) break
      ;[h[i], h[s]] = [h[s], h[i]]
      i = s
    }
  }
  return top
}

// ─── Build Huffman codes from freq table ─────────────────────────────────────
//
// Returns `codes[sym]` = { code: number, len: number } for all 256 symbols.
// Uses canonical Huffman: symbols sorted by (len ASC, sym ASC), codes assigned
// in sequence.

interface CodeEntry { code: number; len: number }

function buildCodes(freq: number[]): CodeEntry[] {
  // Build tree via min-heap
  const heap: HeapNode[] = []
  for (let i = 0; i < 256; i++) {
    heapPush(heap, { freq: freq[i], sym: i, left: null, right: null })
  }
  while (heap.length > 1) {
    const a = heapPop(heap)
    const b = heapPop(heap)
    heapPush(heap, { freq: a.freq + b.freq, sym: -1, left: a, right: b })
  }

  // Derive lengths via DFS
  const lens = new Uint8Array(256)
  function walk(n: HeapNode, d: number): void {
    if (n.sym >= 0) { lens[n.sym] = d; return }
    if (n.left)  walk(n.left,  d + 1)
    if (n.right) walk(n.right, d + 1)
  }
  if (heap.length > 0) walk(heap[0], 0)

  // Assign canonical codes (sort by len ASC, sym ASC)
  const byLen: { sym: number; len: number }[] = []
  for (let i = 0; i < 256; i++) byLen.push({ sym: i, len: lens[i] })
  byLen.sort((a, b) => a.len - b.len || a.sym - b.sym)

  const table: CodeEntry[] = new Array(256)
  let code = 0
  let prevLen = 0
  for (const { sym, len } of byLen) {
    if (len > prevLen) { code <<= len - prevLen; prevLen = len }
    table[sym] = { code, len }
    code++
  }
  return table
}

// ─── Build a flat decode table ────────────────────────────────────────────────
//
// Uses two Uint8Arrays instead of an object array to avoid creating millions of
// JS objects when maxLen is large (e.g. 20 for skewed byte distributions).

interface DecodeTable { sym: Uint8Array; len: Uint8Array; maxLen: number }

function buildDecodeTable(table: CodeEntry[]): DecodeTable {
  let maxLen = 0
  for (const e of table) if (e.len > maxLen) maxLen = e.len
  if (maxLen === 0) maxLen = 1

  const size = 1 << maxLen
  const sym = new Uint8Array(size)
  const len = new Uint8Array(size)   // 0 = invalid entry

  for (let s = 0; s < 256; s++) {
    const { code, len: l } = table[s]
    if (l === 0) continue
    const shift = maxLen - l
    const base = code << shift
    const count = 1 << shift
    for (let j = 0; j < count; j++) {
      sym[base + j] = s
      len[base + j] = l
    }
  }
  return { sym, len, maxLen }
}

// ─── Initial frequency table ──────────────────────────────────────────────────

function makeFreq(): number[] {
  return new Array(256).fill(1)
}

// ─── Encode ───────────────────────────────────────────────────────────────────

function encodeToBits(input: Buffer): number[] {
  const freq = makeFreq()
  let table = buildCodes(freq)
  const bits: number[] = []
  let syncCount = 0

  for (let i = 0; i < input.length; i++) {
    const sym = input[i]
    const { code, len } = table[sym]
    for (let k = len - 1; k >= 0; k--) bits.push((code >> k) & 1)

    freq[sym]++
    syncCount++
    if (syncCount === REBUILD_INTERVAL) {
      table = buildCodes(freq)
      syncCount = 0
    }
  }
  return bits
}

function packBitsToBytes(bits: number[], byteCount: number): Uint8Array {
  const out = new Uint8Array(byteCount)
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) {
      const bi = i >> 3
      if (bi < byteCount) out[bi] |= 1 << (7 - (i & 7))
    }
  }
  return out
}

// ─── Decode state ─────────────────────────────────────────────────────────────

interface AhuffState extends StreamCodecState {
  freq: number[]
  table: CodeEntry[]
  dtSym: Uint8Array
  dtLen: Uint8Array
  maxLen: number
  syncCount: number
  bitBuf: number
  bitsInBuf: number
  bytesDecoded: number
}

function makeDecodeState(): AhuffState {
  const freq = makeFreq()
  const table = buildCodes(freq)
  const { sym: dtSym, len: dtLen, maxLen } = buildDecodeTable(table)
  return {
    freq, table, dtSym, dtLen, maxLen,
    syncCount: 0,
    bitBuf: 0,
    bitsInBuf: 0,
    bytesDecoded: 0,
  }
}

// ─── Codec ────────────────────────────────────────────────────────────────────

export const ahuffmanCodec = ({
  id: 17,
  name: 'ahuffman',

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    // Trial-encode to get exact bit count, then compute pixel count.
    const bits = encodeToBits(input)
    const byteCount = Math.ceil(bits.length / 8)
    return Math.ceil(byteCount / channels) + 1
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    if (input.length === 0) return new Uint8Array(dataPixelCount * channels)
    const bits = encodeToBits(input)
    return packBitsToBytes(bits, dataPixelCount * channels)
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    if (length === 0) return Buffer.alloc(0)

    const freq = makeFreq()
    let table = buildCodes(freq)
    let { sym: dtSym, len: dtLen, maxLen } = buildDecodeTable(table)

    const out = Buffer.allocUnsafe(length)
    let outPos = 0
    let bitBuf = 0
    let bitsInBuf = 0
    let syncCount = 0
    let pos = 0

    while (outPos < length) {
      // Refill bit buffer. Use >>> 0 to keep bitBuf unsigned (avoids signed-shift bug).
      while (bitsInBuf < maxLen && pos < pixels.length) {
        bitBuf = (((bitBuf << 8) >>> 0) | pixels[pos++]) >>> 0
        bitsInBuf += 8
      }
      if (bitsInBuf < 1) break

      // Use >>> (unsigned right shift) so a sign bit never corrupts the index.
      const shift = bitsInBuf - maxLen
      const idx = shift >= 0
        ? (bitBuf >>> shift) & ((1 << maxLen) - 1)
        : (bitBuf << (maxLen - bitsInBuf)) & ((1 << maxLen) - 1)

      const l = dtLen[idx]
      if (l === 0) {
        bitsInBuf--
        bitBuf = (bitsInBuf > 0 ? bitBuf & ((1 << bitsInBuf) - 1) : 0) >>> 0
        continue
      }
      if (l > bitsInBuf) break

      const s = dtSym[idx]
      out[outPos++] = s
      bitsInBuf -= l
      bitBuf = (bitsInBuf > 0 ? bitBuf & ((1 << bitsInBuf) - 1) : 0) >>> 0

      freq[s]++
      syncCount++
      if (syncCount === REBUILD_INTERVAL) {
        table = buildCodes(freq)
        ;({ sym: dtSym, len: dtLen, maxLen } = buildDecodeTable(table))
        syncCount = 0
      }
    }

    return out.subarray(0, outPos)
  },

  createDecodeState(): StreamCodecState {
    return makeDecodeState()
  },

  decodeChunk(
    pixelChunk: PixelBuffer,
    state: StreamCodecState,
  ): { bytes: Buffer; state: StreamCodecState } {
    const s = state as AhuffState
    const decoded: number[] = []

    // Copy mutable fields
    let freq      = s.freq.slice()
    let table     = s.table
    let dtSym     = s.dtSym
    let dtLen     = s.dtLen
    let maxLen    = s.maxLen
    let syncCount = s.syncCount
    let bitBuf    = s.bitBuf
    let bitsInBuf = s.bitsInBuf

    let pos = 0

    for (;;) {
      // Refill bit buffer from chunk bytes. Use >>> 0 to keep bitBuf unsigned.
      while (bitsInBuf < maxLen && pos < pixelChunk.length) {
        bitBuf = (((bitBuf << 8) >>> 0) | pixelChunk[pos++]) >>> 0
        bitsInBuf += 8
      }
      if (bitsInBuf < 1) break

      const shift = bitsInBuf - maxLen
      const idx = shift >= 0
        ? (bitBuf >>> shift) & ((1 << maxLen) - 1)
        : (bitBuf << (maxLen - bitsInBuf)) & ((1 << maxLen) - 1)

      const l = dtLen[idx]
      if (l === 0) {
        bitsInBuf--
        bitBuf = (bitsInBuf > 0 ? bitBuf & ((1 << bitsInBuf) - 1) : 0) >>> 0
        continue
      }
      if (l > bitsInBuf) break

      const sym = dtSym[idx]
      decoded.push(sym)
      bitsInBuf -= l
      bitBuf = (bitsInBuf > 0 ? bitBuf & ((1 << bitsInBuf) - 1) : 0) >>> 0

      freq[sym]++
      syncCount++
      if (syncCount === REBUILD_INTERVAL) {
        table = buildCodes(freq)
        ;({ sym: dtSym, len: dtLen, maxLen } = buildDecodeTable(table))
        syncCount = 0
      }
    }

    const newState: AhuffState = {
      freq,
      table,
      dtSym,
      dtLen,
      maxLen,
      syncCount,
      bitBuf,
      bitsInBuf,
      bytesDecoded: s.bytesDecoded + decoded.length,
    }

    return { bytes: Buffer.from(decoded), state: newState }
  },
}) satisfies StreamingCodec
