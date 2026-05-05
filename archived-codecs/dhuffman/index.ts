import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'
import {
  buildCodeLengths,
  serializeLengths,
  deserializeLengths,
  assignCodes,
  buildDecodeTable,
} from './huffman'

// Dynamic Huffman codec (static two-pass).
// Pass 1: scan input → build optimal Canonical Huffman code table.
// Layout in pixel buffer: [256-byte length table][huffman bitstream...]
// Achieves best compression of the Huffman family because codes are
// tuned to the actual byte distribution.

// ─── Bit writer ───────────────────────────────────────────────────────────────

class BitWriter {
  private buf: number[] = []
  private byte = 0
  private bits = 0

  write(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.byte = (this.byte << 1) | ((code >> i) & 1)
      this.bits++
      if (this.bits === 8) {
        this.buf.push(this.byte)
        this.byte = 0
        this.bits = 0
      }
    }
  }

  flush(): number[] {
    if (this.bits > 0) {
      this.buf.push(this.byte << (8 - this.bits))
      this.bits = 0
      this.byte = 0
    }
    return this.buf
  }
}

// ─── Encoding ─────────────────────────────────────────────────────────────────

function encodeInput(input: Buffer, lengths: Uint8Array): number[] {
  const codeEntries = assignCodes(lengths)
  const encTable = new Array<{ code: number; length: number } | undefined>(256)
  for (const { symbol, code, length } of codeEntries) {
    encTable[symbol] = { code, length }
  }

  const writer = new BitWriter()
  for (let i = 0; i < input.length; i++) {
    const entry = encTable[input[i]]
    if (entry === undefined) continue // should never happen
    writer.write(entry.code, entry.length)
  }
  return writer.flush()
}

// ─── Codec ────────────────────────────────────────────────────────────────────

interface DhuffmanState extends StreamCodecState {
  headerBuf: number[]
  headerDone: boolean
  table: Int32Array | null
  maxLen: number
  bitBuf: number
  bitCount: number
  out: number[]
}

export const dhuffmanCodec = ({
  id: 18,
  name: 'dhuffman',

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    // Compute actual code lengths from frequency to get a tight upper bound.
    const freq = new Uint32Array(256)
    for (let i = 0; i < input.length; i++) freq[input[i]]++
    const lengths = buildCodeLengths(freq)
    // Calculate expected bitstream bytes from per-symbol code lengths
    let totalBits = 0
    for (let sym = 0; sym < 256; sym++) {
      if (freq[sym] > 0 && lengths[sym] > 0) totalBits += freq[sym] * lengths[sym]
    }
    const bitstreamBytes = Math.ceil(totalBits / 8)
    // 256-byte header + bitstream + 1 padding pixel
    return Math.ceil((256 + bitstreamBytes) / channels) + 1
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)

    if (input.length === 0) return pixels

    // Count frequencies
    const freq = new Uint32Array(256)
    for (let i = 0; i < input.length; i++) freq[input[i]]++

    // Build code lengths and serialize header
    const lengths = buildCodeLengths(freq)
    const header = serializeLengths(lengths)

    // Encode bitstream
    const bitstream = encodeInput(input, lengths)

    // Write header + bitstream into pixel buffer
    let pos = 0
    for (let i = 0; i < header.length && pos < pixels.length; i++) pixels[pos++] = header[i]
    for (let i = 0; i < bitstream.length && pos < pixels.length; i++) pixels[pos++] = bitstream[i]

    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    if (length === 0) return Buffer.alloc(0)

    // Read 256-byte header
    const header = Buffer.allocUnsafe(256)
    for (let i = 0; i < 256 && i < pixels.length; i++) header[i] = pixels[i]

    const lengths = deserializeLengths(header)
    const { table, maxLen } = buildDecodeTable(lengths)

    const out = Buffer.allocUnsafe(length)
    let outPos = 0
    let bitBuf = 0
    let bitCount = 0
    let pos = 256

    while (outPos < length && (pos < pixels.length || bitCount > 0)) {
      // Fill bit buffer
      while (bitCount < maxLen && pos < pixels.length) {
        bitBuf = (bitBuf << 8) | pixels[pos++]
        bitCount += 8
      }

      if (bitCount < 1) break

      // Look up top maxLen bits
      const bitsAvail = Math.min(bitCount, maxLen)
      const shift = bitCount - maxLen
      const idx = shift >= 0 ? (bitBuf >> shift) & ((1 << maxLen) - 1) : (bitBuf << (maxLen - bitCount)) & ((1 << maxLen) - 1)

      const entry = table[idx]
      if (entry < 0) break // invalid code (padding zeros)

      const sym = entry & 0xffff
      const len = entry >> 16

      out[outPos++] = sym
      bitCount -= len
      // mask off consumed bits
      if (bitCount >= 0) {
        bitBuf &= (1 << bitCount) - 1
      } else {
        bitBuf = 0
        bitCount = 0
      }
    }

    return out.subarray(0, outPos)
  },

  createDecodeState(): DhuffmanState {
    return {
      headerBuf: [],
      headerDone: false,
      table: null,
      maxLen: 0,
      bitBuf: 0,
      bitCount: 0,
      out: [],
    }
  },

  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState } {
    const s = state as DhuffmanState
    const newOut: number[] = []

    let pos = 0

    // Accumulate header if not done
    let headerBuf = s.headerBuf
    let headerDone = s.headerDone
    let table = s.table
    let maxLen = s.maxLen

    if (!headerDone) {
      while (headerBuf.length < 256 && pos < pixelChunk.length) {
        headerBuf = [...headerBuf, pixelChunk[pos++]]
      }
      if (headerBuf.length >= 256) {
        headerDone = true
        const lengths = deserializeLengths(Buffer.from(headerBuf))
        const decoded = buildDecodeTable(lengths)
        table = decoded.table
        maxLen = decoded.maxLen
      }
    }

    // Decode bits from remaining chunk bytes
    let bitBuf = s.bitBuf
    let bitCount = s.bitCount

    if (headerDone && table !== null && maxLen > 0) {
      while (pos < pixelChunk.length) {
        bitBuf = (bitBuf << 8) | pixelChunk[pos++]
        bitCount += 8

        while (bitCount >= maxLen) {
          const shift = bitCount - maxLen
          const idx = (bitBuf >> shift) & ((1 << maxLen) - 1)
          const entry = table[idx]
          if (entry < 0) {
            // Likely padding zeros — consume 1 bit and continue
            bitCount--
            bitBuf &= (1 << bitCount) - 1
            continue
          }
          const sym = entry & 0xffff
          const len = entry >> 16
          newOut.push(sym)
          bitCount -= len
          bitBuf &= (1 << bitCount) - 1
        }
      }
    }

    const newState: DhuffmanState = {
      headerBuf,
      headerDone,
      table,
      maxLen,
      bitBuf,
      bitCount,
      out: [],
    }

    return { bytes: Buffer.from(newOut), state: newState }
  },
}) satisfies StreamingCodec
