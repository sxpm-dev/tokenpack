import { chromium, type Page } from 'playwright'
import type { TargetConfig, ThrottleConfig } from '../config/types.js'
import { runJourney } from '../record/journey.js'
import { applyThrottle } from './throttle.js'
import { CHROMIUM_LAUNCH_ARGS, NAV_TIMEOUT_MS, POST_LOAD_GRACE_MS } from './constants.js'
import { logger } from '../log/logger.js'
import type { AssetMarker, PhaseRecord } from '../report/types.js'
import { classifyFellthroughUrl } from './url-classifier.js'

const EMPTY_PACK_URL_SET: ReadonlySet<string> = new Set()

export interface BaselineResult {
  cold: PhaseRecord
  reload: PhaseRecord | null
}

export interface BaselineOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
  tokenDebug?: boolean
  /** When true, also measures a page.reload() after the cold load. */
  withReload?: boolean
}

interface PhaseAccumulator {
  startMs: number
  loadEventMs: number | null
  assetMarkers: AssetMarker[]
}

export async function runBaseline(
  target: TargetConfig,
  options: BaselineOptions = {},
): Promise<BaselineResult> {
  // Same Chromium args as the intercept modes so launch behaviour is identical
  // across baseline / baseline-cdp / tokenpack — eliminates one dimension of
  // measurement asymmetry.
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

    const startTimes = new Map<string, number>()

    let active: PhaseAccumulator | null = null
    page.on('load', () => {
      if (active) active.loadEventMs = performance.now() - active.startMs
    })
    page.on('request', req => {
      if (!active) return
      startTimes.set(req.url(), performance.now() - active.startMs)
    })
    page.on('response', async resp => {
      // Capture reference up-front so an async hop inside this handler can't
      // race with `active = null` at end-of-phase.
      const a = active
      if (!a) return
      if (!options.tokenDebug) return
      const req = resp.request()
      if (req.method() !== 'GET') return
      // Skip media noise (images, video, audio) — manifest excludes them too,
      // so they'd just clutter the per-asset table with un-comparable rows.
      if (classifyFellthroughUrl(resp.url(), EMPTY_PACK_URL_SET) !== 'normal') return
      const observedMs = startTimes.get(resp.url()) ?? performance.now() - a.startMs
      let bytes: number | null = null
      try {
        const sizes = await req.sizes()
        bytes = sizes.responseBodySize > 0 ? sizes.responseBodySize : null
      } catch {
        // ignored
      }
      // After the await, drop late markers from a phase that's already ended.
      if (active !== a) return
      const fulfilledMs = performance.now() - a.startMs
      a.assetMarkers.push({
        url: resp.url(),
        source: 'origin',
        status: resp.status(),
        observedMs,
        fetchMs: fulfilledMs - observedMs,
        totalMs: fulfilledMs - observedMs,
        bytes,
      })
    })

    const measure = async (kind: 'cold' | 'reload', go: (page: Page) => Promise<void>): Promise<PhaseRecord> => {
      active = { startMs: performance.now(), loadEventMs: null, assetMarkers: [] }
      startTimes.clear()
      await go(page)
      await runJourney(page, target.journey)
      // Don't wait for networkidle on chatty SPAs — they never go quiet (websockets, telemetry pings).
      // Duration = page.goto resolved (waitUntil: 'load') + journey + a small grace window.
      await page.waitForTimeout(POST_LOAD_GRACE_MS)
      const duration = performance.now() - active.startMs
      const phase: PhaseRecord = {
        durationMs: duration,
        loadEventMs: active.loadEventMs,
        assetMarkers: options.tokenDebug ? active.assetMarkers : undefined,
      }
      logger.info({ mode: 'baseline', kind, durationMs: duration, loadEventMs: active.loadEventMs }, 'baseline phase complete')
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
