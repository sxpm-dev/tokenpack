// Benchmark: alternated baseline-vs-TokenPack samples for a target.
// --local serves packs from a static HTTP server; otherwise --remote-base-url
// resolves relative fixture artifacts against a CDN/base URL.
//
// Usage:
//   yarn ... run benchmark <url-or-targetId> [throttle] [samples] [--local] [--token-debug] [--token-router]

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve as resolvePath } from 'node:path'

import { resolveTargetArg } from '../src/config/resolve-target.js'
import { PRESETS } from '../src/config/throttles.js'
import {
  DEFAULT_REPLAY_TOKEN_VARIANTS,
  isTokenRouterComparisonVariant,
  type ReplayTokenVariant,
} from '../src/config/token-variants.js'
import { BenchmarkConfigSchema } from '../src/config/types.js'
import { ROUTER_TOKEN_FILE, ROUTER_TOKEN_ID } from '../src/encode/router-token.js'
import { logger } from '../src/log/logger.js'
import { installRunLog } from '../src/log/run-log.js'
import { ASSET_STORE_INDEX, loadAssetStore } from '../src/record/asset-store.js'
import { startLocalPackServer } from '../src/replay/local-pack-server.js'
import { loadManifest } from '../src/replay/manifest-loader.js'
import { runBenchmark } from '../src/replay/orchestrator.js'
import { runTokenpackSw } from '../src/replay/tokenpack-sw.js'
import { rowsToCsv } from '../src/report/csv.js'
import { buildHtmlReport } from '../src/report/html-report.js'
import type { RunReport } from '../src/report/types.js'

const args = process.argv.slice(2)
const isolate = args.includes('--isolate')
const local = args.includes('--local')
const sw = args.includes('--sw')
const tokenDebug = args.includes('--token-debug')
const tokenRouter = args.includes('--token-router')
const capturedApp = args.includes('--captured-app')
const remoteBaseUrlFlag = args.find(a => a.startsWith('--remote-base-url='))
const remoteBaseUrl = remoteBaseUrlFlag
  ? remoteBaseUrlFlag.slice(remoteBaseUrlFlag.indexOf('=') + 1)
  : process.env.REPLAY_PACK_BASE_URL
const bundleChunksFlag =
  args.find(a => a.startsWith('--bundle-chunks=')) ?? args.find(a => a.startsWith('--chunk-count='))
const bundleChunks = bundleChunksFlag
  ? Number(bundleChunksFlag.slice(bundleChunksFlag.indexOf('=') + 1))
  : null

if (bundleChunks !== null && (!Number.isInteger(bundleChunks) || bundleChunks < 1)) {
  logger.error({ flag: bundleChunksFlag }, 'invalid --bundle-chunks (expected positive integer)')
  process.exit(1)
}

const bundle = args.includes('--bundle') || bundleChunks !== null
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

const fixtureTargetId = bundle
  ? bundleChunks && bundleChunks > 1
    ? `${target.id}-bundle-${bundleChunks}`
    : `${target.id}-bundle`
  : target.id
const fixtureShape = bundle
  ? bundleChunks && bundleChunks > 1
    ? 'bundle-chunks'
    : 'bundle-single'
  : 'service-groups'
const fixtureDir = resolvePath(`fixtures/${fixtureTargetId}`)
const variantsPath = `${fixtureDir}/variants.json`
const ts = Date.now()
const bundleStem = bundle
  ? bundleChunks && bundleChunks > 1
    ? `-bundle-${bundleChunks}`
    : '-bundle'
  : ''
const reportId = `${target.id}-${ts}${bundleStem}${capturedApp ? '-captured-app' : ''}${isolate ? '-isolate' : ''}${sw ? '-sw' : ''}${local ? '-local' : ''}${tokenDebug ? '-debug' : ''}`
const reportDir = resolvePath(`results/${reportId}`)
const csvPath = `${reportDir}/data.csv`
const jsonPath = `${reportDir}/data.json`
const htmlPath = `${reportDir}/report.html`
const logPath = `${reportDir}/run.log`
const consoleJsonPath = `${reportDir}/browser-console.json`
const consoleLogPath = `${reportDir}/browser-console.log`
const screenshotDir = tokenDebug ? `${reportDir}/screenshots` : undefined
const closeRunLog = installRunLog(logPath)

