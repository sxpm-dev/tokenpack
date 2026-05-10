import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  contentEncodingHeader,
  findRuntimeFixture,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  readRuntimeManifest,
  runtimeCaseId,
  runtimeFixturePath,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ENCODINGS = new Set(['raw', 'deflate', 'brotli'])

function defaultCaseId(
  manifest: NonNullable<ReturnType<typeof readRuntimeManifest>>,
): string | null {
  const first = manifest.fixtures.find(
    fixture => fixture.tab === 'content' && fixture.kind === 'native' && fixture.encoding === 'raw',
  )

  return first ? runtimeCaseId(first.source, first.chunkCount, first.chunkIndex ?? 0) : null
}

export async function GET(req: NextRequest) {
  const manifest = readRuntimeManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'runtime fixtures not found. Run `yarn benchmark`.' },
      { status: 404 },
    )
  }

  const source = param(req, 'source') ?? defaultCaseId(manifest)
  const chunkIndex = Number(param(req, 'chunk') ?? 0)
  const encoding = (param(req, 'encoding') ?? 'raw').toLowerCase() as 'raw' | 'deflate' | 'brotli'
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!source) {
    return NextResponse.json({ error: 'runtime manifest has no content cases' }, { status: 404 })
  }
  if (!ENCODINGS.has(encoding)) {
    return NextResponse.json({ error: `unsupported encoding: ${encoding}` }, { status: 400 })
  }

  const fixture = findRuntimeFixture(manifest, {
    tab: 'content',
    caseId: source,
    chunkIndex,
    kind: 'native',
    encoding,
  })

  if (!fixture) {
    return NextResponse.json(
      { error: `pre-generated content fixture not found: ${source} ${encoding}` },
      { status: 404 },
    )
  }

  const fixturePath = runtimeFixturePath(fixture)
  const body = fs.readFileSync(fixturePath)
  const contentEncoding = contentEncodingHeader(encoding)
  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type':
      fixture.sourceKind === 'json'
        ? 'application/json; charset=utf-8'
        : 'application/javascript; charset=utf-8',
    'content-length': String(body.length),
    'x-runtime-bench-mode': 'static',
    'x-runtime-bench-throttle': condition.name,
    'x-runtime-bench-source': source,
  }

  if (contentEncoding) headers['content-encoding'] = contentEncoding

  return new NextResponse(throttledBody(body, condition), { headers })
}
