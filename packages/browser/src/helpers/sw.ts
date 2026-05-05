// Service Worker helper for TokenPack-cached assets.
//
// Use inside a Service Worker (sw.js) to handle requests for `.tpk`/`.png`
// asset URLs by decoding the cached PNG and serving the original payload.
//
// Example sw.js:
//
//   import { handleTokenpackRequest } from '@tokenpack/browser/sw'
//
//   self.addEventListener('fetch', e => {
//     const url = new URL(e.request.url)
//     if (url.pathname.endsWith('.tpk')) {
//       e.respondWith(handleTokenpackRequest(e.request))
//     }
//   })
//
// Phase 5 sw-cache scenario uses this to demonstrate cold-cache repeat-visit
// perf: TokenPack PNG cached by SW vs brotli-encoded blob.

import { decode } from '../decode'

export interface HandleTokenpackOptions {
  /** Decryption key (if the cached pack is encrypted). */
  key?: string
  /** MIME type to use in the response. Defaults to 'application/octet-stream'. */
  contentType?: string
  /** Cache name to look up. Defaults to 'tokenpack-cache'. */
  cacheName?: string
}

export async function handleTokenpackRequest(
  request: Request,
  options: HandleTokenpackOptions = {},
): Promise<Response> {
  const cacheName = options.cacheName ?? 'tokenpack-cache'
  const cache = await caches.open(cacheName)
  let cached = await cache.match(request)

  if (!cached) {
    cached = await fetch(request)
    if (!cached.ok) return cached
    await cache.put(request, cached.clone())
  }

  // Decode the PNG → original payload bytes.
  const blob = await cached.blob()
  const data = await decode(blob, { key: options.key })

  return new Response(data as BodyInit, {
    status: 200,
    headers: {
      'content-type': options.contentType ?? 'application/octet-stream',
      'x-tokenpack-decoded': '1',
    },
  })
}
