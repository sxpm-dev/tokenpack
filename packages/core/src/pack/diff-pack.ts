// DiffPack — a token carrying diff ops + per-region compressed bytes for
// add/modify/patch ops. `apply(prev)` produces a new in-memory DirPack.

import { applyDiff } from '../pack-format/apply-diff'
import type { DecompressFn } from '../pack-format/decompress'
import { DirPack } from './dir-pack'
import type { DiffEntry, DiffPack as IDiffPack, DirPack as IDirPack } from './types'

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

  isDiff(): this is IDiffPack {
    return true
  }

  async apply(prev: IDirPack): Promise<IDirPack> {
    const prevEntries = await prev.extractAll()
    const newEntries = await applyDiff(prevEntries, this.diffBytes, this.decompress)
    const map = new Map(newEntries.map(e => [e.path, e.bytes]))

    return new DirPack(
      newEntries.map(e => ({ path: e.path, size: e.bytes.length })),
      async path => {
        const bytes = map.get(path)

        if (!bytes) throw new Error(`no entry for path: ${path}`)

        return bytes
      },
      async () => Array.from(map, ([path, bytes]) => ({ path, bytes })),
    )
  }
}
