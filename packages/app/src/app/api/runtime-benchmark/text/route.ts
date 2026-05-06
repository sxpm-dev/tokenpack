// Returns a benchmark source file with optional Content-Encoding compression.
// Browser auto-decodes gzip / br / deflate during transfer (network stack).
//
//   GET /api/runtime-benchmark/text?source=react-dom-dev&encoding=br        → static (pre-generated)
//   GET /api/runtime-benchmark/text?source=react-dom-dev&encoding=br&live=1 → encode on-the-fly
//
// Static is the realistic production case (CDN serving pre-compressed assets).
// Live is for comparing the per-request CPU cost.

import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'
import zlib from 'zlib'

import {
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  SOURCE_MIMES,
  sourcePathFor,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RUNTIME_FIXTURES = path.join(process.cwd(), 'runtime-fixtures')

const ENCODINGS = new Set(['raw', 'gzip', 'br', 'deflate'])

const ENCODING_EXT: Record<string, string> = {
  raw: '.raw',
  gzip: '.gz',
  br: '.br',
  deflate: '.deflate',
}

export async function GET(req: NextRequest) {
  const source = param(req, 'source') ?? 'react-dom-dev'
  const encoding = (param(req, 'encoding') ?? 'raw').toLowerCase()
  const live = param(req, 'live') === '1'
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!ENCODINGS.has(encoding)) {
    return NextResponse.json({ error: `unsupported encoding: ${encoding}` }, { status: 400 })
  }

  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': SOURCE_MIMES[source] ?? 'application/octet-stream',
  }

  if (encoding !== 'raw') {
    headers['content-encoding'] = encoding
  }

  // ── Static path: serve pre-generated fixture from packages/app/runtime-fixtures/
  if (!live) {
    const fixturePath = path.join(RUNTIME_FIXTURES, `${source}${ENCODING_EXT[encoding]}`)

    if (!fs.existsSync(fixturePath)) {
      return NextResponse.json(
        {
          error: `pre-generated fixture not found: ${fixturePath}. Run \`yarn benchmark:generate:runtime\``,
        },
        { status: 404 },
      )
    }

    const body = fs.readFileSync(fixturePath)

    headers['content-length'] = String(body.length)
    headers['x-runtime-bench-mode'] = 'static'
    headers['x-runtime-bench-throttle'] = condition.name

    return new NextResponse(throttledBody(body, condition), { headers })
  }

  // ── Live path: encode on-the-fly per request
  const info = sourcePathFor(source)

  if (!info) {
    return NextResponse.json({ error: `unknown source: ${source}` }, { status: 404 })
  }

  const raw = fs.readFileSync(info.path)
  let body: Buffer

  switch (encoding) {
    case 'raw':
      body = raw
      break
    case 'gzip':
      body = zlib.gzipSync(raw, { level: 6 })
      break
    case 'br':
      body = zlib.brotliCompressSync(raw, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      })
      break
    case 'deflate':
      body = zlib.deflateSync(raw, { level: 6 })
      break
    default:
      throw new Error('unreachable')
  }

  headers['content-length'] = String(body.length)
  headers['x-runtime-bench-mode'] = 'live'
  headers['x-runtime-bench-throttle'] = condition.name

  return new NextResponse(throttledBody(body, condition), { headers })
}
