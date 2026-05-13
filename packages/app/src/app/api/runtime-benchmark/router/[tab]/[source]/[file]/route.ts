import { closeSync, openSync, readSync, statSync } from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  findRuntimeRouterFixture,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  readRuntimeManifest,
  runtimeFixturePath,
  throttledBody,
} from '../../../../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteContext {
  params: Promise<{ tab: string; source: string; file: string }>
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const manifest = readRuntimeManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'runtime fixtures not found. Run `yarn benchmark:runtime`.' },
      { status: 404 },
    )
  }

  const { tab: rawTab, source, file } = await ctx.params
  const tab = rawTab === 'script' ? 'script' : rawTab === 'content' ? 'content' : null

  if (!tab) return NextResponse.json({ error: `invalid router tab: ${rawTab}` }, { status: 400 })
  if (file.includes('/') || file.includes('..')) {
    return NextResponse.json({ error: 'invalid router fixture file' }, { status: 400 })
  }

  const fixture = findRuntimeRouterFixture(manifest, source, tab)

  if (!fixture) {
    return NextResponse.json(
      { error: `pre-generated router fixture not found: ${tab}/${source}` },
      { status: 404 },
    )
  }

  const selected =
    file === 'router.png'
      ? { file: fixture.file }
      : fixture.chunks?.find(chunk => chunk.href === file)

  if (!selected) {
    return NextResponse.json(
      { error: `router fixture file not found: ${tab}/${source}/${file}` },
      { status: 404 },
    )
  }

  const fixturePath = runtimeFixturePath({ ...fixture, file: selected.file })
  const totalBytes = statSync(fixturePath).size
  const range = parseRange(req.headers.get('range'), totalBytes)
  const condition = networkConditionFor(param(req, 'throttle'))
  const contentType = file.endsWith('.png') ? 'image/png' : 'application/octet-stream'

  if (!range) {
    const body = readFileSlice(fixturePath, 0, totalBytes - 1)

    return new NextResponse(throttledBody(body, condition), {
      headers: {
        ...NO_CACHE_HEADERS,
        'accept-ranges': 'bytes',
        'content-type': contentType,
        'content-length': String(totalBytes),
        'x-runtime-bench-mode': 'router-token',
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
      'content-type': contentType,
      'content-length': String(chunk.length),
      'content-range': `bytes ${range.start}-${range.end}/${totalBytes}`,
      'x-runtime-bench-mode': 'router-token',
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
