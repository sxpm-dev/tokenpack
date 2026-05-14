import type {
  RouterChunkManifestEntry,
  RouterFileManifestEntry,
  RouterFileSegment,
  RouterTokenManifest,
} from 'tokenpack'
import { ROUTER_MANIFEST_PATH } from 'tokenpack'
import { decompressRaw } from 'tokenpack/compressors'
import type { DirPack, FilePack, Pack } from 'tokenpack/pack/types'

import type { DecodeOptions, DecodeSource } from './decode'
import { decodeSourceToPayload } from './decode-core'
import { decodeStream, decodeStreamPayload } from './decode-stream'
import {
  fetchPixelRangePayloadBytes,
  fetchPixelRangePayloadHandle,
  fetchPixelRangePayloadStream,
  type PixelRangePayloadHandle,
} from './fetch-pack'
import {
  planRouterLoad,
  type RouterChunkRange,
  type RouterLoadPlan,
  type RouterLoadPlannerOptions,
  type RouterLoadStrategy,
  type RouterPlannedSegment,
  type RouterReadMode,
  segmentCoversChunkPayload,
} from './router-load-plan'
import { Token } from './token'

export type { RouterLoadPlan, RouterLoadStrategy } from './router-load-plan'
export type { RouterTokenManifest } from 'tokenpack'

export interface DecodeRouterOptions extends DecodeOptions {
  /** Required when `source` is not a URL string, because chunk hrefs are relative. */
  baseUrl?: string
  strategy?: RouterLoadStrategy
  /**
   * Small window used to batch app-driven single-file requests before planning.
   * Set to 0 to flush at the end of the current microtask.
   */
  singleLoadBatchWindowMs?: number
  debug?: RouterDebugCallback
}

export interface RouterFileEntry extends RouterFileManifestEntry {
  segments: RouterFileSegment[]
}

export interface MaterializeOptions {
  strategy?: RouterLoadStrategy
  as?: 'auto' | 'bytes' | 'text' | 'js' | 'css'
  nonce?: string
  /**
   * Overrides DecodeRouterOptions.singleLoadBatchWindowMs for this call.
   * Useful when benchmarking exact single-file latency versus burst loading.
   */
  singleLoadBatchWindowMs?: number
  planner?: Partial<
    Pick<
      RouterLoadPlannerOptions,
      | 'rangeRequestPenaltyBytes'
      | 'mergeRangeGapBytes'
      | 'maxRangesPerChunk'
      | 'tinyFileBytes'
      | 'tinyFileBurstFileCount'
      | 'tinyFileRequestPenaltyBytes'
      | 'tinyFileMaxRangesPerChunk'
      | 'largeFileWholeChunkBytes'
      | 'largeFileWholeChunkMaxWasteRatio'
      | 'maxParallelChunkRequests'
      | 'maxParallelSegmentRequests'
    >
  >
}

export interface RouterDebugPlanFile {
  path: string
  url: string
  chunkIds: string[]
  segmentCount: number
  rawBytes: number
  compressedBytes: number
}

export interface MaterializedFile {
  entry: RouterFileEntry
  bytes: Uint8Array
  text: string
  kind: 'bytes' | 'text' | 'js' | 'css'
  element: HTMLScriptElement | HTMLStyleElement | null
  timing: {
    decodeMs: number
    executeMs: number
  }
}

export type RouterDebugEvent =
  | {
      type: 'manifest'
      startMs: number
      durationMs: number
      tokenDecodeMs: number
      jsonParseMs: number
      chunkCount: number
      fileCount: number
      byteLength?: number
    }
  | {
      type: 'plan'
      startMs: number
      durationMs: number
      kind: RouterLoadPlan['kind']
      mode: RouterReadMode
      strategy: RouterLoadStrategy
      reason: string
      fileCount: number
      paths: string[]
      files?: RouterDebugPlanFile[]
      chunkIds: string[]
      requestCount: number
      chunkCount: number
      segmentCount: number
      selectedBytes: number
      fetchedBytes: number
      concurrency: number
    }
  | {
      type: 'batch'
      batchId: number
      mode: RouterReadMode
      strategy: RouterLoadStrategy
      startMs: number
      durationMs: number
      fileCount: number
      paths: string[]
      files?: RouterDebugPlanFile[]
    }
  | {
      type: 'file-cache'
      path: string
      cacheState: 'miss' | 'pending' | 'hit'
      startMs: number
      durationMs: number
      bytes: number
    }
  | {
      type: 'chunk'
      chunkId: string
      url: string
      mode: RouterReadMode
      cacheState: 'miss' | 'pending' | 'hit'
      startMs: number
      durationMs: number
      pngBytes?: number
      payloadBytes: number
    }
  | {
      type: 'payload-handle'
      chunkId: string
      url: string
      cacheState: 'miss' | 'pending' | 'hit'
      startMs: number
      durationMs: number
      payloadOffset: number
      payloadBytes: number
      prefetchedBytes: number
    }
  | {
      type: 'range'
      chunkId: string
      url: string
      mode: RouterReadMode
      startMs: number
      durationMs: number
      offset: number
      length: number
      bytes: number
      fallback: boolean
    }
  | {
      type: 'decompress'
      path: string
      compressor?: string
      level?: number
      startMs: number
      durationMs: number
      compressedBytes: number
      rawBytes: number
    }
  | {
      type: 'materialize'
      path: string
      kind: MaterializedFile['kind']
      startMs: number
      durationMs: number
      decodeMs: number
      executeMs: number
      bytes: number
    }

export type RouterDebugCallback = (event: RouterDebugEvent) => void

interface ChunkEntry extends RouterChunkManifestEntry {
  url: string
}

interface FileLookupIndex {
  byUrl: Map<string, RouterFileEntry>
  byPath: Map<string, RouterFileEntry[]>
}

