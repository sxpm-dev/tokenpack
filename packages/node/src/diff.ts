// Node diff() — thin proxy that loads sources, detects the algorithm,
// decodes both packs, and delegates to `algo.diff(packA, packB)`.
//
// Both sources must share an algorithm (same-algo only); cross-algo diff
// throws an explicit error. The diff token is packaged with the source
// algorithm — `diff(linearA, linearB).token()` is a `linear` token.

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import type { DiffResult } from 'tokenpack/algorithms/types'
import { type FileDiff, type Hunk } from 'tokenpack/diff'

import type { DecodeSource } from './decode'
import { decode } from './decode'
import { loadSource } from './source-loader'

export type { DiffResult, FileDiff, Hunk }

export function diff(sourceA: DecodeSource, sourceB: DecodeSource): DiffResult {
  let cached: DiffResult | null = null

  async function resolve(): Promise<DiffResult> {
    if (cached) return cached
    const [{ bytes: bufA, ext: extA }, { bytes: bufB, ext: extB }] = await Promise.all([
      loadSource(sourceA),
      loadSource(sourceB),
    ])
    const [CtorA, CtorB] = await Promise.all([
      algorithmCatalog.detectFromBuffer(bufA, extA),
      algorithmCatalog.detectFromBuffer(bufB, extB),
    ])

    if (CtorA !== CtorB) {
      throw new Error(
        `diff: source algorithms differ (${CtorA.name} vs ${CtorB.name}); same-algo only`,
      )
    }
    const algo = new CtorA()
    const [packA, packB] = await Promise.all([decode(sourceA), decode(sourceB)])

    cached = algo.diff(packA, packB)

    return cached
  }

  return {
    text: async () => (await resolve()).text(),
    token: async () => (await resolve()).token(),
  }
}
