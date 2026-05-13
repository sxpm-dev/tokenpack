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
import { Token } from './token'

export type { RouterTokenManifest } from 'tokenpack'

export type RouterLoadStrategy =
  | 'auto'
  | 'full'
  | 'range-fetch'
  | 'range-stream'
  | 'range-fetch-all'
  | 'range-stream-all'

export interface DecodeRouterOptions extends DecodeOptions {
  /** Required when `source` is not a URL string, because chunk hrefs are relative. */
  baseUrl?: string
  strategy?: RouterLoadStrategy
}

export interface RouterFileEntry extends RouterFileManifestEntry {
  segments: RouterFileSegment[]
}

export interface MaterializeOptions {
  strategy?: RouterLoadStrategy
  as?: 'auto' | 'bytes' | 'text' | 'js' | 'css'
  nonce?: string
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

interface ChunkEntry extends RouterChunkManifestEntry {
  url: string
}

interface FileLookupIndex {
  byUrl: Map<string, RouterFileEntry>
  byPath: Map<string, RouterFileEntry[]>
}

type RouterReadMode = 'buffered' | 'stream'

interface ChunkPayloadHandleCacheEntry {
  initialBytes: number
  promise: Promise<PixelRangePayloadHandle>
}

const textDecoder = new TextDecoder()
const CHUNK_PAYLOAD_HEADER_BYTES = 8192

export async function decodeRouter(
  source: DecodeSource,
  options: DecodeRouterOptions = {},
): Promise<Pack> {
  const decoded =
    typeof source === 'string'
      ? await decodeStream(source, options)
      : await new Token(source, options).pack()
  const pack = await maybeRouterToken(decoded, source, options)

  if (!pack.isRouter()) throw new Error('decodeRouter(source): token is not a router token')

  return pack
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
  private bytesCache = new Map<string, Promise<Uint8Array>>()

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
      cached = this.loadOne(entry, mode)
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
    const loaded = await this.loadMany(files, this.readModeFor(options))

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
    const decodeStart = now()
    const text = textDecoder.decode(bytes)
    const decodeMs = now() - decodeStart
    const kind = materializedKind(entry, options.as ?? 'auto')
    const executeStart = now()
    const element = executeMaterialized(kind, text, options.nonce)
    const executeMs = now() - executeStart

    return { entry, bytes, text, kind, element, timing: { decodeMs, executeMs } }
  }

  private async materializeMany(
    pathOrUrls: string[],
    options: MaterializeOptions = {},
  ): Promise<MaterializedFile[]> {
    const files = await Promise.all(pathOrUrls.map(pathOrUrl => this.resolveFile(pathOrUrl)))

    return this.materializeEntries(files, options)
  }

  private async materializeEntries(
    files: RouterFileEntry[],
    options: MaterializeOptions,
  ): Promise<MaterializedFile[]> {
    const loaded = await this.loadMany(files, this.readModeFor(options))

    return Promise.all(
      files.map(async file => {
        const bytes = loaded.get(file)!
        const decodeStart = now()
        const text = textDecoder.decode(bytes)
        const decodeMs = now() - decodeStart
        const kind = materializedKind(file, options.as ?? 'auto')
        const executeStart = now()
        const element = executeMaterialized(kind, text, options.nonce)
        const executeMs = now() - executeStart

        return { entry: file, bytes, text, kind, element, timing: { decodeMs, executeMs } }
      }),
    )
  }

  private readModeFor(options: MaterializeOptions = {}): RouterReadMode {
    const strategy = options.strategy ?? this.options.strategy ?? 'auto'

    return strategy === 'full' || strategy === 'range-fetch' || strategy === 'range-fetch-all'
      ? 'buffered'
      : 'stream'
  }

  private async readManifest(): Promise<RouterTokenManifest> {
    const pack = await new Token(this.source, this.options).pack()

    if (pack.isDiff()) throw new Error('router token cannot be a diff token')
    const text = pack.isPack() ? await pack.text(ROUTER_MANIFEST_PATH) : await pack.text()
    const manifest = JSON.parse(text) as RouterTokenManifest

    if (manifest.version !== 1) {
      throw new Error(`unsupported router token manifest version: ${manifest.version}`)
    }

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
    const loaded = await this.loadMany(files, mode)
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
    const loaded = await this.loadMany(files, mode)
    const out = new Map<string, Blob>()

    for (const file of files) {
      out.set(file.url, new Blob([loaded.get(file)! as unknown as ArrayBuffer]))
    }

    return out
  }

  private async loadOne(entry: RouterFileEntry, mode: RouterReadMode): Promise<Uint8Array> {
    const chunks = await this.chunkById()
    const out = new Uint8Array(entry.compressedByteLength ?? entry.byteLength)

    await this.primeChunkPayloadHandles([entry], chunks)

    await Promise.all(
      entry.segments.map(async segment => {
        const chunk = chunks.get(segment.chunkId)

        if (!chunk) throw new Error(`router file references missing chunk: ${segment.chunkId}`)
        const bytes = await this.segmentBytes(chunk, segment, mode)

        out.set(bytes, segment.fileOffset ?? 0)
      }),
    )

    if (!entry.compressor) return out

    return decompressRaw(out, entry.compressor, {
      level: entry.level ?? 0,
      uncompressedLength: entry.byteLength,
    })
  }

