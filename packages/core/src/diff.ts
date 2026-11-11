// Diff compute primitives — env-neutral.
//
// `computeTextDiff(packA, packB)` runs a line-level diff across files in two
// Pack objects. `packToEntries` extracts entries for use with `encodeDiff`.
// `defaultDiffCompress` is the compressor used for diff-pack regions when
// no caller override is supplied — `'deflate-9'` is the browser-friendly
// pick that matches what the app's old `compute-diff.ts` used.
//
// Env packages (`@tokenpack/node`, `@tokenpack/browser`) expose a higher-level
// `diff(sourceA, sourceB)` that loads sources (URLs/Blobs/file paths) and
// delegates to `algo.diff(packA, packB)`. The compute functions here don't
// touch fs / fetch / canvas.

import { compressRaw } from './compressors'
import type { FilePack, Pack } from './pack/types'

const DIFF_COMPRESSOR = 'deflate-9'

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

  const textA = !packA.isPack() && !packA.isDiff() ? await packA.text().catch(() => null) : null
  const textB = !packB.isPack() && !packB.isDiff() ? await packB.text().catch(() => null) : null

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

/**
 * Flatten a Pack to the entry list `encodeDiff` expects. DirPack →
 * `extractAll()`. FilePack → single `_root` entry. DiffPack callers should not
 * pass a DiffPack here.
 */
export async function packToEntries(
  pack: Pack,
): Promise<Array<{ path: string; bytes: Uint8Array }>> {
  if (pack.isPack()) return pack.extractAll()
  if (pack.isDiff()) {
    throw new Error('packToEntries: DiffPack inputs not supported')
  }
  const filePack = pack as FilePack
  const bytes = await filePack.content()

  return [{ path: '_root', bytes }]
}

/** Default per-region compressor for diff-pack bytes. Browser-friendly. */
export async function defaultDiffCompress(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; compressor: string; level: number; originalSize: number }> {
  const r = await compressRaw(bytes, DIFF_COMPRESSOR)

  return {
    bytes: r.bytes,
    compressor: r.compressor,
    level: r.level,
    originalSize: r.originalSize,
  }
}
