import { fileURLToPath, pathToFileURL } from 'node:url'

import type {
  RouterChunkManifestEntry,
  RouterFileManifestEntry,
  RouterFileSegment,
  RouterTokenManifest,
} from 'tokenpack'
import { ROUTER_MANIFEST_PATH } from 'tokenpack'
import { decompressRaw } from 'tokenpack/compressors'
import type { DirPack, Pack } from 'tokenpack/pack/types'

import type { DecodeOptions, DecodeSource } from './decode'
import { decodeSourceToPayload } from './decode-core'
import { decodeStreamPayload } from './decode-stream'
import { Token } from './token'

export type { RouterTokenManifest } from 'tokenpack'

export interface DecodeRouterOptions extends DecodeOptions {
  baseUrl?: string | URL
}

export interface RouterFileEntry extends RouterFileManifestEntry {
  segments: RouterFileSegment[]
}

interface ChunkEntry extends RouterChunkManifestEntry {
  source: string | URL
}

interface FileLookupIndex {
  byUrl: Map<string, RouterFileEntry>
  byPath: Map<string, RouterFileEntry[]>
}

export async function decodeRouter(
  source: DecodeSource,
  options: DecodeRouterOptions = {},
): Promise<Pack> {
  const pack = await maybeRouterToken(await new Token(source, options).pack(), source, options)

  if (!pack.isRouter()) throw new Error('decodeRouter(source): token is not a router token')

  return pack
}

export class RouterToken {
  readonly list: string[] & (() => Promise<RouterFileEntry[]>)
  readonly entries: ReadonlyArray<{ path: string; size: number }> = []
  readonly stream: RouterTokenStreamApi
  private readonly routerBaseUrl: URL
  private manifestPromise: Promise<RouterTokenManifest> | null = null
  private chunkByIdPromise: Promise<Map<string, ChunkEntry>> | null = null
  private filesPromise: Promise<RouterFileEntry[]> | null = null
  private fileLookupPromise: Promise<FileLookupIndex> | null = null
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

  async plan(pathOrUrl?: string | string[]): Promise<unknown> {
    const files =
      typeof pathOrUrl === 'string'
        ? [await this.resolveFile(pathOrUrl)]
        : Array.isArray(pathOrUrl)
          ? await Promise.all(pathOrUrl.map(path => this.resolveFile(path)))
          : await this.list()
    const chunks = await this.chunkById()
    const chunkIds = new Set<string>()
    let selectedBytes = 0

    for (const file of files) {
      for (const segment of file.segments) {
        if (!chunks.has(segment.chunkId)) {
          throw new Error(`router file references missing chunk: ${segment.chunkId}`)
        }
        chunkIds.add(segment.chunkId)
        selectedBytes += segment.length
      }
    }

    return {
      kind: 'whole-chunks',
      mode: 'buffered',
      chunks: [...chunkIds].map(id => chunks.get(id)),
      concurrency: chunkIds.size,
      reason: 'node-router-buffered',
      estimate: {
        requestCount: chunkIds.size,
        selectedBytes,
        fetchedBytes: [...chunkIds].reduce((sum, id) => sum + (chunks.get(id)?.byteLength ?? 0), 0),
        chunkCount: chunkIds.size,
        segmentCount: files.reduce((sum, file) => sum + file.segments.length, 0),
      },
    }
  }

  async content(): Promise<Uint8Array> {
    const files = await this.loadAll()

    return concatBytes(files.map(file => file.bytes))
  }

  async json<T = unknown>(pathOrUrl?: string): Promise<T> {
    const text = pathOrUrl === undefined ? await this.text() : await this.text(pathOrUrl)

    return JSON.parse(text) as T
  }

  async text(): Promise<string>
  async text(pathOrUrl: string): Promise<string>
  async text(pathOrUrls: string[]): Promise<Map<string, string>>
  async text(pathOrUrls?: string | string[]): Promise<string | Map<string, string>> {
    if (typeof pathOrUrls === 'string') {
      return new TextDecoder().decode(await this.load(pathOrUrls))
    }
    if (Array.isArray(pathOrUrls)) return this.textMany(pathOrUrls, false)

    const files = await this.loadAll()

    return files.map(file => new TextDecoder().decode(file.bytes)).join('')
  }

