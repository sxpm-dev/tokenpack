import type {
  RouterChunkManifestEntry,
  RouterFileManifestEntry,
  RouterFileSegment,
} from 'tokenpack'

export type RouterLoadStrategy =
  | 'auto'
  | 'full'
  | 'range-fetch'
  | 'range-stream'
  | 'range-fetch-all'
  | 'range-stream-all'

export type RouterReadMode = 'buffered' | 'stream'

export interface RouterChunkRef extends RouterChunkManifestEntry {
  url: string
}

export interface RouterFileRef extends RouterFileManifestEntry {
  segments: RouterFileSegment[]
}

export type RouterLoadPlan =
  | {
      kind: 'whole-chunks'
      mode: RouterReadMode
      chunks: RouterChunkRef[]
      concurrency: number
      reason: string
      estimate: RouterLoadPlanEstimate
    }
  | {
      kind: 'parallel-segments'
      mode: RouterReadMode
      segments: RouterPlannedSegment[]
      concurrency: number
      reason: string
      estimate: RouterLoadPlanEstimate
    }
  | {
      kind: 'merged-ranges'
      mode: RouterReadMode
      ranges: RouterChunkRange[]
      concurrency: number
      reason: string
      estimate: RouterLoadPlanEstimate
    }
  | {
      kind: 'single-merged'
      mode: RouterReadMode
      ranges: RouterChunkRange[]
      concurrency: 1
      reason: string
      estimate: RouterLoadPlanEstimate
    }

export interface RouterPlannedSegment {
  file: RouterFileRef
  segment: RouterFileSegment
  chunk: RouterChunkRef
}

export interface RouterChunkRange {
  chunk: RouterChunkRef
  offset: number
  length: number
  segments: RouterPlannedSegment[]
}

export interface RouterLoadPlanEstimate {
  requestCount: number
  selectedBytes: number
  fetchedBytes: number
  chunkCount: number
  segmentCount: number
}

export interface RouterLoadPlannerOptions {
  strategy?: RouterLoadStrategy
  mode?: RouterReadMode
  allFiles: readonly RouterFileRef[]
  /**
   * Extra per-request cost used by the auto planner when comparing range reads
   * against whole chunk reads. This is expressed in bytes so the planner can
   * trade fewer requests against over-fetch without knowing the active network.
   */
  rangeRequestPenaltyBytes?: number
  /** Largest gap to merge between adjacent byte ranges in the same chunk. */
  mergeRangeGapBytes?: number
  /**
   * Maximum separate byte ranges the auto planner will keep for one chunk
   * before trying to merge the cheapest adjacent ranges for that chunk. This
   * protects hot chunks with many tiny files from request fanout.
   */
  maxRangesPerChunk?: number
  /** Compressed segment size that is considered tiny for burst tuning. */
  tinyFileBytes?: number
  /** Minimum selected file count before tiny-file burst tuning applies. */
  tinyFileBurstFileCount?: number
  /** Per-request cost used for tiny-file bursts when it is higher than the base cost. */
  tinyFileRequestPenaltyBytes?: number
  /** Maximum ranges per chunk while planning tiny-file bursts. */
  tinyFileMaxRangesPerChunk?: number
  /** Largest selected file size before auto may bias toward whole-chunk streaming. */
  largeFileWholeChunkBytes?: number
  /** Maximum whole-chunk over-fetch ratio allowed for large-file streaming bias. */
  largeFileWholeChunkMaxWasteRatio?: number
  maxParallelChunkRequests?: number
  maxParallelSegmentRequests?: number
}

