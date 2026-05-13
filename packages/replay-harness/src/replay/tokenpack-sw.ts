import { type BrowserContext, chromium, type Page } from 'playwright'

import { bundleBootstrap, DEFAULT_STRATEGY, type StrategyName } from '../browser/build-bootstrap.js'
import type { PackManifest, TargetConfig, ThrottleConfig } from '../config/types.js'
import { logger } from '../log/logger.js'
import type { RecordedAssetStore } from '../record/asset-store.js'
import { runJourney } from '../record/journey.js'
import type { AssetMarker, PhaseRecord } from '../report/types.js'
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

export interface TokenpackSwResult {
  cold: PhaseRecord
  reload: PhaseRecord | null
}

export interface TokenpackSwOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
  manifestPath: string
  packUrls: Readonly<Record<string, string>>
  tokenDebug?: boolean
  strategy?: StrategyName
  withReload?: boolean
  prebuiltBootstrap?: string
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
}

interface PhaseAccumulator {
  startMs: number
  loadEventMs: number | null
  diagnostics: PhaseDiagnostics
}

interface SwAssetEntry {
  packId: string
  internalPath: string
  status: number
  headers: Record<string, string>
}

declare global {
  interface Window {
    __TP_SW_MARKERS?: AssetMarker[]
  }
}

export async function runTokenpackSw(
  target: TargetConfig,
  options: TokenpackSwOptions,
): Promise<TokenpackSwResult> {
  const manifest = options.prebuiltManifest ?? (await loadManifest(options.manifestPath))
  const bootstrap =
    options.prebuiltBootstrap ?? (await bundleBootstrap(options.strategy ?? DEFAULT_STRATEGY))
  const browser = await chromium.launch({
    headless: true,
    args: [...CHROMIUM_LAUNCH_ARGS],
  })

  try {
    const context = await browser.newContext({
      storageState: options.storageStatePath,
      serviceWorkers: 'allow',
    })

    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    await installIsolatedAssetRouter(context, {
      assetStore: options.assetStore,
      throttle: options.throttle,
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

    await installSwMarkerSink(page)
    await installTokenpackServiceWorker(context, target.url, {
      manifest,
      packUrls: options.packUrls,
      bootstrap,
    })
    await setupServiceWorker(page, target.url)

    let active: PhaseAccumulator | null = null

    page.on('load', () => {
      if (active) active.loadEventMs = performance.now() - active.startMs
    })

    const measure = async (
      kind: 'cold' | 'reload',
      go: (page: Page) => Promise<void>,
    ): Promise<PhaseRecord> => {
      active = {
        startMs: performance.now(),
        loadEventMs: null,
        diagnostics: { consoleMessages: [], consoleErrors: [], pageErrors: [] },
      }
      try {
        await startSwPhase(page)
        await go(page)
        await runJourney(page, target.journey)
        await page.waitForTimeout(POST_LOAD_GRACE_MS)

        const duration = performance.now() - active.startMs
        const markers = await readSwMarkers(page)
        const servedMarkers = markers.filter(m => m.source === 'pack')
        const fallThroughMarkers = markers.filter(m => m.source === 'fall-through')
        const totalBytes = servedMarkers.reduce((sum, m) => sum + (m.bytes ?? 0), 0)
        const phase: PhaseRecord = {
          durationMs: duration,
          loadEventMs: active.loadEventMs,
          served: servedMarkers.length,
          fellThrough: fallThroughMarkers.length,
          totalBytes,
          sanity: await capturePhaseSanity(page, options.sanity, kind, active.diagnostics),
          assetMarkers: options.tokenDebug ? markers : undefined,
        }

        logger.info(
          {
            mode: 'tokenpack-sw',
            kind,
            durationMs: duration,
            loadEventMs: active.loadEventMs,
            served: phase.served,
            fellThrough: phase.fellThrough,
          },
          'tokenpack-sw phase complete',
        )

        return phase
      } catch (err: unknown) {
        const failure = phaseFailure(err)
        const duration = active ? performance.now() - active.startMs : NAV_TIMEOUT_MS
        const markers = await readSwMarkers(page).catch(() => [])
        const servedMarkers = markers.filter(m => m.source === 'pack')
        const fallThroughMarkers = markers.filter(m => m.source === 'fall-through')
        const phase: PhaseRecord = {
          durationMs: duration,
          loadEventMs: active?.loadEventMs ?? null,
          timedOut: failure.timedOut,
          error: failure.message,
          served: servedMarkers.length,
          fellThrough: fallThroughMarkers.length,
          totalBytes: servedMarkers.reduce((sum, m) => sum + (m.bytes ?? 0), 0),
          sanity: active
            ? await capturePhaseSanity(page, options.sanity, kind, active.diagnostics)
            : undefined,
          assetMarkers: options.tokenDebug ? markers : undefined,
        }

        logger.warn(
          {
            mode: 'tokenpack-sw',
            kind,
            durationMs: phase.durationMs,
            loadEventMs: phase.loadEventMs,
            served: phase.served,
            fellThrough: phase.fellThrough,
            message: failure.message,
          },
          'tokenpack-sw phase failed',
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

async function installSwMarkerSink(page: Page): Promise<void> {
  await page.addInitScript({
    content: `
      window.__TP_SW_MARKERS = [];
      navigator.serviceWorker?.addEventListener('message', event => {
        if (event.data?.type === 'tp-marker') {
          window.__TP_SW_MARKERS.push(event.data.marker);
        }
      });
    `,
  })
}

async function installTokenpackServiceWorker(
  context: BrowserContext,
  targetUrl: string,
  input: {
    manifest: PackManifest
    packUrls: Readonly<Record<string, string>>
    bootstrap: string
  },
): Promise<void> {
  const origin = new URL(targetUrl).origin
  const setupUrl = `${origin}/__tokenpack_setup.html`
  const swUrl = `${origin}/__tokenpack_sw.js`
  const swScript = buildServiceWorkerScript(input.manifest, input.packUrls, input.bootstrap)

  await context.route(setupUrl, async route => {
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
      body: '<!doctype html><meta charset="utf-8"><title>TokenPack SW setup</title>',
    })
  })
  await context.route(swUrl, async route => {
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
        'service-worker-allowed': '/',
      },
      body: swScript,
    })
  })
}

async function setupServiceWorker(page: Page, targetUrl: string): Promise<void> {
  const origin = new URL(targetUrl).origin
  const setupUrl = `${origin}/__tokenpack_setup.html`

  await page.goto(setupUrl, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('serviceWorker is not available')
    }

    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      await registration.unregister()
    }

    const registration = await navigator.serviceWorker.register('/__tokenpack_sw.js', {
      scope: '/',
    })

    await navigator.serviceWorker.ready

    const worker =
      registration.active ?? registration.installing ?? registration.waiting ?? undefined

    if (worker && worker.state !== 'activated') {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('service worker activation timeout')),
          10000,
        )

        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            clearTimeout(timeout)
            resolve()
          }
        })
      })
    }

    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('service worker control timeout')), 10000)

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            clearTimeout(timeout)
            resolve()
          },
          { once: true },
        )
      })
    }
  })
}

