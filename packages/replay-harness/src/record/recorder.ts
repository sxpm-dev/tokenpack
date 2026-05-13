import type { BrowserContext, Page, Request } from 'playwright'
import { chromium } from 'playwright'

import type { CapturedAsset, TargetConfig } from '../config/types.js'
import { scrubHeaders } from '../encode/header-scrubber.js'
import { isStaticJsonAssetUrl } from '../encode/static-json-asset.js'
import { logger } from '../log/logger.js'
import type { BrowserConsoleMessage } from '../report/types.js'
import { runJourney } from './journey.js'

export interface RecordResult {
  target: TargetConfig
  capturedAt: string
  entryDocument?: {
    url: string
    status: number
    headers: Readonly<Record<string, string>>
    body: Uint8Array
  }
  consoleMessages: BrowserConsoleMessage[]
  pageErrors: string[]
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

// Text-only by default. Keep the recorder narrowly focused on static assets
// that should be TokenPack candidates: JS, CSS, and URL-shaped static JSON
// manifests. API/XHR JSON is deliberately excluded even though its response
// content-type is also application/json.
const DEFAULT_INCLUDE_CONTENT_TYPES: ReadonlyArray<string> = [
  'application/javascript',
  'text/javascript',
  'application/json',
  'text/css',
]

export async function record(
  target: TargetConfig,
  options: RecordOptions = {},
): Promise<RecordResult> {
  const browser = await chromium.launch({ headless: true })

  try {
    const context: BrowserContext = await browser.newContext({
      storageState: options.storageStatePath,
    })

    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page: Page = await context.newPage()
    const consoleMessages: BrowserConsoleMessage[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      const entry = { type: msg.type(), text: msg.text() }

      consoleMessages.push(entry)
      logger.info(entry, '[record browser console]')
    })
    page.on('pageerror', err => {
      pageErrors.push(err.message)
      logger.error({ message: err.message, stack: err.stack }, '[record browser pageerror]')
    })

    const assets: CapturedAsset[] = []
    let entryDocument: RecordResult['entryDocument']
    let seq = 0
    let skippedByContentType = 0

    const includeTypes =
      options.includeContentTypes === null
        ? null
        : (options.includeContentTypes ?? DEFAULT_INCLUDE_CONTENT_TYPES).map(s => s.toLowerCase())

    context.on('response', async resp => {
      const req = resp.request()

      if (req.method() !== 'GET') return
      const status = resp.status()

      if (status >= 300) return
      const headers = resp.headers()

      // Persist the navigation document separately. It is not packed as an
      // asset, but captured-app replay uses it as the deterministic entry
      // point so the app, not a synthetic loader, drives follow-up requests.
      if (isMainFrameDocument(req, page)) {
        try {
          entryDocument = {
            url: resp.url(),
            status,
            headers: scrubHeaders(headers),
            body: new Uint8Array(await resp.body()),
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'unknown'

          logger.warn({ url: resp.url(), reason: message }, 'entry document body unavailable')
        }

        return
      }

      if (headers['cache-control']?.includes('no-store')) return

      if (includeTypes !== null) {
        if (!shouldCaptureAsset(resp.url(), headers, includeTypes)) {
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
    const totalWireBytes = assets.reduce((s, a) => (a.wireBytes !== null ? s + a.wireBytes : s), 0)
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

    return {
      target,
      capturedAt: new Date().toISOString(),
      entryDocument,
      consoleMessages,
      pageErrors,
      assets,
    }
  } finally {
    await browser.close()
  }
}

function isMainFrameDocument(req: Request, page: Page): boolean {
  if (req.resourceType() !== 'document') return false

  try {
    return req.frame() === page.mainFrame()
  } catch {
    return false
  }
}

function shouldCaptureAsset(
  url: string,
  headers: Readonly<Record<string, string>>,
  includeTypes: ReadonlyArray<string>,
): boolean {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

  const contentType = (headers['content-type'] ?? '').toLowerCase()
  const matchesIncludedType = includeTypes.some(prefix => contentType.startsWith(prefix))

  if (!matchesIncludedType) return false
  if (contentType.startsWith('application/json')) return isStaticJsonAssetUrl(url)

  return true
}
