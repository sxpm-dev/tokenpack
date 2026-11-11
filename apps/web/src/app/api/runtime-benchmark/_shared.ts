// Shared helpers for /api/runtime-benchmark/* routes.

import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const RUNTIME_FIXTURES = path.join(process.cwd(), 'benchmark-fixtures', 'runtime')

export interface RuntimeFixtureEntry {
  kind: 'native' | 'token' | 'range-pack' | 'router'
  tab: 'content' | 'script'
  source: string
  sourceKind: 'json' | 'text'
  chunkCount: number
  chunkIndex?: number
  encoding?: 'raw' | 'deflate' | 'brotli'
  group?: 'fetch' | 'stream'
  algo?: string
  channels?: number
  surface?: string
  compressor?: string
  regionCompressor?: string
  streamable?: boolean
  file: string
  bytes: number
  originalBytes: number
  sha256: string
  files?: Array<{
    path: string
    originalBytes: number
    sha256: string
  }>
  chunks?: Array<{
    id: string
    href: string
    file: string
    bytes: number
    sha256: string
  }>
}

export interface RuntimeFixtureManifest {
  generatedAt: string
  sources: Array<{
    id: string
    file: string
    kind: 'json' | 'text'
    bytes: number
    sha256: string
  }>
  chunkCounts: number[]
  encodings: Array<'raw' | 'deflate' | 'brotli'>
  algorithms: Array<{
    name: string
    group: 'fetch' | 'stream'
    channels: ReadonlyArray<1 | 2 | 3 | 4>
    surface: string
    extension: string
    compressor: string
    streamable: boolean
  }>
  fixtures: RuntimeFixtureEntry[]
}

export function runtimeCaseId(source: string, chunkCount: number, chunkIndex: number): string {
  return `${source}__chunks-${chunkCount}__chunk-${String(chunkIndex).padStart(2, '0')}`
}

export function runtimeStrategyId(source: string, chunkCount: number): string {
  return `${source}__chunks-${chunkCount}`
}

export function readRuntimeManifest(): RuntimeFixtureManifest | null {
  const manifestPath = path.join(RUNTIME_FIXTURES, 'manifest.json')

  if (!fs.existsSync(manifestPath)) return null
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RuntimeFixtureManifest
  } catch {
    return null
  }
}

export function parseRuntimeCaseId(
  id: string,
): { source: string; chunkCount: number; chunkIndex: number } | null {
  const match = /^(.*)__chunks-(\d+)__chunk-(\d+)$/.exec(id)

  if (!match) return null

  return {
    source: match[1],
    chunkCount: Number(match[2]),
    chunkIndex: Number(match[3]),
  }
}

export function parseRuntimeStrategyId(id: string): { source: string; chunkCount: number } | null {
  const match = /^(.*)__chunks-(\d+)$/.exec(id)

  if (!match) return null

  return {
    source: match[1],
    chunkCount: Number(match[2]),
  }
}

export function listRuntimeContentCases(manifest: RuntimeFixtureManifest) {
  return listRuntimeCases(manifest, 'content')
}

export function listRuntimeScriptCases(manifest: RuntimeFixtureManifest) {
  return listRuntimeCases(manifest, 'script')
}

export function listRuntimeRangePackCases(manifest: RuntimeFixtureManifest) {
  const out: Array<{
    id: string
    tab: 'content' | 'script'
    source: string
    sourceKind: 'json' | 'text'
    chunkCount: number
    rawBytes: number
    fileCount: number
  }> = []

  for (const fixture of manifest.fixtures) {
    if (fixture.kind !== 'range-pack') continue

    out.push({
      id: runtimeStrategyId(fixture.source, fixture.chunkCount),
      tab: fixture.tab,
      source: fixture.source,
      sourceKind: fixture.sourceKind,
      chunkCount: fixture.chunkCount,
      rawBytes: fixture.originalBytes,
      fileCount: fixture.files?.length ?? fixture.chunkCount,
    })
  }

  return out
}

export function listRuntimeRouterCases(manifest: RuntimeFixtureManifest) {
  const out: Array<{
    id: string
    tab: 'content' | 'script'
    source: string
    sourceKind: 'json' | 'text'
    chunkCount: number
    rawBytes: number
    fileCount: number
    chunkTokenCount: number
    wireBytes: number
    requestCount: number
  }> = []

  for (const fixture of manifest.fixtures) {
    if (fixture.kind !== 'router') continue

    out.push({
      id: runtimeStrategyId(fixture.source, fixture.chunkCount),
      tab: fixture.tab,
      source: fixture.source,
      sourceKind: fixture.sourceKind,
      chunkCount: fixture.chunkCount,
      rawBytes: fixture.originalBytes,
      fileCount: fixture.files?.length ?? fixture.chunkCount,
      chunkTokenCount: fixture.chunks?.length ?? fixture.chunkCount,
      wireBytes:
        fixture.bytes + (fixture.chunks?.reduce((sum, chunk) => sum + chunk.bytes, 0) ?? 0),
      requestCount: 1 + (fixture.chunks?.length ?? fixture.chunkCount),
    })
  }

  return out
}

