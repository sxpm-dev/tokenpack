// Strategy: lazy PixelRange manifest + buffered fetch all files, per-file release.
//
// This mirrors Browser Fetch Bench's "pixel-range-none range fetch all" shape:
// once the app touches a pack, fetch the manifest, fetch all file regions in
// that pack via grouped HTTP Range requests, and cache decoded text per path.
// App requests that arrive while this is in flight wait only for their own file
// decode promise, not for every file in the pack to finish decoding. Unrequested
// files are decoded opportunistically one-per-frame to avoid a main-thread lump.

import type { RemotePackCompressedFile, RemotePackHandle } from '@tokenpack/browser/fetch-pack'
import { fetchPackFilesCompressed, fetchPackManifest } from '@tokenpack/browser/fetch-pack'
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
  allStarted: boolean
}

interface CacheEntry {
  promise: Promise<RemoteEntry>
  settled: boolean
}

interface FileCacheEntry {
  promise: Promise<string> | null
  settled: boolean
  startDecode: () => Promise<string>
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
    startAllFileFetches(entry)
  }

  const fileEntry = entry.files.get(internalPath)

  if (!fileEntry) throw new Error(`path not found in pack manifest: ${internalPath}`)
  const text = await fileEntry.startDecode()
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

function startAllFileFetches(entry: RemoteEntry): void {
  const paths = entry.remote.manifest.files.map(file => file.path).sort()
  const compressedFilesPromise = fetchPackFilesCompressed(entry.remote, paths)

  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i]!
    const fileEntry: FileCacheEntry = {
      promise: null,
      settled: false,
      startDecode: () => {
        if (!fileEntry.promise) {
          fileEntry.promise = compressedFilesPromise.then(async compressedFiles => {
            const file = compressedFiles[i]

            if (!file) throw new Error(`range bytes missing for path: ${path}`)
            const bytes = await decompressFile(file)

            return textDecoder.decode(bytes)
          })
          fileEntry.promise.finally(() => {
            fileEntry.settled = true
          })
        }

        return fileEntry.promise
      },
    }
    entry.files.set(path, fileEntry)
  }

  void scheduleBackgroundDecodes(entry, paths, compressedFilesPromise)
}

async function scheduleBackgroundDecodes(
  entry: RemoteEntry,
  paths: readonly string[],
  compressedFilesPromise: Promise<RemotePackCompressedFile[]>,
): Promise<void> {
  try {
    await compressedFilesPromise
  } catch {
    return
  }

  for (const path of paths) {
    const fileEntry = entry.files.get(path)

    if (!fileEntry || fileEntry.promise || fileEntry.settled) continue
    await nextFrame()
    await fileEntry.startDecode().catch(() => undefined)
  }
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
      return
    }
    setTimeout(resolve, 0)
  })
}

async function decompressFile(file: RemotePackCompressedFile): Promise<Uint8Array> {
  return decompressRaw(file.bytes, file.entry.compressor, {
    level: file.entry.level,
    uncompressedLength: file.entry.originalSize,
  })
}

export {}
