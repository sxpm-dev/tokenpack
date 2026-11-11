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
// Allow more segments per huge file so they can fan out across the
// chunk-concurrency pool. The 12 cap matches the Phase 1.4 4g-fast default,
// so a single huge file can saturate all parallel slots in one wave.
export const DEFAULT_ROUTER_MAX_SEGMENTS_PER_FILE = 12
// Split a file when its compressed payload exceeds `targetChunkBytes ×
// minSplitRatio`. 0.5 means ">= 512KB compressed" splits — the threshold
// where parallel-fetched segments meaningfully overlap the network. Below
// that, the per-segment HTTP overhead (TTFB + headers) costs more than the
// parallelism saves.
export const DEFAULT_ROUTER_MIN_SPLIT_RATIO = 0.5
export const DEFAULT_ROUTER_FILE_COMPRESSOR = 'deflate-9'
export const DEFAULT_ROUTER_CHUNK_LAYOUT = 'tiny-files-clustered'
export const DEFAULT_ROUTER_TINY_FILE_BYTES = 32 * 1024

type ChunkBoxKind = 'per-file-deflate' | 'concat-deflate'

interface BoxAssignment {
  source: CompressedSourceFile
  /**
   * Present when this assignment is one slice of a split large file. The
   * box that holds it is forced to per-file-deflate (split semantics rely on
   * per-file compressed offsets). Absent for whole-payload small-box files.
   */
  payloadSlice?: { offset: number; length: number }
}

interface ChunkBox {
  id: string
  href: string
  assignments: BoxAssignment[]
  /** Sum of per-file-compressed bytes assigned to this box (sizing input). */
  payloadBytes: number
  /**
   * True when the box was created from the large-file split path. Such a box
   * stays per-file-deflate regardless of file size — the split routes through
   * per-file compressed offsets that the concat-deflate emit shape doesn't
   * preserve.
   */
  fromLargeSplit: boolean
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
      }
    }),
  )
  const layoutFiles = layoutRouterFiles(compressedFiles, {
    chunkLayout,
    tinyFileBytes,
  })
  // When all files in a small-box are tiny we emit it as one shared deflate
  // frame (concat-deflate) — eliminates the per-file DecompressionStream setup
  // tax that dominates router cold path at runtime. Mixed boxes (any non-tiny
  // file) and large-split chunks stay per-file-deflate so range fetches still
  // work where useful. 'source-order' opts out of the concat-deflate emit
  // entirely.
  const useConcatDeflateForSmallBoxes = chunkLayout === 'tiny-files-clustered'
  const boxes: ChunkBox[] = []
  const usedChunkIds = new Set<string>()
  let currentSmallBox: ChunkBox | null = null

  for (const source of layoutFiles) {
    const payload = source.payload
    let compressedOffset = 0

    if (payload.byteLength > targetChunkBytes * minSplitRatio) {
      currentSmallBox = null
      // Segment floor matches the split threshold (targetChunkBytes ×
      // minSplitRatio) — segments can now be smaller than a full small-box
      // chunk when minSplitRatio < 1. A 1MB file with the default thresholds
      // (targetChunkBytes=1MB, minSplitRatio=0.5) splits into 2 × 512KB
      // segments fetched in parallel, instead of staying as a single 1MB
      // serial fetch.
      const segmentFloor = Math.max(1, Math.ceil(targetChunkBytes * minSplitRatio))
      const segmentBytes = roundUpToNiceSize(
        Math.max(segmentFloor, Math.ceil(payload.byteLength / maxSegmentsPerFile)),
      )

      while (compressedOffset < payload.byteLength) {
        const length = Math.min(segmentBytes, payload.byteLength - compressedOffset)
        const box = createChunkBox(boxes.length, usedChunkIds, true, source.chunkId, source.href)

        box.assignments.push({
          source,
          payloadSlice: { offset: compressedOffset, length },
        })
        box.payloadBytes += length
        boxes.push(box)
        compressedOffset += length
      }
    } else {
      if (
        !currentSmallBox ||
        currentSmallBox.payloadBytes + payload.byteLength > targetChunkBytes ||
        (source.chunkId && currentSmallBox.id !== source.chunkId)
      ) {
        currentSmallBox = createChunkBox(
          boxes.length,
          usedChunkIds,
          false,
          source.chunkId,
          source.href,
        )
        boxes.push(currentSmallBox)
      }
      currentSmallBox.assignments.push({ source })
      currentSmallBox.payloadBytes += payload.byteLength
    }
  }

  const files: RouterFileManifestEntry[] = new Array(sourceFiles.length)
  const plannedChunks = await emitBoxes(
    boxes,
    files,
    fileCompressor,
    tinyFileBytes,
    useConcatDeflateForSmallBoxes,
  )

  assignChunkPriorities(boxes, plannedChunks, input.options.bootFiles)
  const manifest: RouterTokenManifest = {
    version: 1,
    variant: input.options.variant,
    chunks: plannedChunks.map(chunk => ({
      id: chunk.id,
      href: chunk.href,
      byteLength: chunk.bytes.byteLength,
      ...(chunk.kind ? { kind: chunk.kind } : {}),
      ...(chunk.uncompressedByteLength !== undefined
        ? { uncompressedByteLength: chunk.uncompressedByteLength }
        : {}),
      ...(chunk.compressor ? { compressor: chunk.compressor } : {}),
      ...(chunk.level !== undefined ? { level: chunk.level } : {}),
      ...(chunk.priority !== undefined ? { priority: chunk.priority } : {}),
    })),
    files: assertCompleteManifestFiles(files),
  }

  return { manifest, chunks: plannedChunks }
}

