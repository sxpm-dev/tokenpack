import { chromium } from 'playwright'
import { decode as decodeToken } from '@tokenpack/node'
import type { TargetConfig, ThrottleConfig } from '../config/types.js'
import { runJourney } from '../record/journey.js'
import { applyThrottle } from './throttle.js'
import { loadManifest } from './manifest-loader.js'
import { logger } from '../log/logger.js'

export interface LocalReplayResult {
  durationMs: number
  loadEventMs: number | null
  served: number
  fellThrough: number
}

export interface LocalReplayOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
}

export async function runTokenpackLocal(
  target: TargetConfig,
  manifestPath: string,
  fixtureDir: string,
  options: LocalReplayOptions = {},
): Promise<LocalReplayResult> {
  const manifest = await loadManifest(manifestPath)

  // Decode every pack referenced by the manifest, accumulating into a single
  // (internalPath → bytes) map. Multi-pack apps work the same way at this layer.
  const byInternalPath = new Map<string, Uint8Array>()
  for (const pack of manifest.packs) {
    const packPath = `${fixtureDir}/${pack.id}.png`
    const decoded = await decodeToken(packPath)
    if (!decoded.isPack()) throw new Error(`Pack at ${packPath} is not a DirPack`)
    const entries = await decoded.extractAll()
    for (const e of entries) byInternalPath.set(e.path, e.bytes)
  }
  const byUrl = new Map(manifest.assets.map(a => [a.url, a]))

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ storageState: options.storageStatePath })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page = await context.newPage()
    const client = await context.newCDPSession(page)

    if (options.throttle) await applyThrottle(client, options.throttle)

    let served = 0
    let fellThrough = 0

    await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
    client.on('Fetch.requestPaused', async event => {
      const entry = byUrl.get(event.request.url)
      const bytes = entry ? byInternalPath.get(entry.internalPath) : undefined

      if (entry && bytes) {
        served++
        await client.send('Fetch.fulfillRequest', {
          requestId: event.requestId,
          responseCode: entry.status,
          responseHeaders: Object.entries(entry.headers).map(([name, value]) => ({ name, value })),
          body: Buffer.from(bytes).toString('base64'),
        })
      } else {
        fellThrough++
        await client.send('Fetch.continueRequest', { requestId: event.requestId })
      }
    })

    const started = performance.now()
    let loadEventMs: number | null = null
    page.on('load', () => {
      loadEventMs = performance.now() - started
    })

    await page.goto(target.url, { waitUntil: 'load' })
    await runJourney(page, target.journey)
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
    const durationMs = performance.now() - started

    logger.info(
      { mode: 'tokenpack-local', durationMs, loadEventMs, served, fellThrough },
      'local replay complete',
    )
    return { durationMs, loadEventMs, served, fellThrough }
  } finally {
    await browser.close()
  }
}
