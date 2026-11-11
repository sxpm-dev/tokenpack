/**
 * Tiny static server.
 *   /bench-app/                 serves web public bench index.html
 *   /bench-app/bootloader.js    serves web public bench bootloader.js (+ .map)
 *   /bench-app/assets/...       serves web public bench assets
 *
 * Picks pre-compressed sibling (.br / .gz) when Accept-Encoding allows.
 * CORS is fully open so a separately-served origin can load these assets.
 */
import { existsSync, statSync } from 'node:fs'
import { createReadStream } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

import { PUBLIC_BASE, PUBLIC_DIR } from './paths.js'

const PORT = numFlag('port', 4173)

function numFlag(name: string, fallback: number): number {
  const flag = process.argv.find(a => a.startsWith(`--${name}=`))

  if (!flag) return fallback
  const n = Number(flag.slice(flag.indexOf('=') + 1))

  return Number.isFinite(n) ? n : fallback
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const SERVER = createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
    const pathname = decodeURIComponent(url.pathname)
    const target = resolveTarget(pathname)

    if (!target) {
      res.writeHead(404, corsHeaders())
      res.end('not found')

      return
    }

    const accept = String(req.headers['accept-encoding'] ?? '')
    const encoded = pickEncoded(target, accept)
    const filePath = encoded?.path ?? target
    const ext = extname(target).toLowerCase()
    const type = MIME[ext] ?? 'application/octet-stream'
    const st = statSync(filePath)
    const headers: Record<string, string> = {
      ...corsHeaders(),
      'Content-Type': type,
      'Content-Length': String(st.size),
      'Cache-Control': 'no-store',
    }

    if (encoded) headers['Content-Encoding'] = encoded.encoding
    res.writeHead(200, headers)
    createReadStream(filePath).pipe(res)
  } catch (err) {
    res.writeHead(500, corsHeaders())
    res.end(err instanceof Error ? err.message : 'error')
  }
})

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    'Timing-Allow-Origin': '*',
  }
}

function resolveTarget(pathname: string): string | null {
  const scoped = pathname.startsWith(PUBLIC_BASE)
    ? pathname.slice(PUBLIC_BASE.length) || '/'
    : pathname
  const match = scoped.match(/^\/(small|medium|large)(\/.*)?$/)
  const size = match?.[1] ?? 'large'
  const rest = match?.[2] ?? scoped
  const fixtureDir = join(PUBLIC_DIR, size)
  const assetsDir = join(fixtureDir, 'assets')

  if (rest === '/' || rest === '/index.html') {
    return join(fixtureDir, 'index.html')
  }
  if (
    rest === '/native-chunks.html' ||
    rest === '/native-chunks-random.html' ||
    rest === '/native-single.html' ||
    rest === '/native-single-random.html' ||
    rest === '/native-single-cdn.html'
  ) {
    return join(fixtureDir, rest.slice(1))
  }
  if (rest === '/bootloader.js' || rest === '/bootloader.js.map') {
    return join(fixtureDir, rest.slice(1))
  }
  if (rest.startsWith('/assets/')) {
    const safe = normalize(rest.replace(/^\/assets\//, '')).replace(/^[./\\]+/, '')
    const full = join(assetsDir, safe)

    if (!full.startsWith(assetsDir)) return null
    if (existsSync(full) && statSync(full).isFile()) return full
  }

  return null
}

function pickEncoded(path: string, accept: string): { path: string; encoding: string } | null {
  if (path.endsWith('.png')) return null
  if (accept.includes('br')) {
    const br = `${path}.br`

    if (existsSync(br)) return { path: br, encoding: 'br' }
  }
  if (accept.includes('gzip')) {
    const gz = `${path}.gz`

    if (existsSync(gz)) return { path: gz, encoding: 'gzip' }
  }

  return null
}

SERVER.listen(PORT, () => {
  console.log(`bench-app listening on http://localhost:${PORT}`)
  console.log(`  multi          : http://localhost:${PORT}/bench-app/medium/?loader=multi`)
  console.log(`  single         : http://localhost:${PORT}/bench-app/medium/?loader=single`)
  console.log(`  router         : http://localhost:${PORT}/bench-app/medium/?loader=router`)
  console.log(`  native-chunks  : http://localhost:${PORT}/bench-app/medium/native-chunks.html`)
  console.log(`  native-single  : http://localhost:${PORT}/bench-app/medium/native-single.html`)
})
