import type { PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// ─── Context-mixing codec with 1-byte XOR context + arithmetic coding ────────
//
// Context model:
//   ctx = prev1 XOR prev2  (1-byte context key, 256 distinct contexts)
//   counts[ctx * 256 + b] = occurrences of byte b after context ctx
//   Initial counts: 1 (Laplace smoothing)
//
// Arithmetic coder: 32-bit BigInt range coder, byte renormalization.
// Both encoder and decoder update counts in lockstep — no table transmitted.
//
// Pixel layout: [4 bytes LE: total uncompressed length] [arith-coded payload]
//
// Frequency rescaling: when a context's total count reaches MAX_CTX_TOTAL,
// all counts for that context are halved (min 1).  Without this, total can grow
// to ~N (input size), making range/total → 0 and collapsing the coder's range.
// Encoder and decoder call rescaleCtx at identical points so they stay in sync.

// ─── Counts helpers ───────────────────────────────────────────────────────────

const MAX_CTX_TOTAL = 16384

/** Initial counts: all 1s, 256×256 table. */
function initialCounts(): Uint32Array {
  const c = new Uint32Array(256 * 256)
  c.fill(1)
  return c
}

/** Halve all counts for context `ctx` (min 1). Called when total hits MAX_CTX_TOTAL. */
function rescaleCtx(counts: Uint32Array, ctx: number): void {
  const base = ctx * 256
  for (let i = 0; i < 256; i++) {
    counts[base + i] = Math.max(1, counts[base + i] >> 1)
  }
}

/**
 * Build cumulative frequency (257 entries) for the row at `ctx`.
 * Returns { cumFreq, total } as BigInts for the coder.
 */
function buildCumFreqBig(counts: Uint32Array, ctx: number): { cumFreq: bigint[]; total: bigint } {
  const base = ctx * 256
  const cumFreq = new Array<bigint>(257)
  let total = 0n
  for (let i = 0; i < 256; i++) {
    cumFreq[i] = total
    total += BigInt(counts[base + i])
  }
  cumFreq[256] = total
  return { cumFreq, total }
}

// ─── Arithmetic encode ────────────────────────────────────────────────────────

function ctxEncode(input: Buffer, counts: Uint32Array): Buffer {
  const out: number[] = []
  let low = 0n
  let high = 0xffffffffn
  let prev1 = 0
  let prev2 = 0

  for (let i = 0; i < input.length; i++) {
    const b = input[i]
    const ctx = prev1 ^ prev2
    const { cumFreq, total } = buildCumFreqBig(counts, ctx)

    const range = high - low + 1n
    high = low + (range * cumFreq[b + 1]) / total - 1n
    low = low + (range * cumFreq[b]) / total

    while ((high >> 24n) === (low >> 24n)) {
      out.push(Number((high >> 24n) & 0xffn))
      low = (low << 8n) & 0xffffffffn
      high = ((high << 8n) | 0xffn) & 0xffffffffn
    }

    counts[ctx * 256 + b]++
    if (Number(total) + 1 >= MAX_CTX_TOTAL) rescaleCtx(counts, ctx)
    prev2 = prev1
    prev1 = b
  }

  // Flush 4 bytes
  out.push(Number((low >> 24n) & 0xffn))
  out.push(Number((low >> 16n) & 0xffn))
  out.push(Number((low >> 8n) & 0xffn))
  out.push(Number(low & 0xffn))

  return Buffer.from(out)
}

// ─── Arithmetic decode (full, non-streaming) ──────────────────────────────────

function ctxDecodeAll(
  encoded: Buffer,
  encOffset: number,
  length: number,
  counts: Uint32Array,
): Buffer {
  const out = Buffer.allocUnsafe(length)
  let pos = encOffset
  let prev1 = 0
  let prev2 = 0

  function readByte(): number {
    if (pos < encoded.length) return encoded[pos++]
    return 0
  }

  let low = 0n
  let high = 0xffffffffn
  let code = BigInt(
    ((readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte()) >>> 0,
  )

  for (let i = 0; i < length; i++) {
    const ctx = prev1 ^ prev2
    const { cumFreq, total } = buildCumFreqBig(counts, ctx)
    const range = high - low + 1n
    const codeOff = code - low

    // Binary search: find largest b such that floor(range * cumFreq[b] / total) <= codeOff
    let lo = 0
    let hi = 256
    while (lo + 1 < hi) {
      const mid = (lo + hi) >>> 1
      if ((range * cumFreq[mid]) / total <= codeOff) {
        lo = mid
      } else {
        hi = mid
      }
    }
    const b = lo
    out[i] = b

    high = low + (range * cumFreq[b + 1]) / total - 1n
    low = low + (range * cumFreq[b]) / total

    while ((high >> 24n) === (low >> 24n)) {
      low = (low << 8n) & 0xffffffffn
      high = ((high << 8n) | 0xffn) & 0xffffffffn
      code = ((code << 8n) & 0xffffffffn) | BigInt(readByte())
    }

    counts[ctx * 256 + b]++
    if (Number(total) + 1 >= MAX_CTX_TOTAL) rescaleCtx(counts, ctx)
    prev2 = prev1
    prev1 = b
  }

  return out
}

// ─── Streaming state ──────────────────────────────────────────────────────────

interface CtxpixState extends StreamCodecState {
  counts: Uint32Array
  prev1: number
  prev2: number
  // Arithmetic decoder running BigInt state (stored as hex strings for JSON-safety)
  arithLow: string
  arithHigh: string
  arithCode: string
  // Encoded bytes not yet consumed
  bitBuf: Buffer
  // Bytes decoded so far
  bytesDecoded: number
  // Total expected bytes (-1 until header read)
  totalExpected: number
  // Whether 4-byte length header has been consumed
  headerConsumed: boolean
  // Partial header bytes received so far
  headerBuf: Buffer
  // Whether arithmetic coder is primed (first 4 bytes read)
  arithPrimed: boolean
}

// ─── Codec ────────────────────────────────────────────────────────────────────

export const ctxpixCodec: StreamingCodec = {
  id: 23,
  name: 'ctxpix',

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    // Encode with a fresh counts copy to get the exact compressed size
    const counts = initialCounts()
    const encoded = ctxEncode(input, counts)
    return Math.ceil((4 + encoded.length) / channels) + 1
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    if (input.length === 0) return pixels

    const lengthBuf = Buffer.allocUnsafe(4)
    lengthBuf.writeUInt32LE(input.length, 0)

    const counts = initialCounts()
    const encoded = ctxEncode(input, counts)

    const full = Buffer.concat([lengthBuf, encoded])
    pixels.set(full.subarray(0, Math.min(full.length, pixels.length)))
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    if (length === 0) return Buffer.alloc(0)

    const data = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
    const counts = initialCounts()
    return ctxDecodeAll(data, 4, length, counts)
  },

  createDecodeState(): CtxpixState {
    return {
      counts: initialCounts(),
      prev1: 0,
      prev2: 0,
      arithLow: '0',
      arithHigh: 'ffffffff',
      arithCode: '0',
      bitBuf: Buffer.alloc(0),
      bytesDecoded: 0,
      totalExpected: -1,
      headerConsumed: false,
      headerBuf: Buffer.alloc(0),
      arithPrimed: false,
    }
  },

  decodeChunk(
    pixelChunk: PixelBuffer,
    state: StreamCodecState,
  ): { bytes: Buffer; state: StreamCodecState } {
    // Shallow clone for immutability (counts array is mutated in-place consistently)
    const s: CtxpixState = { ...(state as CtxpixState) }

    s.bitBuf = Buffer.concat([s.bitBuf, Buffer.from(pixelChunk)])

    const decoded: number[] = []

    // Phase 1: collect 4-byte length header
    if (!s.headerConsumed) {
      const combined = Buffer.concat([s.headerBuf, s.bitBuf])
      if (combined.length < 4) {
        s.headerBuf = combined
        s.bitBuf = Buffer.alloc(0)
        return { bytes: Buffer.alloc(0), state: s }
      }
      s.totalExpected = combined.readUInt32LE(0)
      s.bitBuf = combined.subarray(4)
      s.headerBuf = Buffer.alloc(0)
      s.headerConsumed = true
    }

    // Phase 2: prime arithmetic coder with first 4 bytes
    if (!s.arithPrimed) {
      if (s.bitBuf.length < 4) {
        return { bytes: Buffer.alloc(0), state: s }
      }
      const code =
        ((s.bitBuf[0] << 24) | (s.bitBuf[1] << 16) | (s.bitBuf[2] << 8) | s.bitBuf[3]) >>> 0
      s.arithCode = BigInt(code).toString(16)
      s.bitBuf = s.bitBuf.subarray(4)
      s.arithPrimed = true
    }

    // Phase 3: decode symbols while we have buffered encoded bytes
    let low = BigInt('0x' + s.arithLow)
    let high = BigInt('0x' + s.arithHigh)
    let code = BigInt('0x' + s.arithCode)
    let bitBuf = s.bitBuf
    let bitPos = 0

    function readByte(): number {
      if (bitPos < bitBuf.length) return bitBuf[bitPos++]
      return 0
    }

    while (s.bytesDecoded < s.totalExpected) {
      if (bitPos >= bitBuf.length && s.bytesDecoded < s.totalExpected) {
        // No more encoded bytes — stop
        break
      }

      const ctx = s.prev1 ^ s.prev2
      const { cumFreq, total } = buildCumFreqBig(s.counts, ctx)
      const range = high - low + 1n
      const codeOff = code - low

      let lo = 0
      let hi = 256
      while (lo + 1 < hi) {
        const mid = (lo + hi) >>> 1
        if ((range * cumFreq[mid]) / total <= codeOff) {
          lo = mid
        } else {
          hi = mid
        }
      }
      const b = lo
      decoded.push(b)

      high = low + (range * cumFreq[b + 1]) / total - 1n
      low = low + (range * cumFreq[b]) / total

      while ((high >> 24n) === (low >> 24n)) {
        low = (low << 8n) & 0xffffffffn
        high = ((high << 8n) | 0xffn) & 0xffffffffn
        code = ((code << 8n) & 0xffffffffn) | BigInt(readByte())
      }

      s.counts[ctx * 256 + b]++
      if (Number(total) + 1 >= MAX_CTX_TOTAL) rescaleCtx(s.counts, ctx)
      s.prev2 = s.prev1
      s.prev1 = b
      s.bytesDecoded++
    }

    // Save coder state back
    s.arithLow = low.toString(16)
    s.arithHigh = high.toString(16)
    s.arithCode = code.toString(16)
    s.bitBuf = bitBuf.subarray(bitPos)

    return { bytes: Buffer.from(decoded), state: s }
  },
}