const SMALL_SELECTED_BYTES = 512 * 1024
const WHOLE_CHUNK_WASTE_RATIO = 1.35
const MERGE_RANGE_GAP_BYTES = 16 * 1024
const RANGE_REQUEST_PENALTY_BYTES = 96 * 1024
const CHUNK_PAYLOAD_HEADER_PROBE_BYTES = 8192
const MAX_RANGES_PER_CHUNK = 8
const TINY_FILE_BYTES = 32 * 1024
const TINY_FILE_BURST_FILE_COUNT = 8
const TINY_FILE_REQUEST_PENALTY_BYTES = 768 * 1024
const TINY_FILE_MAX_RANGES_PER_CHUNK = 4
const LARGE_FILE_WHOLE_CHUNK_BYTES = 512 * 1024
const LARGE_FILE_WHOLE_CHUNK_MAX_WASTE_RATIO = 1.6
const MAX_PARALLEL_CHUNK_REQUESTS = 4
const MAX_PARALLEL_SEGMENT_REQUESTS = 6

export function planRouterLoad(
  files: readonly RouterFileRef[],
  chunks: ReadonlyMap<string, RouterChunkRef>,
  options: RouterLoadPlannerOptions,
): RouterLoadPlan {
  const mode = resolveMode(options.strategy, options.mode)
  const planned = collectPlannedSegments(files, chunks)
  const selectedBytes = planned.reduce((sum, item) => sum + item.segment.length, 0)
  const selectedChunks = uniqueChunks(planned)
  const selectedChunkBytes = selectedChunks.reduce((sum, chunk) => sum + (chunk.byteLength ?? 0), 0)
  const baseTuning = plannerTuning(options)

  if (shouldForceWholeChunks(options.strategy)) {
    return wholeChunks(
      selectedChunks,
      mode,
      'forced-full-chunks',
      baseTuning.maxParallelChunkRequests,
    )
  }

  if (shouldForceSegments(options.strategy)) {
    return bestRangePlan(planned, mode, 'forced-segments', baseTuning, false)
  }

  const tinyBurst = isTinyFileBurst(files, planned, baseTuning)
  const tuning = tinyBurst ? tinyFileBurstTuning(baseTuning) : baseTuning

  if (isCompleteFileSet(files, options.allFiles)) {
    return wholeChunks(selectedChunks, mode, 'complete-file-set', tuning.maxParallelChunkRequests)
  }

  if (planned.every(item => segmentCoversChunkPayload(item.chunk, item.segment))) {
    return wholeChunks(
      selectedChunks,
      mode,
      'segments-cover-chunks',
      tuning.maxParallelChunkRequests,
    )
  }

  const rangeMode = selectedBytes <= SMALL_SELECTED_BYTES ? 'buffered' : mode
  const rangeReason =
    tinyBurst
      ? 'tiny-file-burst-range-fetch'
      : selectedBytes <= SMALL_SELECTED_BYTES
        ? 'small-selection-range-fetch'
        : 'range-segments'
  const bestRange = bestRangePlan(
    planned,
    rangeMode,
    rangeReason,
    tuning,
    true,
    tinyBurst ? 'tiny-file-burst-coalesced' : 'hot-chunk-range-coalesced',
  )
  const whole = wholeChunks(
    selectedChunks,
    mode,
    'whole-chunks-lower-cost',
    tuning.maxParallelChunkRequests,
  )

  if (
    !tinyBurst &&
    shouldPreferLargeFileWholeChunkStream(files, selectedBytes, selectedChunkBytes, mode, tuning)
  ) {
    return {
      ...whole,
      reason: 'large-file-whole-chunk-stream',
    }
  }

  if (planCost(whole, tuning) <= planCost(bestRange, tuning)) {
    return tinyBurst ? { ...whole, reason: 'tiny-file-burst-whole-chunks' } : whole
  }

  if (
    selectedChunkBytes > 0 &&
    selectedChunkBytes <= Math.ceil(selectedBytes * WHOLE_CHUNK_WASTE_RATIO) &&
    planCost(whole, tuning) <= planCost(bestRange, tuning) * WHOLE_CHUNK_WASTE_RATIO
  ) {
    return {
      ...whole,
      reason: 'whole-chunks-cheaper-than-ranges',
    }
  }

  return bestRange
}

