import type { PackEntry } from '../archive-buffers'
import { compressRaw } from '../compressors'
import type {
  PlannedRouterBundle,
  PlannedRouterChunk,
  RouterFileManifestEntry,
  RouterFileSegment,
  RouterSourceFile,
  RouterTokenManifest,
  RouterTokenPack,
} from './types'

export const DEFAULT_ROUTER_TARGET_CHUNK_BYTES = 1024 * 1024
export const DEFAULT_ROUTER_MAX_SEGMENTS_PER_FILE = 5
export const DEFAULT_ROUTER_MIN_SPLIT_RATIO = 2
export const DEFAULT_ROUTER_FILE_COMPRESSOR = 'deflate-9'
export const DEFAULT_ROUTER_CHUNK_LAYOUT = 'tiny-files-clustered'
export const DEFAULT_ROUTER_TINY_FILE_BYTES = 32 * 1024

interface ChunkBox {
  id: string
  href: string
  parts: Uint8Array[]
  byteLength: number
}

interface SourceFileWithChunk {
  chunkId?: string
  href?: string
  file: RouterSourceFile
}

interface CompressedSourceFile extends SourceFileWithChunk {
  index: number
  compressed: Awaited<ReturnType<typeof compressRaw>>
  payload: Uint8Array
  segments: RouterFileSegment[]
}

export async function planRouterBundle(input: RouterTokenPack): Promise<PlannedRouterBundle> {
  const targetChunkBytes = positiveInt(
    input.options.targetChunkBytes,
    DEFAULT_ROUTER_TARGET_CHUNK_BYTES,
  )
  const maxSegmentsPerFile = positiveInt(
    input.options.maxSegmentsPerFile,
    DEFAULT_ROUTER_MAX_SEGMENTS_PER_FILE,
  )
  const minSplitRatio = positiveNumber(input.options.minSplitRatio, DEFAULT_ROUTER_MIN_SPLIT_RATIO)
  const fileCompressor = input.options.fileCompressor ?? DEFAULT_ROUTER_FILE_COMPRESSOR
  const chunkLayout = input.options.chunkLayout ?? DEFAULT_ROUTER_CHUNK_LAYOUT
  const tinyFileBytes = positiveInt(input.options.tinyFileBytes, DEFAULT_ROUTER_TINY_FILE_BYTES)
  const sourceFiles = await resolveSourceFiles(input)
  const compressedFiles = await Promise.all(
    sourceFiles.map(async (source, index): Promise<CompressedSourceFile> => {
      const compressed = await compressRaw(source.file.bytes, fileCompressor)

      return {
        ...source,
        index,
        compressed,
        payload: compressed.bytes,
        segments: [],
      }
    }),
  )
  const layoutFiles = layoutRouterFiles(compressedFiles, {
    chunkLayout,
    tinyFileBytes,
  })
  const chunks: ChunkBox[] = []
  const usedChunkIds = new Set<string>()
  const files: RouterFileManifestEntry[] = new Array(sourceFiles.length)
  let currentSmallBox: ChunkBox | null = null

  for (const source of layoutFiles) {
    const bytes = source.file.bytes
    const payload = source.payload
    let compressedOffset = 0

    if (payload.byteLength > targetChunkBytes * minSplitRatio) {
      currentSmallBox = null
      const segmentBytes = roundUpToNiceSize(
        Math.max(targetChunkBytes, Math.ceil(payload.byteLength / maxSegmentsPerFile)),
      )

      while (compressedOffset < payload.byteLength) {
        const length = Math.min(segmentBytes, payload.byteLength - compressedOffset)
        const box = createChunkBox(chunks.length, usedChunkIds, source.chunkId, source.href)
        const segmentBytesView = sliceBytes(payload, compressedOffset, compressedOffset + length)

        box.parts.push(segmentBytesView)
        box.byteLength += segmentBytesView.byteLength
        chunks.push(box)
        source.segments.push({
          chunkId: box.id,
          offset: 0,
          length: segmentBytesView.byteLength,
          fileOffset: compressedOffset,
        })
        compressedOffset += length
      }
    } else {
      if (
        !currentSmallBox ||
        currentSmallBox.byteLength + payload.byteLength > targetChunkBytes ||
        (source.chunkId && currentSmallBox.id !== source.chunkId)
      ) {
        currentSmallBox = createChunkBox(chunks.length, usedChunkIds, source.chunkId, source.href)
        chunks.push(currentSmallBox)
      }
      const offset = currentSmallBox.byteLength
      const segmentBytesView = sliceBytes(payload, 0, payload.byteLength)

      currentSmallBox.parts.push(segmentBytesView)
      currentSmallBox.byteLength += segmentBytesView.byteLength
      source.segments.push({
        chunkId: currentSmallBox.id,
        offset,
        length: segmentBytesView.byteLength,
        fileOffset: 0,
      })
    }

    files[source.index] = {
      url: source.file.url,
      path: source.file.path,
      status: source.file.status ?? 200,
      headers: source.file.headers ?? {},
      compressor: source.compressed.compressor,
      level: source.compressed.level,
      byteLength: bytes.byteLength,
      compressedByteLength: payload.byteLength,
      segments: source.segments,
    }
  }

  const plannedChunks: PlannedRouterChunk[] = chunks.map(box => ({
    id: box.id,
    href: box.href,
    bytes: concatBytes(box.parts, box.byteLength),
  }))
  const manifest: RouterTokenManifest = {
    version: 1,
    variant: input.options.variant,
    chunks: plannedChunks.map(chunk => ({
      id: chunk.id,
      href: chunk.href,
      byteLength: chunk.bytes.byteLength,
    })),
    files: assertCompleteManifestFiles(files),
  }

  return { manifest, chunks: plannedChunks }
}

