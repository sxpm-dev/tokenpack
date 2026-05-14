import type { RouterDebugEvent, RouterDebugPlanFile } from '@tokenpack/browser'

/**
 * Per-asset timing record. Captured in both baseline and tokenpack modes
 * when --token-debug is on.
 */
export interface AssetMarker {
  url: string
  /**
   * What the run did with this URL.
   *  - 'pack'                 → served from a token pack (tokenpack mode)
   *  - 'origin'               → fetched from origin (baseline) or refetched (baseline-cdp)
   *  - 'fall-through'         → no manifest entry, hit origin natively
   *  - 'skipped-by-threshold' → manifest had an asset for this URL but its group
   *                              fell below the min-group-size threshold and was
   *                              excluded from packs by intent
   */
  source: 'pack' | 'origin' | 'fall-through' | 'skipped-by-threshold'
  /** Pack id when `source === 'pack'`. */
  packId?: string
  /** Status code (200, 304, etc.). */
  status: number | null
  /** When the request was first observed (page-relative ms). */
  observedMs: number
  /**
   * Pack/file fetch cost charged to this specific request.
   *   - tokenpack full/stream: time this request waited for pack fetch+decode
   *   - tokenpack range-stream: metadata wait + this file's range fetch
   *   - baseline: time spent fetching this asset's bytes from origin
   *   - fall-through: undefined
   */
  fetchMs?: number
  /**
   * Time this request waited for pack-level initialization.
   *   - full/stream: whole token fetch + decode, or wait for an in-flight init
   *   - range-stream: metadata/manifest range read, or wait for an in-flight init
   */
  packInitMs?: number
  /** Time spent fetching this file's own range. Range-stream tokenpack only. */
  fileFetchMs?: number
  /** Pack cache state at request start. Helps separate first init from concurrent waiters. */
  cacheState?: 'miss' | 'pending' | 'hit'
  /**
   * Time to extract this asset's bytes from the decoded pack. tokenpack only.
   */
  extractMs?: number
  /** Total time spent in our handler. */
  totalMs: number | null
  /** Body size in bytes (raw for pack, wire for origin). */
  bytes: number | null
  /** Router-token internal events that happened while serving this asset. */
  routerDebugEvents?: RouterDebugEvent[]
}

export interface PhaseRecord {
  durationMs: number
  loadEventMs: number | null
  timedOut?: boolean
  error?: string
  sanity?: PhaseSanity
  served?: number
  fellThrough?: number
  totalBytes?: number
  /** URL set covered by the TokenPack manifest for this phase/variant. */
  manifestUrls?: string[]
  assetMarkers?: AssetMarker[]
  routerDebug?: RouterDebugSummary
}

export interface RouterDebugSummary {
  eventCount: number
  manifest: {
    count: number
    durationMs: number
    tokenDecodeMs: number
    jsonParseMs: number
  }
  plan: {
    count: number
    durationMs: number
    byReason: Record<string, number>
    byStrategy: Record<string, number>
    byMode: Record<string, number>
    byKind: Record<string, number>
    requestCount: number
    chunkCount: number
    segmentCount: number
    selectedBytes: number
    fetchedBytes: number
  }
  fileCache: {
    count: number
    durationMs: number
    miss: number
    pending: number
    hit: number
    bytes: number
  }
  chunks: {
    count: number
    durationMs: number
    miss: number
    pending: number
    hit: number
  }
  ranges: {
    count: number
    durationMs: number
    bytes: number
    fallback: number
  }
  decompress: {
    count: number
    durationMs: number
    compressedBytes: number
    rawBytes: number
  }
  materialize: {
    count: number
    durationMs: number
    decodeMs: number
    executeMs: number
    bytes: number
  }
  planDecisions: RouterDebugPlanDecision[]
  perChunk: RouterDebugChunkSummary[]
}

export interface RouterDebugPlanDecision {
  path: string
  paths: string[]
  files?: RouterDebugPlanFile[]
  kind: string
  mode: string
  strategy: string
  reason: string
  fileCount: number
  requestCount: number
  chunkCount: number
  segmentCount: number
  selectedBytes: number
  fetchedBytes: number
  concurrency: number
  durationMs: number
  chunkIds: string[]
}

export interface RouterDebugChunkSummary {
  chunkId: string
  url?: string
  pngBytes?: number
  payloadBytes: number
  chunkDecodeMs: number
  rangeMs: number
  rangeBytes: number
  handleMs: number
  miss: number
  pending: number
  hit: number
  rangeCount: number
  fallbackRangeCount: number
  filesServed: number
}

export interface PhaseSanity {
  finalUrl?: string
  title?: string
  bodyTextSample?: string
  screenshotPath?: string
  consoleMessages?: BrowserConsoleMessage[]
  consoleErrors?: string[]
  pageErrors?: string[]
}

export interface BrowserConsoleMessage {
  type: string
  text: string
}

export type RunMode = 'baseline' | 'baseline-cdp' | 'tokenpack'

export interface RunRecord {
  iter: number
  mode: RunMode
  tokenVariantId?: string
  targetId: string
  /** Cold load — first goto in a fresh browser context. */
  cold: PhaseRecord
  /** Warm-cache load — page.reload() after the cold load (same context). */
  reload: PhaseRecord | null
}

export interface RunSummaryStats {
  count: number
  avgMs: number
  minMs: number
  maxMs: number
}

export interface RunReport {
  target: { id: string; url: string }
  fixture?: {
    id: string
    shape: 'service-groups' | 'bundle-single' | 'bundle-chunks'
    chunks?: number
  }
  throttle: string
  samples: number
  mode: 'local' | 'cdn' | 'isolate'
  deliveryMode?: 'cdp' | 'sw'
  strategy: string
  tokenpackVariants?: Array<{
    id: string
    algo: string
    channels: 3 | 4
    loadMode: string
    packCompressor: string
    strategy: string
  }>
  tokenDebug: boolean
  capturedAt: string
  iterations: RunRecord[]
  summary: {
    cold: PhaseSummary
    reload: PhaseSummary
  }
  variantSummaries?: Record<
    string,
    {
      cold: PhaseSummary
      reload: PhaseSummary
    }
  >
}

export interface ModeStats {
  duration: RunSummaryStats
  loadEvent: RunSummaryStats
  assetWindow?: {
    count: number
    avgStartMs: number
    avgEndMs: number
    avgWindowMs: number
    minWindowMs: number
    maxWindowMs: number
  }
  timeouts?: number
  errors?: number
  avgServed?: number
  avgFellThrough?: number
}

export interface PhaseSummary {
  baseline: ModeStats
  baselineCdp: ModeStats
  tokenpack: ModeStats
  /** TokenPack vs baseline (production fairness check). */
  deltaTpVsBl: {
    durationMs: number
    durationPct: number
    loadEventMs: number
    loadEventPct: number
  }
  /** TokenPack vs baseline-cdp (technology fairness check; harness tax canceled). */
  deltaTpVsBlCdp: {
    durationMs: number
    durationPct: number
    loadEventMs: number
    loadEventPct: number
  }
}
