// Re-applyable diff format for CART archives.
//
// Wire format: a regular CART archive that carries two pieces of metadata
//   `.tokenpack-diff-meta.json` — { baseSha?: string, deletions: string[] }
// All other entries are added/modified files (full content; replace by path).
//
// applyDiff(prev, diff) computes new state: (prev minus deletions) ∪ entries.
//
// Browser-safe — no fs deps; uses only `packBuffers`/`unpackBuffers`/`isCartArchive`.

import { isCartArchive, packBuffers, type PackEntry, unpackBuffers } from './archive'

const META_PATH = '.tokenpack-diff-meta.json'

export interface DiffMeta {
  /** Optional sha256 of the base pack — for sanity-check during applyDiff. */
  baseSha?: string
  /** Paths in `prev` removed by this diff. */
  deletions: string[]
}

export interface DiffPackOptions {
  /** Optional sha256 of the prev archive — embedded so applyDiff can verify. */
  baseSha?: string
}

export interface DiffPackResult {
  diff: Uint8Array
  added: string[]
  modified: string[]
  deleted: string[]
  /** True when there are no changes — diff is still produced (zero-entry archive + empty meta). */
  empty: boolean
}

/**
 * Produce a re-applyable diff archive between two pack states.
 * The diff itself is a CART archive — same decoder reads both full packs and diffs.
 */
export function diffPack(
  prev: readonly PackEntry[],
  next: readonly PackEntry[],
  options: DiffPackOptions = {},
): DiffPackResult {
  const prevByPath = new Map(prev.map(e => [e.path, e.bytes]))
  const nextByPath = new Map(next.map(e => [e.path, e.bytes]))

  const added: string[] = []
  const modified: string[] = []
  const deleted: string[] = []
  const changedEntries: PackEntry[] = []

  for (const [path, bytes] of nextByPath) {
    const prevBytes = prevByPath.get(path)

    if (prevBytes === undefined) {
      added.push(path)
      changedEntries.push({ path, bytes })
    } else if (!bytesEqual(prevBytes, bytes)) {
      modified.push(path)
      changedEntries.push({ path, bytes })
    }
  }

  for (const path of prevByPath.keys()) {
    if (!nextByPath.has(path)) deleted.push(path)
  }

  const meta: DiffMeta = { baseSha: options.baseSha, deletions: deleted }
  const metaBytes = new TextEncoder().encode(JSON.stringify(meta))

  // Place meta first so partial parsers can detect this is a diff before reading entries.
  const allEntries: PackEntry[] = [{ path: META_PATH, bytes: metaBytes }, ...changedEntries]

  return {
    diff: packBuffers(allEntries),
    added,
    modified,
    deleted,
    empty: added.length === 0 && modified.length === 0 && deleted.length === 0,
  }
}

/**
 * Apply a diff archive on top of a prev state, returning the new state.
 */
export function applyDiff(prev: readonly PackEntry[], diff: Uint8Array): PackEntry[] {
  if (!isCartArchive(diff)) throw new Error('applyDiff: not a CART archive')
  const entries = unpackBuffers(diff)
  const metaEntry = entries.find(e => e.path === META_PATH)

  if (!metaEntry) {
    throw new Error(
      'applyDiff: missing .tokenpack-diff-meta.json — this archive is a full pack, not a diff',
    )
  }

  const meta = JSON.parse(new TextDecoder('utf-8').decode(metaEntry.bytes)) as DiffMeta
  const deletions = new Set(meta.deletions)

  const result = new Map<string, Uint8Array>()

  for (const e of prev) {
    if (!deletions.has(e.path)) result.set(e.path, e.bytes)
  }
  for (const e of entries) {
    if (e.path === META_PATH) continue
    result.set(e.path, e.bytes)
  }

  // Preserve insertion order: original prev paths first, then new ones.
  const out: PackEntry[] = []
  const seen = new Set<string>()

  for (const e of prev) {
    if (deletions.has(e.path)) continue
    const bytes = result.get(e.path)!

    out.push({ path: e.path, bytes })
    seen.add(e.path)
  }
  for (const e of entries) {
    if (e.path === META_PATH || seen.has(e.path)) continue
    out.push({ path: e.path, bytes: result.get(e.path)! })
    seen.add(e.path)
  }

  return out
}

/**
 * Inspect a diff archive without applying it. Returns null if the archive isn't
 * a TokenPack diff (e.g., is a full pack instead).
 */
export function readDiffMeta(diff: Uint8Array): DiffMeta | null {
  if (!isCartArchive(diff)) return null
  try {
    const entries = unpackBuffers(diff)
    const metaEntry = entries.find(e => e.path === META_PATH)

    if (!metaEntry) return null

    return JSON.parse(new TextDecoder('utf-8').decode(metaEntry.bytes)) as DiffMeta
  } catch {
    return null
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false

  return true
}
