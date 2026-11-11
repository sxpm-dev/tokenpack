/**
 * Drive Playwright across (loader × origin) and print a results table.
 *
 *   yarn bench --iters=10
 *   yarn bench --iters=10 --cdn-base=https://d31tszh4x6dwf2.cloudfront.net/bench-app/<ts>
 *   yarn bench --only=router,multi --origin=local
 *
 * Each iteration opens a fresh context (cold cache), navigates with the
 * variant params, waits for window.__BENCH_BOOT_DONE, captures phases.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { type Browser, chromium } from 'playwright'

import { PUBLIC_BASE, RESULTS_DIR } from './paths.js'

const ITERS = numFlag('iters', 5)
const PORT = numFlag('port', 4173)
const CDN_BASE = strFlag('cdn-base') ?? ''
const ONLY = (strFlag('only') ?? '').split(',').filter(Boolean)
const ORIGIN_FILTER = strFlag('origin') ?? ''
const THROTTLE = strFlag('throttle') ?? 'none'
const BOOT_TIMEOUT_MS = numFlag('boot-timeout-ms', 60_000)
const LAZY_TIMEOUT_MS = numFlag('lazy-timeout-ms', 60_000)
const ITER_TIMEOUT_MS = numFlag('iter-timeout-ms', BOOT_TIMEOUT_MS + LAZY_TIMEOUT_MS + 30_000)
const ORIGIN = strFlag('url') ?? `http://localhost:${PORT}`
const BASE_PATH = strFlag('base-path') ?? PUBLIC_BASE

// Bandwidth in bytes/sec, latency in ms. Matches Chrome DevTools presets.
const THROTTLE_PRESETS: Record<
  string,
  { downloadThroughput: number; uploadThroughput: number; latency: number } | null
> = {
  none: null,
  'fast-cdn': {
    downloadThroughput: (25 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
    latency: 30,
  },
  'fast-4g': {
    downloadThroughput: (9 * 1024 * 1024) / 8,
    uploadThroughput: (1.5 * 1024 * 1024) / 8,
    latency: 170,
  },
  'slow-3g': {
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
    latency: 400,
  },
}

const throttlePreset = THROTTLE_PRESETS[THROTTLE]

if (throttlePreset === undefined) {
  console.error(`unknown throttle: ${THROTTLE}; valid: ${Object.keys(THROTTLE_PRESETS).join(', ')}`)
  process.exit(1)
}

type Loader = 'multi' | 'single' | 'router' | 'native-chunks' | 'native-single'
type Origin = 'local' | 'cdn'

interface Case {
  loader: Loader
  origin: Origin
}

const ALL_LOADERS: readonly Loader[] = [
  'multi',
  'single',
  'router',
  'native-chunks',
  'native-single',
]

interface WireBytes {
  requests: number
  transferBytes: number
  encodedBytes: number
  decodedBytes: number
}

interface PhaseSample {
  totalMs: number
  phases: Record<string, number>
  bytes: WireBytes | null
}

interface Sample {
  boot: PhaseSample
  lazy: PhaseSample | null
}

interface PhaseStats {
  samples: number[]
  median: number
  mean: number
  p95: number
  min: number
  max: number
}

interface ByteStats {
  requests: number
  transferBytes: number
  encodedBytes: number
  decodedBytes: number
}

interface CaseResult extends Case {
  samples: Sample[]
  boot: PhaseStats
  lazy: PhaseStats | null
  bootBytes: ByteStats | null
  lazyBytes: ByteStats | null
}

const ALL_CASES: Case[] = ALL_LOADERS.flatMap((loader): Case[] => [
  { loader, origin: 'local' },
  { loader, origin: 'cdn' },
])

const cases = ALL_CASES.filter(c => {
  if (ONLY.length > 0 && !ONLY.includes(c.loader)) return false
  if (ORIGIN_FILTER && c.origin !== ORIGIN_FILTER) return false
  if (c.origin === 'cdn' && !CDN_BASE) return false

  return true
})

if (cases.length === 0) {
  console.error('no cases selected (CDN cases need --cdn-base=...)')
  process.exit(1)
}

const browser = await chromium.launch({ headless: true })

const results: CaseResult[] = []

for (const c of cases) {
  const samples: Sample[] = []

  for (let i = 0; i < ITERS; i += 1) {
    const startedAt = Date.now()
    let s: Sample | null = null

    try {
      s = await runOnceWithIterTimeout(browser, c, ITER_TIMEOUT_MS)
    } catch (err) {
      process.stderr.write(
        `  ${c.loader}/${c.origin} iter ${i + 1}/${ITERS} FAILED after ${Date.now() - startedAt}ms: ${describeError(err)}\n`,
      )
      continue
    }

    if (s.boot.totalMs <= 0) {
      process.stderr.write(
        `  ${c.loader}/${c.origin} iter ${i + 1}/${ITERS} SKIPPED — boot did not complete (likely manifest/asset URL wrong)\n`,
      )
      continue
    }

    samples.push(s)
    const lazy = s.lazy ? ` · lazy ${Math.round(s.lazy.totalMs)}ms` : ''

    process.stdout.write(
      `  ${c.loader}/${c.origin} iter ${i + 1}/${ITERS}: boot ${Math.round(s.boot.totalMs)}ms${lazy}\n`,
    )
  }
  results.push(summarize(c, samples))
}

async function runOnceWithIterTimeout(b: Browser, c: Case, timeoutMs: number): Promise<Sample> {
  const work = runOnce(b, c)
  const timeout = new Promise<Sample>((_, reject) => {
    setTimeout(
      () => reject(new Error(`iter timeout after ${timeoutMs}ms (outer)`)),
      timeoutMs,
    ).unref()
  })

  return Promise.race([work, timeout])
}

await browser.close()

printTable(results)
const out = {
  iters: ITERS,
  cdnBase: CDN_BASE,
  throttle: THROTTLE,
  results,
  generatedAt: new Date().toISOString(),
}

mkdirSync(RESULTS_DIR, { recursive: true })
const file = join(RESULTS_DIR, `bench-${Date.now()}.json`)

writeFileSync(file, JSON.stringify(out, null, 2))
console.log(`\nwrote ${file}`)

async function runOnce(b: Browser, c: Case): Promise<Sample> {
  const ctx = await b.newContext({ ignoreHTTPSErrors: true })
  const page = await ctx.newPage()
  let boot: PhaseSample = { totalMs: 0, phases: {}, bytes: null }
  let lazy: PhaseSample | null = null

  try {
    if (throttlePreset) {
      const cdp = await ctx.newCDPSession(page)

      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...throttlePreset })
    }
    const url = buildUrl(c)

    await page.goto(url, { waitUntil: 'load', timeout: BOOT_TIMEOUT_MS })

    try {
      boot = await waitForBenchPhase(page, 'boot', BOOT_TIMEOUT_MS)
      boot = { ...boot, bytes: await readWireBytes(page, 'boot') }
    } catch (err) {
      process.stderr.write(`  boot phase failed (${c.loader}/${c.origin}): ${describeError(err)}\n`)
    }

    try {
      await page.waitForSelector('#open-dialog:not([disabled])', { timeout: 15_000 })
      await page.click('#open-dialog')
      lazy = await waitForBenchPhase(page, 'lazy', LAZY_TIMEOUT_MS)
      lazy = { ...lazy, bytes: await readWireBytes(page, 'lazy') }
    } catch (err) {
      process.stderr.write(`  lazy phase failed (${c.loader}/${c.origin}): ${describeError(err)}\n`)
    }
  } finally {
    await ctx.close().catch(() => undefined)
  }

  return { boot, lazy }
}

async function readWireBytes(
  page: import('playwright').Page,
  phase: 'boot' | 'lazy',
): Promise<WireBytes | null> {
  // The fixture runtimes publish wire bytes (from Resource Timing) just
  // before dispatching the phase-done event. Null on pre-bytes fixtures.
  return page.evaluate(
    ({ phase }) => {
      const w = window as unknown as Record<string, unknown>
      const value = w[phase === 'boot' ? '__BENCH_BYTES' : '__BENCH_LAZY_BYTES']

      return (value ?? null) as {
        requests: number
        transferBytes: number
        encodedBytes: number
        decodedBytes: number
      } | null
    },
    { phase },
  )
}

async function waitForBenchPhase(
  page: import('playwright').Page,
  phase: 'boot' | 'lazy',
  timeoutMs: number,
): Promise<PhaseSample> {
  // Two layers of protection: in-page setTimeout (handles page-thread stalls
  // where setTimeout still fires) AND a Node-level race so even a fully
  // wedged page can't stall the harness.
  const evaluatePromise = page.evaluate(
    ({ phase, timeoutMs }) =>
      new Promise<{ totalMs: number; phases: Record<string, number> }>((resolve, reject) => {
        const doneKey = phase === 'boot' ? '__BENCH_BOOT_DONE' : '__BENCH_LAZY_DONE'
        const phasesKey = phase === 'boot' ? '__BENCH_PHASES' : '__BENCH_LAZY_PHASES'
        const eventName = phase === 'boot' ? 'bench:boot:done' : 'bench:lazy:done'
        const w = window as unknown as Record<string, unknown>

        if (typeof w[doneKey] === 'number') {
          resolve({
            totalMs: w[doneKey] as number,
            phases: (w[phasesKey] as Record<string, number> | undefined) ?? {},
          })

          return
        }
        const timer = setTimeout(
          () => reject(new Error(`${phase} timeout after ${timeoutMs}ms (in-page)`)),
          timeoutMs,
        )

        window.addEventListener(
          eventName,
          (e: Event) => {
            clearTimeout(timer)
            const detail = (e as CustomEvent<{ totalMs: number; phases: Record<string, number> }>)
              .detail

            resolve({ totalMs: detail.totalMs, phases: detail.phases })
          },
          { once: true },
        )
      }),
    { phase, timeoutMs },
  )
  const nodeTimeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${phase} timeout after ${timeoutMs + 5_000}ms (node)`)),
      timeoutMs + 5_000,
    ).unref()
  })

  const result = await Promise.race([evaluatePromise, nodeTimeout])

  return { ...result, bytes: null }
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function buildUrl(c: Case): string {
  const params = new URLSearchParams()

  // multi/single/router share the bootloader page; native-* have their own.
  // native-single needs a separate HTML for the CDN case since its <img>
  // src attributes are baked into the document at build time.
  let path = '/'

  if (c.loader === 'native-chunks') path = '/native-chunks.html'
  else if (c.loader === 'native-single') {
    path = c.origin === 'cdn' ? '/native-single-cdn.html' : '/native-single.html'
  } else params.set('loader', c.loader)

  params.set('origin', c.origin)
  if (c.origin === 'cdn') params.set('cdnBase', CDN_BASE)
  const query = params.toString()

  return `${ORIGIN}${BASE_PATH}${path}${query ? `?${query}` : ''}`
}

function summarize(c: Case, samples: Sample[]): CaseResult {
  const bootTotals = samples.map(s => s.boot.totalMs)
  const lazyTotals = samples.flatMap(s => (s.lazy ? [s.lazy.totalMs] : []))

  return {
    ...c,
    samples,
    boot: stats(bootTotals),
    lazy: lazyTotals.length > 0 ? stats(lazyTotals) : null,
    bootBytes: byteStats(samples.flatMap(s => (s.boot.bytes ? [s.boot.bytes] : []))),
    lazyBytes: byteStats(samples.flatMap(s => (s.lazy?.bytes ? [s.lazy.bytes] : []))),
  }
}

function byteStats(values: WireBytes[]): ByteStats | null {
  if (values.length === 0) return null

  // Bytes are deterministic per case (same request set every iter) — median
  // guards against the odd retried request, nothing more.
  const medianOf = (pick: (v: WireBytes) => number): number => {
    const sorted = values.map(pick).sort((a, b) => a - b)

    return sorted[Math.floor(sorted.length / 2)] ?? 0
  }

  return {
    requests: medianOf(v => v.requests),
    transferBytes: medianOf(v => v.transferBytes),
    encodedBytes: medianOf(v => v.encodedBytes),
    decodedBytes: medianOf(v => v.decodedBytes),
  }
}

function stats(values: number[]): PhaseStats {
  const sorted = [...values].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0
  const mean = sorted.reduce((s, n) => s + n, 0) / Math.max(1, sorted.length)
  const min = sorted[0] ?? 0
  const max = sorted[sorted.length - 1] ?? 0

  return { samples: sorted, median, mean, p95, min, max }
}

function printTable(rs: CaseResult[]): void {
  const header = [
    'LOADER',
    'ORIGIN',
    'BOOT_MED',
    'BOOT_P95',
    'BOOT_WIRE',
    'REQS',
    'LAZY_MED',
    'LAZY_P95',
    'LAZY_WIRE',
    'N',
  ]
  const rows = rs.map(r => [
    r.loader,
    r.origin,
    `${Math.round(r.boot.median)}ms`,
    `${Math.round(r.boot.p95)}ms`,
    r.bootBytes ? formatBytes(r.bootBytes.transferBytes) : '—',
    r.bootBytes ? String(r.bootBytes.requests) : '—',
    r.lazy ? `${Math.round(r.lazy.median)}ms` : '—',
    r.lazy ? `${Math.round(r.lazy.p95)}ms` : '—',
    r.lazyBytes ? formatBytes(r.lazyBytes.transferBytes) : '—',
    String(r.samples.length),
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map(row => (row[i] ?? '').length)))

  console.log('\n' + header.map((h, i) => h.padEnd(widths[i] ?? 0)).join('  '))
  console.log(widths.map(w => '-'.repeat(w)).join('  '))
  for (const row of rows) console.log(row.map((v, i) => v.padEnd(widths[i] ?? 0)).join('  '))
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0B (cache/TAO)'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`

  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

function strFlag(name: string): string | undefined {
  const flag = process.argv.find(a => a.startsWith(`--${name}=`))

  return flag ? flag.slice(flag.indexOf('=') + 1) : undefined
}

function numFlag(name: string, fallback: number): number {
  const v = strFlag(name)
  const n = v ? Number(v) : fallback

  return Number.isFinite(n) ? n : fallback
}
