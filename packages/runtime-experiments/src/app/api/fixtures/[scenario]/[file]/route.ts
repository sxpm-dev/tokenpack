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
  const ce = CONTENT_ENCODING_BY_MODE[encoding]

  const rangeHeader = req.headers.get('range')

  if (rangeHeader && !ce) {
    const parsed = parseRangeHeader(rangeHeader, view.byteLength)

    if (!parsed) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...NO_CACHE_HEADERS, 'content-range': 'bytes */' + view.byteLength },
      })
    }
    const slice = view.subarray(parsed.start, parsed.end + 1)
    const partialHeaders: Record<string, string> = {
      ...NO_CACHE_HEADERS,
      'content-type': mime,
      'content-length': String(slice.byteLength),
      'content-range': 'bytes ' + parsed.start + '-' + parsed.end + '/' + view.byteLength,
      'accept-ranges': 'bytes',
      'x-runtime-experiments-throttle': condition.name,
    }

    return new NextResponse(throttledBody(slice, condition), {
      status: 206,
      headers: partialHeaders,
    })
  }

  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': mime,
    'content-length': String(view.byteLength),
    'x-runtime-experiments-throttle': condition.name,
  }

  if (ce) headers['content-encoding'] = ce
  if (!ce) headers['accept-ranges'] = 'bytes'

  return new NextResponse(throttledBody(view, condition), { headers })
}

/** Minimal `Range:` header parser. Supports `bytes=A-B`, `bytes=A-`, `bytes=-N`. */
function parseRangeHeader(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())

  if (!match) return null
  const startRaw = match[1]
  const endRaw = match[2]

  if (startRaw === '' && endRaw === '') return null

  let start: number
  let end: number

  if (startRaw === '') {
    const suffix = Number(endRaw)

    if (!Number.isFinite(suffix) || suffix <= 0) return null
    start = Math.max(0, size - suffix)
    end = size - 1
  } else if (endRaw === '') {
    start = Number(startRaw)
    end = size - 1
  } else {
    start = Number(startRaw)
    end = Number(endRaw)
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (start < 0 || end < start || start >= size) return null
  if (end >= size) end = size - 1

  return { start, end }
}