interface ChunkPayloadHandleCacheEntry {
  initialBytes: number
  promise: Promise<PixelRangePayloadHandle>
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

interface ProgressiveFileState {
  file: RouterFileEntry
  compressed?: Uint8Array
  directCompressed?: Uint8Array
  pendingSegments: number
  deferred: Deferred<Uint8Array>
}

interface ProgressiveLoad {
  ready: Map<RouterFileEntry, Promise<Uint8Array>>
  done: Promise<void>
}

interface PendingSingleLoad {
  file: RouterFileEntry
  cacheKey: string
  deferred: Deferred<Uint8Array>
}

interface SingleLoadBatch {
  id: number
  startMs: number
  mode: RouterReadMode
  options: MaterializeOptions
  items: PendingSingleLoad[]
}

const textDecoder = new TextDecoder()
const CHUNK_PAYLOAD_HEADER_BYTES = 8192
const SINGLE_LOAD_BATCH_WINDOW_MS = 4

export async function decodeRouter(
  source: DecodeSource,
  options: DecodeRouterOptions = {},
): Promise<RouterToken> {
  const decoded =
    typeof source === 'string'
      ? await decodeStream(source, options)
      : await new Token(source, options).pack()
  const pack = await maybeRouterToken(decoded, source, options)

  if (!pack.isRouter()) throw new Error('decodeRouter(source): token is not a router token')

  return pack as RouterToken
}

export const pack = decodeRouter

export class RouterToken {
  readonly list: string[] & (() => Promise<RouterFileEntry[]>)
  readonly entries: ReadonlyArray<{ path: string; size: number }> = []
  readonly stream: RouterTokenStreamApi
  private readonly routerBaseUrl: string
  private manifestPromise: Promise<RouterTokenManifest> | null = null
  private chunkByIdPromise: Promise<Map<string, ChunkEntry>> | null = null
  private filesPromise: Promise<RouterFileEntry[]> | null = null
  private fileLookupPromise: Promise<FileLookupIndex> | null = null
  private chunkPayloadHandleCache = new Map<string, ChunkPayloadHandleCacheEntry>()
  private chunkBytesCache = new Map<string, Promise<Uint8Array>>()
  private chunkBytesSettled = new Set<string>()
  private chunkPayloadHandleSettled = new Set<string>()
  private bytesCache = new Map<string, Promise<Uint8Array>>()
  private singleLoadBatches = new Map<string, SingleLoadBatch>()
  private nextBatchId = 0

  constructor(
    private readonly source: DecodeSource,
    private readonly options: DecodeRouterOptions = {},
    manifest?: RouterTokenManifest,
  ) {
    this.routerBaseUrl = resolveRouterBaseUrl(source, options.baseUrl)
    if (manifest) this.manifestPromise = Promise.resolve(manifest)
    this.list = Object.assign(async () => this.files(), [] as string[])
    this.stream = new RouterTokenStreamApi(this)
  }

  isPack(): this is DirPack {
    return false
  }

  isDiff(): this is import('tokenpack/pack/types').DiffPack {
    return false
  }

  isRouter(): this is RouterToken {
    return true
  }

  async manifest(): Promise<RouterTokenManifest> {
    this.manifestPromise ??= this.readManifest()

    return this.manifestPromise
  }

  async plan(options?: MaterializeOptions): Promise<RouterLoadPlan>
  async plan(pathOrUrl: string, options?: MaterializeOptions): Promise<RouterLoadPlan>
  async plan(pathOrUrls: string[], options?: MaterializeOptions): Promise<RouterLoadPlan>
  async plan(
    pathOrUrlsOrOptions?: string | string[] | MaterializeOptions,
    maybeOptions: MaterializeOptions = {},
  ): Promise<RouterLoadPlan> {
    const options =
      typeof pathOrUrlsOrOptions === 'string' || Array.isArray(pathOrUrlsOrOptions)
        ? maybeOptions
        : (pathOrUrlsOrOptions ?? {})
    const files =
      typeof pathOrUrlsOrOptions === 'string'
        ? [await this.resolveFile(pathOrUrlsOrOptions)]
        : Array.isArray(pathOrUrlsOrOptions)
          ? await Promise.all(pathOrUrlsOrOptions.map(path => this.resolveFile(path)))
          : await this.list()

    return this.createLoadPlan(files, this.readModeFor(options), options)
  }

  private async files(): Promise<RouterFileEntry[]> {
    this.filesPromise ??= (async () => {
      const manifest = await this.manifest()
      const chunks = await this.chunkById()

      return manifest.files.map(file => {
        for (const segment of file.segments) {
          const chunk = chunks.get(segment.chunkId)

          if (!chunk) throw new Error(`router file references missing chunk: ${segment.chunkId}`)
        }

        return file
      })
    })()

    return this.filesPromise
  }

  async load(pathOrUrl: string, options: MaterializeOptions = {}): Promise<Uint8Array> {
    return this.loadWithMode(pathOrUrl, options, this.readModeFor(options))
  }

  async loadStream(pathOrUrl: string, options: MaterializeOptions = {}): Promise<Uint8Array> {
    return this.loadWithMode(pathOrUrl, options, 'stream')
  }

  private async loadWithMode(
    pathOrUrl: string,
    options: MaterializeOptions,
    mode: RouterReadMode,
  ): Promise<Uint8Array> {
    const entry = await this.resolveFile(pathOrUrl)
    const cacheKey = `${mode}:${entry.url}:${options.strategy ?? this.options.strategy ?? 'auto'}`
    let cached = this.bytesCache.get(cacheKey)

    if (!cached) {
      cached = this.enqueueSingleLoad(entry, mode, options, cacheKey)
      this.bytesCache.set(cacheKey, cached)
    }

    return cached
  }

  async loadText(pathOrUrl: string, options: MaterializeOptions = {}): Promise<string> {
    return textDecoder.decode(await this.load(pathOrUrl, options))
  }

  async text(options?: MaterializeOptions): Promise<string>
  async text(pathOrUrl: string, options?: MaterializeOptions): Promise<string>
  async text(pathOrUrls: string[], options?: MaterializeOptions): Promise<Map<string, string>>
  async text(
    pathOrUrlsOrOptions?: string | string[] | MaterializeOptions,
    maybeOptions: MaterializeOptions = {},
  ): Promise<string | Map<string, string>> {
    if (typeof pathOrUrlsOrOptions === 'string') {
      return this.loadText(pathOrUrlsOrOptions, maybeOptions)
    }
    if (Array.isArray(pathOrUrlsOrOptions)) {
      return this.textMany(pathOrUrlsOrOptions, maybeOptions, this.readModeFor(maybeOptions))
    }

    const files = await this.loadAll(pathOrUrlsOrOptions ?? {})

    return files.map(file => textDecoder.decode(file.bytes)).join('')
  }

  async content(options: MaterializeOptions = {}): Promise<Uint8Array> {
    const files = await this.loadAll(options)

    return concatBytes(files.map(file => file.bytes))
  }

  async json<T = unknown>(pathOrUrl?: string, options: MaterializeOptions = {}): Promise<T> {
    const text =
      pathOrUrl === undefined ? await this.text(options) : await this.text(pathOrUrl, options)

    return JSON.parse(text) as T
  }

