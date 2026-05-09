import type { BenchmarkConfig, PackManifest } from '../config/types.js'
import { runBaseline } from './baseline.js'
import { runBaselineCdp } from './baseline-cdp.js'
import { runTokenpack } from './tokenpack.js'
import { loadManifest } from './manifest-loader.js'
import { logger } from '../log/logger.js'
import type {
  ModeStats,
  PhaseRecord,
  PhaseSummary,
  RunRecord,
  RunReport,
  RunSummaryStats,
} from '../report/types.js'
import { bundleBootstrap, DEFAULT_STRATEGY, type StrategyName } from '../browser/build-bootstrap.js'

export interface RunBenchmarkOptions {
  packUrls: Readonly<Record<string, string>>
  mode: 'local' | 'cdn'
  strategy?: StrategyName
  tokenDebug?: boolean
  withReload?: boolean
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
  const out: ModeStats = {
    duration: statsOf(phases.map(p => p.durationMs)),
    loadEvent: statsOf(nonNullNumbers(phases.map(p => p.loadEventMs))),
  }
  if (withCoverage) {
    out.avgServed = avg(phases.map(p => p.served))
    out.avgFellThrough = avg(phases.map(p => p.fellThrough))
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
  const manifest: PackManifest = await loadManifest(manifestPath)
  const missing = manifest.packs.filter(p => !options.packUrls[p.id])
  if (missing.length > 0) {
    throw new Error(`Pack URLs missing for: ${missing.map(p => p.id).join(', ')}`)
  }

  const iterations: RunRecord[] = []
  const strategy = options.strategy ?? DEFAULT_STRATEGY
  const withReload = options.withReload ?? true
  const sharedTarget = config.target

  // Hoist deterministic per-run setup out of the iteration loop. Bundling the
  // bootstrap is non-trivial (esbuild) and the bundle is identical across
  // iterations of the same strategy. Manifest is invariant too.
  const prebuiltBootstrap = await bundleBootstrap(strategy)
  const prebuiltManifest: PackManifest = manifest

  for (let warmup = 0; warmup < config.warmupRuns; warmup++) {
    logger.info({ iter: warmup }, 'warmup baseline')
    await runBaseline(sharedTarget, { throttle: config.throttle, withReload })
    logger.info({ iter: warmup }, 'warmup baseline-cdp')
    await runBaselineCdp(sharedTarget, {
      throttle: config.throttle,
      withReload,
      manifestPath,
      prebuiltManifest,
    })
    logger.info({ iter: warmup }, 'warmup tokenpack')
    await runTokenpack(sharedTarget, {
      throttle: config.throttle,
      manifestPath,
      packUrls: options.packUrls,
      strategy,
      withReload,
      prebuiltBootstrap,
      prebuiltManifest,
    })
  }

  for (let iter = 0; iter < config.samples; iter++) {
    logger.info({ iter, mode: 'baseline' }, 'sample')
    const b = await runBaseline(sharedTarget, {
      throttle: config.throttle,
      storageStatePath: sharedTarget.storageStatePath,
      extraHeaders: sharedTarget.extraHeaders,
      tokenDebug: options.tokenDebug,
      withReload,
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
      prebuiltManifest,
    })
    iterations.push({
      iter,
      mode: 'baseline-cdp',
      targetId: sharedTarget.id,
      cold: bc.cold,
      reload: bc.reload,
    })

    logger.info({ iter, mode: 'tokenpack' }, 'sample')
    const t = await runTokenpack(sharedTarget, {
      throttle: config.throttle,
      manifestPath,
      packUrls: options.packUrls,
      storageStatePath: sharedTarget.storageStatePath,
      extraHeaders: sharedTarget.extraHeaders,
      tokenDebug: options.tokenDebug,
      strategy,
      withReload,
      skippedUrls: options.skippedUrls,
      prebuiltBootstrap,
      prebuiltManifest,
    })
    iterations.push({
      iter,
      mode: 'tokenpack',
      targetId: sharedTarget.id,
      cold: t.cold,
      reload: t.reload,
    })
  }

  const baselineRows = iterations.filter(r => r.mode === 'baseline')
  const baselineCdpRows = iterations.filter(r => r.mode === 'baseline-cdp')
  const tokenpackRows = iterations.filter(r => r.mode === 'tokenpack')

  return {
    target: { id: sharedTarget.id, url: sharedTarget.url },
    throttle: '',
    samples: config.samples,
    mode: options.mode,
    strategy,
    tokenDebug: Boolean(options.tokenDebug),
    capturedAt: new Date().toISOString(),
    iterations,
    summary: {
      cold: buildPhaseSummary(
        baselineRows.map(r => r.cold),
        baselineCdpRows.map(r => r.cold),
        tokenpackRows.map(r => r.cold),
      ),
      reload: buildPhaseSummary(
        baselineRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
        baselineCdpRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
        tokenpackRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
      ),
    },
  }
}