async function startSwPhase(page: Page): Promise<void> {
  await page.evaluate(async () => {
    window.__TP_SW_MARKERS = []
    const controller = navigator.serviceWorker?.controller

    if (!controller) throw new Error('service worker is not controlling the page')
    await new Promise<void>((resolve, reject) => {
      const channel = new MessageChannel()
      const timeout = setTimeout(
        () => reject(new Error('service worker phase-start timeout')),
        5000,
      )

      channel.port1.onmessage = () => {
        clearTimeout(timeout)
        resolve()
      }
      controller.postMessage({ type: 'tp-phase-start' }, [channel.port2])
    })
  })
}

async function readSwMarkers(page: Page): Promise<AssetMarker[]> {
  return page.evaluate(() => window.__TP_SW_MARKERS ?? [])
}

function buildServiceWorkerScript(
  manifest: PackManifest,
  packUrls: Readonly<Record<string, string>>,
  bootstrap: string,
): string {
  const assets = Object.fromEntries(
    manifest.assets.map((entry): [string, SwAssetEntry] => [
      entry.url,
      {
        packId: entry.packId,
        internalPath: entry.internalPath,
        status: entry.status,
        headers: stripWireHeaders(entry.headers),
      },
    ]),
  )

  return `
const window = self;
self.__PACK_URLS = ${JSON.stringify(packUrls)};
const __TP_ASSETS = ${JSON.stringify(assets)};
const __TP_ENCODER = new TextEncoder();
let __tpPhaseStartMs = performance.now();

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'tp-phase-start') {
    __tpPhaseStartMs = performance.now();
    event.ports?.[0]?.postMessage({ ok: true });
  }
});

${bootstrap}

self.addEventListener('fetch', event => {
  const entry = __TP_ASSETS[event.request.url];
  if (!entry) return;
  event.respondWith(__tpHandleAsset(event, entry));
});

async function __tpHandleAsset(event, entry) {
  const observedMs = performance.now() - __tpPhaseStartMs;

  try {
    const result = await window.__getPackFile(entry.packId, entry.internalPath);
    const fulfilledMs = performance.now() - __tpPhaseStartMs;
    const bytes = __TP_ENCODER.encode(result.text).byteLength;

    event.waitUntil(__tpPostMarker(event, {
      url: event.request.url,
      source: 'pack',
      packId: entry.packId,
      status: entry.status,
      observedMs,
      fetchMs: result.packFetchMs,
      packInitMs: result.packInitMs,
      fileFetchMs: result.fileFetchMs,
      extractMs: result.extractMs,
      cacheState: result.cacheState,
      totalMs: fulfilledMs - observedMs,
      bytes,
    }));

    return new Response(result.text, {
      status: entry.status,
      headers: entry.headers,
    });
  } catch (error) {
    const fulfilledMs = performance.now() - __tpPhaseStartMs;

    event.waitUntil(__tpPostMarker(event, {
      url: event.request.url,
      source: 'fall-through',
      status: null,
      observedMs,
      totalMs: fulfilledMs - observedMs,
      bytes: null,
    }));

    return fetch(event.request);
  }
}

async function __tpPostMarker(event, marker) {
  if (!event.clientId) return;
  const client = await self.clients.get(event.clientId);

  client?.postMessage({ type: 'tp-marker', marker });
}
`
}

export {}
