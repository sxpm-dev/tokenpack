// Benchmark: alternated baseline-vs-TokenPack samples for a target.
// --local serves packs from a static HTTP server; otherwise CDN URLs from manifest.
//
// Usage:
//   yarn ... run benchmark <url-or-targetId> [throttle] [samples] [--local] [--token-debug]

import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { runBenchmark } from '../src/replay/orchestrator.js'
import { resolveTargetArg } from '../src/config/resolve-target.js'
import { loadManifest } from '../src/replay/manifest-loader.js'
import { startLocalPackServer } from '../src/replay/local-pack-server.js'
import { PRESETS } from '../src/config/throttles.js'
import { BenchmarkConfigSchema } from '../src/config/types.js'
import { logger } from '../src/log/logger.js'
import { buildHtmlReport } from '../src/report/html-report.js'
import { rowsToCsv } from '../src/report/csv.js'

const args = process.argv.slice(2)
const local = args.includes('--local')
const tokenDebug = args.includes('--token-debug')
const positional = args.filter(a => !a.startsWith('--'))

const arg = positional[0] ?? 'public-demo'
const throttleName = positional[1] ?? 'FAST_4G'
const samples = Number(positional[2] ?? 10)

const target = resolveTargetArg(arg)
const throttle = PRESETS[throttleName]
if (!throttle) {
  logger.error({ throttleName, available: Object.keys(PRESETS) }, 'unknown throttle preset')
  process.exit(1)
}

const fixtureDir = resolvePath(`fixtures/${target.id}`)
const manifestPath = `${fixtureDir}/manifest.json`
const ts = Date.now()
const stem = `results/${target.id}-${ts}${local ? '-local' : ''}${tokenDebug ? '-debug' : ''}`
const csvPath = `${stem}.csv`
const jsonPath = `${stem}.json`
const htmlPath = `${stem}.html`

const config = BenchmarkConfigSchema.parse({
  target,
  throttle,
  samples,
  warmupRuns: local ? 0 : 1,
  outputCsv: csvPath,
})

const manifest = await loadManifest(manifestPath)
let packUrls: Record<string, string>
let server: { url: string; close: () => Promise<void> } | undefined

if (local) {
  server = await startLocalPackServer(fixtureDir)
  packUrls = {}
  for (const p of manifest.packs) {
    packUrls[p.id] = `${server.url}${p.id}.png`
  }
  logger.info({ localServer: server.url, packCount: manifest.packs.length }, 'serving packs locally')
} else {
  packUrls = {}
  for (const p of manifest.packs) {
    if (!p.url) {
      logger.error({ packId: p.id }, 'pack URL missing — run upload first or pass --local')
      process.exit(1)
    }
    packUrls[p.id] = p.url
  }
}

logger.info(
  {
    url: target.url,
    throttle: throttleName,
    samples,
    mode: local ? 'local' : 'cdn',
    tokenDebug,
    authMode: target.authMode,
    csvPath,
    jsonPath,
    htmlPath,
  },
  'benchmark starting',
)

// Load stats.json (if present) to identify URLs that were excluded from packs
// by the min-group-size threshold; pass as a Set so the runners can tag those
// fall-throughs distinctly in markers.
const statsPath = `${fixtureDir}/stats.json`
const skippedUrls = new Set<string>()
if (existsSync(statsPath)) {
  try {
    const stats = JSON.parse(await readFile(statsPath, 'utf8')) as {
      skipped?: { groups?: Array<{ urls?: string[] }> }
    }
    for (const g of stats.skipped?.groups ?? []) {
      for (const u of g.urls ?? []) skippedUrls.add(u)
    }
    if (skippedUrls.size > 0) {
      logger.info(
        { skippedUrlCount: skippedUrls.size },
        'loaded skipped-by-threshold URLs from stats.json',
      )
    }
  } catch (err) {
    logger.warn({ err: String(err) }, 'failed to read stats.json — skipped highlights disabled')
  }
}