  async blob(options?: MaterializeOptions): Promise<Blob>
  async blob(pathOrUrl: string, options?: MaterializeOptions): Promise<Blob>
  async blob(pathOrUrls: string[], options?: MaterializeOptions): Promise<Map<string, Blob>>
  async blob(
    pathOrUrlsOrOptions?: string | string[] | MaterializeOptions,
    maybeOptions: MaterializeOptions = {},
  ): Promise<Blob | Map<string, Blob>> {
    if (typeof pathOrUrlsOrOptions === 'string') {
      const bytes = await this.load(pathOrUrlsOrOptions, maybeOptions)

      return new Blob([bytes as unknown as ArrayBuffer])
    }
    if (Array.isArray(pathOrUrlsOrOptions)) {
      return this.blobMany(pathOrUrlsOrOptions, maybeOptions, this.readModeFor(maybeOptions))
    }

    const files = await this.loadAll(pathOrUrlsOrOptions ?? {})

    return new Blob(files.map(file => file.bytes as unknown as ArrayBuffer))
  }

  async loadAll(
    options: MaterializeOptions = {},
  ): Promise<Array<{ entry: RouterFileEntry; bytes: Uint8Array }>> {
    const files = await this.list()
    const loaded = await this.loadMany(files, this.readModeFor(options), options)

    return files.map(file => ({ entry: file, bytes: loaded.get(file)! }))
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    const files = await this.loadAll()

    return files.map(file => ({ path: file.entry.path, bytes: file.bytes }))
  }

  async materialize(options?: MaterializeOptions): Promise<MaterializedFile[]>
  async materialize(pathOrUrl: string, options?: MaterializeOptions): Promise<MaterializedFile>
  async materialize(pathOrUrls: string[], options?: MaterializeOptions): Promise<MaterializedFile[]>
  async materialize(
    pathOrUrlsOrOptions?: string | string[] | MaterializeOptions,
    maybeOptions: MaterializeOptions = {},
  ): Promise<MaterializedFile | MaterializedFile[]> {
    if (typeof pathOrUrlsOrOptions === 'string') {
      return this.materializeOne(pathOrUrlsOrOptions, maybeOptions)
    }
    if (Array.isArray(pathOrUrlsOrOptions)) {
      return this.materializeMany(pathOrUrlsOrOptions, maybeOptions)
    }

    return this.materializeAll(pathOrUrlsOrOptions ?? {})
  }

  async materializeAll(options: MaterializeOptions = {}): Promise<MaterializedFile[]> {
    const files = await this.list()

    return this.materializeEntries(files, options)
  }

  private async materializeOne(
    pathOrUrl: string,
    options: MaterializeOptions = {},
  ): Promise<MaterializedFile> {
    const entry = await this.resolveFile(pathOrUrl)
    const bytes = await this.loadWithMode(pathOrUrl, options, this.readModeFor(options))
    const kind = materializedKind(entry, options.as ?? 'auto')
    const decodeStart = now()
    const text = kind === 'bytes' ? '' : textDecoder.decode(bytes)
    const decodeMs = now() - decodeStart
    const executeStart = now()
    const element = executeMaterialized(kind, text, options.nonce)
    const executeMs = now() - executeStart

    this.emitDebug({
      type: 'materialize',
      path: entry.path,
      kind,
      startMs: decodeStart,
      durationMs: decodeMs + executeMs,
      decodeMs,
      executeMs,
      bytes: bytes.byteLength,
    })

    return { entry, bytes, text, kind, element, timing: { decodeMs, executeMs } }
  }

  private async materializeMany(
    pathOrUrls: string[],
    options: MaterializeOptions = {},
  ): Promise<MaterializedFile[]> {
    const files = await Promise.all(pathOrUrls.map(pathOrUrl => this.resolveFile(pathOrUrl)))

    return this.materializeEntries(files, options)
  }

  async materializeEntries(
    files: RouterFileEntry[],
    options: MaterializeOptions,
    mode: RouterReadMode = this.readModeFor(options),
  ): Promise<MaterializedFile[]> {
    const load = await this.startProgressiveLoad(files, mode, options)
    const materialized: MaterializedFile[] = []

    try {
      for (const file of files) {
        const bytes = await load.ready.get(file)!

        materialized.push(this.materializeLoadedFile(file, bytes, options))
      }
      await load.done
    } catch (error) {
      await load.done.catch(() => undefined)
      throw error
    }

    return materialized
  }

  private readModeFor(options: MaterializeOptions = {}): RouterReadMode {
    const strategy = options.strategy ?? this.options.strategy ?? 'auto'

    return strategy === 'full' || strategy === 'range-fetch' || strategy === 'range-fetch-all'
      ? 'buffered'
      : 'stream'
  }

  private async readManifest(): Promise<RouterTokenManifest> {
    const startMs = now()
    const tokenStartMs = now()
    const pack = await new Token(this.source, this.options).pack()
    const tokenDecodeMs = now() - tokenStartMs

    if (pack.isDiff()) throw new Error('router token cannot be a diff token')
    const text = pack.isPack() ? await pack.text(ROUTER_MANIFEST_PATH) : await pack.text()
    const jsonStartMs = now()
    const manifest = JSON.parse(text) as RouterTokenManifest
    const jsonParseMs = now() - jsonStartMs

    if (manifest.version !== 1) {
      throw new Error(`unsupported router token manifest version: ${manifest.version}`)
    }
    this.emitDebug({
      type: 'manifest',
      startMs,
      durationMs: now() - startMs,
      tokenDecodeMs,
      jsonParseMs,
      chunkCount: manifest.chunks.length,
      fileCount: manifest.files.length,
      byteLength: text.length,
    })

    return manifest
  }

  private async chunkById(): Promise<Map<string, ChunkEntry>> {
    this.chunkByIdPromise ??= (async () => {
      const manifest = await this.manifest()

      return new Map(
        manifest.chunks.map(chunk => [
          chunk.id,
          { ...chunk, url: resolveChunkUrl(chunk.href, this.routerBaseUrl) },
        ]),
      )
    })()

    return this.chunkByIdPromise
  }

  private async fileLookup(): Promise<FileLookupIndex> {
    this.fileLookupPromise ??= (async () => {
      const files = await this.list()
      const byUrl = new Map<string, RouterFileEntry>()
      const byPath = new Map<string, RouterFileEntry[]>()

      for (const file of files) {
        byUrl.set(file.url, file)
        const pathMatches = byPath.get(file.path) ?? []

        pathMatches.push(file)
        byPath.set(file.path, pathMatches)
      }

      return { byUrl, byPath }
    })()

    return this.fileLookupPromise
  }

