import type { Codec, PixelBuffer } from './types.js'

interface KeywordEntry {
  id: number
  text: string
  color: [number, number, number]
  pixels: number
}

const KEYWORDS: KeywordEntry[] = [
  { id: 1, text: 'function', color: [255,  32,  64], pixels: 4 },
  { id: 2, text: 'const',    color: [255,  96,  96], pixels: 1 },
  { id: 3, text: 'var',      color: [255, 128, 128], pixels: 1 },
  { id: 4, text: 'let',      color: [255, 160, 160], pixels: 1 },
  { id: 5, text: 'for',      color: [ 64, 160, 255], pixels: 1 },
  { id: 6, text: 'forEach',  color: [ 64, 160, 255], pixels: 4 },
  { id: 7, text: 'class',    color: [255, 144,  32], pixels: 4 },
  { id: 8, text: 'return',   color: [ 32, 255, 128], pixels: 1 },
]

const BY_ID = new Map(KEYWORDS.map(k => [k.id, k]))

// Longest-first so 'forEach' matches before 'for'
const SORTED = [...KEYWORDS].sort((a, b) => b.text.length - a.text.length)

function matchKeyword(src: Buffer, offset: number): KeywordEntry | null {
  for (const kw of SORTED) {
    if (src.slice(offset, offset + kw.text.length).toString() === kw.text) {
      const after = offset + kw.text.length
      const isBoundary = after >= src.length || !/\w/.test(String.fromCharCode(src[after]))
      if (isBoundary) return kw
    }
  }
  return null
}

export const semanticCodec: Codec = {
  id: 3,
  name: 'semantic',

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number): PixelBuffer {
    const out: number[] = []

    let i = 0
    while (i < input.length) {
      const kw = matchKeyword(input, i)
      if (kw) {
        out.push(kw.id, 0, 0)
        for (let p = 0; p < kw.pixels; p++) out.push(...kw.color)
        i += kw.text.length
      } else {
        out.push(0, 0, 0)
        for (let p = 0; p < 3; p++) {
          for (let c = 0; c < 3; c++) {
            out.push(i < input.length ? input[i++] : 0)
          }
        }
      }
    }

    const pixels = new Uint8Array(dataPixelCount * 3)
    for (let j = 0; j < Math.min(out.length, pixels.length); j++) pixels[j] = out[j]
    return pixels
  },

  estimateDataPixels(input: Buffer): number {
    let pixels = 0
    let i = 0
    while (i < input.length) {
      const kw = matchKeyword(input, i)
      if (kw) {
        pixels += 1 + kw.pixels
        i += kw.text.length
      } else {
        pixels += 4  // 1 prefix + 3 data pixels (holds 9 bytes)
        i = Math.min(i + 9, input.length)
      }
    }
    return pixels + 1  // +1 safety margin
  },

  decode(pixels: PixelBuffer, length: number, _w: number, _h: number): Buffer {
    const out: number[] = []
    let i = 0

    while (out.length < length && i + 3 <= pixels.length) {
      const prefixR = pixels[i]
      const prefixG = pixels[i + 1]
      const prefixB = pixels[i + 2]
      i += 3

      if (prefixR === 0 && prefixG === 0 && prefixB === 0) {
        for (let p = 0; p < 3 && out.length < length; p++) {
          for (let c = 0; c < 3 && out.length < length; c++) {
            if (i < pixels.length) out.push(pixels[i++])
            else i++
          }
        }
      } else {
        const kw = BY_ID.get(prefixR)
        if (!kw) throw new Error(`Unknown keyword id: ${prefixR}`)
        i += kw.pixels * 3
        for (const ch of kw.text) out.push(ch.charCodeAt(0))
      }
    }

    return Buffer.from(out.slice(0, length))
  },
}