  async blob(): Promise<Blob>
  async blob(pathOrUrl: string): Promise<Blob>
  async blob(pathOrUrls: string[]): Promise<Map<string, Blob>>
  async blob(pathOrUrls?: string | string[]): Promise<Blob | Map<string, Blob>> {
    if (typeof pathOrUrls === 'string') {
      return new Blob([(await this.load(pathOrUrls)) as unknown as ArrayBuffer])
    }
    if (Array.isArray(pathOrUrls)) return this.blobMany(pathOrUrls, false)

    const files = await this.loadAll()

    return new Blob(files.map(file => file.bytes as unknown as ArrayBuffer))
  }

  async materialize(): Promise<never> {
    throw new Error('RouterPack.materialize: document execution is only available in browser')
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    const files = await this.loadAll()

    return files.map(file => ({ path: file.entry.path, bytes: file.bytes }))
  }

  async load(pathOrUrl: string): Promise<Uint8Array> {
    return this.loadWithMode(pathOrUrl, false)
  }

  async loadStream(pathOrUrl: string): Promise<Uint8Array> {
    return this.loadWithMode(pathOrUrl, true)
  }

  private async files(): Promise<RouterFileEntry[]> {
    this.filesPromise ??= (async () => {
      const manifest = await this.manifest()
      const chunks = await this.chunkById()

      return manifest.files.map(file => {
        for (const segment of file.segments) {
          if (!chunks.has(segment.chunkId)) {
            throw new Error(`router file references missing chunk: ${segment.chunkId}`)
          }
        }

        return file
      })
    })()

    return this.filesPromise
  }

  private async loadAll(): Promise<Array<{ entry: RouterFileEntry; bytes: Uint8Array }>> {
    const files = await this.list()
    const loaded = await this.loadMany(files, false)

    return files.map(file => ({ entry: file, bytes: loaded.get(file)! }))
  }

  private async loadWithMode(pathOrUrl: string, stream: boolean): Promise<Uint8Array> {
    const entry = await this.resolveFile(pathOrUrl)
    const cacheKey = `${stream ? 'stream' : 'buffer'}:${entry.url}`
    let cached = this.bytesCache.get(cacheKey)

    if (!cached) {
      cached = this.loadOne(entry, stream)
      this.bytesCache.set(cacheKey, cached)
    }

    return cached
  }

