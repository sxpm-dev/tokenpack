// baseline-cdp: same harness rig as TokenPack (interception + fulfillRequest),
// but bytes come from a Node-side `context.request.get(url)` of the original
// URL instead of a pack. Lets us isolate harness IPC tax from the pack vs
// direct comparison: (tokenpack - baseline-cdp) ≈ pure tokenpack-vs-direct.

import { chromium, type Page } from 'playwright'

import type { PackManifest, TargetConfig, ThrottleConfig } from '../config/types.js'
import { logger } from '../log/logger.js'
import { type RecordedAssetStore, simulatedNetworkDelayMs } from '../record/asset-store.js'
import { runJourney } from '../record/journey.js'
import type { AssetMarker, PhaseRecord } from '../report/types.js'
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

const EMPTY_PACK_URL_SET: ReadonlySet<string> = new Set()

export interface BaselineCdpResult {
  cold: PhaseRecord
  reload: PhaseRecord | null
}

export interface BaselineCdpOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
  tokenDebug?: boolean
  withReload?: boolean
  /**
   * Same manifest as TokenPack uses. baseline-cdp only intercepts/refetches
   * URLs in the manifest — that is, the same set of assets TokenPack would
   * have served. Other requests (navigation doc, dynamic API, etc.) fall
   * through to origin natively. This keeps the comparison fair: same number
   * of intercepted assets, same harness IPC tax per asset.
   */
  manifestPath: string
  /** Pre-loaded manifest, hoisted out of per-iteration cost by orchestrator. */
  prebuiltManifest?: PackManifest
  assetStore?: RecordedAssetStore
  serveEntryDocument?: boolean
  sanity?: PhaseSanityOptions
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

export async function runBaselineCdp(
  target: TargetConfig,
  options: BaselineCdpOptions,
): Promise<BaselineCdpResult> {
  const manifest = options.prebuiltManifest ?? (await loadManifest(options.manifestPath))
  const manifestUrls = new Set(manifest.assets.map(a => a.url))
  const manifestUrlList = [...manifestUrls]
  // We need the original response headers (Content-Type especially) when we
  // fulfill so the browser parses scripts/styles correctly. Without this,
  // everything served as application/octet-stream → JS doesn't execute, CSS
  // doesn't apply, page boots only partially → fewer follow-up requests fire
  // → numbers are bogus.
  const byUrl = new Map(manifest.assets.map(a => [a.url, a]))

  const browser = await chromium.launch({ headless: true, args: [...CHROMIUM_LAUNCH_ARGS] })

  try {
    const context = await browser.newContext({ storageState: options.storageStatePath })

    if (options.extraHeaders) await context.setExtraHTTPHeaders(options.extraHeaders)
    await installIsolatedAssetRouter(context, {
      assetStore: options.assetStore,
      throttle: options.throttle,
      excludeUrls: manifestUrls,
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

    let active: PhaseAccumulator | null = null

    page.on('load', () => {
      if (active) active.loadEventMs = performance.now() - active.startMs
    })

    await installCdpFetchRouter(client, manifestUrlList, async (event, router) => {
      const a = active

      if (!a) {
        await router.continue(event.requestId).catch(() => {})

        return
      }
      const observedMs = performance.now() - a.startMs
      const url = event.request.url

      if (!manifestUrls.has(url)) {
        const cls = classifyFellthroughUrl(url, EMPTY_PACK_URL_SET)

        a.fellThrough++
        if (options.tokenDebug && cls === 'normal') {
          a.assetMarkers.push({
            url,
            source: 'fall-through',
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
        const stored = options.assetStore?.byUrl.get(url)
        const apiResp = stored ? null : await context.request.get(url)
        const buf = stored ? stored.body : Buffer.from(await apiResp!.body())

        if (stored && options.throttle) {
          await new Promise(resolve =>
            setTimeout(
              resolve,
              simulatedNetworkDelayMs(stored.wireBytes ?? stored.rawBytes, options.throttle!),
            ),
          )
        }

        if (active !== a) return
        const fulfilledMs = performance.now() - a.startMs

        a.served++
        a.totalBytes += buf.byteLength

        const entry = byUrl.get(url)

        await router
          .fulfill({
            requestId: event.requestId,
            status: stored?.status ?? entry?.status ?? apiResp!.status(),
            headers: stripWireHeaders(stored?.headers ?? entry?.headers ?? apiResp!.headers()),
            body: buf,
          })
          .catch(() => {})

        if (options.tokenDebug) {
          a.assetMarkers.push({
            url,
            source: 'origin',
            status: 200,
            observedMs,
            fetchMs: fulfilledMs - observedMs,
            totalMs: fulfilledMs - observedMs,
            bytes: buf.byteLength,
          })
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown'

        logger.warn({ url, message }, 'baseline-cdp refetch failed — falling through')
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
          sanity: await capturePhaseSanity(page, options.sanity, kind, snap.diagnostics),
          assetMarkers: options.tokenDebug ? snap.assetMarkers : undefined,
        }

        logger.info(
          {
            mode: 'baseline-cdp',
            kind,
            durationMs: duration,
            loadEventMs: snap.loadEventMs,
            served: snap.served,
            fellThrough: snap.fellThrough,
          },
          'baseline-cdp phase complete',
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
          sanity: snap
            ? await capturePhaseSanity(page, options.sanity, kind, snap.diagnostics)
            : undefined,
          assetMarkers: options.tokenDebug ? snap?.assetMarkers : undefined,
        }

        logger.warn(
          {
            mode: 'baseline-cdp',
            kind,
            durationMs: duration,
            loadEventMs: phase.loadEventMs,
            served: phase.served,
            fellThrough: phase.fellThrough,
            message: failure.message,
          },
          'baseline-cdp phase failed',
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
