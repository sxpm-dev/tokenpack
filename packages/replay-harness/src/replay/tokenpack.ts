import type { RouterDebugEvent } from '@tokenpack/browser'
import { chromium, type Page } from 'playwright'

import { bundleBootstrap, DEFAULT_STRATEGY, type StrategyName } from '../browser/build-bootstrap.js'
import type { PackManifest, TargetConfig, ThrottleConfig } from '../config/types.js'
import { logger } from '../log/logger.js'
import type { RecordedAssetStore } from '../record/asset-store.js'
import { runJourney } from '../record/journey.js'
import { summarizeRouterDebug } from '../report/router-debug.js'
import type { AssetMarker, PhaseRecord } from '../report/types.js'
import { installStrategy } from './bridge.js'
import { installCdpFetchRouter } from './cdp-fetch-router.js'
import { CHROMIUM_LAUNCH_ARGS, NAV_TIMEOUT_MS, POST_LOAD_GRACE_MS } from './constants.js'
import { installIsolatedAssetRouter } from './isolated-assets.js'
import { loadManifest } from './manifest-loader.js'
import { phaseFailure } from './phase-failure.js'
import {
  capturePhaseSanity,
  type PhaseDiagnostics,
  type PhaseSanityOptions,
  pushConsoleMessage,
  pushDiagnostic,
} from './phase-sanity.js'
import { stripWireHeaders } from './strip-encoding.js'
import { applyThrottle } from './throttle.js'
import { classifyFellthroughUrl } from './url-classifier.js'

export interface TokenpackResult {
  cold: PhaseRecord
  reload: PhaseRecord | null
}

export interface TokenpackOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
  manifestPath: string
  packUrls: Readonly<Record<string, string>>
  tokenDebug?: boolean
  strategy?: StrategyName
  withReload?: boolean
  skippedUrls?: ReadonlySet<string>
  /**
   * Pre-bundled bootstrap script. If omitted, this function calls
   * `bundleBootstrap(strategy)` itself — convenient for one-shot use, but
   * wasteful per-iteration. Orchestrator hoists this out of the loop.
   */
  prebuiltBootstrap?: string
  /**
   * Pre-loaded manifest. Same hoisting trick.
   */
  prebuiltManifest?: PackManifest
  assetStore?: RecordedAssetStore
  serveEntryDocument?: boolean
  sanity?: PhaseSanityOptions
}

interface PackFileResult {
  text: string
  packFetchMs: number
  packInitMs: number
  fileFetchMs: number
  extractMs: number
  cacheState: 'miss' | 'pending' | 'hit'
  routerDebugEvents?: RouterDebugEvent[]
}

interface PhaseAccumulator {
  startMs: number
  loadEventMs: number | null
  served: number
  fellThrough: number
  totalBytes: number
  assetMarkers: AssetMarker[]
  diagnostics: PhaseDiagnostics
}