interface PlannerTuning {
  rangeRequestPenaltyBytes: number
  mergeRangeGapBytes: number
  maxRangesPerChunk: number
  tinyFileBytes: number
  tinyFileBurstFileCount: number
  tinyFileRequestPenaltyBytes: number
  tinyFileMaxRangesPerChunk: number
  largeFileWholeChunkBytes: number
  largeFileWholeChunkMaxWasteRatio: number
  maxParallelChunkRequests: number
  maxParallelSegmentRequests: number
}

function plannerTuning(options: RouterLoadPlannerOptions): PlannerTuning {
  return {
    rangeRequestPenaltyBytes: positiveFinite(
      options.rangeRequestPenaltyBytes,
      RANGE_REQUEST_PENALTY_BYTES,
    ),
    mergeRangeGapBytes: positiveFinite(options.mergeRangeGapBytes, MERGE_RANGE_GAP_BYTES),
    maxRangesPerChunk: positiveInt(options.maxRangesPerChunk, MAX_RANGES_PER_CHUNK),
    tinyFileBytes: positiveFinite(options.tinyFileBytes, TINY_FILE_BYTES),
    tinyFileBurstFileCount: positiveInt(
      options.tinyFileBurstFileCount,
      TINY_FILE_BURST_FILE_COUNT,
    ),
    tinyFileRequestPenaltyBytes: positiveFinite(
      options.tinyFileRequestPenaltyBytes,
      TINY_FILE_REQUEST_PENALTY_BYTES,
    ),
    tinyFileMaxRangesPerChunk: positiveInt(
      options.tinyFileMaxRangesPerChunk,
      TINY_FILE_MAX_RANGES_PER_CHUNK,
    ),
    largeFileWholeChunkBytes: positiveFinite(
      options.largeFileWholeChunkBytes,
      LARGE_FILE_WHOLE_CHUNK_BYTES,
    ),
    largeFileWholeChunkMaxWasteRatio: positiveFinite(
      options.largeFileWholeChunkMaxWasteRatio,
      LARGE_FILE_WHOLE_CHUNK_MAX_WASTE_RATIO,
    ),
    maxParallelChunkRequests: positiveInt(
      options.maxParallelChunkRequests,
      MAX_PARALLEL_CHUNK_REQUESTS,
    ),
    maxParallelSegmentRequests: positiveInt(
      options.maxParallelSegmentRequests,
      MAX_PARALLEL_SEGMENT_REQUESTS,
    ),
  }
}

function shouldPreferLargeFileWholeChunkStream(
  files: readonly RouterFileRef[],
  selectedBytes: number,
  selectedChunkBytes: number,
  mode: RouterReadMode,
  tuning: PlannerTuning,
): boolean {
  if (mode !== 'stream' || selectedChunkBytes <= 0 || selectedBytes <= 0) return false

  const largestFileBytes = files.reduce(
    (max, file) => Math.max(max, file.compressedByteLength ?? file.byteLength),
    0,
  )

  if (largestFileBytes < tuning.largeFileWholeChunkBytes) return false

  return selectedChunkBytes <= Math.ceil(selectedBytes * tuning.largeFileWholeChunkMaxWasteRatio)
}

function isTinyFileBurst(
  files: readonly RouterFileRef[],
  segments: readonly RouterPlannedSegment[],
  tuning: PlannerTuning,
): boolean {
  if (files.length < tuning.tinyFileBurstFileCount || segments.length === 0) return false

  const largestSegment = segments.reduce((max, item) => Math.max(max, item.segment.length), 0)
  const averageSegment = segments.reduce((sum, item) => sum + item.segment.length, 0) / segments.length

  return largestSegment <= tuning.tinyFileBytes && averageSegment <= tuning.tinyFileBytes
}

function tinyFileBurstTuning(tuning: PlannerTuning): PlannerTuning {
  return {
    ...tuning,
    rangeRequestPenaltyBytes: Math.max(
      tuning.rangeRequestPenaltyBytes,
      tuning.tinyFileRequestPenaltyBytes,
    ),
    maxRangesPerChunk: Math.min(tuning.maxRangesPerChunk, tuning.tinyFileMaxRangesPerChunk),
  }
}

