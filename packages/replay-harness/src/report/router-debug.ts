import type { AssetMarker, RouterDebugChunkSummary, RouterDebugSummary } from './types.js'

interface MutableChunkSummary extends RouterDebugChunkSummary {
  fileUrls: Set<string>
}

export function summarizeRouterDebug(
  markers: ReadonlyArray<AssetMarker> | undefined,
): RouterDebugSummary | undefined {
  const summary: RouterDebugSummary = {
    eventCount: 0,
    manifest: { count: 0, durationMs: 0, tokenDecodeMs: 0, jsonParseMs: 0 },
    plan: {
      count: 0,
      durationMs: 0,
      byReason: {},
      byStrategy: {},
      byMode: {},
      byKind: {},
      requestCount: 0,
      chunkCount: 0,
      segmentCount: 0,
      selectedBytes: 0,
      fetchedBytes: 0,
    },
    fileCache: { count: 0, durationMs: 0, miss: 0, pending: 0, hit: 0, bytes: 0 },
    chunks: { count: 0, durationMs: 0, miss: 0, pending: 0, hit: 0 },
    ranges: { count: 0, durationMs: 0, bytes: 0, fallback: 0 },
    decompress: { count: 0, durationMs: 0, compressedBytes: 0, rawBytes: 0 },
    materialize: { count: 0, durationMs: 0, decodeMs: 0, executeMs: 0, bytes: 0 },
    planDecisions: [],
    perChunk: [],
  }
  const chunks = new Map<string, MutableChunkSummary>()
  const seenSeq = new Set<number>()

  for (const marker of markers ?? []) {
    for (const event of marker.routerDebugEvents ?? []) {
      const seq = (event as { seq?: number }).seq

      if (typeof seq === 'number') {
        if (seenSeq.has(seq)) continue
        seenSeq.add(seq)
      }
      summary.eventCount += 1
      if (event.type === 'manifest') {
        summary.manifest.count += 1
        summary.manifest.durationMs += event.durationMs
        summary.manifest.tokenDecodeMs += event.tokenDecodeMs
        summary.manifest.jsonParseMs += event.jsonParseMs
      } else if (event.type === 'plan') {
        summary.plan.count += 1
        summary.plan.durationMs += event.durationMs
        countKey(summary.plan.byReason, event.reason)
        countKey(summary.plan.byStrategy, event.strategy)
        countKey(summary.plan.byMode, event.mode)
        countKey(summary.plan.byKind, event.kind)
        summary.plan.requestCount += event.requestCount
        summary.plan.chunkCount += event.chunkCount
        summary.plan.segmentCount += event.segmentCount
        summary.plan.selectedBytes += event.selectedBytes
        summary.plan.fetchedBytes += event.fetchedBytes
        summary.planDecisions.push({
          path: event.paths?.[0] ?? marker.url,
          paths: event.paths ?? [],
          files: event.files,
          kind: event.kind,
          mode: event.mode,
          strategy: event.strategy,
          reason: event.reason,
          fileCount: event.fileCount ?? 1,
          requestCount: event.requestCount,
          chunkCount: event.chunkCount,
          segmentCount: event.segmentCount,
          selectedBytes: event.selectedBytes,
          fetchedBytes: event.fetchedBytes,
          concurrency: event.concurrency,
          durationMs: event.durationMs,
          chunkIds: event.chunkIds ?? [],
        })
      } else if (event.type === 'file-cache') {
        summary.fileCache.count += 1
        summary.fileCache.durationMs += event.durationMs
        summary.fileCache.bytes += event.bytes
        countCacheState(event.cacheState, summary.fileCache)
      } else if (event.type === 'chunk') {
        const chunk = chunkSummary(chunks, event.chunkId, event.url)

        summary.chunks.count += 1
        summary.chunks.durationMs += event.durationMs
        chunk.chunkDecodeMs += event.durationMs
        chunk.payloadBytes = Math.max(chunk.payloadBytes, event.payloadBytes)
        if (event.pngBytes !== undefined)
          chunk.pngBytes = Math.max(chunk.pngBytes ?? 0, event.pngBytes)
        countCacheState(event.cacheState, summary.chunks)
        countCacheState(event.cacheState, chunk)
        chunk.fileUrls.add(marker.url)
      } else if (event.type === 'payload-handle') {
        const chunk = chunkSummary(chunks, event.chunkId, event.url)

        chunk.handleMs += event.durationMs
        chunk.payloadBytes = Math.max(chunk.payloadBytes, event.payloadBytes)
        countCacheState(event.cacheState, chunk)
        chunk.fileUrls.add(marker.url)
      } else if (event.type === 'range') {
        const chunk = chunkSummary(chunks, event.chunkId, event.url)

        summary.ranges.count += 1
        summary.ranges.durationMs += event.durationMs
        summary.ranges.bytes += event.bytes
        if (event.fallback) summary.ranges.fallback += 1
        chunk.rangeMs += event.durationMs
        chunk.rangeBytes += event.bytes
        chunk.rangeCount += 1
        if (event.fallback) chunk.fallbackRangeCount += 1
        chunk.fileUrls.add(marker.url)
      } else if (event.type === 'decompress') {
        summary.decompress.count += 1
        summary.decompress.durationMs += event.durationMs
        summary.decompress.compressedBytes += event.compressedBytes
        summary.decompress.rawBytes += event.rawBytes
      } else if (event.type === 'materialize') {
        summary.materialize.count += 1
        summary.materialize.durationMs += event.durationMs
        summary.materialize.decodeMs += event.decodeMs
        summary.materialize.executeMs += event.executeMs
        summary.materialize.bytes += event.bytes
      }
    }
  }

  if (summary.eventCount === 0) return undefined
  summary.perChunk = [...chunks.values()]
    .map(({ fileUrls, ...chunk }) => ({ ...chunk, filesServed: fileUrls.size }))
    .sort((a, b) => b.chunkDecodeMs + b.rangeMs - (a.chunkDecodeMs + a.rangeMs))
  summary.planDecisions.sort(
    (a, b) =>
      b.fetchedBytes - a.fetchedBytes ||
      b.requestCount - a.requestCount ||
      a.path.localeCompare(b.path),
  )

  return summary
}

function countKey(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1
}

function chunkSummary(
  chunks: Map<string, MutableChunkSummary>,
  chunkId: string,
  url?: string,
): MutableChunkSummary {
  let chunk = chunks.get(chunkId)

  if (!chunk) {
    chunk = {
      chunkId,
      url,
      payloadBytes: 0,
      chunkDecodeMs: 0,
      rangeMs: 0,
      rangeBytes: 0,
      handleMs: 0,
      miss: 0,
      pending: 0,
      hit: 0,
      rangeCount: 0,
      fallbackRangeCount: 0,
      filesServed: 0,
      fileUrls: new Set<string>(),
    }
    chunks.set(chunkId, chunk)
  } else if (!chunk.url && url) {
    chunk.url = url
  }

  return chunk
}

function countCacheState(
  state: 'miss' | 'pending' | 'hit',
  target: { miss: number; pending: number; hit: number },
): void {
  if (state === 'miss') target.miss += 1
  else if (state === 'pending') target.pending += 1
  else target.hit += 1
}
