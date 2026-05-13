import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

import { loadReplayEntryDocument } from '../record/asset-store.js'
import { stripWireHeaders } from './strip-encoding.js'

export interface CapturedAppReplayServer {
  url: string
  sourceUrl: string
  close: () => Promise<void>
}

export async function startCapturedAppReplayServer(
  fixtureDir: string,
): Promise<CapturedAppReplayServer> {
  const entry = await loadReplayEntryDocument(fixtureDir)

  if (!entry) {
    throw new Error(
      `captured entry document missing in ${fixtureDir}; re-run record before --captured-app`,
    )
  }

  const html = withCaptureBase(entry.body.toString('utf8'), entry.url)
  const headers = {
    ...stripWireHeaders(entry.headers),
    'content-type': entry.headers['content-type'] ?? 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  }

  const server: Server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'

    if (path !== '/' && path !== '/index.html') {
      res.writeHead(404, { 'cache-control': 'no-store' }).end('not found')

      return
    }

    res.writeHead(entry.status, headers)
    res.end(html)
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port

  return {
    url: `http://127.0.0.1:${port}/`,
    sourceUrl: entry.url,
    close: () =>
      new Promise<void>((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))),
  }
}

function withCaptureBase(html: string, sourceUrl: string): string {
  if (/<base\b/i.test(html)) return html

  const base = `<base href="${escapeHtml(sourceUrl)}">`
  const headMatch = /<head(\s[^>]*)?>/i.exec(html)

  if (headMatch?.index !== undefined) {
    const insertAt = headMatch.index + headMatch[0].length

    return `${html.slice(0, insertAt)}${base}${html.slice(insertAt)}`
  }

  return `<!doctype html><head>${base}</head>${html}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