function resolveMode(strategy: RouterLoadStrategy | undefined, mode: RouterReadMode | undefined) {
  if (strategy === 'range-fetch' || strategy === 'range-fetch-all' || strategy === 'full') {
    return 'buffered'
  }
  if (strategy === 'range-stream' || strategy === 'range-stream-all') return 'stream'

  return mode ?? (canStreamDecode() ? 'stream' : 'buffered')
}

function shouldForceWholeChunks(strategy: RouterLoadStrategy | undefined): boolean {
  return strategy === 'full' || strategy === 'range-fetch-all' || strategy === 'range-stream-all'
}

function shouldForceSegments(strategy: RouterLoadStrategy | undefined): boolean {
  return strategy === 'range-fetch' || strategy === 'range-stream'
}

function collectPlannedSegments(
  files: readonly RouterFileRef[],
  chunks: ReadonlyMap<string, RouterChunkRef>,
): RouterPlannedSegment[] {
  const out: RouterPlannedSegment[] = []

  for (const file of files) {
    for (const segment of file.segments) {
      const chunk = chunks.get(segment.chunkId)

      if (!chunk) throw new Error(`router file references missing chunk: ${segment.chunkId}`)
      out.push({ file, segment, chunk })
    }
  }

  return out
}

function uniqueChunks(planned: readonly RouterPlannedSegment[]): RouterChunkRef[] {
  const byId = new Map<string, RouterChunkRef>()

  for (const item of planned) byId.set(item.chunk.id, item.chunk)

  return [...byId.values()]
}

function isCompleteFileSet(
  files: readonly RouterFileRef[],
  allFiles: readonly RouterFileRef[],
): boolean {
  if (files.length !== allFiles.length) return false
  const requested = new Set(files)

  return allFiles.every(file => requested.has(file))
}

function wholeChunks(
  chunks: RouterChunkRef[],
  mode: RouterReadMode,
  reason: string,
  maxParallelChunkRequests: number,
): RouterLoadPlan {
  const fetchedBytes = chunks.reduce((sum, chunk) => sum + (chunk.byteLength ?? 0), 0)

  return {
    kind: 'whole-chunks',
    mode,
    chunks,
    concurrency: Math.min(maxParallelChunkRequests, Math.max(1, chunks.length)),
    reason,
    estimate: {
      requestCount: chunks.length,
      selectedBytes: fetchedBytes,
      fetchedBytes,
      chunkCount: chunks.length,
      segmentCount: 0,
    },
  }
}

function parallelSegments(
  segments: RouterPlannedSegment[],
  mode: RouterReadMode,
  reason: string,
  tuning: PlannerTuning,
): RouterLoadPlan {
  const selectedBytes = segments.reduce((sum, item) => sum + item.segment.length, 0)
  const rangeEstimate = estimateRangeAccess(
    segments.map(item => ({
      chunk: item.chunk,
      offset: item.segment.offset,
      length: item.segment.length,
      segments: [item],
    })),
  )

  return {
    kind: 'parallel-segments',
    mode,
    segments,
    concurrency: segmentConcurrency(segments.length, rangeEstimate.fetchedBytes, tuning),
    reason,
    estimate: {
      selectedBytes,
      requestCount: rangeEstimate.requestCount,
      fetchedBytes: rangeEstimate.fetchedBytes,
      chunkCount: uniqueChunks(segments).length,
      segmentCount: segments.length,
    },
  }
}