  async resolveFile(pathOrUrl: string): Promise<RouterFileEntry> {
    const lookup = await this.fileLookup()
    const urlMatch = lookup.byUrl.get(pathOrUrl)

    if (urlMatch) return urlMatch
    const pathMatches = lookup.byPath.get(pathOrUrl) ?? []

    if (pathMatches.length === 1) return pathMatches[0]!
    if (pathMatches.length > 1) {
      throw new Error(
        `router token path is ambiguous: ${pathOrUrl}. Use a full URL or inspect list().`,
      )
    }

    throw new Error(`router token has no file: ${pathOrUrl}`)
  }

  async textMany(
    paths: string[],
    options: MaterializeOptions,
    mode: RouterReadMode,
  ): Promise<Map<string, string>> {
    const files = await Promise.all(paths.map(path => this.resolveFile(path)))
    const loaded = await this.loadMany(files, mode, options)
    const out = new Map<string, string>()

    for (const file of files) out.set(file.url, textDecoder.decode(loaded.get(file)!))

    return out
  }

  async blobMany(
    paths: string[],
    options: MaterializeOptions,
    mode: RouterReadMode,
  ): Promise<Map<string, Blob>> {
    const files = await Promise.all(paths.map(path => this.resolveFile(path)))
    const loaded = await this.loadMany(files, mode, options)
    const out = new Map<string, Blob>()

    for (const file of files) {
      out.set(file.url, new Blob([loaded.get(file)! as unknown as ArrayBuffer]))
    }

    return out
  }

  async loadMany(
    files: RouterFileEntry[],
    mode: RouterReadMode,
    options: MaterializeOptions = {},
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    return this.executeLoadMany(files, mode, options)
  }

  private enqueueSingleLoad(
    file: RouterFileEntry,
    mode: RouterReadMode,
    options: MaterializeOptions,
    cacheKey: string,
  ): Promise<Uint8Array> {
    const batchKey = this.singleLoadBatchKey(mode, options)
    let batch = this.singleLoadBatches.get(batchKey)

    if (!batch) {
      batch = {
        id: ++this.nextBatchId,
        startMs: now(),
        mode,
        options,
        items: [],
      }
      this.singleLoadBatches.set(batchKey, batch)
      this.scheduleSingleLoadBatchFlush(batchKey, batch)
    }

    const deferred = createDeferred<Uint8Array>()

    batch.items.push({ file, cacheKey, deferred })

    return deferred.promise
  }

  private async flushSingleLoadBatch(batchKey: string, batch: SingleLoadBatch): Promise<void> {
    if (this.singleLoadBatches.get(batchKey) !== batch) return
    this.singleLoadBatches.delete(batchKey)

    const files = uniqueFiles(batch.items.map(item => item.file))
    const strategy = batch.options.strategy ?? this.options.strategy ?? 'auto'

    this.emitDebug({
      type: 'batch',
      batchId: batch.id,
      mode: batch.mode,
      strategy,
      startMs: batch.startMs,
      durationMs: now() - batch.startMs,
      fileCount: files.length,
      paths: files.map(file => file.path),
      files: routerDebugPlanFiles(files),
    })

    try {
      const loaded = await this.executeLoadMany(files, batch.mode, batch.options)

      for (const item of batch.items) {
        const bytes = loaded.get(item.file)

        if (!bytes) throw new Error(`router batch did not load file: ${item.file.path}`)
        item.deferred.resolve(bytes)
      }
    } catch (error) {
      for (const item of batch.items) {
        if (this.bytesCache.get(item.cacheKey) === item.deferred.promise) {
          this.bytesCache.delete(item.cacheKey)
        }
        item.deferred.reject(error)
      }
    }
  }

  private singleLoadBatchKey(mode: RouterReadMode, options: MaterializeOptions): string {
    const strategy = options.strategy ?? this.options.strategy ?? 'auto'
    const planner = options.planner ? JSON.stringify(options.planner) : ''
    const batchWindowMs = this.singleLoadBatchWindowMs(options)

    return `${mode}:${strategy}:${batchWindowMs}:${planner}`
  }

  private scheduleSingleLoadBatchFlush(batchKey: string, batch: SingleLoadBatch): void {
    const batchWindowMs = this.singleLoadBatchWindowMs(batch.options)

    if (batchWindowMs <= 0) {
      queueMicrotask(() => this.flushSingleLoadBatch(batchKey, batch))

      return
    }

    setTimeout(() => this.flushSingleLoadBatch(batchKey, batch), batchWindowMs)
  }

  private singleLoadBatchWindowMs(options: MaterializeOptions): number {
    const configured = options.singleLoadBatchWindowMs ?? this.options.singleLoadBatchWindowMs

    if (configured === undefined) return SINGLE_LOAD_BATCH_WINDOW_MS
    if (!Number.isFinite(configured) || configured <= 0) return 0

    return configured
  }

  private async executeLoadMany(
    files: readonly RouterFileEntry[],
    mode: RouterReadMode,
    options: MaterializeOptions = {},
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    const plan = await this.createLoadPlan(files, mode, options)

    if (plan.kind === 'whole-chunks') {
      return this.loadFromWholeChunks(files, plan.chunks, plan.mode, plan.concurrency)
    }

    if (plan.kind === 'merged-ranges' || plan.kind === 'single-merged') {
      return this.loadFromRanges(files, plan.ranges, plan.mode, plan.concurrency)
    }

    const compressedByFile = new Map<RouterFileEntry, Uint8Array>()
    const directCompressedByFile = new Map<RouterFileEntry, Uint8Array>()

    await mapWithConcurrency(plan.segments, plan.concurrency, async item => {
      const bytes = await this.segmentBytes(item.chunk, item.segment, plan.mode)

      this.addCompressedSegment(
        item.file,
        item.segment,
        bytes,
        compressedByFile,
        directCompressedByFile,
      )
    })

    const entries = await Promise.all(
      files.map(
        async file =>
          [
            file,
            await this.decompressFile(
              file,
              directCompressedByFile.get(file) ?? compressedByFile.get(file)!,
            ),
          ] as const,
      ),
    )

    return new Map(entries)
  }