  async loadMany(
    files: RouterFileEntry[],
    mode: RouterReadMode,
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    const chunks = await this.chunkById()

    if (await this.isCompleteFileSet(files)) {
      return this.loadCompleteFileSet(files, chunks, mode)
    }

    await this.primeChunkPayloadHandles(files, chunks)
    const entries = await Promise.all(
      files.map(async file => [file, await this.loadOne(file, mode)] as const),
    )

    return new Map(entries)
  }

  private async isCompleteFileSet(files: readonly RouterFileEntry[]): Promise<boolean> {
    const allFiles = await this.list()

    if (files.length !== allFiles.length) return false
    const requested = new Set(files)

    return allFiles.every(file => requested.has(file))
  }

  private async loadCompleteFileSet(
    files: readonly RouterFileEntry[],
    chunks: ReadonlyMap<string, ChunkEntry>,
    mode: RouterReadMode,
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    const chunkIds = new Set<string>()
    const compressedByFile = new Map<RouterFileEntry, Uint8Array>()

    for (const file of files) {
      compressedByFile.set(file, new Uint8Array(file.compressedByteLength ?? file.byteLength))
      for (const segment of file.segments) {
        if (!chunks.has(segment.chunkId)) {
          throw new Error(`router file references missing chunk: ${segment.chunkId}`)
        }
        chunkIds.add(segment.chunkId)
      }
    }

    const chunkBytesById = new Map(
      await Promise.all(
        [...chunkIds].map(async chunkId => {
          const chunk = chunks.get(chunkId)!

          return [chunkId, await this.chunkBytes(chunk, mode)] as const
        }),
      ),
    )

    await Promise.all(
      files.map(async file => {
        const compressed = compressedByFile.get(file)!

        for (const segment of file.segments) {
          const chunkBytes = chunkBytesById.get(segment.chunkId)!

          compressed.set(
            chunkBytes.subarray(segment.offset, segment.offset + segment.length),
            segment.fileOffset ?? 0,
          )
        }
      }),
    )

    const entries = await Promise.all(
      files.map(async file => {
        const compressed = compressedByFile.get(file)!
        const bytes = file.compressor
          ? await decompressRaw(compressed, file.compressor, {
              level: file.level ?? 0,
              uncompressedLength: file.byteLength,
            })
          : compressed

        return [file, bytes] as const
      }),
    )

    return new Map(entries)
  }

  private async primeChunkPayloadHandles(
    files: readonly RouterFileEntry[],
    chunks: ReadonlyMap<string, ChunkEntry>,
  ): Promise<void> {
    const chunkIds = new Set<string>()

    for (const file of files) {
      for (const segment of file.segments) {
        const chunk = chunks.get(segment.chunkId)

        if (!chunk) {
          throw new Error(`router file references missing chunk: ${segment.chunkId}`)
        }
        if (segmentCoversChunkPayload(chunk, segment)) continue
        chunkIds.add(segment.chunkId)
      }
    }

    await Promise.all(
      [...chunkIds].map(async chunkId => {
        const chunk = chunks.get(chunkId)!

        await this.chunkPayloadHandle(chunk)
      }),
    )
  }

  private chunkBytes(chunk: ChunkEntry, mode: RouterReadMode): Promise<Uint8Array> {
    const cacheKey = `${mode}:${chunk.id}`
    let cached = this.chunkBytesCache.get(cacheKey)

    if (!cached) {
      cached = this.decodeChunkBytes(chunk, mode)
      this.chunkBytesCache.set(cacheKey, cached)
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
        return readStreamBytes(
          await fetchPixelRangePayloadStream(handle, segment.offset, segment.length),
        )
      }

      return fetchPixelRangePayloadBytes(handle, segment.offset, segment.length)
    } catch {
      const chunkBytes = await this.chunkBytes(chunk, mode)

      return chunkBytes.subarray(segment.offset, segment.offset + segment.length)
    }
  }

  private chunkPayloadHandle(chunk: ChunkEntry): Promise<PixelRangePayloadHandle> {
    const initialBytes = CHUNK_PAYLOAD_HEADER_BYTES
    const cached = this.chunkPayloadHandleCache.get(chunk.id)

    if (cached && cached.initialBytes >= initialBytes) return cached.promise

    const promise = fetchPixelRangePayloadHandle(chunk.url, initialBytes)

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
}

function segmentCoversChunkPayload(chunk: ChunkEntry, segment: RouterFileSegment): boolean {
  return (
    typeof chunk.byteLength === 'number' &&
    segment.offset === 0 &&
    segment.length === chunk.byteLength
  )
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
    const loaded = await this.router.loadMany(files, 'stream')
    const materialized = files.map(file => {
      const bytes = loaded.get(file)!
      const decodeStart = now()
      const text = textDecoder.decode(bytes)
      const decodeMs = now() - decodeStart
      const kind = materializedKind(file, 'auto')
      const executeStart = now()
      const element = executeMaterialized(kind, text, undefined)
      const executeMs = now() - executeStart

      return { entry: file, bytes, text, kind, element, timing: { decodeMs, executeMs } }
    })

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
  const text = textDecoder.decode(bytes)
  const entry: RouterFileEntry = {
    url: path,
    path,
    status: 200,
    headers,
    byteLength: bytes.byteLength,
    segments: [],
  }
  const kind = materializedKind(entry, 'auto')
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

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}