function rangePlan(
  segments: RouterPlannedSegment[],
  mode: RouterReadMode,
  reason: string,
  tuning: PlannerTuning,
  mergeRangeGapBytes = tuning.mergeRangeGapBytes,
  options: RangePlanOptions = {},
): RouterLoadPlan {
  const ranges = mergeRanges(segments, mergeRangeGapBytes, options, tuning)

  if (ranges.length === segments.length) return parallelSegments(segments, mode, reason, tuning)

  const selectedBytes = segments.reduce((sum, item) => sum + item.segment.length, 0)
  const rangeEstimate = estimateRangeAccess(ranges)
  const estimate = {
    requestCount: rangeEstimate.requestCount,
    selectedBytes,
    fetchedBytes: rangeEstimate.fetchedBytes,
    chunkCount: new Set(ranges.map(range => range.chunk.id)).size,
    segmentCount: segments.length,
  }

  if (ranges.length === 1) {
    return {
      kind: 'single-merged',
      mode,
      ranges,
      concurrency: 1,
      reason,
      estimate,
    }
  }

  return {
    kind: 'merged-ranges',
    mode,
    ranges,
    concurrency: segmentConcurrency(ranges.length, rangeEstimate.fetchedBytes, tuning),
    reason,
    estimate,
  }
}

function bestRangePlan(
  segments: RouterPlannedSegment[],
  mode: RouterReadMode,
  reason: string,
  tuning: PlannerTuning,
  coalesceHotChunks = true,
  coalescedReason = 'hot-chunk-range-coalesced',
): RouterLoadPlan {
  const gaps = [
    0,
    tuning.mergeRangeGapBytes,
    Math.max(tuning.mergeRangeGapBytes, 64 * 1024),
    Math.max(tuning.mergeRangeGapBytes, 256 * 1024),
  ]
  let best: RouterLoadPlan | null = null

  for (const gap of new Set(gaps)) {
    const candidate = rangePlan(segments, mode, reason, tuning, gap)

    if (!best || planCost(candidate, tuning) < planCost(best, tuning)) best = candidate

    if (coalesceHotChunks && hasHotChunkFanout(segments, gap, tuning)) {
      const capped = rangePlan(segments, mode, coalescedReason, tuning, gap, {
        coalesceHotChunks: true,
      })

      if (!best || planCost(capped, tuning) < planCost(best, tuning)) best = capped
    }
  }

  return best!
}

interface RangePlanOptions {
  coalesceHotChunks?: boolean
}

function hasHotChunkFanout(
  segments: readonly RouterPlannedSegment[],
  mergeRangeGapBytes: number,
  tuning: PlannerTuning,
): boolean {
  const ranges = mergeRanges(segments, mergeRangeGapBytes)
  const counts = new Map<string, number>()

  for (const range of ranges) {
    const nextCount = (counts.get(range.chunk.id) ?? 0) + 1

    if (nextCount > tuning.maxRangesPerChunk && typeof range.chunk.byteLength === 'number') {
      return true
    }
    counts.set(range.chunk.id, nextCount)
  }

  return false
}

function mergeRanges(
  segments: readonly RouterPlannedSegment[],
  mergeRangeGapBytes: number,
  options: RangePlanOptions = {},
  tuning?: PlannerTuning,
): RouterChunkRange[] {
  const byChunk = new Map<string, RouterPlannedSegment[]>()

  for (const item of segments) {
    const chunkSegments = byChunk.get(item.chunk.id) ?? []

    chunkSegments.push(item)
    byChunk.set(item.chunk.id, chunkSegments)
  }

  const ranges: RouterChunkRange[] = []

  for (const chunkSegments of byChunk.values()) {
    chunkSegments.sort((a, b) => a.segment.offset - b.segment.offset)
    const chunkRanges: RouterChunkRange[] = []

    for (const item of chunkSegments) {
      const last = chunkRanges.at(-1)
      const itemEnd = item.segment.offset + item.segment.length

      if (
        last &&
        last.chunk.id === item.chunk.id &&
        item.segment.offset - (last.offset + last.length) <= mergeRangeGapBytes
      ) {
        last.length = Math.max(last.length, itemEnd - last.offset)
        last.segments.push(item)
        continue
      }

      chunkRanges.push({
        chunk: item.chunk,
        offset: item.segment.offset,
        length: item.segment.length,
        segments: [item],
      })
    }

    const first = chunkSegments[0]

    if (
      options.coalesceHotChunks &&
      tuning &&
      first &&
      chunkRanges.length > tuning.maxRangesPerChunk
    ) {
      ranges.push(...coalesceRangeFanout(chunkRanges, tuning.maxRangesPerChunk))
      continue
    }

    ranges.push(...chunkRanges)
  }

  return ranges
}

