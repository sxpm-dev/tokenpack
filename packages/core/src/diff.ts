import path from 'path'

import { decodeToBuffer } from './decoder'
import { HEADER_PIXELS, readHeader } from './header'
import { PngSurface } from './surfaces/png-surface'
import { surfaceRegistry } from './surfaces/registry'

function surfaceFor(filePath: string) {
  return surfaceRegistry.byExtension(path.extname(filePath))
}

// ── Visual pixel diff ─────────────────────────────────────────────────────────

export async function diffTokens(
  pathA: string,
  pathB: string,
  outPath: string,
): Promise<DiffStats> {
  const a = await surfaceFor(pathA).readFile(pathA)
  const b = await surfaceFor(pathB).readFile(pathB)

  const headerA = readHeader(a.pixels)
  const headerB = readHeader(b.pixels)

  const width = Math.max(a.width, b.width)
  const height = Math.max(a.height, b.height)
  const size = width * height * 3

  const pa = padPixels(a.pixels, size)
  const pb = padPixels(b.pixels, size)
  const out = new Uint8Array(size)
  let changed = 0,
    total = 0

  for (let i = HEADER_PIXELS * 3; i < size; i += 3) {
    const delta =
      Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2])

    total++
    if (delta === 0) {
      out[i] = 20
      out[i + 1] = 20
      out[i + 2] = 20
    } else {
      changed++
      const intensity = Math.min(255, delta)

      if (intensity < 80) {
        out[i] = 0
        out[i + 1] = 80
        out[i + 2] = intensity * 3
      } else if (intensity < 200) {
        out[i] = intensity
        out[i + 1] = intensity / 2
        out[i + 2] = 0
      } else {
        out[i] = 255
        out[i + 1] = intensity / 4
        out[i + 2] = intensity / 4
      }
    }
  }

  PngSurface.encodeSync(outPath, { pixels: out, width, height, fileChannels: 3 })

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

// ── Line-level text diff ──────────────────────────────────────────────────────

export interface FileDiff {
  filePath: string
  hunks: Hunk[]
  added: number
  removed: number
}

export interface Hunk {
  lineA: number
  lineB: number
  lines: { type: '+' | '-' | ' '; text: string }[]
}

export async function diffText(pathA: string, pathB: string): Promise<FileDiff[]> {
  const dataA = await decodeToBuffer(pathA)
  const dataB = await decodeToBuffer(pathB)

  const isCartA = dataA.readUInt32BE(0) === 0x43415254 // 'CART'
  const isCartB = dataB.readUInt32BE(0) === 0x43415254

  if (isCartA && isCartB) {
    return diffArchives(dataA, dataB)
  }

  // Single file diff
  const linesA = dataA.toString('utf8').split('\n')
  const linesB = dataB.toString('utf8').split('\n')
  const hunks = computeHunks(linesA, linesB)

  if (!hunks.length) return []
  const { added, removed } = countChanges(hunks)

  return [{ filePath: '(file)', hunks, added, removed }]
}

function diffArchives(dataA: Buffer, dataB: Buffer): FileDiff[] {
  const filesA = parseArchive(dataA)
  const filesB = parseArchive(dataB)

  const allPaths = new Set([...Object.keys(filesA), ...Object.keys(filesB)])
  const results: FileDiff[] = []

  for (const filePath of [...allPaths].sort()) {
    const a = filesA[filePath]
    const b = filesB[filePath]

    if (!a) {
      results.push({
        filePath,
        hunks: [{ lineA: 0, lineB: 1, lines: [{ type: '+', text: '(new file)' }] }],
        added: 1,
        removed: 0,
      })
      continue
    }
    if (!b) {
      results.push({
        filePath,
        hunks: [{ lineA: 1, lineB: 0, lines: [{ type: '-', text: '(deleted)' }] }],
        added: 0,
        removed: 1,
      })
      continue
    }

    const strA = a.toString('utf8')
    const strB = b.toString('utf8')

    if (strA === strB) continue

    const linesA = strA.split('\n')
    const linesB = strB.split('\n')
    const hunks = computeHunks(linesA, linesB)
    const { added, removed } = countChanges(hunks)

    results.push({ filePath, hunks, added, removed })
  }

  return results
}

function parseArchive(data: Buffer): Record<string, Buffer> {
  const files: Record<string, Buffer> = {}
  const fileCount = data.readUInt32BE(4)
  let offset = 8

  for (let i = 0; i < fileCount; i++) {
    const pathLen = data.readUInt16BE(offset)

    offset += 2
    const filePath = data.slice(offset, offset + pathLen).toString('utf8')

    offset += pathLen
    const contentLen = data.readUInt32BE(offset)

    offset += 4
    files[filePath] = data.slice(offset, offset + contentLen)
    offset += contentLen
  }

  return files
}

function countChanges(hunks: Hunk[]): { added: number; removed: number } {
  let added = 0,
    removed = 0

  for (const h of hunks)
    for (const l of h.lines) {
      if (l.type === '+') added++
      else if (l.type === '-') removed++
    }

  return { added, removed }
}

// Simple LCS-based line diff
function lcs(a: string[], b: string[]): boolean[][] {
  const m = a.length,
    n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])

  const inLCS: boolean[][] = Array.from({ length: m }, () => new Array(n).fill(false))
  let i = m,
    j = n

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      inLCS[i - 1][j - 1] = true
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) i--
    else j--
  }

  return inLCS
}

const CONTEXT = 3

function computeHunks(a: string[], b: string[]): Hunk[] {
  const match = lcs(a, b)
  const ops: { type: '+' | '-' | ' '; text: string; lineA: number; lineB: number }[] = []

  let i = 0,
    j = 0

  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && match[i]?.[j]) {
      ops.push({ type: ' ', text: a[i], lineA: i + 1, lineB: j + 1 })
      i++
      j++
    } else if (j < b.length && (i >= a.length || !match[i]?.[j])) {
      ops.push({ type: '+', text: b[j], lineA: i + 1, lineB: j + 1 })
      j++
    } else {
      ops.push({ type: '-', text: a[i], lineA: i + 1, lineB: i + 1 })
      i++
    }
  }

  const changed: number[] = []

  for (let idx = 0; idx < ops.length; idx++) if (ops[idx].type !== ' ') changed.push(idx)
  if (!changed.length) return []

  const ranges: [number, number][] = []
  let start = Math.max(0, changed[0] - CONTEXT)
  let end = Math.min(ops.length - 1, changed[0] + CONTEXT)

  for (let k = 1; k < changed.length; k++) {
    const next = Math.min(ops.length - 1, changed[k] + CONTEXT)

    if (changed[k] - CONTEXT <= end + 1) {
      end = next
    } else {
      ranges.push([start, end])
      start = Math.max(0, changed[k] - CONTEXT)
      end = next
    }
  }
  ranges.push([start, end])

  return ranges.map(([s, e]) => {
    const lines = ops.slice(s, e + 1)

    return {
      lineA: ops[s].lineA,
      lineB: ops[s].lineB,
      lines: lines.map(o => ({ type: o.type, text: o.text })),
    }
  })
}

function padPixels(pixels: Uint8Array, targetSize: number): Uint8Array {
  if (pixels.length >= targetSize) return pixels
  const padded = new Uint8Array(targetSize)

  padded.set(pixels)

  return padded
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