interface VariantIndex {
  variants: Array<ReplayTokenVariant & { manifestPath: string; fixtureDir: string }>
}

const variantIndex: VariantIndex = existsSync(variantsPath)
  ? (JSON.parse(await readFile(variantsPath, 'utf8')) as VariantIndex)
  : {
      variants: DEFAULT_REPLAY_TOKEN_VARIANTS.slice(0, 1).map(variant => ({
        ...variant,
        manifestPath: `${fixtureDir}/manifest.json`,
        fixtureDir,
      })),
    }
const tokenVariants: ReplayTokenVariant[] = variantIndex.variants
  .filter(v => !tokenRouter || isTokenRouterComparisonVariant(v))
  .map(v => ({
    id: v.id,
    algo: v.algo,
    channels: v.channels,
    loadMode: v.loadMode,
    packCompressor: v.packCompressor,
  }))
const selectedVariantIds = new Set(tokenVariants.map(v => v.id))
const selectedVariantIndex = {
  variants: variantIndex.variants.filter(v => selectedVariantIds.has(v.id)),
}

if (tokenRouter && !tokenVariants.some(v => v.loadMode === 'router-materialize')) {
  logger.error(
    { fixtureDir, variants: variantIndex.variants.map(v => v.id) },
    'router variant missing — re-run record/encode with --token-router',
  )
  process.exit(1)
}
const manifestPath = selectedVariantIndex.variants[0]?.manifestPath ?? `${fixtureDir}/manifest.json`
let packUrls: Record<string, Record<string, string>>
let server: { url: string; close: () => Promise<void> } | undefined

function joinUrl(base: string, path: string): string {
  return new URL(path.replace(/^\/+/, ''), base.endsWith('/') ? base : `${base}/`).href
}

function artifactPath(
  fixtureBaseDir: string,
  variantFixtureDir: string,
  artifact: string | undefined,
  fallback: string,
): string {
  const variantPrefix = relative(fixtureBaseDir, variantFixtureDir).replace(/\\/g, '/')
  const localPath = artifact ?? fallback

  return variantPrefix === '' ? localPath : `${variantPrefix}/${localPath}`
}

if (isolate && !existsSync(`${fixtureDir}/${ASSET_STORE_INDEX}`)) {
  logger.error(
    { assetStorePath: `${fixtureDir}/${ASSET_STORE_INDEX}` },
    'isolated asset store missing — re-run record to create it',
  )
  process.exit(1)
}
const assetStore = isolate ? await loadAssetStore(fixtureDir) : undefined

if (capturedApp && !isolate) {
  logger.error('--captured-app requires --isolate so captured assets are served from the fixture')
  process.exit(1)
}

const benchmarkTarget = { ...target }

if (capturedApp) {
  logger.info(
    { replayUrl: benchmarkTarget.url, sourceUrl: assetStore?.entryDocument?.url },
    'serving captured app entry document on original origin',
  )
}

const config = BenchmarkConfigSchema.parse({
  target: benchmarkTarget,
  throttle,
  samples,
  warmupRuns: local ? 0 : 1,
  outputCsv: csvPath,
})

if (local) {
  server = await startLocalPackServer(fixtureDir)
  packUrls = {}
  for (const variant of selectedVariantIndex.variants) {
    const manifest = await loadManifest(variant.manifestPath)
    const variantPrefix = relative(fixtureDir, variant.fixtureDir).replace(/\\/g, '/')
    const urlPrefix = variantPrefix === '' ? '' : `${variantPrefix}/`

    packUrls[variant.id] = {}
    if (manifest.router) {
      packUrls[variant.id]![ROUTER_TOKEN_ID] = `${server.url}${urlPrefix}${ROUTER_TOKEN_FILE}`
    }
    for (const p of manifest.packs) {
      packUrls[variant.id]![p.id] = `${server.url}${urlPrefix}${p.id}.png`
    }
  }
  logger.info(
    { localServer: server.url, variantCount: tokenVariants.length },
    'serving packs locally',
  )
} else {
  if (!remoteBaseUrl) {
    logger.error(
      'remote pack base URL missing — pass --remote-base-url=https://... or set REPLAY_PACK_BASE_URL, or pass --local',
    )
    process.exit(1)
  }
  packUrls = {}
  for (const variant of selectedVariantIndex.variants) {
    const manifest = await loadManifest(variant.manifestPath)

    packUrls[variant.id] = {}
    if (manifest.router) {
      packUrls[variant.id]![ROUTER_TOKEN_ID] = joinUrl(
        remoteBaseUrl,
        artifactPath(fixtureDir, variant.fixtureDir, manifest.router.localPath, ROUTER_TOKEN_FILE),
      )
    }
    for (const p of manifest.packs) {
      packUrls[variant.id]![p.id] = joinUrl(
        remoteBaseUrl,
        artifactPath(fixtureDir, variant.fixtureDir, p.localPath, `${p.id}.png`),
      )
    }
  }
}

