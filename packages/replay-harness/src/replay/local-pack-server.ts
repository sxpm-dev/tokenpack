import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'

export interface LocalPackServer {
  url: string
  close: () => Promise<void>
}

/**
 * Vanilla static file server: GET /<packId>.png → reads from `fixtureDir`,
 * pipes the bytes back. Permissive CORS so cross-origin pages can fetch.
 * No routing logic — pack files are static assets.
 */
export async function startLocalPackServer(fixtureDir: string): Promise<LocalPackServer> {
  const server: Server = createServer((req, res) => {
    // CORS preflight + headers, including Access-Control-Allow-Private-Network
    // for Chromium's PNA check on cross-origin → loopback fetches.
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': '*',
      'access-control-allow-private-network': 'true',
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders).end()

      return
    }
    const path = (req.url ?? '/').split('?')[0] ?? '/'

    if (!path.endsWith('.png')) {
      res.writeHead(404, corsHeaders).end()

      return
    }
    const filePath = join(fixtureDir, path)

    if (!existsSync(filePath)) {
      res.writeHead(404, corsHeaders).end()

      return
    }
    const size = statSync(filePath).size
    const range = parseRange(req.headers.range, size)

    if (req.headers.range && !range) {
      res
        .writeHead(416, {
          ...corsHeaders,
          'content-range': `bytes */${size}`,
          'accept-ranges': 'bytes',
        })
        .end()

      return
    }

    if (range) {
      res.writeHead(206, {
        ...corsHeaders,
        'content-type': 'image/png',
        'content-length': String(range.end - range.start + 1),
        'content-range': `bytes ${range.start}-${range.end}/${size}`,
        'accept-ranges': 'bytes',
        'cache-control': 'public, max-age=31536000, immutable',
      })
      createReadStream(filePath, { start: range.start, end: range.end }).pipe(res)

      return
    }

    res.writeHead(200, {
      ...corsHeaders,
      'content-type': 'image/png',
      'content-length': String(size),
      'accept-ranges': 'bytes',
      // Long max-age so the pack survives in the browser HTTP cache across
      // a `page.reload()` — that's how we measure the warm-cache phase.
      'cache-control': 'public, max-age=31536000, immutable',
    })
    createReadStream(filePath).pipe(res)
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port

  return {
    url: `http://127.0.0.1:${port}/`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))),
  }
}

function parseRange(
  header: string | string[] | undefined,
  size: number,
): { start: number; end: number } | null {
  if (!header || Array.isArray(header)) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())

  if (!match) return null

  const [, startRaw, endRaw] = match

  if (startRaw === '' && endRaw === '') return null

  let start: number
  let end: number

  if (startRaw === '') {
    const suffix = Number(endRaw)

    if (!Number.isInteger(suffix) || suffix <= 0) return null
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(startRaw)
    end = endRaw === '' ? size - 1 : Number(endRaw)
  }

  if (!Number.isInteger(start) || !Number.isInteger(end)) return null
  if (start < 0 || end < start || start >= size) return null

  return { start, end: Math.min(end, size - 1) }
}
