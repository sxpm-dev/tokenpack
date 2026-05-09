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
      res.writeHead(200, { 'content-type': extra.mime, 'cache-control': 'public,max-age=60' })
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
      new Promise<void>((resolve, reject) =>
        server.close(err => (err ? reject(err) : resolve())),
      ),
  }
}
