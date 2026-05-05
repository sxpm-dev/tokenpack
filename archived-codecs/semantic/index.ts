import type { Codec, PixelBuffer } from '../types'

interface KeywordEntry {
  id: number
  text: string
  color: [number, number, number]
  pixels: number
}

const KEYWORDS: KeywordEntry[] = [
  { id: 1, text: 'function', color: [255, 32, 64],   pixels: 4 },
  { id: 2, text: 'const',    color: [255, 96, 96],   pixels: 2 },
  { id: 3, text: 'var',      color: [255, 128, 128], pixels: 2 },
  { id: 4, text: 'let',      color: [255, 160, 160], pixels: 2 },
  { id: 5, text: 'for',      color: [64, 160, 255],  pixels: 2 },
  { id: 6, text: 'forEach',  color: [64, 160, 255],  pixels: 4 },
  { id: 7, text: 'class',    color: [255, 144, 32],  pixels: 4 },
  { id: 8, text: 'return',   color: [32, 255, 128],  pixels: 2 },
]

const BY_ID = new Map(KEYWORDS.map(k => [k.id, k]))
const SORTED = [...KEYWORDS].sort((a, b) => b.text.length - a.text.length)

function matchKeyword(src: Buffer, offset: number): KeywordEntry | null {
  for (const kw of SORTED) {
    if (src.slice(offset, offset + kw.text.length).toString() === kw.text) {
      const after = offset + kw.text.length
      if (after >= src.length || !/\w/.test(String.fromCharCode(src[after]))) return kw
    }
  }
  return null
}

// Count how many bytes we can consume as raw before hitting the next keyword.
// Cap at maxBytes. Stops at the first keyword boundary so no keyword is
// accidentally absorbed into a raw chunk.
function rawByteCount(src: Buffer, offset: number, maxBytes: number): number {
  let count = 0
  while (count < maxBytes && offset + count < src.length) {
    if (count > 0 && matchKeyword(src, offset + count) !== null) break
    count++
  }
  return Math.max(1, count)
}

export const semanticCodec: Codec = {
  id: 3,
  name: 'semantic',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)
    const maxChunk = 3 * channels
    let pos = 0
    let i = 0

    while (i < input.length && pos < pixels.length) {
      const kw = matchKeyword(input, i)
      if (kw) {
        pixels[pos] = kw.id
        pos += channels
        for (let p = 0; p < kw.pixels && pos + 2 < pixels.length; p++) {
          pixels[pos] = kw.color[0]
          pixels[pos + 1] = kw.color[1]
          pixels[pos + 2] = kw.color[2]
          pos += channels
        }
        i += kw.text.length
      } else {
        const count = rawByteCount(input, i, maxChunk)
        // prefix pixel: R=0 (raw), G=byteCount, B=0
        pixels[pos + 1] = count
        pos += channels
        for (let b = 0; b < maxChunk; b++) {
          if (pos < pixels.length) pixels[pos++] = b < count ? input[i++] : 0
        }
      }
    }

    return pixels
  },

  estimateDataPixels(input: Buffer, channels = 3): number {
    const maxChunk = 3 * channels
    let pixelCount = 0
    let i = 0
    while (i < input.length) {
      const kw = matchKeyword(input, i)
      if (kw) {
        pixelCount += 1 + kw.pixels
        i += kw.text.length
      } else {
        const count = rawByteCount(input, i, maxChunk)
        pixelCount += 4 // 1 prefix + 3 data pixels
        i += count
      }
    }
    return pixelCount + 1
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number, channels = 3): Buffer {
    const output = Buffer.allocUnsafe(length)
    const maxChunk = 3 * channels
    let outPos = 0
    let i = 0

    while (outPos < length && i + channels <= pixels.length) {
      const prefixR = pixels[i]
      const prefixG = pixels[i + 1]
      i += channels

      if (prefixR === 0) {
        // prefixG = byteCount (0 = legacy full chunk = maxChunk bytes)
        const count = prefixG === 0 ? maxChunk : prefixG
        let read = 0
        for (let b = 0; b < maxChunk; b++) {
          const val = i < pixels.length ? pixels[i++] : 0
          if (read < count && outPos < length) output[outPos++] = val
          read++
        }
      } else {
        const kw = BY_ID.get(prefixR)
        if (!kw) throw new Error(`Unknown keyword id: ${prefixR}`)
        i += kw.pixels * channels
        for (const ch of kw.text) if (outPos < length) output[outPos++] = ch.charCodeAt(0)
      }
    }

    return output
  },
}
