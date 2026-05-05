import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// LZ4-inspired codec. Fastest decode — pure memory-copy operations.
//
// Sequence format (repeated until all input encoded):
//   [TOKEN byte]
//   [EXTRA_LIT bytes if litLen_nibble == 15]   (add bytes until non-255)
//   [literal bytes]
//   [MATCH_OFFSET 2B LE]                        (omitted on last sequence)
//   [EXTRA_MATCH bytes if matchLen_nibble == 15] (add until non-255)
//
// TOKEN = (litLen_nibble << 4) | matchLen_nibble
//   litLen_nibble: 0-14 = literal count; 15 = more in EXTRA_LIT
//   matchLen_nibble: actual match = value + 4 (min match = 4 bytes)
//
// Block format: 4-byte LE originalSize header + LZ4 sequences.
// Multiple blocks if input > 64KB.

const BLOCK_SIZE = 65536 // 64 KB input per block
const MIN_MATCH = 4
const HASH_SIZE = 65536 // 2^16 hash entries per block
const MAX_LIT_NIBBLE = 15
const MAX_MATCH_NIBBLE = 15

// ─── Hash ─────────────────────────────────────────────────────────────────────

function hash4(b0: number, b1: number, b2: number, b3: number): number {
  return (((b0 << 8) ^ (b1 << 4) ^ (b2 << 2) ^ b3) * 0x9e3779b9) >>> 16
}

// ─── Encode a single block (up to 64KB) → compressed bytes ───────────────────

function encodeBlock(block: Buffer): number[] {
  const n = block.length
  const out: number[] = []

  // Hash table: position of last occurrence of 4-byte sequence
  const hashTable = new Int32Array(HASH_SIZE).fill(-1)

  let i = 0 // current input position
  let litStart = 0 // start of current literal run

  function emitSequence(litEnd: number, matchOffset: number, matchLen: number): void {
    const litLen = litEnd - litStart
    const matchExtra = matchLen - MIN_MATCH

    // TOKEN
    const litNibble = Math.min(litLen, MAX_LIT_NIBBLE)
    const matchNibble = Math.min(matchExtra, MAX_MATCH_NIBBLE)
    out.push((litNibble << 4) | matchNibble)

    // EXTRA_LIT
    if (litLen >= MAX_LIT_NIBBLE) {
      let rem = litLen - MAX_LIT_NIBBLE
      while (rem >= 255) {
        out.push(255)
        rem -= 255
      }
      out.push(rem)
    }

    // LITERALS
    for (let j = litStart; j < litEnd; j++) out.push(block[j])

    // MATCH_OFFSET (only if there is a match)
    if (matchLen > 0) {
      out.push(matchOffset & 0xff, (matchOffset >> 8) & 0xff)

      // EXTRA_MATCH
      if (matchExtra >= MAX_MATCH_NIBBLE) {
        let rem = matchExtra - MAX_MATCH_NIBBLE
        while (rem >= 255) {
          out.push(255)
          rem -= 255
        }
        out.push(rem)
      }
    }

    litStart = litEnd + matchLen
  }

  while (i + MIN_MATCH <= n) {
    const h = hash4(block[i], block[i + 1], block[i + 2], block[i + 3]) & (HASH_SIZE - 1)
    const candidate = hashTable[h]
    hashTable[h] = i

    if (
      candidate >= 0 &&
      i - candidate < BLOCK_SIZE &&
      block[candidate] === block[i] &&
      block[candidate + 1] === block[i + 1] &&
      block[candidate + 2] === block[i + 2] &&
      block[candidate + 3] === block[i + 3]
    ) {
      // Measure full match length
      let mLen = MIN_MATCH
      while (mLen < 0x7fff && i + mLen < n && block[candidate + mLen] === block[i + mLen]) {
        mLen++
      }

      const offset = i - candidate
      emitSequence(i, offset, mLen)
      i = litStart
    } else {
      i++
    }
  }

  // Emit final sequence (remaining literals, no match)
  if (litStart < n) {
    const litLen = n - litStart
    const litNibble = Math.min(litLen, MAX_LIT_NIBBLE)
    out.push(litNibble << 4) // matchNibble = 0, but no match follows

    if (litLen >= MAX_LIT_NIBBLE) {
      let rem = litLen - MAX_LIT_NIBBLE
      while (rem >= 255) {
        out.push(255)
        rem -= 255
      }
      out.push(rem)
    }

    for (let j = litStart; j < n; j++) out.push(block[j])
    // No MATCH_OFFSET for last sequence
  }

  return out
}

// ─── Decode a single block from compressed bytes ──────────────────────────────

