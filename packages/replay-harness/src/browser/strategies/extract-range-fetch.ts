// Strategy: lazy PixelRange manifest + one buffered HTTP Range fetch per file.
//
// This is the buffered sibling of extract-range-stream: each app request pulls
// its own compressed file region, decompresses it, and caches decoded text.

import type { RemotePackHandle } from '@tokenpack/browser/fetch-pack'
import { fetchPackFile, fetchPackManifest } from '@tokenpack/browser/fetch-pack'
import { decompressRaw } from 'tokenpack/compressors'

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

interface RemoteEntry {
  remote: RemotePackHandle
  files: Map<string, FileCacheEntry>
}

interface CacheEntry {
  promise: Promise<RemoteEntry>
  settled: boolean
}

interface FileCacheEntry {
  promise: Promise<string>
  settled: boolean
}

const remoteCache = new Map<string, CacheEntry>()
const textDecoder = new TextDecoder()

window.__getPackFile = async (packId, internalPath) => {
  let cacheEntry = remoteCache.get(packId)
  const cacheState: 'miss' | 'pending' | 'hit' = !cacheEntry
    ? 'miss'
    : cacheEntry.settled
      ? 'hit'
      : 'pending'

  if (!cacheEntry) {
    const promise = (async (): Promise<RemoteEntry> => {
      const url = window.__PACK_URLS[packId]

      if (!url) throw new Error(`no pack URL for ${packId}`)
      const remote = await fetchPackManifest(url)

      return { remote, files: new Map() }
    })()

    cacheEntry = { promise, settled: false }
    promise.finally(() => {
      cacheEntry!.settled = true
    })
    remoteCache.set(packId, cacheEntry)
  }

  const initStart = performance.now()
  const entry = await cacheEntry.promise
  const packInitMs = performance.now() - initStart
  const fileStart = performance.now()
  let fileEntry = entry.files.get(internalPath)

  if (!fileEntry) {
    const promise = (async (): Promise<string> => {
      const bytes = await fetchPackFile(entry.remote, internalPath, decompressRaw)

      return textDecoder.decode(bytes)
    })()

    fileEntry = { promise, settled: false }
    promise.finally(() => {
      fileEntry!.settled = true
    })
    entry.files.set(internalPath, fileEntry)
  }

  const text = await fileEntry.promise
  const fileFetchMs = performance.now() - fileStart
  const t1 = performance.now()
  const extractMs = performance.now() - t1

  return {
    text,
    packFetchMs: packInitMs + fileFetchMs,
    packInitMs,
    fileFetchMs,
    extractMs,
    cacheState,
  }
}

export {}
