import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// LZSS codec with 4KB sliding window.
//
// Token format (control-byte based):
//   Control byte: 8 flag bits. Each bit 0=literal, 1=match.
//   After control byte: up to 8 items:
//     Literal: 1 raw byte.
//     Match:   2 bytes packed as uint16 LE:
//              bits 15–4 = offset (0–4095, relative to current window position)
//              bits  3–0 = length-3 (match length 3–18)
//
// Groups of 8 items emitted together; last group may be partial (control byte padded with 0).

const WINDOW_SIZE = 4096
const MIN_MATCH = 3
const MAX_MATCH = 18

// ─── Hash table helpers ───────────────────────────────────────────────────────

// Hash 3 bytes to a table index (chain hash for longest-match search)
function hash3(b0: number, b1: number, b2: number): number {
  return ((b0 * 31 + b1) * 31 + b2) & 0xfff // 4096 buckets
}

// ─── Encoding ─────────────────────────────────────────────────────────────────

function encodeToBytes(input: Buffer): number[] {
  const out: number[] = []
  const n = input.length

  // Hash table: for each 3-byte hash, store a chain of positions (last 4KB)
  // We use a simple head array (4096 entries) + next array (per position)
  const head = new Int32Array(WINDOW_SIZE).fill(-1)
  const next = new Int32Array(n).fill(-1)

  let i = 0

  // Accumulate up to 8 tokens, then emit control byte + items
  const groupTokens: Array<{ isMatch: boolean; offset?: number; matchLen?: number; literal?: number }> = []

  function flushGroup(): void {
    if (groupTokens.length === 0) return
    let ctrl = 0
    const items: number[] = []
    // Always emit 8 slots so the decoder can reliably determine group size from
    // the control byte alone. Absent trailing slots are padded as literal 0.
    for (let t = 0; t < 8; t++) {
      const tok = groupTokens[t]
      if (tok !== undefined && tok.isMatch) {
        ctrl |= 1 << t
        const packed = ((tok.offset! & 0xfff) << 4) | ((tok.matchLen! - MIN_MATCH) & 0xf)
        items.push(packed & 0xff, (packed >> 8) & 0xff)
      } else {
        // tok undefined means padding; literal zero emitted, bit stays 0 in ctrl
        items.push(tok !== undefined ? tok.literal! : 0)
      }
    }
    out.push(ctrl, ...items)
    groupTokens.length = 0
  }

  while (i < n) {
    // Try to find a match of length >= MIN_MATCH in the 4KB window
    let bestLen = 0
    let bestOffset = 0

    if (i + MIN_MATCH <= n) {
      const h = hash3(input[i], input[i + 1], input[i + 2])
      let candidate = head[h]
      let searchDepth = 0

      while (candidate >= 0 && i - candidate < WINDOW_SIZE && searchDepth < 64) {
        // Measure match length
        let mLen = 0
        while (
          mLen < MAX_MATCH &&
          i + mLen < n &&
          input[candidate + mLen] === input[i + mLen]
        ) {
          mLen++
        }
        if (mLen > bestLen) {
          bestLen = mLen
          bestOffset = i - candidate
        }
        candidate = next[candidate] ?? -1
        searchDepth++
      }
    }

    if (bestLen >= MIN_MATCH) {
      groupTokens.push({ isMatch: true, offset: bestOffset, matchLen: bestLen })
      // Insert all positions covered by the match into the hash table
      for (let j = 0; j < bestLen; j++) {
        if (i + j + 2 < n) {
          const hj = hash3(input[i + j], input[i + j + 1], input[i + j + 2])
          next[i + j] = head[hj]
          head[hj] = i + j
        }
      }
      i += bestLen
    } else {
      groupTokens.push({ isMatch: false, literal: input[i] })
      // Insert this position into hash table
      if (i + 2 < n) {
        const h = hash3(input[i], input[i + 1], input[i + 2])
        next[i] = head[h]
        head[h] = i
      }
      i++
    }

    if (groupTokens.length === 8) flushGroup()
  }
  flushGroup()
  return out
}

// ─── Decoding ─────────────────────────────────────────────────────────────────

function decodeFromBytes(
  compressed: Uint8Array | number[],
  startPos: number,
  length: number,
  window: Buffer,
  windowPos: number,
): { out: Buffer; windowPos: number; readPos: number } {
  const out: number[] = []
  let pos = startPos
  const buf = compressed

  while (out.length < length) {
    if (pos >= buf.length) break

    const ctrl = buf[pos++]

    for (let bit = 0; bit < 8 && out.length < length; bit++) {
      if (pos >= buf.length) break

      if ((ctrl >> bit) & 1) {
        // Match token: 2 bytes
        if (pos + 1 >= buf.length) break
        const lo = buf[pos++]
        const hi = buf[pos++]
        const packed = lo | (hi << 8)
        const offset = (packed >> 4) & 0xfff
        const matchLen = (packed & 0xf) + MIN_MATCH

        if (offset === 0) {
          // Zero offset = unused/padding, skip
          continue
        }

        // Copy from window
        for (let j = 0; j < matchLen && out.length < length; j++) {
          const srcPos = (windowPos - offset + WINDOW_SIZE) % WINDOW_SIZE
          const b = window[srcPos]
          out.push(b)
          window[windowPos] = b
          windowPos = (windowPos + 1) % WINDOW_SIZE
        }
      } else {
        // Literal token: 1 byte
        const b = buf[pos++]
        out.push(b)
        window[windowPos] = b
        windowPos = (windowPos + 1) % WINDOW_SIZE
      }
    }
  }

  return { out: Buffer.from(out.slice(0, length)), windowPos, readPos: pos }
}