function decodeBlock(
  compressed: Uint8Array | Buffer,
  pos: number,
  originalSize: number,
  history: Buffer,
  histPos: number,
): { out: Buffer; histPos: number; readPos: number } {
  const out = Buffer.allocUnsafe(originalSize)
  let outPos = 0

  while (outPos < originalSize) {
    if (pos >= compressed.length) break

    const token = compressed[pos++]
    let litLen = token >> 4
    const matchNibble = token & 0xf

    // EXTRA_LIT
    if (litLen === MAX_LIT_NIBBLE) {
      let extra: number
      do {
        if (pos >= compressed.length) break
        extra = compressed[pos++]
        litLen += extra
      } while (extra === 255)
    }

    // LITERALS
    for (let j = 0; j < litLen && outPos < originalSize && pos < compressed.length; j++) {
      const b = compressed[pos++]
      out[outPos++] = b
      history[histPos] = b
      histPos = (histPos + 1) & 0xffff
    }

    if (outPos >= originalSize) break

    // MATCH_OFFSET (2 bytes LE)
    if (pos + 1 >= compressed.length) break
    const offsetLo = compressed[pos++]
    const offsetHi = compressed[pos++]
    const matchOffset = offsetLo | (offsetHi << 8)

    if (matchOffset === 0) break // end marker

    // EXTRA_MATCH
    let matchLen = matchNibble + MIN_MATCH
    if (matchNibble === MAX_MATCH_NIBBLE) {
      let extra: number
      do {
        if (pos >= compressed.length) break
        extra = compressed[pos++]
        matchLen += extra
      } while (extra === 255)
    }

    // Copy from history
    for (let j = 0; j < matchLen && outPos < originalSize; j++) {
      const srcPos = (histPos - matchOffset + 0x10000) & 0xffff
      const b = history[srcPos]
      out[outPos++] = b
      history[histPos] = b
      histPos = (histPos + 1) & 0xffff
    }
  }

  return { out: out.subarray(0, outPos), histPos, readPos: pos }
}

// ─── Codec ────────────────────────────────────────────────────────────────────

interface Lz4pixState extends StreamCodecState {
  history: Buffer
  histPos: number
  compressed: Buffer
}

export const lz4pixCodec = ({
  id: 20,
  name: 'lz4pix',

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    // Compress each block to get exact total size, pad by 1 pixel
    let totalCompressed = 0
    let inputPos = 0
    while (inputPos < input.length) {
      const blockEnd = Math.min(inputPos + BLOCK_SIZE, input.length)
      const block = input.subarray(inputPos, blockEnd)
      totalCompressed += 4 + encodeBlock(Buffer.from(block)).length
      inputPos = blockEnd
    }
    return Math.ceil(totalCompressed / channels) + 1
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    if (input.length === 0) return pixels

    let pixelPos = 0
    let inputPos = 0

    while (inputPos < input.length) {
      const blockEnd = Math.min(inputPos + BLOCK_SIZE, input.length)
      const block = input.subarray(inputPos, blockEnd)
      const blockSize = block.length

      // Write 4-byte LE original block size header
      if (pixelPos + 4 <= pixels.length) {
        pixels[pixelPos++] = blockSize & 0xff
        pixels[pixelPos++] = (blockSize >> 8) & 0xff
        pixels[pixelPos++] = (blockSize >> 16) & 0xff
        pixels[pixelPos++] = (blockSize >> 24) & 0xff
      }

      const compressed = encodeBlock(Buffer.from(block))
      for (let i = 0; i < compressed.length && pixelPos < pixels.length; i++) {
        pixels[pixelPos++] = compressed[i]
      }

      inputPos = blockEnd
    }

    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    if (length === 0) return Buffer.alloc(0)

    const history = Buffer.alloc(0x10000)
    let histPos = 0
    const chunks: Buffer[] = []
    let totalOut = 0
    let pos = 0

    while (totalOut < length && pos < pixels.length) {
      if (pos + 4 > pixels.length) break

      const blockSize =
        pixels[pos] | (pixels[pos + 1] << 8) | (pixels[pos + 2] << 16) | (pixels[pos + 3] << 24)
      pos += 4

      if (blockSize <= 0 || blockSize > BLOCK_SIZE) break

      const { out, histPos: newHistPos, readPos } = decodeBlock(pixels, pos, Math.min(blockSize, length - totalOut), history, histPos)
      chunks.push(out)
      totalOut += out.length
      histPos = newHistPos
      pos = readPos
    }

    return Buffer.concat(chunks).subarray(0, length)
  },

  createDecodeState(): Lz4pixState {
    return {
      history: Buffer.alloc(0x10000),
      histPos: 0,
      compressed: Buffer.alloc(0),
    }
  },

  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState } {
    const s = state as Lz4pixState

    const combined = Buffer.concat([s.compressed, Buffer.from(pixelChunk)])
    const history = Buffer.from(s.history)
    let histPos = s.histPos

    const chunks: Buffer[] = []
    let pos = 0

    while (pos < combined.length) {
      // Need at least 4-byte block header
      if (pos + 4 > combined.length) break

      const blockSize =
        combined[pos] | (combined[pos + 1] << 8) | (combined[pos + 2] << 16) | (combined[pos + 3] << 24)

      if (blockSize <= 0 || blockSize > BLOCK_SIZE) break

      // We can't know exact compressed size without decoding, so attempt decode
      // and check if we consumed valid data. If we run out of compressed bytes
      // before producing blockSize bytes, re-buffer and wait for more.
      const headerPos = pos
      pos += 4

      // Try to decode — pass blockSize as target
      const before = pos
      const { out, histPos: newHistPos, readPos } = decodeBlock(combined, pos, blockSize, history, histPos)

      if (out.length < blockSize && readPos >= combined.length) {
        // Incomplete block — re-buffer from block header
        pos = headerPos
        break
      }

      chunks.push(out)
      histPos = newHistPos
      pos = readPos
    }

    const remainder = combined.subarray(pos)

    const newState: Lz4pixState = {
      history,
      histPos,
      compressed: Buffer.from(remainder),
    }

    return { bytes: Buffer.concat(chunks), state: newState }
  },
}) satisfies StreamingCodec
