import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface FixtureServer {
  url: string
  serveFile: (path: string, mime: string, bytes: Uint8Array) => void
  close: () => Promise<void>
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const html = `<!doctype html><html><head>
    <link rel="stylesheet" href="/a.css">
    <script src="/b.js" defer></script>
    </head><body>fixture</body></html>`
  const css = 'body{background:#eef}'
  const js = 'window.__loaded=true'
  const privateHtml =
    '<!doctype html><html><head><script src="/b.js"></script></head><body>private</body></html>'

  const extraFiles = new Map<string, { mime: string; bytes: Uint8Array }>()

  const server: Server = createServer((req, res) => {
    const path = req.url ?? '/'
    const extra = extraFiles.get(path)

    if (extra) {
      const range = parseRange(req.headers.range, extra.bytes.byteLength)

      if (req.headers.range && !range) {
        res
          .writeHead(416, {
            'content-range': `bytes */${extra.bytes.byteLength}`,
            'accept-ranges': 'bytes',
          })
          .end()

        return
      }
      if (range) {
        res.writeHead(206, {
          'content-type': extra.mime,
          'content-range': `bytes ${range.start}-${range.end}/${extra.bytes.byteLength}`,
          'content-length': String(range.end - range.start + 1),
          'accept-ranges': 'bytes',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'cache-control': 'public,max-age=60',
        })
        res.end(Buffer.from(extra.bytes.subarray(range.start, range.end + 1)))

        return
      }
      res.writeHead(200, {
        'content-type': extra.mime,
        'content-length': String(extra.bytes.byteLength),
        'accept-ranges': 'bytes',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'cache-control': 'public,max-age=60',
      })
      res.end(Buffer.from(extra.bytes))

      return
    }
    if (path === '/private/index.html') {
      const auth = req.headers.authorization

      if (auth !== 'Basic dXNlcjpwYXNz') {
        res.writeHead(401, { 'www-authenticate': 'Basic' }).end('unauthorized')

        return
      }
      res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' })
      res.end(privateHtml)

      return
    }
    if (path === '/' || path === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' })
      res.end(html)
    } else if (path === '/a.css') {
      res.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'public,max-age=60' })
      res.end(css)
    } else if (path === '/b.js') {
      res.writeHead(200, {
        'content-type': 'application/javascript',
        'cache-control': 'public,max-age=60',
      })
      res.end(js)
    } else {
      res.writeHead(404).end()
    }
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port

  return {
    url: `http://127.0.0.1:${port}/`,
    serveFile: (path, mime, bytes) => extraFiles.set(path, { mime, bytes }),
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