function listRuntimeCases(manifest: RuntimeFixtureManifest, tab: 'content' | 'script') {
  const seen = new Map<
    string,
    {
      id: string
      source: string
      sourceKind: 'json' | 'text'
      chunkCount: number
      rawBytes: number
      chunkIndexes: number[]
    }
  >()
  const out: Array<{
    id: string
    source: string
    sourceKind: 'json' | 'text'
    chunkCount: number
    rawBytes: number
    chunkIndexes: number[]
  }> = []

  for (const fixture of manifest.fixtures) {
    if (fixture.tab !== tab || fixture.kind !== 'native' || fixture.encoding !== 'raw') {
      continue
    }
    const chunkIndex = fixture.chunkIndex ?? 0
    const id = runtimeStrategyId(fixture.source, fixture.chunkCount)
    const existing = seen.get(id)

    if (existing) {
      existing.rawBytes += fixture.originalBytes
      existing.chunkIndexes.push(chunkIndex)
      continue
    }
    const aggregate = {
      id,
      source: fixture.source,
      sourceKind: fixture.sourceKind,
      chunkCount: fixture.chunkCount,
      rawBytes: fixture.originalBytes,
      chunkIndexes: [chunkIndex],
    }

    seen.set(id, aggregate)
    out.push(aggregate)
  }

  return out
}

export function findRuntimeFixture(
  manifest: RuntimeFixtureManifest,
  input: {
    tab: 'content' | 'script'
    caseId: string
    chunkIndex?: number
    kind: 'native' | 'token'
    encoding?: 'raw' | 'deflate' | 'brotli'
    algo?: string
    channels?: number
  },
): RuntimeFixtureEntry | null {
  const parsedCase = parseRuntimeCaseId(input.caseId)
  const parsedStrategy = parsedCase ?? parseRuntimeStrategyId(input.caseId)

  if (!parsedStrategy) return null
  const chunkIndex = input.chunkIndex ?? parsedCase?.chunkIndex ?? 0

  return (
    manifest.fixtures.find(fixture => {
      if (fixture.tab !== input.tab) return false
      if (fixture.kind !== input.kind) return false
      if (fixture.source !== parsedStrategy.source) return false
      if (fixture.chunkCount !== parsedStrategy.chunkCount) return false
      if ((fixture.chunkIndex ?? 0) !== chunkIndex) return false
      if (input.kind === 'native') return fixture.encoding === input.encoding

      return fixture.algo === input.algo && fixture.channels === input.channels
    }) ?? null
  )
}

export function findRuntimeRangePackFixture(
  manifest: RuntimeFixtureManifest,
  source: string,
  tab: 'content' | 'script' = 'content',
): RuntimeFixtureEntry | null {
  const parsed = parseRuntimeStrategyId(source)

  if (!parsed) return null

  return (
    manifest.fixtures.find(
      fixture =>
        fixture.kind === 'range-pack' &&
        fixture.tab === tab &&
        fixture.source === parsed.source &&
        fixture.chunkCount === parsed.chunkCount,
    ) ?? null
  )
}

export function findRuntimeRouterFixture(
  manifest: RuntimeFixtureManifest,
  source: string,
  tab: 'content' | 'script',
): RuntimeFixtureEntry | null {
  const parsed = parseRuntimeStrategyId(source)

  if (!parsed) return null

  return (
    manifest.fixtures.find(
      fixture =>
        fixture.kind === 'router' &&
        fixture.tab === tab &&
        fixture.source === parsed.source &&
        fixture.chunkCount === parsed.chunkCount,
    ) ?? null
  )
}

export function runtimeFixturePath(fixture: RuntimeFixtureEntry): string {
  return path.join(RUNTIME_FIXTURES, fixture.file)
}

export function contentEncodingHeader(encoding: 'raw' | 'deflate' | 'brotli'): string | null {
  if (encoding === 'raw') return null
  if (encoding === 'brotli') return 'br'

  return 'deflate'
}

/**
 * Standard "no caches anywhere" headers — server side of the three-layer
 * cache prevention (the other two are fetch({cache:'no-store'}) and the
 * URL `?nonce=…` param the client appends).
 */
export const NO_CACHE_HEADERS: Record<string, string> = {
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  pragma: 'no-cache',
  expires: '0',
  // Disable shared/CDN caches and any heuristic-based intermediate cache.
  vary: '*',
}

export function jsonNoCache(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: { ...NO_CACHE_HEADERS, ...(init?.headers as Record<string, string> | undefined) },
  })
}

/**
 * Read query param. Returns null if missing.
 */
export function param(req: NextRequest, name: string): string | null {
  const v = new URL(req.url).searchParams.get(name)

  return v === null || v === '' ? null : v
}

// ── Network throttling ────────────────────────────────────────────────────
// Matches the conditions used by `scripts/benchmark/run.ts` so numbers are comparable
// across the offline benchmark + the in-app runtime benchmark.