/**
 * For each chunk, find the lowest position any of its files holds in the
 * `bootFiles` URL list and use that as the chunk's `priority`. Chunks that
 * contain no boot files stay priority-less.
 */
function assignChunkPriorities(
  boxes: readonly ChunkBox[],
  plannedChunks: PlannedRouterChunk[],
  bootFiles: readonly string[] | undefined,
): void {
  if (!bootFiles || bootFiles.length === 0) return
  const positionByUrl = new Map<string, number>()

  for (let i = 0; i < bootFiles.length; i++) {
    const url = bootFiles[i]

    if (typeof url === 'string' && !positionByUrl.has(url)) positionByUrl.set(url, i)
  }

  for (let i = 0; i < boxes.length; i++) {
    let priority: number | undefined

    for (const a of boxes[i]!.assignments) {
      const pos = positionByUrl.get(a.source.file.url)

      if (pos === undefined) continue
      if (priority === undefined || pos < priority) priority = pos
    }
    if (priority !== undefined) plannedChunks[i]!.priority = priority
  }
}

async function emitBoxes(
  boxes: readonly ChunkBox[],
  files: RouterFileManifestEntry[],
  fileCompressor: string,
  tinyFileBytes: number,
  useConcatDeflateForSmallBoxes: boolean,
): Promise<PlannedRouterChunk[]> {
  return Promise.all(
    boxes.map(async (box): Promise<PlannedRouterChunk> => {
      const kind = chooseBoxKind(box, tinyFileBytes, useConcatDeflateForSmallBoxes)

      return kind === 'concat-deflate'
        ? emitConcatDeflateBox(box, files, fileCompressor)
        : emitPerFileDeflateBox(box, files)
    }),
  )
}

function chooseBoxKind(
  box: ChunkBox,
  tinyFileBytes: number,
  useConcatDeflateForSmallBoxes: boolean,
): ChunkBoxKind {
  if (!useConcatDeflateForSmallBoxes) return 'per-file-deflate'
  if (box.fromLargeSplit) return 'per-file-deflate'

  for (const assignment of box.assignments) {
    if (assignment.payloadSlice) return 'per-file-deflate'
    if (assignment.source.payload.byteLength > tinyFileBytes) return 'per-file-deflate'
  }

  return 'concat-deflate'
}

async function emitConcatDeflateBox(
  box: ChunkBox,
  files: RouterFileManifestEntry[],
  fileCompressor: string,
): Promise<PlannedRouterChunk> {
  const rawParts: Uint8Array[] = []
  let rawByteLength = 0

  for (const assignment of box.assignments) {
    const { source } = assignment
    const bytes = source.file.bytes
    const offset = rawByteLength

    rawParts.push(bytes)
    rawByteLength += bytes.byteLength
    files[source.index] = {
      url: source.file.url,
      path: source.file.path,
      status: source.file.status ?? 200,
      headers: source.file.headers ?? {},
      byteLength: bytes.byteLength,
      segments: [
        {
          chunkId: box.id,
          offset,
          length: bytes.byteLength,
          fileOffset: 0,
        },
      ],
    }
  }

  const raw = concatBytes(rawParts, rawByteLength)
  const compressed = await compressRaw(raw, fileCompressor)

  return {
    id: box.id,
    href: box.href,
    bytes: compressed.bytes,
    kind: 'concat-deflate',
    uncompressedByteLength: raw.byteLength,
    compressor: compressed.compressor,
    level: compressed.level,
  }
}

function emitPerFileDeflateBox(
  box: ChunkBox,
  files: RouterFileManifestEntry[],
): PlannedRouterChunk {
  const parts: Uint8Array[] = []
  let byteLength = 0
  const segmentsBySource = new Map<number, RouterFileSegment[]>()

  for (const assignment of box.assignments) {
    const { source, payloadSlice } = assignment
    const slice = payloadSlice
      ? sliceBytes(source.payload, payloadSlice.offset, payloadSlice.offset + payloadSlice.length)
      : sliceBytes(source.payload, 0, source.payload.byteLength)
    const offset = byteLength

    parts.push(slice)
    byteLength += slice.byteLength
    const segments = segmentsBySource.get(source.index) ?? []

    segments.push({
      chunkId: box.id,
      offset,
      length: slice.byteLength,
      fileOffset: payloadSlice ? payloadSlice.offset : 0,
    })
    segmentsBySource.set(source.index, segments)
  }

  for (const [index, segments] of segmentsBySource) {
    const existing = files[index]
    const source = box.assignments.find(a => a.source.index === index)!.source

    files[index] = existing
      ? { ...existing, segments: [...existing.segments, ...segments] }
      : {
          url: source.file.url,
          path: source.file.path,
          status: source.file.status ?? 200,
          headers: source.file.headers ?? {},
          compressor: source.compressed.compressor,
          level: source.compressed.level,
          byteLength: source.file.bytes.byteLength,
          compressedByteLength: source.payload.byteLength,
          segments,
        }
  }

  return {
    id: box.id,
    href: box.href,
    bytes: concatBytes(parts, byteLength),
  }
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
  fromLargeSplit: boolean,
  preferredId?: string,
  preferredHref?: string,
): ChunkBox {
  const id = uniqueChunkId(preferredId ?? `chunk-${String(index + 1).padStart(4, '0')}`, usedIds)
  const href = preferredHref && id === preferredId ? preferredHref : `${id}.png`

  return { id, href, assignments: [], payloadBytes: 0, fromLargeSplit }
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
