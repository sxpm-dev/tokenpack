import { bundleBootstrap, type StrategyName } from '../browser/build-bootstrap.js'
import {
  DEFAULT_REPLAY_TOKEN_VARIANTS,
  type ReplayTokenVariant,
  strategyForLoadMode,
} from '../config/token-variants.js'
import type { BenchmarkConfig, PackManifest } from '../config/types.js'
import { logger } from '../log/logger.js'
import type { RecordedAssetStore } from '../record/asset-store.js'
import type {
  ModeStats,
  PhaseRecord,
  PhaseSummary,
  RunRecord,
  RunReport,
  RunSummaryStats,
} from '../report/types.js'
import { runBaseline } from './baseline.js'
import { runBaselineCdp } from './baseline-cdp.js'
import { loadManifest } from './manifest-loader.js'
import { runTokenpack } from './tokenpack.js'

type TokenpackRunner = typeof runTokenpack

export interface RunBenchmarkOptions {
  packUrls:
    | Readonly<Record<string, Readonly<Record<string, string>>>>
    | Readonly<Record<string, string>>
  mode: 'local' | 'cdn' | 'isolate'
  strategy?: StrategyName
  tokenVariants?: readonly ReplayTokenVariant[]
  tokenDebug?: boolean
  withReload?: boolean
  tokenpackRunner?: TokenpackRunner
  deliveryMode?: 'cdp' | 'sw'
  assetStore?: RecordedAssetStore
  serveEntryDocument?: boolean
  screenshotDir?: string
  /** URLs excluded from packs by min-group-size threshold (for marker tagging). */
  skippedUrls?: ReadonlySet<string>
}

function statsOf(values: ReadonlyArray<number>): RunSummaryStats {
  if (values.length === 0) return { count: 0, avgMs: 0, minMs: 0, maxMs: 0 }

  return {
    count: values.length,
    avgMs: values.reduce((s, v) => s + v, 0) / values.length,
    minMs: Math.min(...values),
    maxMs: Math.max(...values),
  }
}

function nonNullNumbers(xs: ReadonlyArray<number | null | undefined>): number[] {
  return xs.filter((v): v is number => v !== null && v !== undefined)
}

function avg(xs: ReadonlyArray<number | undefined>): number {
  const ys = xs.filter((v): v is number => v !== undefined)

  return ys.length === 0 ? 0 : ys.reduce((s, v) => s + v, 0) / ys.length
}

function modeStats(phases: ReadonlyArray<PhaseRecord>, withCoverage: boolean): ModeStats {
  const successfulPhases = phases.filter(p => !p.timedOut && !p.error)
  const out: ModeStats = {
    duration: statsOf(successfulPhases.map(p => p.durationMs)),
    loadEvent: statsOf(nonNullNumbers(successfulPhases.map(p => p.loadEventMs))),
    timeouts: phases.filter(p => p.timedOut).length,
    errors: phases.filter(p => p.error && !p.timedOut).length,
  }

  if (withCoverage) {
    out.avgServed = avg(successfulPhases.map(p => p.served))
    out.avgFellThrough = avg(successfulPhases.map(p => p.fellThrough))
  }

  return out
}

function buildPhaseSummary(
  baselinePhases: ReadonlyArray<PhaseRecord>,
  baselineCdpPhases: ReadonlyArray<PhaseRecord>,
  tokenpackPhases: ReadonlyArray<PhaseRecord>,
): PhaseSummary {
  const bl = modeStats(baselinePhases, false)
  const blCdp = modeStats(baselineCdpPhases, true)
  const tp = modeStats(tokenpackPhases, true)

  return {
    baseline: bl,
    baselineCdp: blCdp,
    tokenpack: tp,
    deltaTpVsBl: {
      durationMs: tp.duration.avgMs - bl.duration.avgMs,
      durationPct:
        bl.duration.avgMs === 0
          ? 0
          : ((tp.duration.avgMs - bl.duration.avgMs) / bl.duration.avgMs) * 100,
      loadEventMs: tp.loadEvent.avgMs - bl.loadEvent.avgMs,
      loadEventPct:
        bl.loadEvent.avgMs === 0
          ? 0
          : ((tp.loadEvent.avgMs - bl.loadEvent.avgMs) / bl.loadEvent.avgMs) * 100,
    },
    deltaTpVsBlCdp: {
      durationMs: tp.duration.avgMs - blCdp.duration.avgMs,
      durationPct:
        blCdp.duration.avgMs === 0
          ? 0
          : ((tp.duration.avgMs - blCdp.duration.avgMs) / blCdp.duration.avgMs) * 100,
      loadEventMs: tp.loadEvent.avgMs - blCdp.loadEvent.avgMs,
      loadEventPct:
        blCdp.loadEvent.avgMs === 0
          ? 0
          : ((tp.loadEvent.avgMs - blCdp.loadEvent.avgMs) / blCdp.loadEvent.avgMs) * 100,
    },
  }
}

