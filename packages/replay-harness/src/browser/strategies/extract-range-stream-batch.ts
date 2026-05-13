// Strategy: lazy PixelRange manifest + short-window grouped range streams.
//
// This keeps the app-driven request shape, but batches file requests that arrive
// close together into one fetchPackFilesStream(remote, paths) call. It is a
// middle ground between one HTTP Range fetch per file and eager stream-all.

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
  batch: BatchState | null
}

interface CacheEntry {
  promise: Promise<RemoteEntry>
  settled: boolean
}

interface FileCacheEntry {
  promise: Promise<string>
  settled: boolean
}

interface PendingFileEntry extends FileCacheEntry {
  resolve: (text: string) => void
  reject: (error: unknown) => void
}

interface BatchState {
  files: Map<string, PendingFileEntry>
  timer: ReturnType<typeof setTimeout>
}

const BATCH_WINDOW_MS = 10
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

      return { remote, files: new Map(), batch: null }
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
    fileEntry = queueBatchFile(entry, internalPath)
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

function queueBatchFile(entry: RemoteEntry, path: string): FileCacheEntry {
  if (!entry.remote.manifest.files.some(file => file.path === path)) {
    throw new Error(`path not found in pack manifest: ${path}`)
  }

  const batch = entry.batch ?? createBatch(entry)
  let pending = batch.files.get(path)

  if (pending) return pending

  let resolve!: (text: string) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  pending = { promise, settled: false, resolve, reject }
  promise.finally(() => {
    pending!.settled = true
  })
  batch.files.set(path, pending)
  entry.files.set(path, pending)

  return pending
}

function createBatch(entry: RemoteEntry): BatchState {
  const batch: BatchState = {
    files: new Map(),
    timer: setTimeout(() => {
      flushBatch(entry, batch)
    }, BATCH_WINDOW_MS),
  }

  entry.batch = batch

  return batch
}

async function flushBatch(entry: RemoteEntry, batch: BatchState): Promise<void> {
  if (entry.batch !== batch) return
  entry.batch = null
  const paths = [...batch.files.keys()].sort()

  try {
    const files = await fetchPackFilesStream(entry.remote, paths)
    const filesByPath = new Map(files.map((file, index) => [paths[index], file]))

    await Promise.all(
      paths.map(async path => {
        const pending = batch.files.get(path)
        const file = filesByPath.get(path)

        if (!pending) return
        if (!file) throw new Error(`range stream missing for path: ${path}`)
        const bytes = await readStream(file.stream)

        pending.resolve(textDecoder.decode(bytes))
      }),
    )
  } catch (error) {
    for (const pending of batch.files.values()) {
      if (!pending.settled) pending.reject(error)
    }
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
