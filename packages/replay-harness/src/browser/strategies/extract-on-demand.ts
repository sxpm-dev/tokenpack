// Strategy: lazy fetch + lazy text-extract.
//
// First call to __getPackFile(packId, ...) triggers fetch + decodeStream of
// the pack PNG. The DirPack is cached, so subsequent files in the same pack
// just call text().
//
// Returns the file as a UTF-8 string — no browser-side base64. Assumption:
// captured assets are text (JS/CSS/JSON/HTML). The recorder's default
// content-type allowlist matches that. Add a binary path here if/when you
// pack fonts or wasm.

import type { DirPack } from '@tokenpack/browser'
import { decodeStream } from '@tokenpack/browser'

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

      if (!resp.body) throw new Error(`no body for ${url}`)
      const pack = await decodeStream(resp.body)
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
