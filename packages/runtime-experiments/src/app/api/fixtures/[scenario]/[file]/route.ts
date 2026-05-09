// Serves any pre-generated fixture from `runtime-fixtures/<scenario>/<file>`.
// Applies the active throttle condition (passed via `?throttle=<name>`) to the
// response body.

import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'

import { networkConditionFor, throttledBody } from '@/lib/throttle'

const FIXTURES_DIR = path.join(process.cwd(), 'runtime-fixtures')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS: Record<string, string> = {
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  pragma: 'no-cache',
  expires: '0',
  vary: '*',
}

const MIME_BY_EXTENSION: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.raw': 'application/octet-stream',
  '.deflate': 'application/octet-stream',
  '.br': 'application/octet-stream',
  '.gz': 'application/octet-stream',
  '.cart': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
}

interface RouteContext {
  params: Promise<{ scenario: string; file: string }>
}

type EncodingMode = 'raw' | 'gz' | 'br'

const CONTENT_ENCODING_BY_MODE: Record<EncodingMode, string | null> = {
  raw: null,
  gz: 'gzip',
  br: 'br',
}

function parseEncodingMode(raw: string | null): EncodingMode {
  if (raw === 'gz' || raw === 'gzip') return 'gz'
  if (raw === 'br' || raw === 'brotli') return 'br'

  return 'raw'
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { scenario, file } = await ctx.params

  // Defensive — disallow path traversal. Filenames in our fixtures are flat
  // (no `/` or `..`), but user-supplied URLs need to be checked.
  if (
    scenario.includes('/') ||
    scenario.includes('..') ||
    file.includes('/') ||
    file.includes('..')
  ) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 })
  }

  const encoding = parseEncodingMode(req.nextUrl.searchParams.get('encoding'))
  // For ?encoding=gz/br we look up the precompressed `.gz` / `.br` sibling
  // generated at build time and serve it with the right Content-Encoding
  // header so the browser auto-decompresses on the way in. Mime is derived
  // from the LOGICAL filename (the request URL's `file` param), not the
  // on-disk file — `index.js.gz` is still `application/javascript` to JS.
  const onDiskName = encoding === 'raw' ? file : `${file}.${encoding}`
  const fixturePath = path.join(FIXTURES_DIR, scenario, onDiskName)

  if (!fs.existsSync(fixturePath)) {
    return NextResponse.json(
      {
        error: `fixture not found: ${scenario}/${onDiskName}. Run \`yarn workspace tokenpack-runtime-experiments generate:fixtures\`.`,
      },
      { status: 404 },
    )
  }

  const condition = networkConditionFor(req.nextUrl.searchParams.get('throttle'))
  const body = fs.readFileSync(fixturePath)
  const ext = path.extname(file).toLowerCase()
  const mime = MIME_BY_EXTENSION[ext] ?? 'application/octet-stream'

  const view = new Uint8Array(body.buffer, body.byteOffset, body.byteLength)

  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': mime,
    'content-length': String(view.byteLength),
    'x-runtime-experiments-throttle': condition.name,
  }
  const ce = CONTENT_ENCODING_BY_MODE[encoding]

  if (ce) headers['content-encoding'] = ce

  return new NextResponse(throttledBody(view, condition), { headers })
}
