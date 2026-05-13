// Strategy: lazy PixelRange manifest + one HTTP Range fetch per requested file.
//
// This uses @tokenpack/browser/fetch-pack, the same public API as Browser Fetch
// Bench. The first request for a pack range-fetches its manifest. Each asset
// then range-fetches only its own file region and caches decoded text by path.

import type { RemotePackHandle } from '@tokenpack/browser/fetch-pack'
import { fetchPackFileStream, fetchPackManifest } from '@tokenpack/browser/fetch-pack'

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
  manifestMs: number
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
      const t0 = performance.now()
      const url = window.__PACK_URLS[packId]

      if (!url) throw new Error(`no pack URL for ${packId}`)
      const remote = await fetchPackManifest(url)

      return { remote, manifestMs: performance.now() - t0, files: new Map() }
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
      const file = await fetchPackFileStream(entry.remote, internalPath)
      const bytes = await readStream(file.stream)

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

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break
      if (!value) continue
      chunks.push(value)
      total += value.byteLength
    }
  } finally {
    reader.releaseLock()
  }

  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}

export {}