try {
  const report = await runBenchmark(config, manifestPath, {
    packUrls,
    mode: local ? 'local' : 'cdn',
    tokenDebug,
    withReload: true,
    skippedUrls,
  })
  report.throttle = throttleName

  await mkdir(dirname(jsonPath), { recursive: true })
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8')
  await writeFile(htmlPath, buildHtmlReport(report, jsonPath.replace(/^results\//, '')), 'utf8')

  interface CsvRow extends Record<string, string | number | boolean | null | undefined> {
    iter: number
    mode: 'baseline' | 'baseline-cdp' | 'tokenpack'
    phase: 'cold' | 'reload'
    targetId: string
    durationMs: number
    loadEventMs: number | null
    served: number | null
    fellThrough: number | null
    totalBytes: number | null
  }
  const csvRows: CsvRow[] = []
  for (const r of report.iterations) {
    csvRows.push({
      iter: r.iter,
      mode: r.mode,
      phase: 'cold',
      targetId: r.targetId,
      durationMs: r.cold.durationMs,
      loadEventMs: r.cold.loadEventMs,
      served: r.cold.served ?? null,
      fellThrough: r.cold.fellThrough ?? null,
      totalBytes: r.cold.totalBytes ?? null,
    })
    if (r.reload) {
      csvRows.push({
        iter: r.iter,
        mode: r.mode,
        phase: 'reload',
        targetId: r.targetId,
        durationMs: r.reload.durationMs,
        loadEventMs: r.reload.loadEventMs,
        served: r.reload.served ?? null,
        fellThrough: r.reload.fellThrough ?? null,
        totalBytes: r.reload.totalBytes ?? null,
      })
    }
  }
  await writeFile(csvPath, rowsToCsv(csvRows), 'utf8')

  const fmt = (n: number): string => `${Math.round(n)}ms`
  const delta = (b: number, t: number): string => {
    const d = t - b
    const pct = b === 0 ? 0 : (d / b) * 100
    const sign = d >= 0 ? '+' : ''
    return `${sign}${Math.round(d)}ms (${sign}${pct.toFixed(1)}%)`
  }
  const tripleRow = (label: string, bl: number, blCdp: number, tp: number): string =>
    `${label.padEnd(18)}${fmt(bl).padEnd(11)}${fmt(blCdp).padEnd(11)}${fmt(tp).padEnd(11)}${delta(bl, tp).padEnd(22)}${delta(blCdp, tp)}`

  /* eslint-disable no-console */
  console.log('')
  console.log(`Target:      ${target.url}`)
  console.log(`Mode:        ${local ? 'local' : 'cdn'} · strategy: ${report.strategy}${tokenDebug ? ' · token-debug ON' : ''}`)
  console.log(`Throttle:    ${throttleName}`)
  console.log(`Samples:     ${samples} per mode (3 modes per iter)`)
  console.log(`Report:      ${htmlPath}`)
  console.log(`JSON:        ${jsonPath}`)
  console.log(`CSV:         ${csvPath}`)
  console.log('')
  console.log('Metric            Baseline   BL-CDP     TokenPack  Δ TP vs BL            Δ TP vs BL-CDP')
  console.log('────────────────  ─────────  ─────────  ─────────  ────────────────────  ──────────────')
  console.log('-- COLD LOAD --')
  console.log(tripleRow('total duration',
    report.summary.cold.baseline.duration.avgMs,
    report.summary.cold.baselineCdp.duration.avgMs,
    report.summary.cold.tokenpack.duration.avgMs))
  console.log(tripleRow('load event',
    report.summary.cold.baseline.loadEvent.avgMs,
    report.summary.cold.baselineCdp.loadEvent.avgMs,
    report.summary.cold.tokenpack.loadEvent.avgMs))
  console.log('-- RELOAD (warm cache) --')
  console.log(tripleRow('total duration',
    report.summary.reload.baseline.duration.avgMs,
    report.summary.reload.baselineCdp.duration.avgMs,
    report.summary.reload.tokenpack.duration.avgMs))
  console.log(tripleRow('load event',
    report.summary.reload.baseline.loadEvent.avgMs,
    report.summary.reload.baselineCdp.loadEvent.avgMs,
    report.summary.reload.tokenpack.loadEvent.avgMs))
  console.log('')
  /* eslint-enable no-console */
} finally {
  await server?.close()
}