  private async startProgressiveLoad(
    files: readonly RouterFileEntry[],
    mode: RouterReadMode,
    options: MaterializeOptions = {},
  ): Promise<ProgressiveLoad> {
    const plan = await this.createLoadPlan(files, mode, options)
    const states = new Map(
      files.map(file => [
        file,
        {
          file,
          pendingSegments: file.segments.length,
          deferred: createDeferred<Uint8Array>(),
        } satisfies ProgressiveFileState,
      ]),
    )
    const ready = new Map([...states].map(([file, state]) => [file, state.deferred.promise]))
    const done = (async () => {
      try {
        if (plan.kind === 'whole-chunks') {
          await this.progressiveWholeChunks(files, plan.chunks, plan.mode, plan.concurrency, states)
        } else if (plan.kind === 'merged-ranges' || plan.kind === 'single-merged') {
          await this.progressiveRanges(plan.ranges, plan.mode, plan.concurrency, states)
        } else {
          await this.progressiveSegments(plan.segments, plan.mode, plan.concurrency, states)
        }
      } catch (error) {
        rejectPending(states, error)
        throw error
      }
    })()

    done.catch(() => undefined)

    return { ready, done }
  }

  private async progressiveSegments(
    segments: readonly RouterPlannedSegment[],
    mode: RouterReadMode,
    concurrency: number,
    states: Map<RouterFileEntry, ProgressiveFileState>,
  ): Promise<void> {
    await mapWithConcurrency(segments, concurrency, async item => {
      const bytes = await this.segmentBytes(item.chunk, item.segment, mode)

      await this.addProgressiveSegment(states.get(item.file)!, item.segment, bytes)
    })
  }

  private async progressiveRanges(
    ranges: readonly RouterChunkRange[],
    mode: RouterReadMode,
    concurrency: number,
    states: Map<RouterFileEntry, ProgressiveFileState>,
  ): Promise<void> {
    await mapWithConcurrency(ranges, concurrency, async range => {
      const bytes = await this.rangeBytes(range.chunk, range.offset, range.length, mode)

      await Promise.all(
        range.segments.map(item => {
          const localOffset = item.segment.offset - range.offset
          const segmentBytes = bytes.subarray(localOffset, localOffset + item.segment.length)

          return this.addProgressiveSegment(states.get(item.file)!, item.segment, segmentBytes)
        }),
      )
    })
  }

  private async progressiveWholeChunks(
    files: readonly RouterFileEntry[],
    chunks: readonly ChunkEntry[],
    mode: RouterReadMode,
    concurrency: number,
    states: Map<RouterFileEntry, ProgressiveFileState>,
  ): Promise<void> {
    const byChunk = new Map<string, Array<{ file: RouterFileEntry; segment: RouterFileSegment }>>()

    for (const file of files) {
      for (const segment of file.segments) {
        const items = byChunk.get(segment.chunkId) ?? []

        items.push({ file, segment })
        byChunk.set(segment.chunkId, items)
      }
    }

    await mapWithConcurrency(chunks, concurrency, async chunk => {
      const chunkBytes = await this.chunkBytes(chunk, mode)
      const items = byChunk.get(chunk.id) ?? []

      await Promise.all(
        items.map(item => {
          const bytes = chunkBytes.subarray(
            item.segment.offset,
            item.segment.offset + item.segment.length,
          )

          return this.addProgressiveSegment(states.get(item.file)!, item.segment, bytes)
        }),
      )
    })
  }

  private async addProgressiveSegment(
    state: ProgressiveFileState,
    segment: RouterFileSegment,
    bytes: Uint8Array,
  ): Promise<void> {
    if (this.isCompleteCompressedFileSegment(state.file, segment, bytes)) {
      state.directCompressed = bytes
    } else {
      state.directCompressed = undefined
      state.compressed ??= new Uint8Array(this.compressedLength(state.file))
      state.compressed.set(bytes, segment.fileOffset ?? 0)
    }

    state.pendingSegments -= 1
    if (state.pendingSegments > 0) return

    try {
      const compressed = state.directCompressed ?? state.compressed

      if (!compressed) throw new Error(`router file had no loaded bytes: ${state.file.path}`)
      state.deferred.resolve(await this.decompressFile(state.file, compressed))
    } catch (error) {
      state.deferred.reject(error)
      throw error
    }
  }

  private materializeLoadedFile(
    file: RouterFileEntry,
    bytes: Uint8Array,
    options: MaterializeOptions,
  ): MaterializedFile {
    const startMs = now()
    const kind = materializedKind(file, options.as ?? 'auto')
    const decodeStart = now()
    const text = kind === 'bytes' ? '' : textDecoder.decode(bytes)
    const decodeMs = now() - decodeStart
    const executeStart = now()
    const element = executeMaterialized(kind, text, options.nonce)
    const executeMs = now() - executeStart

    this.emitDebug({
      type: 'materialize',
      path: file.path,
      kind,
      startMs,
      durationMs: now() - startMs,
      decodeMs,
      executeMs,
      bytes: bytes.byteLength,
    })

    return { entry: file, bytes, text, kind, element, timing: { decodeMs, executeMs } }
  }

  private async createLoadPlan(
    files: readonly RouterFileEntry[],
    mode: RouterReadMode,
    options: MaterializeOptions,
  ): Promise<RouterLoadPlan> {
    const startMs = now()
    const strategy = options.strategy ?? this.options.strategy ?? 'auto'
    const plan = planRouterLoad(files, await this.chunkById(), {
      allFiles: await this.list(),
      mode,
      ...(options.planner ?? {}),
      strategy,
    })

    this.emitDebug({
      type: 'plan',
      startMs,
      durationMs: now() - startMs,
      kind: plan.kind,
      mode: plan.mode,
      strategy,
      reason: plan.reason,
      fileCount: files.length,
      paths: files.map(file => file.path),
      files: routerDebugPlanFiles(files),
      chunkIds: chunkIdsForPlan(plan),
      requestCount: plan.estimate.requestCount,
      chunkCount: plan.estimate.chunkCount,
      segmentCount: plan.estimate.segmentCount,
      selectedBytes: plan.estimate.selectedBytes,
      fetchedBytes: plan.estimate.fetchedBytes,
      concurrency: plan.concurrency,
    })

    return plan
  }

  private async loadFromWholeChunks(
    files: readonly RouterFileEntry[],
    chunks: readonly ChunkEntry[],
    mode: RouterReadMode,
    concurrency: number,
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    const compressedByFile = new Map<RouterFileEntry, Uint8Array>()
    const directCompressedByFile = new Map<RouterFileEntry, Uint8Array>()
    const chunkBytesById = new Map<string, Uint8Array>()

    await mapWithConcurrency(chunks, concurrency, async chunk => {
      chunkBytesById.set(chunk.id, await this.chunkBytes(chunk, mode))
    })

    for (const file of files) {
      for (const segment of file.segments) {
        const chunkBytes = chunkBytesById.get(segment.chunkId)!
        const bytes = chunkBytes.subarray(segment.offset, segment.offset + segment.length)

        this.addCompressedSegment(file, segment, bytes, compressedByFile, directCompressedByFile)
      }
    }

    const entries = await Promise.all(
      files.map(
        async file =>
          [
            file,
            await this.decompressFile(
              file,
              directCompressedByFile.get(file) ?? compressedByFile.get(file)!,
            ),
          ] as const,
      ),
    )

    return new Map(entries)
  }