export async function runBenchmark(
  config: BenchmarkConfig,
  manifestPath: string,
  options: RunBenchmarkOptions,
): Promise<RunReport> {
  const tokenVariants = options.tokenVariants ?? DEFAULT_REPLAY_TOKEN_VARIANTS
  const runTokenpackMode = options.tokenpackRunner ?? runTokenpack
  const manifests = new Map<string, PackManifest>()

  manifests.set(tokenVariants[0]?.id ?? 'default', await loadManifest(manifestPath))
  for (const variant of tokenVariants.slice(1)) {
    const path = manifestPath.replace(/\/[^/]+\/manifest\.json$/, `/${variant.id}/manifest.json`)

    manifests.set(variant.id, await loadManifest(path))
  }

  const packUrlsByVariant = normalizePackUrls(options.packUrls, tokenVariants)

  for (const variant of tokenVariants) {
    const manifest = manifests.get(variant.id)

    if (!manifest) throw new Error(`manifest missing for variant: ${variant.id}`)
    const packUrls = packUrlsByVariant[variant.id]
    const missing = manifest.packs.filter(p => !packUrls?.[p.id])

    if (missing.length > 0) {
      throw new Error(`Pack URLs missing for ${variant.id}: ${missing.map(p => p.id).join(', ')}`)
    }
  }

  const iterations: RunRecord[] = []
  const withReload = options.withReload ?? true
  const sharedTarget = config.target
  const primaryManifest = manifests.get(tokenVariants[0]?.id ?? 'default')!

  // Hoist deterministic per-run setup out of the iteration loop. Bundling
  // bootstrap scripts is non-trivial (esbuild) and each strategy bundle is
  // identical across iterations.
  const bootstraps = new Map<string, string>()

  for (const variant of tokenVariants) {
    const variantStrategy = (options.strategy ??
      strategyForLoadMode(variant.loadMode)) as StrategyName

    if (!bootstraps.has(variantStrategy)) {
      bootstraps.set(variantStrategy, await bundleBootstrap(variantStrategy))
    }
  }

  for (let warmup = 0; warmup < config.warmupRuns; warmup++) {
    logger.info({ iter: warmup }, 'warmup baseline')
    await runBaseline(sharedTarget, {
      throttle: config.throttle,
      storageStatePath: sharedTarget.storageStatePath,
      extraHeaders: sharedTarget.extraHeaders,
      withReload,
      assetStore: options.assetStore,
      serveEntryDocument: options.serveEntryDocument,
    })
    logger.info({ iter: warmup }, 'warmup baseline-cdp')
    await runBaselineCdp(sharedTarget, {
      throttle: config.throttle,
      storageStatePath: sharedTarget.storageStatePath,
      extraHeaders: sharedTarget.extraHeaders,
      withReload,
      manifestPath,
      prebuiltManifest: primaryManifest,
      assetStore: options.assetStore,
      serveEntryDocument: options.serveEntryDocument,
    })
    logger.info({ iter: warmup }, 'warmup tokenpack')
    for (const variant of tokenVariants) {
      const variantStrategy = (options.strategy ??
        strategyForLoadMode(variant.loadMode)) as StrategyName

      await runTokenpackMode(sharedTarget, {
        throttle: config.throttle,
        manifestPath,
        packUrls: packUrlsByVariant[variant.id]!,
        storageStatePath: sharedTarget.storageStatePath,
        extraHeaders: sharedTarget.extraHeaders,
        strategy: variantStrategy,
        withReload,
        prebuiltBootstrap: bootstraps.get(variantStrategy)!,
        prebuiltManifest: manifests.get(variant.id)!,
        assetStore: options.assetStore,
        serveEntryDocument: options.serveEntryDocument,
      })
    }
  }

  for (let iter = 0; iter < config.samples; iter++) {
    logger.info({ iter, mode: 'baseline' }, 'sample')
    const b = await runBaseline(sharedTarget, {
      throttle: config.throttle,
      storageStatePath: sharedTarget.storageStatePath,
      extraHeaders: sharedTarget.extraHeaders,
      tokenDebug: options.tokenDebug,
      withReload,
      assetStore: options.assetStore,
      serveEntryDocument: options.serveEntryDocument,
      sanity: phaseSanityOptions(options.screenshotDir, `iter-${iter}-baseline`),
    })

    iterations.push({
      iter,
      mode: 'baseline',
      targetId: sharedTarget.id,
      cold: b.cold,
      reload: b.reload,
    })

    logger.info({ iter, mode: 'baseline-cdp' }, 'sample')
    const bc = await runBaselineCdp(sharedTarget, {
      throttle: config.throttle,
      storageStatePath: sharedTarget.storageStatePath,
      extraHeaders: sharedTarget.extraHeaders,
      tokenDebug: options.tokenDebug,
      withReload,
      manifestPath,
      prebuiltManifest: primaryManifest,
      assetStore: options.assetStore,
      serveEntryDocument: options.serveEntryDocument,
      sanity: phaseSanityOptions(options.screenshotDir, `iter-${iter}-baseline-cdp`),
    })

    iterations.push({
      iter,
      mode: 'baseline-cdp',
      targetId: sharedTarget.id,
      cold: bc.cold,
      reload: bc.reload,
    })

    for (const variant of tokenVariants) {
      const variantStrategy = (options.strategy ??
        strategyForLoadMode(variant.loadMode)) as StrategyName

      logger.info({ iter, mode: 'tokenpack', variant: variant.id }, 'sample')
      const t = await runTokenpackMode(sharedTarget, {
        throttle: config.throttle,
        manifestPath,
        packUrls: packUrlsByVariant[variant.id]!,
        storageStatePath: sharedTarget.storageStatePath,
        extraHeaders: sharedTarget.extraHeaders,
        tokenDebug: options.tokenDebug,
        strategy: variantStrategy,
        withReload,
        skippedUrls: options.skippedUrls,
        prebuiltBootstrap: bootstraps.get(variantStrategy)!,
        prebuiltManifest: manifests.get(variant.id)!,
        assetStore: options.assetStore,
        serveEntryDocument: options.serveEntryDocument,
        sanity: phaseSanityOptions(options.screenshotDir, `iter-${iter}-${variant.id}`),
      })

      iterations.push({
        iter,
        mode: 'tokenpack',
        tokenVariantId: variant.id,
        targetId: sharedTarget.id,
        cold: t.cold,
        reload: t.reload,
      })
    }
  }

  const baselineRows = iterations.filter(r => r.mode === 'baseline')
  const baselineCdpRows = iterations.filter(r => r.mode === 'baseline-cdp')
  const tokenpackRows = iterations.filter(r => r.mode === 'tokenpack')
  const primaryVariantId = tokenVariants[0]?.id
  const primaryTokenpackRows = primaryVariantId
    ? tokenpackRows.filter(r => r.tokenVariantId === primaryVariantId)
    : tokenpackRows
  const variantSummaries = Object.fromEntries(
    tokenVariants.map(variant => {
      const rows = tokenpackRows.filter(r => r.tokenVariantId === variant.id)

      return [
        variant.id,
        {
          cold: buildPhaseSummary(
            baselineRows.map(r => r.cold),
            baselineCdpRows.map(r => r.cold),
            rows.map(r => r.cold),
          ),
          reload: buildPhaseSummary(
            baselineRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
            baselineCdpRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
            rows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
          ),
        },
      ]
    }),
  )

  return {
    target: { id: sharedTarget.id, url: sharedTarget.url },
    throttle: '',
    samples: config.samples,
    mode: options.mode,
    deliveryMode: options.deliveryMode ?? 'cdp',
    strategy: tokenVariants
      .map(v => `${v.id}:${options.strategy ?? strategyForLoadMode(v.loadMode)}`)
      .join(','),
    tokenpackVariants: tokenVariants.map(v => ({
      ...v,
      strategy: options.strategy ?? strategyForLoadMode(v.loadMode),
    })),
    tokenDebug: Boolean(options.tokenDebug),
    capturedAt: new Date().toISOString(),
    iterations,
    summary: {
      cold: buildPhaseSummary(
        baselineRows.map(r => r.cold),
        baselineCdpRows.map(r => r.cold),
        primaryTokenpackRows.map(r => r.cold),
      ),
      reload: buildPhaseSummary(
        baselineRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
        baselineCdpRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
        primaryTokenpackRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
      ),
    },
    variantSummaries,
  }
}

function phaseSanityOptions(
  screenshotDir: string | undefined,
  screenshotPrefix: string,
): { screenshotDir?: string; screenshotPrefix: string } | undefined {
  if (!screenshotDir) return undefined

  return { screenshotDir, screenshotPrefix }
}

function normalizePackUrls(
  packUrls: RunBenchmarkOptions['packUrls'],
  variants: readonly ReplayTokenVariant[],
): Record<string, Readonly<Record<string, string>>> {
  const first = variants[0]

  if (!first) return {}
  const maybeNested = packUrls as Record<string, unknown>

  if (typeof maybeNested[first.id] === 'object' && maybeNested[first.id] !== null) {
    return packUrls as Record<string, Readonly<Record<string, string>>>
  }

  return { [first.id]: packUrls as Readonly<Record<string, string>> }
}
