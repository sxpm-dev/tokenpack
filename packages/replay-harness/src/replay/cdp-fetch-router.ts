import type { CDPSession } from 'playwright'

import { safeSend } from './cdp-safe-send.js'

interface PausedRequest {
  requestId: string
  request: {
    url: string
  }
}

interface FulfillRequest {
  requestId: string
  status: number
  headers: Readonly<Record<string, string>>
  body: Buffer | string
}

export interface CdpFetchRouter {
  fulfill(req: FulfillRequest): Promise<void>
  continue(requestId: string): Promise<void>
}

export type CdpFetchHandler = (event: PausedRequest, router: CdpFetchRouter) => Promise<void>

function toHeaderArray(headers: Readonly<Record<string, string>>) {
  return Object.entries(headers).map(([name, value]) => ({ name, value: String(value) }))
}

function toBase64Body(body: Buffer | string): string {
  return Buffer.isBuffer(body)
    ? body.toString('base64')
    : Buffer.from(body, 'utf8').toString('base64')
}

/**
 * Intercept only recorded asset URLs through CDP Fetch.
 *
 * Playwright broad routing is convenient and frame-aware, but it
 * disables the browser HTTP cache and pauses every request. That distorts the
 * harness, especially warm reloads. CDP Fetch with exact URL patterns keeps
 * unrelated page traffic native and preserves normal browser caching.
 */
export async function installCdpFetchRouter(
  client: CDPSession,
  urls: Iterable<string>,
  handler: CdpFetchHandler,
): Promise<void> {
  const patterns = [...urls].map(url => ({ urlPattern: url }))

  if (patterns.length === 0) return

  const router: CdpFetchRouter = {
    continue: requestId => safeSend(client, 'Fetch.continueRequest', { requestId }),
    fulfill: req =>
      safeSend(client, 'Fetch.fulfillRequest', {
        requestId: req.requestId,
        responseCode: req.status,
        responseHeaders: toHeaderArray(req.headers),
        body: toBase64Body(req.body),
      }),
  }

  await client.send('Fetch.enable', { patterns })
  client.on('Fetch.requestPaused', event => {
    void handler(event as PausedRequest, router).catch(() => {
      void router.continue((event as PausedRequest).requestId).catch(() => {})
    })
  })
}