interface RouterLayoutOptions {
  chunkLayout: RouterTokenPack['options']['chunkLayout']
  tinyFileBytes: number
}

function layoutRouterFiles(
  files: readonly CompressedSourceFile[],
  options: RouterLayoutOptions,
): CompressedSourceFile[] {
  if (options.chunkLayout === 'source-order' || files.some(file => file.chunkId || file.href)) {
    return [...files]
  }

  const tiny: CompressedSourceFile[] = []
  const regular: CompressedSourceFile[] = []

  for (const file of files) {
    const bucket = file.payload.byteLength <= options.tinyFileBytes ? tiny : regular

    bucket.push(file)
  }

  tiny.sort((a, b) => {
    const group = routerLocalityKey(a.file.path).localeCompare(routerLocalityKey(b.file.path))

    return group || a.file.path.localeCompare(b.file.path) || a.index - b.index
  })

  return [...tiny, ...regular]
}

function routerLocalityKey(path: string): string {
  const parts = path.split('/')

  if (parts.length <= 1) return ''

  return parts.slice(0, -1).join('/')
}

function assertCompleteManifestFiles(
  files: Array<RouterFileManifestEntry | undefined>,
): RouterFileManifestEntry[] {
  for (const [index, file] of files.entries()) {
    if (!file) throw new Error(`router manifest missing planned file at index ${index}`)
  }

  return files as RouterFileManifestEntry[]
}

async function resolveSourceFiles(input: RouterTokenPack): Promise<SourceFileWithChunk[]> {
  if (input.options.files) {
    return input.options.files.map(file => ({ file }))
  }

  if (input.options.chunks) {
    return input.options.chunks.flatMap(chunk =>
      chunk.files.map(file => ({ chunkId: chunk.id, href: chunk.href, file })),
    )
  }

  const entries = await input.source.build()

  return entries.map(entry => ({ file: packEntryToSourceFile(entry) }))
}

function packEntryToSourceFile(entry: PackEntry): RouterSourceFile {
  return {
    url: entry.path,
    path: entry.path,
    bytes: entry.bytes,
    status: 200,
    headers: {},
  }
}

function createChunkBox(
  index: number,
  usedIds: Set<string>,
  preferredId?: string,
  preferredHref?: string,
): ChunkBox {
  const id = uniqueChunkId(preferredId ?? `chunk-${String(index + 1).padStart(4, '0')}`, usedIds)
  const href = preferredHref && id === preferredId ? preferredHref : `${id}.png`

  return { id, href, parts: [], byteLength: 0 }
}

function uniqueChunkId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId)

    return baseId
  }

  let suffix = 2

  for (;;) {
    const candidate = `${baseId}-${suffix}`

    if (!usedIds.has(candidate)) {
      usedIds.add(candidate)

      return candidate
    }
    suffix += 1
  }
}

function sliceBytes(bytes: Uint8Array, start: number, end: number): Uint8Array {
  return bytes.slice(start, end)
}

function concatBytes(parts: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total)
  let offset = 0

  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }

  return out
}

function positiveInt(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value! > 0 ? Math.floor(value!) : fallback
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value! > 0 ? value! : fallback
}

function roundUpToNiceSize(value: number): number {
  const quantum = 64 * 1024

  return Math.ceil(value / quantum) * quantum
}