  private async loadFromRanges(
    files: readonly RouterFileEntry[],
    ranges: readonly RouterChunkRange[],
    mode: RouterReadMode,
    concurrency: number,
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    const compressedByFile = new Map<RouterFileEntry, Uint8Array>()
    const directCompressedByFile = new Map<RouterFileEntry, Uint8Array>()

    await mapWithConcurrency(ranges, concurrency, async range => {
      const bytes = await this.rangeBytes(range.chunk, range.offset, range.length, mode)

      for (const item of range.segments) {
        const localOffset = item.segment.offset - range.offset
        const segmentBytes = bytes.subarray(localOffset, localOffset + item.segment.length)

        this.addCompressedSegment(
          item.file,
          item.segment,
          segmentBytes,
          compressedByFile,
          directCompressedByFile,
        )
      }
    })

    const entries = await Promise.all(
      files.map(
        async file =>
          [
            file,
            await this.decompressFile(
              file,
              directCompressedByFile.get(file) ?? compressedByFile.get(file)!,
            ),
          ] as const,
      ),
    )

    return new Map(entries)
  }

  private addCompressedSegment(
    file: RouterFileEntry,
    segment: RouterFileSegment,
    bytes: Uint8Array,
    compressedByFile: Map<RouterFileEntry, Uint8Array>,
    directCompressedByFile: Map<RouterFileEntry, Uint8Array>,
  ): void {
    if (this.isCompleteCompressedFileSegment(file, segment, bytes)) {
      directCompressedByFile.set(file, bytes)

      return
    }

    directCompressedByFile.delete(file)
    let compressed = compressedByFile.get(file)

    if (!compressed) {
      compressed = new Uint8Array(this.compressedLength(file))
      compressedByFile.set(file, compressed)
    }
    compressed.set(bytes, segment.fileOffset ?? 0)
  }

  private isCompleteCompressedFileSegment(
    file: RouterFileEntry,
    segment: RouterFileSegment,
    bytes: Uint8Array,
  ): boolean {
    return (
      (segment.fileOffset ?? 0) === 0 &&
      segment.length === this.compressedLength(file) &&
      bytes.byteLength === segment.length
    )
  }

  private compressedLength(file: RouterFileEntry): number {
    return file.compressedByteLength ?? file.byteLength
  }

  private async decompressFile(file: RouterFileEntry, compressed: Uint8Array): Promise<Uint8Array> {
    if (!file.compressor) return compressed

    const startMs = now()
    const bytes = await decompressRaw(compressed, file.compressor, {
      level: file.level ?? 0,
      uncompressedLength: file.byteLength,
    })

    this.emitDebug({
      type: 'decompress',
      path: file.path,
      compressor: file.compressor,
      level: file.level,
      startMs,
      durationMs: now() - startMs,
      compressedBytes: compressed.byteLength,
      rawBytes: bytes.byteLength,
    })

    return bytes
  }

  private chunkBytes(chunk: ChunkEntry, mode: RouterReadMode): Promise<Uint8Array> {
    const cacheKey = `${mode}:${chunk.id}`
    let cached = this.chunkBytesCache.get(cacheKey)
    const startMs = now()
    const cacheState: 'miss' | 'pending' | 'hit' = !cached
      ? 'miss'
      : this.chunkBytesSettled.has(cacheKey)
        ? 'hit'
        : 'pending'

    if (!cached) {
      const promise = this.decodeChunkBytes(chunk, mode)

      cached = promise
        .then(bytes => {
          this.chunkBytesSettled.add(cacheKey)
          this.emitDebug({
            type: 'chunk',
            chunkId: chunk.id,
            url: chunk.url,
            mode,
            cacheState,
            startMs,
            durationMs: now() - startMs,
            pngBytes: chunk.byteLength,
            payloadBytes: bytes.byteLength,
          })

          return bytes
        })
        .catch(error => {
          if (this.chunkBytesCache.get(cacheKey) === cached) {
            this.chunkBytesCache.delete(cacheKey)
            this.chunkBytesSettled.delete(cacheKey)
          }

          throw error
        })
      this.chunkBytesCache.set(cacheKey, cached)
    } else {
      cached.then(
        bytes => {
          this.emitDebug({
            type: 'chunk',
            chunkId: chunk.id,
            url: chunk.url,
            mode,
            cacheState,
            startMs,
            durationMs: now() - startMs,
            pngBytes: chunk.byteLength,
            payloadBytes: bytes.byteLength,
          })
        },
        () => undefined,
      )
    }

    return cached
  }

  private async segmentBytes(
    chunk: ChunkEntry,
    segment: RouterFileSegment,
    mode: RouterReadMode,
  ): Promise<Uint8Array> {
    if (segmentCoversChunkPayload(chunk, segment)) {
      const bytes = await this.chunkBytes(chunk, mode)

      return bytes.byteLength === segment.length
        ? bytes
        : bytes.subarray(segment.offset, segment.offset + segment.length)
    }

    try {
      const handle = await this.chunkPayloadHandle(chunk)

      if (mode === 'stream') {
        return this.fetchRangeBytes(chunk, segment.offset, segment.length, mode, async () =>
          readStreamBytes(
            await fetchPixelRangePayloadStream(handle, segment.offset, segment.length),
          ),
        )
      }

      return this.fetchRangeBytes(chunk, segment.offset, segment.length, mode, () =>
        fetchPixelRangePayloadBytes(handle, segment.offset, segment.length),
      )
    } catch {
      const chunkBytes = await this.chunkBytes(chunk, mode)

      const bytes = chunkBytes.subarray(segment.offset, segment.offset + segment.length)

      this.emitDebug({
        type: 'range',
        chunkId: chunk.id,
        url: chunk.url,
        mode,
        startMs: now(),
        durationMs: 0,
        offset: segment.offset,
        length: segment.length,
        bytes: bytes.byteLength,
        fallback: true,
      })

      return bytes
    }
  }