export async function runTokenpack(
  target: TargetConfig,
  options: TokenpackOptions,
): Promise<TokenpackResult> {
  const manifest = options.prebuiltManifest ?? (await loadManifest(options.manifestPath))
  const byUrl = new Map(manifest.assets.map(a => [a.url, a]))
  const manifestUrls = manifest.assets.map(a => a.url)
  const packUrlSet = new Set(Object.values(options.packUrls))
  const bootstrap =
    options.prebuiltBootstrap ?? (await bundleBootstrap(options.strategy ?? DEFAULT_STRATEGY))

  const browser = await chromium.launch({ headless: true, args: [...CHROMIUM_LAUNCH_ARGS] })

  try {
    const context = await browser.newContext({ storageState: options.storageStatePath })

    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    await installIsolatedAssetRouter(context, {
      assetStore: options.assetStore,
      throttle: options.throttle,
      excludeUrls: new Set(manifestUrls),
      serveEntryDocument: options.serveEntryDocument,
    })
    const page = await context.newPage()

    page.on('console', msg => {
      logger.info({ type: msg.type(), text: msg.text() }, '[browser console]')
      if (active) {
        pushConsoleMessage(active.diagnostics.consoleMessages, {
          type: msg.type(),
          text: msg.text(),
        })
      }
      if (active && ['error', 'warning'].includes(msg.type())) {
        pushDiagnostic(active.diagnostics.consoleErrors, `${msg.type()}: ${msg.text()}`)
      }
    })
    page.on('pageerror', err => {
      logger.error({ message: err.message, stack: err.stack }, '[browser pageerror]')
      if (active) pushDiagnostic(active.diagnostics.pageErrors, err.message)
    })
    const client = await context.newCDPSession(page)

    if (options.throttle) await applyThrottle(client, options.throttle)
    await installStrategy(page, options.packUrls, bootstrap)

    let active: PhaseAccumulator | null = null

    page.on('load', () => {
      if (active) active.loadEventMs = performance.now() - active.startMs
    })

    await installCdpFetchRouter(client, manifestUrls, async (event, router) => {
      const a = active

      if (!a) {
        await router.continue(event.requestId).catch(() => {})

        return
      }
      const observedMs = performance.now() - a.startMs
      const url = event.request.url
      const entry = byUrl.get(url)

      if (!entry) {
        const cls = classifyFellthroughUrl(url, packUrlSet)

        if (cls !== 'pack-self') a.fellThrough++
        if (options.tokenDebug && cls === 'normal') {
          const isSkipped = options.skippedUrls?.has(url) ?? false

          a.assetMarkers.push({
            url,
            source: isSkipped ? 'skipped-by-threshold' : 'fall-through',
            status: null,
            observedMs,
            totalMs: null,
            bytes: null,
          })
        }
        await router.continue(event.requestId).catch(() => {})

        return
      }

      try {
        const result = (await page.evaluate(
          ({ packId, path }: { packId: string; path: string }) =>
            window.__getPackFile(packId, path),
          { packId: entry.packId, path: entry.internalPath },
        )) as PackFileResult

        if (active !== a) return
        const fulfilledMs = performance.now() - a.startMs
        const bodyBytes = Buffer.byteLength(result.text, 'utf8')

        a.served++
        a.totalBytes += bodyBytes

        await router
          .fulfill({
            requestId: event.requestId,
            status: entry.status,
            headers: stripWireHeaders(entry.headers),
            body: result.text,
          })
          .catch(() => {})

        if (options.tokenDebug) {
          a.assetMarkers.push({
            url,
            source: 'pack',
            packId: entry.packId,
            status: entry.status,
            observedMs,
            fetchMs: result.packFetchMs,
            packInitMs: result.packInitMs,
            fileFetchMs: result.fileFetchMs,
            extractMs: result.extractMs,
            totalMs: fulfilledMs - observedMs,
            bytes: bodyBytes,
            cacheState: result.cacheState,
            routerDebugEvents: result.routerDebugEvents,
          })
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown'

        logger.warn({ url, packId: entry.packId, message }, 'getPackFile failed — falling through')
        if (active === a) a.fellThrough++
        await router.continue(event.requestId).catch(() => {})
      }
    })

    const measure = async (
      kind: 'cold' | 'reload',
      go: (page: Page) => Promise<void>,
    ): Promise<PhaseRecord> => {
      active = {
        startMs: performance.now(),
        loadEventMs: null,
        served: 0,
        fellThrough: 0,
        totalBytes: 0,
        assetMarkers: [],
        diagnostics: { consoleMessages: [], consoleErrors: [], pageErrors: [] },
      }
      try {
        await go(page)
        await runJourney(page, target.journey)
        // Don't wait for networkidle on chatty SPAs — they never go quiet (websockets, telemetry pings).
        // Duration = page.goto resolved (waitUntil: 'load') + journey + a small grace window.
        await page.waitForTimeout(POST_LOAD_GRACE_MS)
        const duration = performance.now() - active.startMs
        const snap = active
        const phase: PhaseRecord = {
          durationMs: duration,
          loadEventMs: snap.loadEventMs,
          served: snap.served,
          fellThrough: snap.fellThrough,
          totalBytes: snap.totalBytes,
          manifestUrls,
          sanity: await capturePhaseSanity(page, options.sanity, kind, snap.diagnostics),
          assetMarkers: options.tokenDebug ? snap.assetMarkers : undefined,
          routerDebug: options.tokenDebug ? summarizeRouterDebug(snap.assetMarkers) : undefined,
        }

        logger.info(
          {
            mode: 'tokenpack',
            kind,
            durationMs: duration,
            loadEventMs: snap.loadEventMs,
            served: snap.served,
            fellThrough: snap.fellThrough,
          },
          'tokenpack phase complete',
        )

        return phase
      } catch (err: unknown) {
        const failure = phaseFailure(err)
        const snap = active
        const duration = snap ? performance.now() - snap.startMs : NAV_TIMEOUT_MS
        const phase: PhaseRecord = {
          durationMs: duration,
          loadEventMs: snap?.loadEventMs ?? null,
          timedOut: failure.timedOut,
          error: failure.message,
          served: snap?.served ?? 0,
          fellThrough: snap?.fellThrough ?? 0,
          totalBytes: snap?.totalBytes ?? 0,
          manifestUrls,
          sanity: snap
            ? await capturePhaseSanity(page, options.sanity, kind, snap.diagnostics)
            : undefined,
          assetMarkers: options.tokenDebug ? snap?.assetMarkers : undefined,
          routerDebug: options.tokenDebug ? summarizeRouterDebug(snap?.assetMarkers) : undefined,
        }

        logger.warn(
          {
            mode: 'tokenpack',
            kind,
            durationMs: duration,
            loadEventMs: phase.loadEventMs,
            served: phase.served,
            fellThrough: phase.fellThrough,
            message: failure.message,
          },
          'tokenpack phase failed',
        )

        return phase
      } finally {
        active = null
      }
    }

    const cold = await measure('cold', p =>
      p.goto(target.url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS }).then(() => undefined),
    )
    const reload = options.withReload
      ? await measure('reload', p =>
          p.reload({ waitUntil: 'load', timeout: NAV_TIMEOUT_MS }).then(() => undefined),
        )
      : null

    return { cold, reload }
  } finally {
    await browser.close()
  }
}
