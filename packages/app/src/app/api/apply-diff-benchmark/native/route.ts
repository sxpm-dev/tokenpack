import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  contentEncodingHeader,
  networkConditionFor,
  NO_CACHE_HEADERS,
  throttledBody,
} from '../../runtime-benchmark/_shared'
import {
  type ApplyDiffEncoding,
  applyDiffFixturePath,
  findCase,
  findNativeFixture,
  readApplyDiffManifest,
  readParam,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ENCODINGS = new Set(['raw', 'deflate', 'brotli'])

export async function GET(req: NextRequest) {
  const manifest = readApplyDiffManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'apply-diff fixtures not found. Run `yarn benchmark`.' },
      { status: 404 },
    )
  }

  const item = findCase(manifest, readParam(req, 'case'))
  const encoding = (readParam(req, 'encoding') ?? 'raw') as ApplyDiffEncoding
  const condition = networkConditionFor(readParam(req, 'throttle'))

  if (!item)
    return NextResponse.json({ error: 'apply-diff manifest has no cases' }, { status: 404 })
  if (!ENCODINGS.has(encoding)) {
    return NextResponse.json({ error: `unsupported encoding: ${encoding}` }, { status: 400 })
  }

  const fixture = findNativeFixture(item, encoding)

  if (!fixture) {
    return NextResponse.json(
      { error: `native fixture not found: ${item.id} ${encoding}` },
      { status: 404 },
    )
  }

  const body = fs.readFileSync(applyDiffFixturePath(fixture.file))
  const contentEncoding = contentEncodingHeader(encoding)
  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': 'application/javascript; charset=utf-8',
    'content-length': String(body.length),
    'x-apply-diff-bench-case': item.id,
    'x-apply-diff-bench-mode': `native-${encoding}`,
    'x-runtime-bench-throttle': condition.name,
  }

  if (contentEncoding) headers['content-encoding'] = contentEncoding

  return new NextResponse(throttledBody(body, condition), { headers })
}
