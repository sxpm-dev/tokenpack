import { readPNG, writePNG } from './image.js'
import { readHeader, HEADER_PIXELS } from './header.js'

export function diffTokens(pathA: string, pathB: string, outPath: string): DiffStats {
  const a = readPNG(pathA)
  const b = readPNG(pathB)

  const headerA = readHeader(a.pixels)
  const headerB = readHeader(b.pixels)

  if (headerA.algorithmId !== headerB.algorithmId) {
    throw new Error(`Codec mismatch: ${headerA.algorithmId} vs ${headerB.algorithmId} — tokens must use the same codec`)
  }

  // Work on the larger of the two (pad the smaller with zeros)
  const width  = Math.max(a.width,  b.width)
  const height = Math.max(a.height, b.height)
  const size   = width * height * 3

  const pa = padPixels(a.pixels, size)
  const pb = padPixels(b.pixels, size)

  const out    = new Uint8Array(size)
  let changed  = 0
  let total    = 0

  for (let i = HEADER_PIXELS * 3; i < size; i += 3) {
    const dr = Math.abs(pa[i]     - pb[i])
    const dg = Math.abs(pa[i + 1] - pb[i + 1])
    const db = Math.abs(pa[i + 2] - pb[i + 2])
    const delta = dr + dg + db

    total++

    if (delta === 0) {
      // Unchanged — dim grey so structure is visible
      out[i] = 20; out[i + 1] = 20; out[i + 2] = 20
    } else {
      changed++
      // Encode delta as color:
      // small change  → blue
      // medium change → orange
      // large change  → red/white (full replacement)
      const intensity = Math.min(255, delta)
      if (intensity < 80) {
        out[i] = 0; out[i + 1] = 80; out[i + 2] = intensity * 3
      } else if (intensity < 200) {
        out[i] = intensity; out[i + 1] = intensity / 2; out[i + 2] = 0
      } else {
        out[i] = 255; out[i + 1] = intensity / 4; out[i + 2] = intensity / 4
      }
    }
  }

  writePNG(outPath, out, width, height)

  return {
    totalPixels: total,
    changedPixels: changed,
    unchangedPixels: total - changed,
    changedBytes: changed * 3,
    changePercent: ((changed / total) * 100).toFixed(2),
    sizeA: headerA.fileLength,
    sizeB: headerB.fileLength,
  }
}

function padPixels(pixels: Uint8Array, targetSize: number): Uint8Array {
  if (pixels.length >= targetSize) return pixels
  const padded = new Uint8Array(targetSize)
  padded.set(pixels)
  return padded
}

export interface ByteDiff {
  offset: number
  before: number
  after: number
  char: string
}

export function diffBytes(pathA: string, pathB: string): { diffs: ByteDiff[]; stats: DiffStats } {
  const a = readPNG(pathA)
  const b = readPNG(pathB)

  const headerA = readHeader(a.pixels)
  const headerB = readHeader(b.pixels)

  const dataA = a.pixels.slice(HEADER_PIXELS * 3, HEADER_PIXELS * 3 + headerA.fileLength)
  const dataB = b.pixels.slice(HEADER_PIXELS * 3, HEADER_PIXELS * 3 + headerB.fileLength)

  const maxLen = Math.max(dataA.length, dataB.length)
  const diffs: ByteDiff[] = []

  for (let i = 0; i < maxLen; i++) {
    const before = i < dataA.length ? dataA[i] : 0
    const after  = i < dataB.length ? dataB[i] : 0
    if (before !== after) {
      const charBefore = before >= 32 && before < 127 ? String.fromCharCode(before) : '·'
      const charAfter  = after  >= 32 && after  < 127 ? String.fromCharCode(after)  : '·'
      diffs.push({ offset: i, before, after, char: `${charBefore}→${charAfter}` })
    }
  }

  return {
    diffs,
    stats: {
      totalPixels: Math.ceil(maxLen / 3),
      changedPixels: Math.ceil(diffs.length / 3),
      unchangedPixels: Math.ceil((maxLen - diffs.length) / 3),
      changedBytes: diffs.length,
      changePercent: ((diffs.length / maxLen) * 100).toFixed(2),
      sizeA: headerA.fileLength,
      sizeB: headerB.fileLength,
    },
  }
}

export interface DiffStats {
  totalPixels: number
  changedPixels: number
  unchangedPixels: number
  changedBytes: number
  changePercent: string
  sizeA: number
  sizeB: number
}
