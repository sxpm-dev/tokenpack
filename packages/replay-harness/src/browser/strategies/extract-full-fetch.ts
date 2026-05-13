// Strategy: lazy full fetch + buffered decode.
//
// First call to __getPackFile(packId, ...) fetches the whole PNG token and
// decodes it through @tokenpack/browser.decode(). This intentionally exercises
// non-streaming whole-token fetch behavior for variants such as
// linear-deflate-c3.

import type { DirPack } from '@tokenpack/browser'
import { decode } from '@tokenpack/browser'

declare global {
  interface Window {
    __PACK_URLS: Record<string, string>
    __getPackFile: (
      packId: string,
      internalPath: string,
    ) => Promise<{
      text: string
      packFetchMs: number
      packInitMs: number
      fileFetchMs: number
      extractMs: number
      cacheState: 'miss' | 'pending' | 'hit'
    }>
  }
}

interface PackEntry {
  pack: DirPack
  fetchMs: number
}

interface CacheEntry {
  promise: Promise<PackEntry>
  settled: boolean
}

const packCache = new Map<string, CacheEntry>()

window.__getPackFile = async (packId, internalPath) => {
  let cacheEntry = packCache.get(packId)
  const cacheState: 'miss' | 'pending' | 'hit' = !cacheEntry
    ? 'miss'
    : cacheEntry.settled
      ? 'hit'
      : 'pending'

  if (!cacheEntry) {
    const promise = (async (): Promise<PackEntry> => {
      const t0 = performance.now()
      const url = window.__PACK_URLS[packId]

      if (!url) throw new Error(`no pack URL for ${packId}`)
      const resp = await fetch(url)

      if (!resp.ok) throw new Error(`fetch ${url}: ${resp.status}`)
      const pack = await decode(await resp.blob())
      const fetchMs = performance.now() - t0

      if (!pack.isPack()) throw new Error(`pack is not a DirPack: ${packId}`)

      return { pack, fetchMs }
    })()

    cacheEntry = { promise, settled: false }
    promise.finally(() => {
      cacheEntry!.settled = true
    })
    packCache.set(packId, cacheEntry)
  }

  const initStart = performance.now()
  const entry = await cacheEntry.promise
  const packInitMs = performance.now() - initStart
  const t1 = performance.now()
  const text = await entry.pack.text(internalPath)
  const extractMs = performance.now() - t1

  return {
    text,
    packFetchMs: packInitMs,
    packInitMs,
    fileFetchMs: 0,
    extractMs,
    cacheState,
  }
}

export {}
