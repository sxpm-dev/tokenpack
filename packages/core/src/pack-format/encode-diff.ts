// Compute diff ops between two pack contents and serialize to a diff-format
// byte stream. Per-region compression is reused from `encode-pack`'s CompressFn
// so the same env-injected compressor handles both formats.

import type { PackEntry } from '../archive-buffers'
import type { CompressFn } from './encode-pack'
import { FORMAT_DIFF, writeFormatByte } from './format-byte'
import {
  type DiffManifest,
  type DiffManifestEntry,
  type DiffOp,
  writeDiffManifest,
} from './manifest'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface DiffOpSummary {
  op: DiffOp
  path: string
  fromPath?: string
}

interface BytePatch {
  start: number
  deleteSize: number
  insert: Uint8Array
  targetSize: number
}

// FNV-1a 32-bit — same hashing style as `dense-drawer.ts` in core.
function hash(bytes: Uint8Array): string {
  let h = 0x811c9dc5

  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]
    h = Math.imul(h, 0x01000193)
  }

  return (h >>> 0).toString(16)
}

export function computeDiffOps(
  prev: readonly PackEntry[],
  next: readonly PackEntry[],
): DiffOpSummary[] {
  const prevByPath = new Map(prev.map(e => [e.path, e]))
  const nextByPath = new Map(next.map(e => [e.path, e]))
  const prevByHash = new Map<string, string>()

  for (const e of prev) {
    const h = hash(e.bytes)

    // First path wins on hash collision; renaming logic resolves ambiguity.
    if (!prevByHash.has(h)) prevByHash.set(h, e.path)
  }

  const ops: DiffOpSummary[] = []
  const renamedFromPaths = new Set<string>()

  for (const e of next) {
    const prevEntry = prevByPath.get(e.path)

    if (!prevEntry) {
      // Possibly a rename — look for same content under a different prev path.
      const fromPath = prevByHash.get(hash(e.bytes))

      if (fromPath && !nextByPath.has(fromPath) && !renamedFromPaths.has(fromPath)) {
        ops.push({ op: 'rename', path: e.path, fromPath })
        renamedFromPaths.add(fromPath)
      } else {
        ops.push({ op: 'add', path: e.path })
      }
    } else if (hash(prevEntry.bytes) !== hash(e.bytes)) {
      ops.push({ op: 'modify', path: e.path })
    }
    // else: identical, no op
  }

  for (const e of prev) {
    if (!nextByPath.has(e.path) && !renamedFromPaths.has(e.path)) {
      ops.push({ op: 'delete', path: e.path })
    }
  }

  return ops
}

export async function encodeDiff(
  prev: readonly PackEntry[],
  next: readonly PackEntry[],
  compress: CompressFn,
): Promise<Uint8Array> {
  const ops = computeDiffOps(prev, next)
  const nextByPath = new Map(next.map(e => [e.path, e]))
  let runningOffset = 0
  const regionBytes: Uint8Array[] = []
  const manifestEntries: DiffManifestEntry[] = []

  for (const op of ops) {
    if (op.op === 'add') {
      const file = nextByPath.get(op.path)

      if (!file) throw new Error(`encodeDiff: missing next entry for op path: ${op.path}`)
      const c = await compress(file.bytes)

      manifestEntries.push({
        op: op.op,
        path: op.path,
        compressor: c.compressor,
        level: c.level,
        compressedSize: c.bytes.length,
        originalSize: c.originalSize,
        offset: runningOffset,
      })
      regionBytes.push(c.bytes)
      runningOffset += c.bytes.length
    } else if (op.op === 'modify') {
      const file = nextByPath.get(op.path)
      const prevFile = prev.find(e => e.path === op.path)

      if (!file) throw new Error(`encodeDiff: missing next entry for op path: ${op.path}`)
      if (!prevFile) throw new Error(`encodeDiff: missing previous entry for op path: ${op.path}`)

      const full = await compress(file.bytes)
      const patch = computeBytePatch(prevFile.bytes, file.bytes)
      const compressedPatch = await compress(patch.insert)
      const usePatch = compressedPatch.bytes.length < full.bytes.length

      if (usePatch) {
        manifestEntries.push({
          op: 'patch',
          path: op.path,
          compressor: compressedPatch.compressor,
          level: compressedPatch.level,
          compressedSize: compressedPatch.bytes.length,
          originalSize: compressedPatch.originalSize,
          offset: runningOffset,
          patchStart: patch.start,
          deleteSize: patch.deleteSize,
          targetSize: patch.targetSize,
        })
        regionBytes.push(compressedPatch.bytes)
        runningOffset += compressedPatch.bytes.length
      } else {
        manifestEntries.push({
          op: op.op,
          path: op.path,
          compressor: full.compressor,
          level: full.level,
          compressedSize: full.bytes.length,
          originalSize: full.originalSize,
          offset: runningOffset,
        })
        regionBytes.push(full.bytes)
        runningOffset += full.bytes.length
      }
    } else if (op.op === 'rename') {
      manifestEntries.push({ op: 'rename', path: op.path, fromPath: op.fromPath })
    } else {
      manifestEntries.push({ op: 'delete', path: op.path })
    }
  }

  const manifest: DiffManifest = { version: 1, ops: manifestEntries }
  const manifestBytes = writeDiffManifest(manifest)
  const totalRegionSize = regionBytes.reduce((s, r) => s + r.length, 0)
  const out = new Uint8Array(4 + 1 + 4 + manifestBytes.length + totalRegionSize)

  out.set(SIG, 0)
  writeFormatByte(out, 4, FORMAT_DIFF)
  new DataView(out.buffer, out.byteOffset, out.byteLength).setUint32(5, manifestBytes.length, true)
  out.set(manifestBytes, 9)

  let pos = 9 + manifestBytes.length

  for (const r of regionBytes) {
    out.set(r, pos)
    pos += r.length
  }

  return out
}

function computeBytePatch(prev: Uint8Array, next: Uint8Array): BytePatch {
  const min = Math.min(prev.length, next.length)
  let prefix = 0

  while (prefix < min && prev[prefix] === next[prefix]) prefix += 1

  let suffix = 0
  while (
    suffix < min - prefix &&
    prev[prev.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1
  }

  const nextEnd = next.length - suffix
  const prevEnd = prev.length - suffix

  return {
    start: prefix,
    deleteSize: prevEnd - prefix,
    insert: next.subarray(prefix, nextEnd),
    targetSize: next.length,
  }
}