  private async rangeBytes(
    chunk: ChunkEntry,
    offset: number,
    length: number,
    mode: RouterReadMode,
  ): Promise<Uint8Array> {
    try {
      const handle = await this.chunkPayloadHandle(chunk)

      if (mode === 'stream') {
        return this.fetchRangeBytes(chunk, offset, length, mode, async () =>
          readStreamBytes(await fetchPixelRangePayloadStream(handle, offset, length)),
        )
      }

      return this.fetchRangeBytes(chunk, offset, length, mode, () =>
        fetchPixelRangePayloadBytes(handle, offset, length),
      )
    } catch {
      const chunkBytes = await this.chunkBytes(chunk, mode)

      const bytes = chunkBytes.subarray(offset, offset + length)

      this.emitDebug({
        type: 'range',
        chunkId: chunk.id,
        url: chunk.url,
        mode,
        startMs: now(),
        durationMs: 0,
        offset,
        length,
        bytes: bytes.byteLength,
        fallback: true,
      })

      return bytes
    }
  }

  private async fetchRangeBytes(
    chunk: ChunkEntry,
    offset: number,
    length: number,
    mode: RouterReadMode,
    read: () => Promise<Uint8Array>,
  ): Promise<Uint8Array> {
    const startMs = now()
    const bytes = await read()

    this.emitDebug({
      type: 'range',
      chunkId: chunk.id,
      url: chunk.url,
      mode,
      startMs,
      durationMs: now() - startMs,
      offset,
      length,
      bytes: bytes.byteLength,
      fallback: false,
    })

    return bytes
  }

  private chunkPayloadHandle(chunk: ChunkEntry): Promise<PixelRangePayloadHandle> {
    if (typeof chunk.payloadOffset === 'number') {
      const startMs = now()

      this.emitDebug({
        type: 'payload-handle',
        chunkId: chunk.id,
        url: chunk.url,
        cacheState: 'hit',
        startMs,
        durationMs: 0,
        payloadOffset: chunk.payloadOffset,
        payloadBytes: chunk.byteLength ?? 0,
        prefetchedBytes: 0,
      })

      return Promise.resolve({
        url: chunk.url,
        prefetchedBytes: new Uint8Array(0),
        payloadAbsOffset: chunk.payloadOffset,
        payloadByteLength: chunk.byteLength ?? 0,
      })
    }

    const initialBytes = CHUNK_PAYLOAD_HEADER_BYTES
    const cached = this.chunkPayloadHandleCache.get(chunk.id)

    if (cached && cached.initialBytes >= initialBytes) {
      const startMs = now()
      const cacheState: 'pending' | 'hit' = this.chunkPayloadHandleSettled.has(chunk.id)
        ? 'hit'
        : 'pending'

      return cached.promise.then(handle => {
        this.emitDebug({
          type: 'payload-handle',
          chunkId: chunk.id,
          url: chunk.url,
          cacheState,
          startMs,
          durationMs: now() - startMs,
          payloadOffset: handle.payloadAbsOffset,
          payloadBytes: handle.payloadByteLength,
          prefetchedBytes: handle.prefetchedBytes.byteLength,
        })

        return handle
      })
    }

    const startMs = now()
    const promise = fetchPixelRangePayloadHandle(chunk.url, initialBytes).then(handle => {
      this.chunkPayloadHandleSettled.add(chunk.id)
      this.emitDebug({
        type: 'payload-handle',
        chunkId: chunk.id,
        url: chunk.url,
        cacheState: 'miss',
        startMs,
        durationMs: now() - startMs,
        payloadOffset: handle.payloadAbsOffset,
        payloadBytes: handle.payloadByteLength,
        prefetchedBytes: handle.prefetchedBytes.byteLength,
      })

      return handle
    })

    this.chunkPayloadHandleCache.set(chunk.id, { initialBytes, promise })

    return promise.catch(error => {
      if (this.chunkPayloadHandleCache.get(chunk.id)?.promise === promise) {
        this.chunkPayloadHandleCache.delete(chunk.id)
      }

      throw error
    })
  }

  private async decodeChunkBytes(chunk: ChunkEntry, mode: RouterReadMode): Promise<Uint8Array> {
    const { bytes } =
      mode === 'stream'
        ? await decodeStreamPayload(chunk.url, this.options)
        : await decodeSourceToPayload(chunk.url, this.options)

    return bytes
  }

  private emitDebug(event: RouterDebugEvent): void {
    this.options.debug?.(event)
  }
}

async function readStreamBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    if (!value) continue
    chunks.push(value)
  }

  return concatBytes(chunks)
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

function uniqueFiles(files: readonly RouterFileEntry[]): RouterFileEntry[] {
  const seen = new Set<string>()
  const unique: RouterFileEntry[] = []

  for (const file of files) {
    if (seen.has(file.url)) continue
    seen.add(file.url)
    unique.push(file)
  }

  return unique
}

function routerDebugPlanFiles(files: readonly RouterFileEntry[]): RouterDebugPlanFile[] {
  return files.map(file => ({
    path: file.path,
    url: file.url,
    chunkIds: [...new Set(file.segments.map(segment => segment.chunkId))],
    segmentCount: file.segments.length,
    rawBytes: file.byteLength,
    compressedBytes: file.compressedByteLength ?? file.byteLength,
  }))
}

function rejectPending(
  states: ReadonlyMap<RouterFileEntry, ProgressiveFileState>,
  error: unknown,
): void {
  for (const state of states.values()) {
    if (state.pendingSegments > 0) state.deferred.reject(error)
  }
}

function chunkIdsForPlan(plan: RouterLoadPlan): string[] {
  if (plan.kind === 'whole-chunks') return plan.chunks.map(chunk => chunk.id)

  const ids =
    plan.kind === 'parallel-segments'
      ? plan.segments.map(item => item.chunk.id)
      : plan.ranges.map(range => range.chunk.id)

  return [...new Set(ids)]
}

export class RouterTokenStreamApi {
  constructor(private readonly router: RouterToken) {}

  async text(): Promise<string>
  async text(path: string): Promise<string>
  async text(path: string[]): Promise<Map<string, string>>
  async text(path?: string | string[]): Promise<string | Map<string, string>> {
    if (typeof path === 'string') {
      return textDecoder.decode(await this.router.loadStream(path))
    }
    if (Array.isArray(path)) {
      return this.router.textMany(path, {}, 'stream')
    }
    const files = await this.router.list()
    const loaded = await this.router.loadMany(files, 'stream')

    return files.map(file => textDecoder.decode(loaded.get(file)!)).join('')
  }

