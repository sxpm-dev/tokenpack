import { chromium, type Page } from 'playwright'
import type { TargetConfig, ThrottleConfig, PackManifest } from '../config/types.js'
import { runJourney } from '../record/journey.js'
import { applyThrottle } from './throttle.js'
import { loadManifest } from './manifest-loader.js'
import { installStrategy } from './bridge.js'
import { bundleBootstrap, DEFAULT_STRATEGY, type StrategyName } from '../browser/build-bootstrap.js'
import { CHROMIUM_LAUNCH_ARGS, NAV_TIMEOUT_MS, POST_LOAD_GRACE_MS } from './constants.js'
import { classifyFellthroughUrl } from './url-classifier.js'
import { stripWireHeaders } from './strip-encoding.js'
import { logger } from '../log/logger.js'
import type { AssetMarker, PhaseRecord } from '../report/types.js'

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
}

interface PackFileResult {
  text: string
  packFetchMs: number
  extractMs: number
  cached: boolean
}

interface PhaseAccumulator {
  startMs: number
  loadEventMs: number | null
  served: number
  fellThrough: number
  totalBytes: number
  assetMarkers: AssetMarker[]
}

export async function runTokenpack(
  target: TargetConfig,
  options: TokenpackOptions,
): Promise<TokenpackResult> {
  const manifest = options.prebuiltManifest ?? (await loadManifest(options.manifestPath))
  const byUrl = new Map(manifest.assets.map(a => [a.url, a]))
  const packUrlSet = new Set(Object.values(options.packUrls))
  const bootstrap =
    options.prebuiltBootstrap ?? (await bundleBootstrap(options.strategy ?? DEFAULT_STRATEGY))

  const browser = await chromium.launch({ headless: true, args: [...CHROMIUM_LAUNCH_ARGS] })
  try {
    const context = await browser.newContext({ storageState: options.storageStatePath })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page = await context.newPage()
    page.on('console', msg => {
      logger.info({ type: msg.type(), text: msg.text() }, '[browser console]')
    })
    page.on('pageerror', err => {
      logger.error({ message: err.message, stack: err.stack }, '[browser pageerror]')
    })
    const client = await context.newCDPSession(page)

    if (options.throttle) await applyThrottle(client, options.throttle)
    await installStrategy(page, options.packUrls, bootstrap)

    let active: PhaseAccumulator | null = null

    page.on('load', () => {
      if (active) active.loadEventMs = performance.now() - active.startMs
    })

    // Use Playwright's context.route — frame-aware (covers iframes/workers),
    // unlike page-level CDP `Fetch.enable` which only intercepts main-frame
    // requests. The Wix editor runs services from inside an iframe, so a
    // page-level CDP intercept misses the entire `editor-platform-services/*`
    // tree.
    await context.route('**/*', async route => {
      const a = active
      if (!a) {
        await route.continue().catch(() => {})
        return
      }
      const observedMs = performance.now() - a.startMs
      const url = route.request().url()
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
        await route.continue().catch(() => {})
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
        a.served++
        a.totalBytes += Buffer.byteLength(result.text, 'utf8')

        await route
          .fulfill({
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
            extractMs: result.extractMs,
            totalMs: fulfilledMs - observedMs,
            bytes: Buffer.byteLength(result.text, 'utf8'),
          })
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown'
        logger.warn({ url, packId: entry.packId, message }, 'getPackFile failed — falling through')
        if (active === a) a.fellThrough++
        await route.continue().catch(() => {})
      }
    })

    const measure = async (kind: 'cold' | 'reload', go: (page: Page) => Promise<void>): Promise<PhaseRecord> => {
      active = { startMs: performance.now(), loadEventMs: null, served: 0, fellThrough: 0, totalBytes: 0, assetMarkers: [] }
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
        assetMarkers: options.tokenDebug ? snap.assetMarkers : undefined,
      }
      logger.info(
        { mode: 'tokenpack', kind, durationMs: duration, loadEventMs: snap.loadEventMs, served: snap.served, fellThrough: snap.fellThrough },
        'tokenpack phase complete',
      )
      active = null
      return phase
    }

    const cold = await measure('cold', p => p.goto(target.url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS }).then(() => undefined))
    const reload = options.withReload
      ? await measure('reload', p => p.reload({ waitUntil: 'load', timeout: NAV_TIMEOUT_MS }).then(() => undefined))
      : null

    return { cold, reload }
  } finally {
    await browser.close()
  }
}
