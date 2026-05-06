// Shared helpers for /api/runtime-benchmark/* routes.

import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'

const REPO_ROOT = path.join(process.cwd(), '..', '..')

export const BENCH_SOURCES = path.join(REPO_ROOT, 'benchmark', 'sources')
export const BENCH_TOKENS = path.join(REPO_ROOT, 'benchmark', 'tokens')

export const SOURCE_FILES: Record<string, string> = {
  'react-dom-dev': 'react-dom-client.development.js',
  'react-dom-prod': 'react-dom-client.production.js',
  'chunk-5mb': 'chunk-5mb.js',
  screenshot: 'screenshot.jpg',
  'client-spec': 'client-spec-map.json',
  'client-spec-min': 'client-spec-map.min.json',
}

export const SOURCE_MIMES: Record<string, string> = {
  'react-dom-dev': 'application/javascript; charset=utf-8',
  'react-dom-prod': 'application/javascript; charset=utf-8',
  'chunk-5mb': 'application/javascript; charset=utf-8',
  screenshot: 'image/jpeg',
  'client-spec': 'application/json; charset=utf-8',
  'client-spec-min': 'application/json; charset=utf-8',
}

export const SOURCE_TO_TOKEN_NAME: Record<string, string> = {
  'react-dom-dev': 'react-dom-client.development',
  'react-dom-prod': 'react-dom-client.production',
  'chunk-5mb': 'chunk-5mb',
  screenshot: 'screenshot',
  'client-spec': 'client-spec-map',
  'client-spec-min': 'client-spec-map.min',
}

export const SCENARIOS = [
  'max-webp3',
  'max-png3',
  'max-def3',
  'stream-png3',
  'stream-def3',
] as const

export type ScenarioId = (typeof SCENARIOS)[number]

export function tokenPathFor(
  source: string,
  scenario: string,
): { path: string; mime: string } | null {
  const sourceName = SOURCE_TO_TOKEN_NAME[source]

  if (!sourceName) return null
  const ext = scenario === 'max-webp3' ? '.webp' : '.png'
  const mime = ext === '.webp' ? 'image/webp' : 'image/png'
  const filePath = path.join(BENCH_TOKENS, `${scenario}__${sourceName}${ext}`)

  if (!fs.existsSync(filePath)) return null

  return { path: filePath, mime }
}

export function sourcePathFor(source: string): { path: string; size: number } | null {
  const file = SOURCE_FILES[source]

  if (!file) return null
  const filePath = path.join(BENCH_SOURCES, file)

  if (!fs.existsSync(filePath)) return null
  const size = fs.statSync(filePath).size

  return { path: filePath, size }
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
// Matches the conditions used by `benchmark/run.ts` so numbers are comparable
// across the offline benchmark + the in-app runtime benchmark.

export interface NetworkCondition {
  name: 'local' | 'fast-cdn' | 'average' | 'slow'
  latencyMs: number
  bandwidthBps: number
  label: string
}

export const NETWORK_CONDITIONS: readonly NetworkCondition[] = [
  { name: 'local', latencyMs: 0, bandwidthBps: Infinity, label: 'Local · no throttle' },
  {
    name: 'fast-cdn',
    latencyMs: 10,
    bandwidthBps: 100 * 1024 * 1024,
    label: 'Fast CDN · 10ms · 100 MB/s',
  },
  {
    name: 'average',
    latencyMs: 50,
    bandwidthBps: 10 * 1024 * 1024,
    label: 'Average · 50ms · 10 MB/s',
  },
  { name: 'slow', latencyMs: 100, bandwidthBps: 2 * 1024 * 1024, label: 'Slow · 100ms · 2 MB/s' },
] as const

export function networkConditionFor(name: string | null): NetworkCondition {
  return NETWORK_CONDITIONS.find(c => c.name === name) ?? NETWORK_CONDITIONS[0]
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const THROTTLE_CHUNK = 8 * 1024

/**
 * Wrap a fully-buffered body for response streaming, optionally pacing it to
 * simulate a network condition.
 *
 * For `local` (latency=0, bandwidth=Infinity) we short-circuit and return the
 * raw `Buffer`, so `NextResponse` hands it to the runtime without any extra
 * chunking, microtask-queue churn, or per-chunk `enqueue` overhead — the
 * timings match the pre-throttle implementation byte-for-byte.
 *
 * For throttled conditions we return a `ReadableStream` that applies the
 * leading-latency sleep, then emits 8KB chunks paced to the target bandwidth.
 * Note that JS `setTimeout` minimums (~1ms in browsers, ~4ms with nested
 * timers) cap the achievable upper bandwidth — this matches the offline
 * benchmark in `benchmark/run.ts`.
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

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (latencyMs > 0) await sleep(latencyMs)

      let offset = 0

      while (offset < view.byteLength) {
        const end = Math.min(offset + THROTTLE_CHUNK, view.byteLength)
        const chunk = view.subarray(offset, end)

        controller.enqueue(chunk)
        offset = end
        if (isFinite(bandwidthBps) && offset < view.byteLength) {
          await sleep((chunk.byteLength / bandwidthBps) * 1000)
        }
      }
      controller.close()
    },
  })
}
