// Shared `diffTo` builder used by `decode()` and `decodeStream()`.
//
// Returns a function compatible with `DirPack.diffToFn`. The function is
// invoked when a consumer calls `prevPack.diffTo(nextPack)` — both packs are
// extracted, the diff bytes are produced via `encodeDiff`, and the result is
// wrapped in the image pipeline so it can be re-decoded as a `DiffPack`.

import { compressRaw } from 'tokenpack/compressors'
import type { DirPack } from 'tokenpack/pack/types'
import { encodeDiff } from 'tokenpack/pack-format/encode-diff'

import { encode, type EncodeResult } from './encode'

export function buildDiffToFn(compressor: string = 'brotli-11') {
  return async (a: DirPack, b: DirPack): Promise<EncodeResult> => {
    const prevEntries = await a.extractAll()
    const nextEntries = await b.extractAll()
    const diffBytes = await encodeDiff(prevEntries, nextEntries, async bytes => {
      const r = await compressRaw(bytes, compressor)

      return {
        bytes: r.bytes,
        compressor: r.compressor,
        level: r.level,
        originalSize: r.originalSize,
      }
    })

    // Diff bytes are already deflate-compressed inside; wrap them in a
    // none-compressor algorithm so the pixel layer doesn't re-compress.
    return encode(diffBytes, { algo: 'linear-none' })
  }
}
