import type { Codec, PixelBuffer, StreamCodecState, StreamingCodec } from '../types'

// RLE + Delta hybrid codec.
// Two packet types:
//
// Literal packet: header byte (count-1) with bit7=0 → 0x00–0x7E (count 1–127)
//   followed by `count` raw bytes.
//
// Delta-run packet: header byte 0x80|(count-1) → 0x80–0xFF (count 1–128)
//   followed by start_byte and delta byte.
//   Produces: start_byte, start_byte+delta, start_byte+2*delta, ... (all mod 256).
//   delta=0 → constant run; delta≠0 → arithmetic sequence.
//
// Encoding: scan for delta runs of ≥4 bytes first; otherwise accumulate literals.

// ─── Encoding helpers ────────────────────────────────────────────────────────

function measureDeltaRun(input: Buffer, pos: number): number {
  if (pos + 1 >= input.length) return 1
  const delta = (input[pos + 1] - input[pos] + 256) & 0xff
  let count = 2
  while (count < 128 && pos + count < input.length) {
    const expected = (input[pos] + delta * count) & 0xff
    if (input[pos + count] !== expected) break
    count++
  }
  return count
}

function compressToBytes(input: Buffer): number[] {
  const out: number[] = []
  let i = 0

  while (i < input.length) {
    const runLen = measureDeltaRun(input, i)

    if (runLen >= 4) {
      // Emit delta-run packet
      const delta = (input[i + 1] - input[i] + 256) & 0xff
      out.push(0x80 | (runLen - 1), input[i], delta)
      i += runLen
      continue
    }

    // Accumulate literal bytes until a long enough delta run starts
    let litEnd = i + 1
    while (litEnd < input.length && litEnd - i < 127) {
      if (measureDeltaRun(input, litEnd) >= 4) break
      litEnd++
    }

    const litCount = litEnd - i
    out.push(litCount - 1)
    for (let j = i; j < litEnd; j++) out.push(input[j])
    i = litEnd
  }

  return out
}

// ─── Streaming decode state ───────────────────────────────────────────────────

type PacketPhase = 'header' | 'literal-body' | 'delta-start' | 'delta-delta'

interface RledpixState extends StreamCodecState {
  // Bytes waiting to be processed
  buf: number[]
  // How many output bytes have been produced so far
  outCount: number
  // Current packet phase
  phase: PacketPhase
  // Bytes remaining in current packet (literal body count)
  remaining: number
  // For delta packets: start byte
  deltaStart: number
  // For delta packets: delta value
  deltaDelta: number
  // How many delta bytes already emitted for current run
  deltaEmitted: number
  // Total count for current delta run
  deltaTotal: number
}

// Decode as many complete packets as possible from a flat byte array.
// Writes output into `outArr`, respects `limit` (total bytes to produce).
// Returns updated read position.
function decodePackets(
  compressed: number[],
  readPos: number,
  outArr: number[],
  limit: number,
  phaseState: {
    phase: PacketPhase
    remaining: number
    deltaStart: number
    deltaDelta: number
    deltaEmitted: number
    deltaTotal: number
  },
): number {
  const ps = phaseState

  while (outArr.length < limit && readPos < compressed.length) {
    if (ps.phase === 'header') {
      const hdr = compressed[readPos++]
      if (hdr & 0x80) {
        // Delta run packet
        ps.deltaTotal = (hdr & 0x7f) + 1
        ps.deltaEmitted = 0
        ps.phase = 'delta-start'
      } else {
        // Literal packet
        ps.remaining = (hdr & 0x7f) + 1
        ps.phase = 'literal-body'
      }
      continue
    }

    if (ps.phase === 'literal-body') {
      while (ps.remaining > 0 && outArr.length < limit && readPos < compressed.length) {
        outArr.push(compressed[readPos++])
        ps.remaining--
      }
      if (ps.remaining === 0) ps.phase = 'header'
      continue
    }

    if (ps.phase === 'delta-start') {
      if (readPos >= compressed.length) break
      ps.deltaStart = compressed[readPos++]
      ps.phase = 'delta-delta'
      continue
    }

    if (ps.phase === 'delta-delta') {
      if (readPos >= compressed.length) break
      ps.deltaDelta = compressed[readPos++]
      // Emit all bytes for this delta run
      while (ps.deltaEmitted < ps.deltaTotal && outArr.length < limit) {
        outArr.push((ps.deltaStart + ps.deltaDelta * ps.deltaEmitted) & 0xff)
        ps.deltaEmitted++
      }
      if (ps.deltaEmitted >= ps.deltaTotal) ps.phase = 'header'
      continue
    }
  }

  return readPos
}

// ─── Codec implementation ─────────────────────────────────────────────────────

export const rledpixCodec = ({
  id: 16,
  name: 'rledpix',

  estimateDataPixels(input: Buffer, channels = 3): number {
    return Math.ceil((input.length * 1.05) / channels) + 16
  },

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const compressed = compressToBytes(input)
    const pixels = new Uint8Array(dataPixelCount * channels)
    const copyLen = Math.min(compressed.length, pixels.length)
    for (let i = 0; i < copyLen; i++) pixels[i] = compressed[i]
    return pixels
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, _channels = 3): Buffer {
    const out: number[] = []
    const compressed = Array.from(pixels)
    const ps = {
      phase: 'header' as PacketPhase,
      remaining: 0,
      deltaStart: 0,
      deltaDelta: 0,
      deltaEmitted: 0,
      deltaTotal: 0,
    }
    decodePackets(compressed, 0, out, length, ps)
    return Buffer.from(out.slice(0, length))
  },

  createDecodeState(): RledpixState {
    return {
      buf: [],
      outCount: 0,
      phase: 'header',
      remaining: 0,
      deltaStart: 0,
      deltaDelta: 0,
      deltaEmitted: 0,
      deltaTotal: 0,
    }
  },

  decodeChunk(
    pixelChunk: PixelBuffer,
    state: StreamCodecState,
  ): { bytes: Buffer; state: StreamCodecState } {
    const s = state as RledpixState

    // Append new bytes to the buffer
    const buf = s.buf.concat(Array.from(pixelChunk))

    const outArr: number[] = []
    const ps = {
      phase: s.phase,
      remaining: s.remaining,
      deltaStart: s.deltaStart,
      deltaDelta: s.deltaDelta,
      deltaEmitted: s.deltaEmitted,
      deltaTotal: s.deltaTotal,
    }

    const newReadPos = decodePackets(buf, 0, outArr, Infinity, ps)

    const newState: RledpixState = {
      buf: buf.slice(newReadPos),
      outCount: s.outCount + outArr.length,
      phase: ps.phase,
      remaining: ps.remaining,
      deltaStart: ps.deltaStart,
      deltaDelta: ps.deltaDelta,
      deltaEmitted: ps.deltaEmitted,
      deltaTotal: ps.deltaTotal,
    }

    return { bytes: Buffer.from(outArr), state: newState }
  },
}) satisfies StreamingCodec