  async blob(): Promise<Blob>
  async blob(path: string): Promise<Blob>
  async blob(path: string[]): Promise<Map<string, Blob>>
  async blob(path?: string | string[]): Promise<Blob | Map<string, Blob>> {
    if (typeof path === 'string') {
      return new Blob([(await this.router.loadStream(path)) as unknown as ArrayBuffer])
    }
    if (Array.isArray(path)) {
      return this.router.blobMany(path, {}, 'stream')
    }
    const files = await this.router.list()
    const loaded = await this.router.loadMany(files, 'stream')

    return new Blob(files.map(file => loaded.get(file)! as unknown as ArrayBuffer))
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    const files = await this.router.list()
    const loaded = await this.router.loadMany(files, 'stream')

    return files.map(file => ({ path: file.path, bytes: loaded.get(file)! }))
  }

  async materialize(path?: string | string[]): Promise<MaterializedFile | MaterializedFile[]> {
    const paths = Array.isArray(path)
      ? path
      : path
        ? [path]
        : (await this.router.list()).map(file => file.url)
    const files = await Promise.all(paths.map(item => this.router.resolveFile(item)))
    const materialized = await this.router.materializeEntries(files, {}, 'stream')

    return Array.isArray(path) || path === undefined ? materialized : materialized[0]!
  }
}

export async function maybeRouterToken(
  rawPack: Pack,
  source: DecodeSource,
  options: DecodeRouterOptions = {},
): Promise<Pack> {
  const manifest = await maybeReadRouterManifest(rawPack)

  return manifest ? new RouterToken(source, options, manifest) : withBrowserMaterialize(rawPack)
}

export function withBrowserMaterialize(pack: Pack): Pack {
  if (pack.isRouter()) return pack

  const target = pack as Pack & {
    materialize?: (path?: string | string[]) => Promise<unknown>
  }

  if (pack.isDiff()) return pack

  target.materialize = async (path?: string | string[]) => materializePack(pack, path)

  return target
}

async function maybeReadRouterManifest(pack: Pack): Promise<RouterTokenManifest | null> {
  if (pack.isRouter() || pack.isDiff()) return null

  try {
    const text = pack.isPack()
      ? await readPackRouterManifest(pack)
      : await readFileRouterManifest(pack)
    const manifest = JSON.parse(text) as RouterTokenManifest

    return manifest?.version === 1 &&
      Array.isArray(manifest.chunks) &&
      Array.isArray(manifest.files)
      ? manifest
      : null
  } catch {
    return null
  }
}

async function readPackRouterManifest(pack: DirPack): Promise<string> {
  if (!pack.entries.some(entry => entry.path === ROUTER_MANIFEST_PATH)) {
    throw new Error('not a router pack')
  }

  return pack.text(ROUTER_MANIFEST_PATH)
}

async function readFileRouterManifest(pack: FilePack): Promise<string> {
  if (pack.list[0] !== ROUTER_MANIFEST_PATH) throw new Error('not a router file')

  return pack.text()
}

async function materializePack(
  pack: FilePack | DirPack,
  path?: string | string[],
): Promise<MaterializedFile | MaterializedFile[]> {
  if (pack.isPack()) {
    const paths = Array.isArray(path) ? path : path ? [path] : pack.list
    const files = await Promise.all(
      paths.map(async filePath => ({
        path: filePath,
        bytes: await pack.extract(filePath),
      })),
    )
    const materialized = files.map(file => materializeBytes(file.path, file.bytes, {}))

    return Array.isArray(path) || path === undefined ? materialized : materialized[0]!
  }

  if (Array.isArray(path))
    throw new Error('FilePack.materialize: array path is only valid for packs')
  const filePath = path ?? pack.list[0] ?? ''

  return materializeBytes(filePath, await pack.content(), {})
}

function materializeBytes(
  path: string,
  bytes: Uint8Array,
  headers: Readonly<Record<string, string>>,
): MaterializedFile {
  const entry: RouterFileEntry = {
    url: path,
    path,
    status: 200,
    headers,
    byteLength: bytes.byteLength,
    segments: [],
  }
  const kind = materializedKind(entry, 'auto')
  const text = kind === 'bytes' ? '' : textDecoder.decode(bytes)
  const executeStart = now()
  const element = executeMaterialized(kind, text, undefined)
  const executeMs = now() - executeStart

  return { entry, bytes, text, kind, element, timing: { decodeMs: 0, executeMs } }
}

function resolveRouterBaseUrl(source: DecodeSource, baseUrl: string | undefined): string {
  if (baseUrl) return baseUrl
  if (typeof source === 'string') {
    const documentBase = typeof document === 'undefined' ? undefined : document.baseURI
    const locationBase = typeof location === 'undefined' ? undefined : location.href

    return new URL(source, documentBase ?? locationBase).href
  }

  throw new Error('decodeRouter(source): baseUrl is required when source is not a URL string')
}

function resolveChunkUrl(href: string, routerBaseUrl: string): string {
  const routerUrl = new URL(routerBaseUrl)
  const chunkUrl = new URL(href, routerUrl)

  if (!chunkUrl.search && routerUrl.search) chunkUrl.search = routerUrl.search

  return chunkUrl.href
}

function materializedKind(
  entry: RouterFileEntry,
  as: NonNullable<MaterializeOptions['as']>,
): MaterializedFile['kind'] {
  if (as !== 'auto') return as === 'bytes' ? 'bytes' : as
  const contentType = entry.headers['content-type'] ?? entry.headers['Content-Type'] ?? ''
  const path = entry.path.toLowerCase()

  if (contentType.includes('javascript') || path.endsWith('.js') || path.endsWith('.mjs')) {
    return 'js'
  }
  if (contentType.includes('css') || path.endsWith('.css')) return 'css'
  if (contentType.startsWith('text/') || path.endsWith('.json')) return 'text'

  return 'bytes'
}

function executeMaterialized(
  kind: MaterializedFile['kind'],
  text: string,
  nonce: string | undefined,
): HTMLScriptElement | HTMLStyleElement | null {
  if (kind !== 'js' && kind !== 'css') return null
  if (typeof document === 'undefined') {
    throw new Error(`RouterToken.materialize(${kind}): document is not available`)
  }

  if (kind === 'css') {
    const style = document.createElement('style')

    if (nonce) style.nonce = nonce
    style.textContent = text
    document.head.appendChild(style)

    return style
  }

  const script = document.createElement('script')

  if (nonce) script.nonce = nonce
  script.text = text
  document.head.appendChild(script)

  return script
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}

async function mapWithConcurrency<T>(
  values: readonly T[],
  concurrency: number,
  fn: (value: T) => Promise<void>,
): Promise<void> {
  let next = 0
  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), Math.max(1, values.length)) },
    async () => {
      for (;;) {
        const index = next

        next += 1
        if (index >= values.length) return
        await fn(values[index]!)
      }
    },
  )

  await Promise.all(workers)
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}
