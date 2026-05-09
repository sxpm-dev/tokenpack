// Diff compute primitives — env-neutral.
//
// `computeTextDiff(packA, packB)` runs a line-level diff across files in two
// Pack objects. `renderHeatmap(bytesA, bytesB)` renders a pixel-delta PNG
// heatmap by surface-decoding both inputs and comparing channels.
//
// Env packages (`@tokenpack/node`, `@tokenpack/browser`) expose a higher-level
// `diff(sourceA, sourceB)` that loads sources (URLs/Blobs/file paths) and
// delegates here. The compute functions don't touch fs / fetch / canvas.

import type { Pack } from './pack/types'
import { surfaceRegistry } from './surfaces/registry'

const HEADER_PIXELS = 32

export interface DiffStats {
  totalPixels: number
  changedPixels: number
  unchangedPixels: number
  changedBytes: number
  changePercent: string
  sizeA: number
  sizeB: number
}

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

export async function computeTextDiff(packA: Pack, packB: Pack): Promise<FileDiff[]> {
  const out: FileDiff[] = []

  if (packA.isPack() && packB.isPack()) {
    const listA = new Set(packA.list)
    const listB = new Set(packB.list)
    const allPaths = new Set([...listA, ...listB])

    for (const filePath of allPaths) {
      const textA = listA.has(filePath) ? await packA.text(filePath).catch(() => null) : null
      const textB = listB.has(filePath) ? await packB.text(filePath).catch(() => null) : null
      const fd = lineDiff(filePath, textA, textB)

      if (fd.hunks.length > 0) out.push(fd)
    }

    return out
  }

  const textA =
    !packA.isPack() && !packA.isDiff() ? await packA.text().catch(() => null) : null
  const textB =
    !packB.isPack() && !packB.isDiff() ? await packB.text().catch(() => null) : null

  return [lineDiff('(file)', textA, textB)].filter(fd => fd.hunks.length > 0)
}

function lineDiff(filePath: string, a: string | null, b: string | null): FileDiff {
  const linesA = (a ?? '').split('\n')
  const linesB = (b ?? '').split('\n')
  const hunks: Hunk[] = []
  let added = 0
  let removed = 0
  const max = Math.max(linesA.length, linesB.length)
  const lines: Hunk['lines'] = []
  let firstChangeA = -1

  for (let i = 0; i < max; i++) {
    const la = linesA[i] ?? null
    const lb = linesB[i] ?? null

    if (la === lb) {
      if (lines.length > 0) {
        hunks.push({ lineA: firstChangeA + 1, lineB: firstChangeA + 1, lines: lines.slice() })
        lines.length = 0
        firstChangeA = -1
      }
      continue
    }
    if (firstChangeA === -1) firstChangeA = i
    if (la !== null && (lb === null || la !== lb)) {
      lines.push({ type: '-', text: la })
      removed++
    }
    if (lb !== null && (la === null || la !== lb)) {
      lines.push({ type: '+', text: lb })
      added++
    }
  }
  if (lines.length > 0) {
    hunks.push({ lineA: firstChangeA + 1, lineB: firstChangeA + 1, lines })
  }

  return { filePath, hunks, added, removed }
}

function padPixels(pixels: Uint8Array, target: number): Uint8Array {
  if (pixels.length >= target) return pixels
  const out = new Uint8Array(target)

  out.set(pixels, 0)

  return out
}

export async function renderHeatmap(
  bytesA: Buffer,
  bytesB: Buffer,
): Promise<{ stats: DiffStats; bytes: Buffer }> {
  const surface = surfaceRegistry.byFormat('png')
  const a = await surface.readBuffer(bytesA)
  const b = await surface.readBuffer(bytesB)

  const width = Math.max(a.width, b.width)
  const height = Math.max(a.height, b.height)
  const size = width * height * 3
  const pa = padPixels(a.pixels, size)
  const pb = padPixels(b.pixels, size)
  const out = new Uint8Array(size)
  let changed = 0
  let total = 0

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

  const heatmapBytes = await surface.writeBuffer({
    pixels: out,
    width,
    height,
    fileChannels: 3,
  })

  return {
    stats: {
      totalPixels: total,
      changedPixels: changed,
      unchangedPixels: total - changed,
      changedBytes: changed * 3,
      changePercent: ((changed / total) * 100).toFixed(2),
      sizeA: bytesA.length,
      sizeB: bytesB.length,
    },
    bytes: heatmapBytes,
  }
}