export interface NetworkCondition {
  name: 'local' | 'fast-cdn' | 'average' | 'slow' | 'slow-parallel'
  latencyMs: number
  bandwidthBps: number
  label: string
  bandwidthScope: 'none' | 'shared' | 'per-response'
}

export const NETWORK_CONDITIONS: readonly NetworkCondition[] = [
  {
    name: 'local',
    latencyMs: 0,
    bandwidthBps: Infinity,
    label: 'Local · no throttle',
    bandwidthScope: 'none',
  },
  {
    name: 'fast-cdn',
    latencyMs: 10,
    bandwidthBps: 100 * 1024 * 1024,
    label: 'Fast CDN · 10ms · 100 MB/s shared',
    bandwidthScope: 'shared',
  },
  {
    name: 'average',
    latencyMs: 50,
    bandwidthBps: 10 * 1024 * 1024,
    label: 'Average · 50ms · 10 MB/s shared',
    bandwidthScope: 'shared',
  },
  {
    name: 'slow',
    latencyMs: 100,
    bandwidthBps: 2 * 1024 * 1024,
    label: 'Slow · 100ms · 2 MB/s shared',
    bandwidthScope: 'shared',
  },
  {
    name: 'slow-parallel',
    latencyMs: 100,
    bandwidthBps: 2 * 1024 * 1024,
    label: 'Slow parallel · 100ms · 2 MB/s per response',
    bandwidthScope: 'per-response',
  },
] as const

export function networkConditionFor(name: string | null): NetworkCondition {
  return NETWORK_CONDITIONS.find(c => c.name === name) ?? NETWORK_CONDITIONS[0]
}

const sleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve()

const FIRST_THROTTLE_CHUNK = 16 * 1024
const THROTTLE_CHUNK = 256 * 1024

class SharedBandwidthLimiter {
  private nextAvailableAt = 0

  async waitFor(bytes: number, bandwidthBps: number): Promise<void> {
    if (!isFinite(bandwidthBps) || bytes <= 0) return

    const now = Date.now()
    const durationMs = (bytes / bandwidthBps) * 1000
    const startAt = Math.max(now, this.nextAvailableAt)
    const endAt = startAt + durationMs

    this.nextAvailableAt = endAt
    await sleep(endAt - now)
  }
}

const bandwidthLimiters = new Map<NetworkCondition['name'], SharedBandwidthLimiter>()

function bandwidthLimiterFor(condition: NetworkCondition): SharedBandwidthLimiter {
  let limiter = bandwidthLimiters.get(condition.name)

  if (!limiter) {
    limiter = new SharedBandwidthLimiter()
    bandwidthLimiters.set(condition.name, limiter)
  }

  return limiter
}

/**
 * Wrap a fully-buffered body for response streaming, optionally pacing it to
 * simulate a network condition.
 *
 * For `local` (latency=0, bandwidth=Infinity) we short-circuit and return the
 * raw `Buffer`, so `NextResponse` hands it to the runtime without any extra
 * chunking, microtask-queue churn, or per-chunk `enqueue` overhead — the
 * timings match the pre-throttle implementation byte-for-byte.
 *
 * For throttled conditions we return a `ReadableStream` that applies per-request
 * latency, then emits chunks paced either by a shared bandwidth limiter or by a
 * per-response limiter. Shared mode models one client pipe. Per-response mode is
 * an optimistic upper bound for CDN / multi-connection strategies where parallel
 * requests can each make bandwidth progress.
 *
 * The first chunk is intentionally small so TTFB is close to the latency value;
 * later chunks are larger to avoid timer overhead dominating fast-cdn cases.
 */

export function throttledBody(body: Buffer, condition: NetworkCondition): any {
  const { latencyMs, bandwidthBps } = condition

  // No throttle: hand the buffer to NextResponse directly. Critical for the
  // local-mode timings to be apples-to-apples with the pre-throttle code, and
  // for the streaming PNG decoder to receive chunks at the runtime's natural
  // boundaries instead of our 8KB-paced ones.
  if (latencyMs === 0 && !isFinite(bandwidthBps)) {
    return body
  }

  const view = new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
  const sharedLimiter =
    condition.bandwidthScope === 'shared' ? bandwidthLimiterFor(condition) : null

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (latencyMs > 0) await sleep(latencyMs)

      let offset = 0

      while (offset < view.byteLength) {
        const size = offset === 0 ? FIRST_THROTTLE_CHUNK : THROTTLE_CHUNK
        const end = Math.min(offset + size, view.byteLength)
        const chunk = view.subarray(offset, end)

        if (sharedLimiter) {
          await sharedLimiter.waitFor(chunk.byteLength, bandwidthBps)
        } else if (condition.bandwidthScope === 'per-response' && isFinite(bandwidthBps)) {
          await sleep((chunk.byteLength / bandwidthBps) * 1000)
        }
        controller.enqueue(chunk)
        offset = end
      }
      controller.close()
    },
  })
}
