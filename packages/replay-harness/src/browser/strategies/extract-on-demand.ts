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

import { decodeStream } from '@tokenpack/browser'
import type { DirPack } from '@tokenpack/browser'

declare global {
  interface Window {
    __PACK_URLS: Record<string, string>
    __getPackFile: (
      packId: string,
      internalPath: string,
    ) => Promise<{
      text: string
      packFetchMs: number
      extractMs: number
      cached: boolean
    }>
  }
}

interface PackEntry {
  pack: DirPack
  fetchMs: number
}

const packCache = new Map<string, Promise<PackEntry>>()

window.__getPackFile = async (packId, internalPath) => {
  const wasCached = packCache.has(packId)
  let promise = packCache.get(packId)
  if (!promise) {
    promise = (async (): Promise<PackEntry> => {
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
    packCache.set(packId, promise)
  }

  const entry = await promise
  const t1 = performance.now()
  const text = await entry.pack.text(internalPath)
  const extractMs = performance.now() - t1

  return {
    text,
    packFetchMs: wasCached ? 0 : entry.fetchMs,
    extractMs,
    cached: wasCached,
  }
}

export {}
