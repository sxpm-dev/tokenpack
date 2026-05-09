// Browser diff() — thin proxy that loads sources, detects the algorithm,
// decodes both packs, and delegates to `algo.diff(packA, packB)`.
//
// Both sources must share an algorithm (same-algo only); cross-algo diff
// throws an explicit error. The diff token is packaged with the source
// algorithm — `diff(linearA, linearB).token()` returns a `linear` token.

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import type { DiffResult } from 'tokenpack/algorithms/types'
import { type FileDiff, type Hunk } from 'tokenpack/diff'

import { decode, type DecodeSource } from './decode'

export type { DiffResult, FileDiff, Hunk }

export function diff(sourceA: DecodeSource, sourceB: DecodeSource): DiffResult {
  let cached: DiffResult | null = null
  async function resolve(): Promise<DiffResult> {
    if (cached) return cached
    const [bufA, bufB] = await Promise.all([sourceToBytes(sourceA), sourceToBytes(sourceB)])
    const [CtorA, CtorB] = await Promise.all([
      algorithmCatalog.detectFromBuffer(bufA, '.png'),
      algorithmCatalog.detectFromBuffer(bufB, '.png'),
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

async function sourceToBytes(source: DecodeSource): Promise<Buffer> {
  if (source instanceof Uint8Array) {
    return Buffer.from(source.buffer, source.byteOffset, source.byteLength)
  }
  if (source instanceof ArrayBuffer) {
    return Buffer.from(source)
  }
  if (source instanceof Blob) {
    return Buffer.from(await source.arrayBuffer())
  }
  if (typeof source === 'string') {
    const response = await fetch(source)

    if (!response.ok) throw new Error(`fetch ${source}: ${response.status}`)

    return Buffer.from(await response.arrayBuffer())
  }
  // HTMLImageElement / ImageBitmap are accepted by decode() but not by diff()
  // since detectFromBuffer needs raw bytes; force the caller to pre-decode.
  throw new TypeError('diff(): unsupported source type — pass bytes or a URL/Blob')
}
