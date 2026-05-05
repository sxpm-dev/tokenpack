import type { PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// ─── Block-based arithmetic coding codec ─────────────────────────────────────
//
// Each block of up to BLOCK_SIZE input bytes is encoded independently:
//
//   [4 bytes LE: uncompressed block size]
//   [4 bytes LE: encoded payload size]      ← avoids re-encoding at decode time
//   [256 × 4 bytes LE: frequency table (raw counts)]
//   [arithmetic-coded payload bytes]
//
// 32-bit arithmetic coding (BigInt for exact arithmetic).
// Renormalization: byte-at-a-time when top byte of low == top byte of high.

const BLOCK_SIZE   = 4096
const HEADER_SIZE  = 4 + 4 + 256 * 4   // blockLen(4) + encodedLen(4) + freq(1024) = 1032

// ─── Arithmetic encoder ───────────────────────────────────────────────────────

function arithEncode(block: Buffer, cumFreq: Uint32Array, total: number): Buffer {
  const out: number[] = []
  let low = 0n
  let high = 0xffffffffn
  const totalN = BigInt(total)

  for (let i = 0; i < block.length; i++) {
    const b = block[i]

    // Pre-symbol normalization: ensure range >= total so no interval collapses to zero.
    // Without this, range * freq[b] < total causes high < low and coder corruption.
    let range = high - low + 1n
    while (range < totalN) {
      out.push(Number((high >> 24n) & 0xffn))
      low = (low << 8n) & 0xffffffffn
      high = ((high << 8n) | 0xffn) & 0xffffffffn
      range = high - low + 1n
    }

    high = low + (range * BigInt(cumFreq[b + 1])) / totalN - 1n
    low = low + (range * BigInt(cumFreq[b])) / totalN

    while ((high >> 24n) === (low >> 24n)) {
      out.push(Number((high >> 24n) & 0xffn))
      low = (low << 8n) & 0xffffffffn
      high = ((high << 8n) | 0xffn) & 0xffffffffn
    }
  }

  // Flush 4 bytes of low
  out.push(Number((low >> 24n) & 0xffn))
  out.push(Number((low >> 16n) & 0xffn))
  out.push(Number((low >> 8n) & 0xffn))
  out.push(Number(low & 0xffn))

  return Buffer.from(out)
}

// ─── Arithmetic decoder ───────────────────────────────────────────────────────

function arithDecode(
  encoded: Buffer,
  encOffset: number,
  encLen: number,
  blockLen: number,
  cumFreq: Uint32Array,
  total: number,
): Buffer {
  const out = Buffer.allocUnsafe(blockLen)
  let pos = encOffset
  const end = encOffset + encLen
  const totalN = BigInt(total)

  function readByte(): number {
    if (pos < end) return encoded[pos++]
    return 0
  }

  let low = 0n
  let high = 0xffffffffn
  let code = BigInt(
    ((readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte()) >>> 0,
  )

  for (let i = 0; i < blockLen; i++) {
    // Pre-symbol normalization: mirror encoder's pre-norm to stay in sync.
    let range = high - low + 1n
    while (range < totalN) {
      low = (low << 8n) & 0xffffffffn
      high = ((high << 8n) | 0xffn) & 0xffffffffn
      code = ((code << 8n) & 0xffffffffn) | BigInt(readByte())
      range = high - low + 1n
    }

    const codeOff = code - low

    let lo = 0
    let hi = 256
    while (lo + 1 < hi) {
      const mid = (lo + hi) >>> 1
      if ((range * BigInt(cumFreq[mid])) / totalN <= codeOff) {
        lo = mid
      } else {
        hi = mid
      }
    }
    const b = lo
    out[i] = b

    high = low + (range * BigInt(cumFreq[b + 1])) / totalN - 1n
    low = low + (range * BigInt(cumFreq[b])) / totalN

    while ((high >> 24n) === (low >> 24n)) {
      low = (low << 8n) & 0xffffffffn
      high = ((high << 8n) | 0xffn) & 0xffffffffn
      code = ((code << 8n) & 0xffffffffn) | BigInt(readByte())
    }
  }

  return out
}

// ─── Block encode / decode helpers ───────────────────────────────────────────

function encodeBlock(block: Buffer): Buffer {
  const blockLen = block.length

  const freq = new Uint32Array(256)
  for (let i = 0; i < block.length; i++) freq[block[i]]++

  let total = 0
  for (let i = 0; i < 256; i++) total += freq[i]

  const cumFreq = new Uint32Array(257)
  for (let i = 0; i < 256; i++) cumFreq[i + 1] = cumFreq[i] + freq[i]

  const encoded = arithEncode(block, cumFreq, total)

  const out = Buffer.allocUnsafe(HEADER_SIZE + encoded.length)
  out.writeUInt32LE(blockLen, 0)
  out.writeUInt32LE(encoded.length, 4)          // store encoded payload length
  for (let i = 0; i < 256; i++) {
    out.writeUInt32LE(freq[i], 8 + i * 4)
  }
  encoded.copy(out, HEADER_SIZE)

  return out
}

function decodeBlock(data: Buffer, offset: number): { block: Buffer; bytesConsumed: number } {
  if (offset + HEADER_SIZE > data.length) {
    throw new Error('anspix: truncated block header')
  }

  const blockLen   = data.readUInt32LE(offset)
  const encodedLen = data.readUInt32LE(offset + 4)

  // Safety: reject obviously invalid values (e.g. zero-padded tail of pixel buffer)
  if (blockLen === 0 || blockLen > BLOCK_SIZE || encodedLen === 0 || offset + HEADER_SIZE + encodedLen > data.length) {
    return { block: Buffer.alloc(0), bytesConsumed: data.length - offset }
  }

  const freq = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    freq[i] = data.readUInt32LE(offset + 8 + i * 4)
  }

  let total = 0
  for (let i = 0; i < 256; i++) total += freq[i]

  const cumFreq = new Uint32Array(257)
  for (let i = 0; i < 256; i++) cumFreq[i + 1] = cumFreq[i] + freq[i]

  const block = arithDecode(data, offset + HEADER_SIZE, encodedLen, blockLen, cumFreq, total)
  return { block, bytesConsumed: HEADER_SIZE + encodedLen }
}

// ─── Streaming state ──────────────────────────────────────────────────────────

interface AnspixState extends StreamCodecState {
  buf: Buffer
}

// ─── Codec ────────────────────────────────────────────────────────────────────

export const anspixCodec: StreamingCodec = {
  id: 22,
  name: 'anspix',

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    let totalCompressed = 0
    for (let off = 0; off < input.length; off += BLOCK_SIZE) {
      const block = input.subarray(off, Math.min(off + BLOCK_SIZE, input.length))
      totalCompressed += encodeBlock(Buffer.from(block)).length
    }
    return Math.ceil(totalCompressed / channels) + 1
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    if (input.length === 0) return pixels

    let pixelPos = 0
    for (let off = 0; off < input.length; off += BLOCK_SIZE) {
      const block = input.subarray(off, Math.min(off + BLOCK_SIZE, input.length))
      const encoded = encodeBlock(Buffer.from(block))
      for (let i = 0; i < encoded.length && pixelPos < pixels.length; i++) {
        pixels[pixelPos++] = encoded[i]
      }
    }
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    if (length === 0) return Buffer.alloc(0)

    const data = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
    const chunks: Buffer[] = []
    let offset = 0
    let totalDecoded = 0

    while (totalDecoded < length && offset + HEADER_SIZE <= data.length) {
      const { block, bytesConsumed } = decodeBlock(data, offset)
      if (block.length === 0) break
      const needed = Math.min(block.length, length - totalDecoded)
      chunks.push(block.subarray(0, needed))
      totalDecoded += needed
      offset += bytesConsumed
    }

    return Buffer.concat(chunks)
  },

  createDecodeState(): AnspixState {
    return { buf: Buffer.alloc(0) }
  },

  decodeChunk(
    pixelChunk: PixelBuffer,
    state: StreamCodecState,
  ): { bytes: Buffer; state: StreamCodecState } {
    const s = state as AnspixState
    const combined = Buffer.concat([s.buf, Buffer.from(pixelChunk)])

    const chunks: Buffer[] = []
    let offset = 0

    while (offset + HEADER_SIZE <= combined.length) {
      const blockLen   = combined.readUInt32LE(offset)
      const encodedLen = combined.readUInt32LE(offset + 4)

      if (blockLen === 0 || blockLen > BLOCK_SIZE) break

      if (offset + HEADER_SIZE + encodedLen > combined.length) break

      try {
        const { block, bytesConsumed } = decodeBlock(combined, offset)
        if (block.length === 0) break
        chunks.push(block)
        offset += bytesConsumed
      } catch {
        break
      }
    }

    const remainder = combined.subarray(offset)
    const newState: AnspixState = { buf: Buffer.from(remainder) }
    return { bytes: Buffer.concat(chunks), state: newState }
  },
}