  private async resolveFile(pathOrUrl: string): Promise<RouterFileEntry> {
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

  private async loadOne(entry: RouterFileEntry, stream: boolean): Promise<Uint8Array> {
    const chunks = await this.chunkById()
    const out = new Uint8Array(entry.compressedByteLength ?? entry.byteLength)

    await Promise.all(
      entry.segments.map(async segment => {
        const chunk = chunks.get(segment.chunkId)

        if (!chunk) throw new Error(`router file references missing chunk: ${segment.chunkId}`)
        const chunkBytes = await this.chunkBytes(chunk, stream)

        out.set(
          chunkBytes.subarray(segment.offset, segment.offset + segment.length),
          segment.fileOffset ?? 0,
        )
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
    stream: boolean,
  ): Promise<Map<RouterFileEntry, Uint8Array>> {
    const entries = await Promise.all(
      files.map(async file => [file, await this.loadOne(file, stream)] as const),
    )

    return new Map(entries)
  }

  private async chunkBytes(chunk: ChunkEntry, stream: boolean): Promise<Uint8Array> {
    const cacheKey = `${stream ? 'stream' : 'buffer'}:${chunk.id}`
    let cached = this.chunkBytesCache.get(cacheKey)

    if (!cached) {
      cached = this.decodeChunkBytes(chunk, stream)
      this.chunkBytesCache.set(cacheKey, cached)
    }

    return cached
  }

  private async decodeChunkBytes(chunk: ChunkEntry, stream: boolean): Promise<Uint8Array> {
    const { bytes } = stream
      ? await decodeStreamPayload(chunk.source, this.options)
      : await decodeSourceToPayload(chunk.source, this.options)

    return bytes
  }

  private async chunkById(): Promise<Map<string, ChunkEntry>> {
    this.chunkByIdPromise ??= (async () => {
      const manifest = await this.manifest()

      return new Map(
        manifest.chunks.map(chunk => [
          chunk.id,
          { ...chunk, source: resolveChunkSource(chunk.href, this.routerBaseUrl) },
        ]),
      )
    })()

    return this.chunkByIdPromise
  }

  private async readManifest(): Promise<RouterTokenManifest> {
    const pack = await new Token(this.source, this.options).pack()

    if (pack.isDiff()) throw new Error('router token cannot be a diff token')
    const text = pack.isPack() ? await pack.text(ROUTER_MANIFEST_PATH) : await pack.text()
    const manifest = JSON.parse(text) as RouterTokenManifest

    if (!isRouterManifest(manifest)) {
      throw new Error('decodeRouter(source): token is not a router token')
    }

    return manifest
  }

  async textMany(paths: string[], stream: boolean): Promise<Map<string, string>> {
    const files = await Promise.all(paths.map(path => this.resolveFile(path)))
    const loaded = await this.loadMany(files, stream)
    const out = new Map<string, string>()
    const decoder = new TextDecoder()

    for (const file of files) out.set(file.url, decoder.decode(loaded.get(file)!))

    return out
  }

  async blobMany(paths: string[], stream: boolean): Promise<Map<string, Blob>> {
    const files = await Promise.all(paths.map(path => this.resolveFile(path)))
    const loaded = await this.loadMany(files, stream)
    const out = new Map<string, Blob>()

    for (const file of files) {
      out.set(file.url, new Blob([loaded.get(file)! as unknown as ArrayBuffer]))
    }

    return out
  }
}

export class RouterTokenStreamApi {
  constructor(private readonly router: RouterToken) {}

  async text(): Promise<string>
  async text(path: string): Promise<string>
  async text(path: string[]): Promise<Map<string, string>>
  async text(path?: string | string[]): Promise<string | Map<string, string>> {
    if (typeof path === 'string')
      return new TextDecoder().decode(await this.router.loadStream(path))
    if (Array.isArray(path)) return this.router.textMany(path, true)

    const files = await this.router.list()
    const loaded = await this.router.loadMany(files, true)
    const decoder = new TextDecoder()

    return files.map(file => decoder.decode(loaded.get(file)!)).join('')
  }

  async blob(): Promise<Blob>
  async blob(path: string): Promise<Blob>
  async blob(path: string[]): Promise<Map<string, Blob>>
  async blob(path?: string | string[]): Promise<Blob | Map<string, Blob>> {
    if (typeof path === 'string') {
      return new Blob([(await this.router.loadStream(path)) as unknown as ArrayBuffer])
    }
    if (Array.isArray(path)) return this.router.blobMany(path, true)

    const files = await this.router.list()
    const loaded = await this.router.loadMany(files, true)

    return new Blob(files.map(file => loaded.get(file)! as unknown as ArrayBuffer))
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    const files = await this.router.list()
    const loaded = await this.router.loadMany(files, true)

    return files.map(file => ({ path: file.path, bytes: loaded.get(file)! }))
  }

  async materialize(): Promise<never> {
    throw new Error(
      'RouterPack.stream.materialize: document execution is only available in browser',
    )
  }
}

export async function maybeRouterToken(
  rawPack: Pack,
  source: DecodeSource,
  options: DecodeRouterOptions = {},
): Promise<Pack> {
  const manifest = await maybeReadRouterManifest(rawPack)

  return manifest ? new RouterToken(source, options, manifest) : rawPack
}

async function maybeReadRouterManifest(pack: Pack): Promise<RouterTokenManifest | null> {
  if (pack.isRouter() || pack.isDiff()) return null

  try {
    const text = pack.isPack() ? await pack.text(ROUTER_MANIFEST_PATH) : await pack.text()
    const manifest = JSON.parse(text) as RouterTokenManifest

    return isRouterManifest(manifest) ? manifest : null
  } catch {
    return null
  }
}

function isRouterManifest(manifest: RouterTokenManifest): boolean {
  return (
    manifest?.version === 1 &&
    Array.isArray(manifest.chunks) &&
    Array.isArray(manifest.files) &&
    manifest.files.every(file => Array.isArray(file.segments))
  )
}

function resolveRouterBaseUrl(source: DecodeSource, baseUrl: string | URL | undefined): URL {
  if (baseUrl) return typeof baseUrl === 'string' ? new URL(baseUrl) : baseUrl
  if (source instanceof URL) return source
  if (typeof source === 'string') {
    if (/^(?:https?|file):\/\//.test(source)) return new URL(source)

    return pathToFileURL(source)
  }

  throw new Error('decodeRouter(source): baseUrl is required when source is not path or URL')
}

function resolveChunkSource(href: string, routerBaseUrl: URL): string | URL {
  const url = new URL(href, routerBaseUrl)

  if (!url.search && routerBaseUrl.search) url.search = routerBaseUrl.search
  if (url.protocol === 'file:') return fileURLToPath(url)

  return url
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
