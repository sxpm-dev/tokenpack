// DiffPack — a token carrying diff ops + per-region compressed bytes for
// add/modify/patch ops. Applying produces a lazy DirPack: unchanged files stay
// backed by the base pack, and diff regions are decompressed only when read.

import { decodeDiff } from '../pack-format/apply-diff'
import type { DecompressFn } from '../pack-format/decompress'
import { DirPack } from './dir-pack'
import type {
  DiffEntry,
  DiffOpKind,
  DiffPack as IDiffPack,
  DirPack as IDirPack,
  PackEntryInfo,
} from './types'

export class DiffPack implements IDiffPack {
  readonly list: string[]
  readonly entries: ReadonlyArray<DiffEntry>

  constructor(
    entries: ReadonlyArray<DiffEntry>,
    private readonly diffBytes: Uint8Array,
    private readonly decompress: DecompressFn,
  ) {
    this.entries = entries
    this.list = entries.map(e => e.path)
  }

  isPack(): this is IDirPack {
    return false
  }

  isRouter(): this is import('./types').RouterPack {
    return false
  }

  isDiff(): this is IDiffPack {
    return true
  }

  async materialize(): Promise<never> {
    throw new Error('DiffPack.materialize: diff tokens cannot be materialized directly')
  }

  async apply(prev: IDirPack): Promise<IDirPack> {
    const decoded = decodeDiff(this.diffBytes)
    const opsByPath = new Map(decoded.manifest.ops.map(op => [op.path, op]))
    const deleted = new Set(
      decoded.manifest.ops.filter(op => op.op === 'delete').map(op => op.path),
    )
    const renamedFrom = new Map(
      decoded.manifest.ops
        .filter(op => op.op === 'rename' && op.fromPath)
        .map(op => [op.fromPath!, op.path]),
    )
    const entries = buildAppliedEntries(prev.entries, this.entries, deleted, renamedFrom)

    const extractOne = async (path: string) => {
      const op = opsByPath.get(path)

      if (!op) return prev.extract(path)
      if (op.op === 'rename') return prev.extract(op.fromPath!)
      if (op.op === 'delete') throw new Error(`no entry for path: ${path}`)

      const region = decoded.extractRegion(path)
      const bytes = await this.decompress(region, op.compressor!, {
        level: op.level!,
        uncompressedLength: op.originalSize!,
      })

      if (op.op !== 'patch') return bytes

      const base = await prev.extract(path)

      return applyBytePatch(base, op.patchStart!, op.deleteSize!, bytes, op.targetSize!)
    }

    return new DirPack(entries, extractOne, async () =>
      Promise.all(
        entries.map(async entry => ({ path: entry.path, bytes: await extractOne(entry.path) })),
      ),
    )
  }
}

function buildAppliedEntries(
  prevEntries: ReadonlyArray<PackEntryInfo>,
  diffEntries: ReadonlyArray<DiffEntry>,
  deleted: ReadonlySet<string>,
  renamedFrom: ReadonlyMap<string, string>,
): PackEntryInfo[] {
  const out: PackEntryInfo[] = []
  const seen = new Set<string>()
  const diffByPath = new Map(diffEntries.map(entry => [entry.path, entry]))

  for (const entry of prevEntries) {
    if (deleted.has(entry.path)) continue

    const renamedPath = renamedFrom.get(entry.path)

    if (renamedPath) {
      out.push({ path: renamedPath, size: entry.size })
      seen.add(renamedPath)
      continue
    }

    const diffEntry = diffByPath.get(entry.path)

    if (diffEntry && diffEntry.op !== 'rename' && diffEntry.op !== 'delete') {
      out.push({ path: entry.path, size: diffEntry.size ?? entry.size })
    } else {
      out.push(entry)
    }
    seen.add(entry.path)
  }

  for (const entry of diffEntries) {
    if (seen.has(entry.path) || !addsEntry(entry.op)) continue
    out.push({ path: entry.path, size: entry.size ?? 0 })
    seen.add(entry.path)
  }

  return out
}

function addsEntry(op: DiffOpKind): boolean {
  return op === 'add' || op === 'modify' || op === 'patch'
}

function applyBytePatch(
  base: Uint8Array,
  start: number,
  deleteSize: number,
  insert: Uint8Array,
  targetSize: number,
): Uint8Array {
  if (start < 0 || deleteSize < 0 || start + deleteSize > base.length) {
    throw new Error('DiffPack.apply: invalid patch bounds')
  }

  const out = new Uint8Array(base.length - deleteSize + insert.length)

  out.set(base.subarray(0, start), 0)
  out.set(insert, start)
  out.set(base.subarray(start + deleteSize), start + insert.length)

  if (out.length !== targetSize) {
    throw new Error(`DiffPack.apply: patch produced ${out.length} bytes, expected ${targetSize}`)
  }

  return out
}
