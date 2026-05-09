import type { BrowserContext, Page } from 'playwright'
import { chromium } from 'playwright'
import type { CapturedAsset, TargetConfig } from '../config/types.js'
import { runJourney } from './journey.js'
import { scrubHeaders } from '../encode/header-scrubber.js'
import { logger } from '../log/logger.js'

export interface RecordResult {
  target: TargetConfig
  capturedAt: string
  assets: CapturedAsset[]
}

export interface RecordOptions {
  storageStatePath?: string
  extraHeaders?: Record<string, string>
  /**
   * Content-type prefixes to keep (case-insensitive). Default: parser-blocking
   * critical-path resources only — JS, CSS, fonts, JSON, HTML fragments. This
   * is what the streaming-bundle hypothesis is actually about. Set to `null`
   * to keep everything (warning: large media will inflate the pack and may
   * exceed the single-PNG output limit).
   */
  includeContentTypes?: ReadonlyArray<string> | null
}

// Text-only by default. The current bootstrap uses `pack.text()` to extract,
// so binary asset types (fonts, images, wasm) would be UTF-8-corrupted on the
// way back. They're also outside the streaming-bundle hypothesis we're testing
// — fonts are already woff2-compressed, images don't block parsing. Keep the
// recorder narrowly focused on parser-blocking text resources.
const DEFAULT_INCLUDE_CONTENT_TYPES: ReadonlyArray<string> = [
  'application/javascript',
  'text/javascript',
  'application/json',
  'text/css',
  'text/html',
  'image/svg+xml', // SVG is XML/text — safe via pack.text()
]

export async function record(target: TargetConfig, options: RecordOptions = {}): Promise<RecordResult> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context: BrowserContext = await browser.newContext({
      storageState: options.storageStatePath,
    })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page: Page = await context.newPage()

    const assets: CapturedAsset[] = []
    let seq = 0
    let skippedByContentType = 0

    const includeTypes =
      options.includeContentTypes === null
        ? null
        : (options.includeContentTypes ?? DEFAULT_INCLUDE_CONTENT_TYPES).map(s => s.toLowerCase())

    page.on('response', async resp => {
      const req = resp.request()
      if (req.method() !== 'GET') return
      // Skip the navigation document — that's the page itself, not a sub-resource.
      if (req.resourceType() === 'document' && req.frame() === page.mainFrame()) return
      const status = resp.status()
      if (status >= 300) return
      const headers = resp.headers()
      if (headers['cache-control']?.includes('no-store')) return

      if (includeTypes !== null) {
        const ct = (headers['content-type'] ?? '').toLowerCase()
        if (!includeTypes.some(prefix => ct.startsWith(prefix))) {
          skippedByContentType++
          return
        }
      }

      try {
        const body = await resp.body()
        if (body.length === 0) return

        let wireBytes: number | null = null
        try {
          const sizes = await req.sizes()
          // 0 typically means "unknown" (cached / SW / preload). Treat as null.
          wireBytes = sizes.responseBodySize > 0 ? sizes.responseBodySize : null
        } catch {
          // some responses can't report sizes — leave null
        }

        const contentEncoding = headers['content-encoding'] ?? null

        assets.push({
          url: resp.url(),
          seq: seq++,
          status,
          headers: scrubHeaders(headers),
          body: new Uint8Array(body),
          rawBytes: body.length,
          wireBytes,
          contentEncoding,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown'
        logger.warn({ url: resp.url(), reason: message }, 'response body unavailable')
      }
    })

    logger.info({ url: target.url }, 'navigating')
    await page.goto(target.url, { waitUntil: 'load' })
    await runJourney(page, target.journey)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(target.captureGraceMs ?? 5000)

    const totalRawBytes = assets.reduce((s, a) => s + a.rawBytes, 0)
    const totalWireBytes = assets.reduce(
      (s, a) => (a.wireBytes !== null ? s + a.wireBytes : s),
      0,
    )
    const wireKnownCount = assets.filter(a => a.wireBytes !== null).length

    logger.info(
      {
        count: assets.length,
        totalRawBytes,
        totalWireBytes,
        wireKnownCount,
        skippedByContentType,
      },
      'recorded',
    )

    return { target, capturedAt: new Date().toISOString(), assets }
  } finally {
    await browser.close()
  }
}