// ─── Streaming decode state ───────────────────────────────────────────────────

// Per-group state machine phases:
//   'ctrl'         — waiting for control byte
//   'token'        — processing tokens within a group
//   'match-hi'     — have low byte of 2-byte match token, waiting for high byte
type LzsspixPhase = 'ctrl' | 'token' | 'match-hi'

interface LzsspixState extends StreamCodecState {
  window: Buffer
  windowPos: number
  buf: number[]         // bytes buffered but not yet consumed
  phase: LzsspixPhase
  ctrl: number          // current group control byte
  bit: number           // which bit (0–7) we are processing in current group
  matchLo: number       // low byte of a match token (waiting for hi byte)
}

export const lzsspixCodec = ({
  id: 19,
  name: 'lzsspix',

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    // Compress to get exact size, then pad by 1 pixel for safety
    const compressed = encodeToBytes(input)
    return Math.ceil(compressed.length / channels) + 1
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    if (input.length === 0) return pixels

    const compressed = encodeToBytes(input)
    const copyLen = Math.min(compressed.length, pixels.length)
    for (let i = 0; i < copyLen; i++) pixels[i] = compressed[i]
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    if (length === 0) return Buffer.alloc(0)
    const window = Buffer.alloc(WINDOW_SIZE)
    const { out } = decodeFromBytes(pixels, 0, length, window, 0)
    return out
  },

  createDecodeState(): LzsspixState {
    return {
      window: Buffer.alloc(WINDOW_SIZE),
      windowPos: 0,
      buf: [],
      phase: 'ctrl',
      ctrl: 0,
      bit: 0,
      matchLo: 0,
    }
  },

  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState } {
    const s = state as LzsspixState

    // Merge buffered bytes with incoming chunk
    const incoming = Array.from(pixelChunk)
    const buf = s.buf.concat(incoming)

    const window = Buffer.from(s.window)
    let windowPos = s.windowPos

    const outBytes: number[] = []
    let pos = 0
    let phase = s.phase
    let ctrl = s.ctrl
    let bit = s.bit
    let matchLo = s.matchLo

    outer: while (true) {
      // Resume 'match-hi' if we stalled mid-match-token
      if (phase === 'match-hi') {
        if (pos >= buf.length) break
        const hi = buf[pos++]
        const packed = matchLo | (hi << 8)
        const offset = (packed >> 4) & 0xfff
        const matchLen = (packed & 0xf) + MIN_MATCH
        if (offset !== 0) {
          for (let j = 0; j < matchLen; j++) {
            const srcPos = (windowPos - offset + WINDOW_SIZE) % WINDOW_SIZE
            const b = window[srcPos]
            outBytes.push(b)
            window[windowPos] = b
            windowPos = (windowPos + 1) % WINDOW_SIZE
          }
        }
        phase = 'token'
        bit++
      }

      if (phase === 'ctrl') {
        if (pos >= buf.length) break
        ctrl = buf[pos++]
        bit = 0
        phase = 'token'
      }

      // Process tokens within the group
      while (phase === 'token' && bit < 8) {
        if ((ctrl >> bit) & 1) {
          // Match token: needs 2 bytes
          if (pos >= buf.length) break outer
          matchLo = buf[pos++]
          phase = 'match-hi'
          if (pos >= buf.length) break outer
          // Have both bytes — process immediately
          const hi = buf[pos++]
          const packed = matchLo | (hi << 8)
          const offset = (packed >> 4) & 0xfff
          const matchLen = (packed & 0xf) + MIN_MATCH
          if (offset !== 0) {
            for (let j = 0; j < matchLen; j++) {
              const srcPos = (windowPos - offset + WINDOW_SIZE) % WINDOW_SIZE
              const b = window[srcPos]
              outBytes.push(b)
              window[windowPos] = b
              windowPos = (windowPos + 1) % WINDOW_SIZE
            }
          }
          phase = 'token'
        } else {
          // Literal token
          if (pos >= buf.length) break outer
          const b = buf[pos++]
          outBytes.push(b)
          window[windowPos] = b
          windowPos = (windowPos + 1) % WINDOW_SIZE
        }
        bit++
      }

      if (bit >= 8) {
        phase = 'ctrl'
      }

      if (pos >= buf.length) break
    }

    const newState: LzsspixState = {
      window,
      windowPos,
      buf: buf.slice(pos),
      phase,
      ctrl,
      bit,
      matchLo,
    }

    return { bytes: Buffer.from(outBytes), state: newState }
  },
}) satisfies StreamingCodec