function coalesceRangeFanout(
  ranges: readonly RouterChunkRange[],
  maxRangesPerChunk: number,
): RouterChunkRange[] {
  const out = ranges.map(range => ({
    ...range,
    segments: [...range.segments],
  }))

  while (out.length > maxRangesPerChunk) {
    let mergeAt = 0
    let smallestGap = Number.POSITIVE_INFINITY
    let smallestMergedSegmentCount = Number.POSITIVE_INFINITY

    for (let index = 0; index < out.length - 1; index += 1) {
      const current = out[index]!
      const next = out[index + 1]!
      const currentEnd = current.offset + current.length
      const gap = next.offset - currentEnd
      const mergedSegmentCount = current.segments.length + next.segments.length

      if (
        gap < smallestGap ||
        (gap === smallestGap && mergedSegmentCount < smallestMergedSegmentCount)
      ) {
        smallestGap = gap
        smallestMergedSegmentCount = mergedSegmentCount
        mergeAt = index
      }
    }

    const current = out[mergeAt]!
    const next = out[mergeAt + 1]!
    const nextEnd = next.offset + next.length

    current.length = Math.max(current.length, nextEnd - current.offset)
    current.segments.push(...next.segments)
    out.splice(mergeAt + 1, 1)
  }

  return out
}

function planCost(plan: RouterLoadPlan, tuning: PlannerTuning): number {
  return plan.estimate.fetchedBytes + plan.estimate.requestCount * tuning.rangeRequestPenaltyBytes
}

function segmentConcurrency(count: number, fetchedBytes: number, tuning: PlannerTuning): number {
  const max =
    fetchedBytes <= SMALL_SELECTED_BYTES
      ? Math.min(4, tuning.maxParallelSegmentRequests)
      : tuning.maxParallelSegmentRequests

  return Math.min(max, Math.max(1, count))
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value! >= 0 ? value! : fallback
}

function positiveInt(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value! > 0 ? Math.floor(value!) : fallback
}

function estimateRangeAccess(ranges: readonly RouterChunkRange[]): {
  requestCount: number
  fetchedBytes: number
} {
  const byChunk = new Map<string, RouterChunkRange[]>()

  for (const range of ranges) {
    const chunkRanges = byChunk.get(range.chunk.id) ?? []

    chunkRanges.push(range)
    byChunk.set(range.chunk.id, chunkRanges)
  }

  let requestCount = 0
  let fetchedBytes = 0

  for (const chunkRanges of byChunk.values()) {
    const firstRange = chunkRanges[0]

    if (firstRange && typeof firstRange.chunk.payloadOffset === 'number') {
      requestCount += chunkRanges.length
      fetchedBytes += chunkRanges.reduce((sum, range) => sum + range.length, 0)
      continue
    }

    requestCount += 1
    fetchedBytes += CHUNK_PAYLOAD_HEADER_PROBE_BYTES

    for (const range of chunkRanges) {
      const rangeEnd = range.offset + range.length

      if (rangeEnd <= CHUNK_PAYLOAD_HEADER_PROBE_BYTES) continue
      requestCount += 1
      fetchedBytes += rangeEnd - Math.max(range.offset, CHUNK_PAYLOAD_HEADER_PROBE_BYTES)
    }
  }

  return { requestCount, fetchedBytes }
}

export function segmentCoversChunkPayload(
  chunk: RouterChunkManifestEntry,
  segment: RouterFileSegment,
): boolean {
  return (
    typeof chunk.byteLength === 'number' &&
    segment.offset === 0 &&
    segment.length === chunk.byteLength
  )
}

function canStreamDecode(): boolean {
  return typeof DecompressionStream !== 'undefined'
}
