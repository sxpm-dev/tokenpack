// Returns a benchmark script with optional Content-Encoding compression.
//
//   GET /api/runtime-benchmark/script?encoding=br        → static (pre-generated)
//   GET /api/runtime-benchmark/script?encoding=br&live=1 → encode on-the-fly
//
// Static is the realistic CDN-asset case (pre-generated server timestamp).
// Live regenerates per request so the embedded `tServer` reflects request time.

import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'
import zlib from 'zlib'

import { buildScript } from '../_script-builder'
import { networkConditionFor, NO_CACHE_HEADERS, param, throttledBody } from '../_shared'

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
  const encoding = (param(req, 'encoding') ?? 'raw').toLowerCase()
  const live = param(req, 'live') === '1'
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!ENCODINGS.has(encoding)) {
    return NextResponse.json({ error: `unsupported encoding: ${encoding}` }, { status: 400 })
  }

  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': 'application/javascript; charset=utf-8',
  }

  if (encoding !== 'raw') headers['content-encoding'] = encoding

  if (!live) {
    const fixturePath = path.join(RUNTIME_FIXTURES, `script${ENCODING_EXT[encoding]}`)

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

  // Live: regenerate with fresh timestamp per request.
  const source = buildScript(performance.now())
  const raw = Buffer.from(source, 'utf-8')
  let body: Buffer

  switch (encoding) {
    case 'raw':
      body = raw
      break
    case 'gzip':
      body = zlib.gzipSync(raw, { level: 6 })
      break
    case 'br':
      body = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } })
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
