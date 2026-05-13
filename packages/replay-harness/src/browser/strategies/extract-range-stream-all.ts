// Strategy: lazy PixelRange manifest + stream all files in a pack on first use.
//
// This mirrors Browser Fetch Bench's "range stream all" shape: once the app
// touches a pack, fetch the manifest, start one grouped multi-file range stream
// for every file in the pack, and cache decoded text per path.

import type { RemotePackHandle } from '@tokenpack/browser/fetch-pack'
import { fetchPackFilesStream, fetchPackManifest } from '@tokenpack/browser/fetch-pack'

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
  allStarted: boolean
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

      return { remote, files: new Map(), allStarted: false }
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

  if (!entry.allStarted) {
    entry.allStarted = true
    startAllFileStreams(entry)
  }

  const fileEntry = entry.files.get(internalPath)

  if (!fileEntry) throw new Error(`path not found in pack manifest: ${internalPath}`)
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

function startAllFileStreams(entry: RemoteEntry): void {
  const paths = entry.remote.manifest.files.map(file => file.path).sort()
  const streamsByPathPromise = fetchPackFilesStream(entry.remote, paths).then(files => {
    return new Map(files.map((file, index) => [paths[index], file]))
  })

  for (const path of paths) {
    const promise = streamsByPathPromise.then(async filesByPath => {
      const file = filesByPath.get(path)

      if (!file) throw new Error(`range stream missing for path: ${path}`)
      const bytes = await readStream(file.stream)

      return textDecoder.decode(bytes)
    })
    const fileEntry: FileCacheEntry = { promise, settled: false }

    promise.finally(() => {
      fileEntry.settled = true
    })
    entry.files.set(path, fileEntry)
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
