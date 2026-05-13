import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

import { afterAll, beforeAll, expect, it } from 'vitest'

import type { TargetConfig } from '../../src/config/types.js'
import { record } from '../../src/record/recorder.js'

let server: Server
let origin: string

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = req.url ?? '/'

    if (path === '/' || path === '/index.html') {
      res
        .writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' })
        .end(`<!doctype html>
          <script src="/app.js"></script>
          <link rel="stylesheet" href="/app.css">
          <script>
            fetch('/static/config.manifest.min.json');
            fetch('/_api/config');
          </script>`)

      return
    }

    if (path === '/app.js') {
      res
        .writeHead(200, {
          'content-type': 'application/javascript',
          'cache-control': 'public,max-age=60',
        })
        .end('window.__appLoaded = true')

      return
    }

    if (path === '/app.css') {
      res
        .writeHead(200, { 'content-type': 'text/css', 'cache-control': 'public,max-age=60' })
        .end('body { color: black }')

      return
    }

    if (path === '/static/config.manifest.min.json') {
      res
        .writeHead(200, {
          'content-type': 'application/json',
          'cache-control': 'public,max-age=60',
        })
        .end('{"static":true}')

      return
    }

    if (path === '/_api/config') {
      res
        .writeHead(200, {
          'content-type': 'application/json',
          'cache-control': 'public,max-age=60',
        })
        .end('{"api":true}')

      return
    }

    res.writeHead(404).end()
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(err => (err ? reject(err) : resolve())))
})

it(
  'records JS, CSS, and static JSON assets but skips API JSON',
  async () => {
    const target: TargetConfig = {
      id: 'fixture',
      url: origin,
      journey: { type: 'goto-only' },
      authMode: 'none',
      captureGraceMs: 250,
    }

    const result = await record(target)
    const paths = result.assets.map(asset => new URL(asset.url).pathname).sort()

    expect(paths).toEqual(['/app.css', '/app.js', '/static/config.manifest.min.json'])
  },
  30_000,
)
