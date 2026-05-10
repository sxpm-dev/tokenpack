import { closeSync, openSync, readSync, statSync } from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  findRuntimeRangePackFixture,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  readRuntimeManifest,
  runtimeFixturePath,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function defaultSource(
  manifest: NonNullable<ReturnType<typeof readRuntimeManifest>>,
  tab: 'content' | 'script',
): string | null {
  const first = manifest.fixtures.find(
    fixture => fixture.kind === 'range-pack' && fixture.tab === tab,
  )

  return first ? `${first.source}__chunks-${first.chunkCount}` : null
}

export async function GET(req: NextRequest) {
  const manifest = readRuntimeManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'runtime fixtures not found. Run `yarn benchmark`.' },
      { status: 404 },
    )
  }

  const tab = param(req, 'tab') === 'script' ? 'script' : 'content'
  const source = param(req, 'source') ?? defaultSource(manifest, tab)
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!source) {
    return NextResponse.json({ error: 'runtime manifest has no range-pack cases' }, { status: 404 })
  }

  const fixture = findRuntimeRangePackFixture(manifest, source, tab)

  if (!fixture) {
    return NextResponse.json(
      { error: `pre-generated range-pack fixture not found: ${source}` },
      { status: 404 },
    )
  }

  const fixturePath = runtimeFixturePath(fixture)
  const totalBytes = statSync(fixturePath).size
  const range = parseRange(req.headers.get('range'), totalBytes)

  if (!range) {
    const body = readFileSlice(fixturePath, 0, totalBytes - 1)

    return new NextResponse(throttledBody(body, condition), {
      headers: {
        ...NO_CACHE_HEADERS,
        'accept-ranges': 'bytes',
        'content-type': 'image/png',
        'content-length': String(totalBytes),
        'x-runtime-bench-mode': 'range-pack',
        'x-runtime-bench-throttle': condition.name,
        'x-runtime-bench-source': source,
      },
    })
  }

  const chunk = readFileSlice(fixturePath, range.start, range.end)

  return new NextResponse(throttledBody(chunk, condition), {
    status: 206,
    headers: {
      ...NO_CACHE_HEADERS,
      'accept-ranges': 'bytes',
      'content-type': 'image/png',
      'content-length': String(chunk.length),
      'content-range': `bytes ${range.start}-${range.end}/${totalBytes}`,
      'x-runtime-bench-mode': 'range-pack',
      'x-runtime-bench-throttle': condition.name,
      'x-runtime-bench-source': source,
    },
  })
}

function parseRange(
  header: string | null,
  totalBytes: number,
): { start: number; end: number } | null {
  if (!header) return null

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())

  if (!match) return null

  const [, rawStart, rawEnd] = match
  let start: number
  let end: number

  if (rawStart === '') {
    const suffixBytes = Number(rawEnd)

    if (!Number.isInteger(suffixBytes) || suffixBytes <= 0) return null
    start = Math.max(0, totalBytes - suffixBytes)
    end = totalBytes - 1
  } else {
    start = Number(rawStart)
    end = rawEnd === '' ? totalBytes - 1 : Number(rawEnd)
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= totalBytes
  ) {
    return null
  }

  return { start, end: Math.min(end, totalBytes - 1) }
}

function readFileSlice(filePath: string, start: number, end: number): Buffer {
  const length = end - start + 1
  const out = Buffer.allocUnsafe(length)
  const fd = openSync(filePath, 'r')

  try {
    const bytesRead = readSync(fd, out, 0, length, start)

    return bytesRead === length ? out : out.subarray(0, bytesRead)
  } finally {
    closeSync(fd)
  }
}