logger.info(
  {
    url: target.url,
    benchmarkUrl: benchmarkTarget.url,
    throttle: throttleName,
    samples,
    mode: local ? 'local' : 'cdn',
    remoteBaseUrl: local ? undefined : remoteBaseUrl,
    isolate,
    sw,
    capturedApp,
    bundle,
    bundleChunks,
    tokenDebug,
    tokenRouter,
    fixtureDir,
    variants: tokenVariants.map(v => v.id),
    authMode: benchmarkTarget.authMode,
    csvPath,
    jsonPath,
    htmlPath,
    logPath,
    consoleJsonPath,
    consoleLogPath,
    reportDir,
    screenshotDir,
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
    mode: isolate ? 'isolate' : local ? 'local' : 'cdn',
    tokenVariants,
    tokenDebug,
    withReload: true,
    skippedUrls,
    assetStore,
    serveEntryDocument: capturedApp,
    tokenpackRunner: sw ? runTokenpackSw : undefined,
    deliveryMode: sw ? 'sw' : 'cdp',
    screenshotDir,
  })

  report.throttle = throttleName
  report.fixture = {
    id: fixtureTargetId,
    shape: fixtureShape,
    ...(bundleChunks && bundleChunks > 1 ? { chunks: bundleChunks } : {}),
  }
  relativizeScreenshotPaths(report, reportDir)

  await mkdir(dirname(jsonPath), { recursive: true })
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8')
  await writeBenchmarkConsoleArtifacts(report, consoleJsonPath, consoleLogPath)
  await writeFile(htmlPath, buildHtmlReport(report, 'data.json'), 'utf8')

  interface CsvRow extends Record<string, string | number | boolean | null | undefined> {
    iter: number
    mode: 'baseline' | 'baseline-cdp' | 'tokenpack'
    tokenVariantId: string | null
    phase: 'cold' | 'reload'
    targetId: string
    durationMs: number
    loadEventMs: number | null
    timedOut: boolean | null
    error: string | null
    served: number | null
    fellThrough: number | null
    totalBytes: number | null
  }
  const csvRows: CsvRow[] = []

  for (const r of report.iterations) {
    csvRows.push({
      iter: r.iter,
      mode: r.mode,
      tokenVariantId: r.tokenVariantId ?? null,
      phase: 'cold',
      targetId: r.targetId,
      durationMs: r.cold.durationMs,
      loadEventMs: r.cold.loadEventMs,
      timedOut: r.cold.timedOut ?? null,
      error: r.cold.error ?? null,
      served: r.cold.served ?? null,
      fellThrough: r.cold.fellThrough ?? null,
      totalBytes: r.cold.totalBytes ?? null,
    })
    if (r.reload) {
      csvRows.push({
        iter: r.iter,
        mode: r.mode,
        tokenVariantId: r.tokenVariantId ?? null,
        phase: 'reload',
        targetId: r.targetId,
        durationMs: r.reload.durationMs,
        loadEventMs: r.reload.loadEventMs,
        timedOut: r.reload.timedOut ?? null,
        error: r.reload.error ?? null,
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
  if (capturedApp) console.log('Replay:      captured entry document on original origin')
  console.log(
    `Mode:        ${isolate ? 'isolate · ' : ''}${sw ? 'sw · ' : ''}${local ? 'local' : 'cdn'}${tokenDebug ? ' · token-debug ON' : ''}`,
  )
  console.log(`Throttle:    ${throttleName}`)
  console.log(`Samples:     ${samples} per mode (${2 + tokenVariants.length} modes per iter)`)
  console.log(`Report:      ${htmlPath}`)
  console.log(`JSON:        ${jsonPath}`)
  console.log(`CSV:         ${csvPath}`)
  console.log(`Log:         ${logPath}`)
  console.log(`Console:     ${consoleJsonPath}`)
  console.log(`Console log: ${consoleLogPath}`)
  if (screenshotDir) console.log(`Screenshots: ${screenshotDir}`)
  console.log('')
  for (const variant of tokenVariants) {
    const summary = report.variantSummaries?.[variant.id] ?? report.summary

    console.log(
      `Variant:     ${variant.id} · ${variant.loadMode} · ${variant.algo} c${variant.channels}`,
    )
    console.log(
      `Metric            Baseline   BL-CDP     ${sw ? 'TP-SW' : 'TokenPack'}${sw ? '     ' : '  '}Δ TP vs BL            Δ TP vs BL-CDP`,
    )
    console.log(
      '────────────────  ─────────  ─────────  ─────────  ────────────────────  ──────────────',
    )
    console.log('-- COLD LOAD --')
    console.log(
      tripleRow(
        'total duration',
        summary.cold.baseline.duration.avgMs,
        summary.cold.baselineCdp.duration.avgMs,
        summary.cold.tokenpack.duration.avgMs,
      ),
    )
    console.log(
      tripleRow(
        'load event',
        summary.cold.baseline.loadEvent.avgMs,
        summary.cold.baselineCdp.loadEvent.avgMs,
        summary.cold.tokenpack.loadEvent.avgMs,
      ),
    )
    console.log('-- RELOAD (warm cache) --')
    console.log(
      tripleRow(
        'total duration',
        summary.reload.baseline.duration.avgMs,
        summary.reload.baselineCdp.duration.avgMs,
        summary.reload.tokenpack.duration.avgMs,
      ),
    )
    console.log(
      tripleRow(
        'load event',
        summary.reload.baseline.loadEvent.avgMs,
        summary.reload.baselineCdp.loadEvent.avgMs,
        summary.reload.tokenpack.loadEvent.avgMs,
      ),
    )
    console.log('')
  }
  console.log('')
  /* eslint-enable no-console */
} finally {
  await server?.close()
  closeRunLog()
}

function relativizeScreenshotPaths(
  report: Awaited<ReturnType<typeof runBenchmark>>,
  baseDir: string,
): void {
  for (const iter of report.iterations) {
    for (const phase of [iter.cold, iter.reload]) {
      const screenshotPath = phase?.sanity?.screenshotPath

      if (!screenshotPath) continue
      phase.sanity!.screenshotPath = relative(baseDir, screenshotPath)
    }
  }
}

async function writeBenchmarkConsoleArtifacts(
  report: RunReport,
  jsonPath: string,
  logPath: string,
): Promise<void> {
  const phases = report.iterations.flatMap(iter =>
    (
      [
        ['cold', iter.cold],
        ['reload', iter.reload],
      ] as const
    )
      .filter(([, phase]) => Boolean(phase))
      .map(([phaseName, phase]) => ({
        iter: iter.iter,
        mode: iter.mode,
        tokenVariantId: iter.tokenVariantId ?? null,
        phase: phaseName,
        finalUrl: phase!.sanity?.finalUrl,
        consoleMessages: phase!.sanity?.consoleMessages ?? [],
        consoleErrors: phase!.sanity?.consoleErrors ?? [],
        pageErrors: phase!.sanity?.pageErrors ?? [],
      })),
  )

  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        target: report.target,
        capturedAt: report.capturedAt,
        mode: report.mode,
        deliveryMode: report.deliveryMode,
        phases,
      },
      null,
      2,
    ),
    'utf8',
  )

  const lines: string[] = []

  for (const phase of phases) {
    const label = [
      `iter=${phase.iter}`,
      `mode=${phase.mode}`,
      phase.tokenVariantId ? `variant=${phase.tokenVariantId}` : null,
      `phase=${phase.phase}`,
    ]
      .filter(Boolean)
      .join(' ')

    for (const message of phase.consoleMessages) {
      lines.push(`[${label}][${message.type}] ${message.text}`)
    }
    for (const message of phase.pageErrors) {
      lines.push(`[${label}][pageerror] ${message}`)
    }
  }

  await writeFile(logPath, `${lines.join('\n')}${lines.length ? '\n' : ''}`, 'utf8')
}
