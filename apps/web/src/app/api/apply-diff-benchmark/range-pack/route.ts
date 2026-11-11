import { closeSync, openSync, readSync, statSync } from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  networkConditionFor,
  NO_CACHE_HEADERS,
  throttledBody,
} from '../../runtime-benchmark/_shared'
import {
  applyDiffFixturePath,
  findCase,
  findTokenFixture,
  readApplyDiffManifest,
  readParam,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const manifest = readApplyDiffManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'apply-diff fixtures not found. Run `yarn benchmark`.' },
      { status: 404 },
    )
  }

  const item = findCase(manifest, readParam(req, 'case'))
  const tokenId = readParam(req, 'token')
  const condition = networkConditionFor(readParam(req, 'throttle'))

  if (!item)
    return NextResponse.json({ error: 'apply-diff manifest has no cases' }, { status: 404 })

  const fixture = findTokenFixture(item, tokenId)

  if (!fixture?.rangePackFile) {
    return NextResponse.json(
      { error: `range-pack fixture not found: ${item.id} ${tokenId ?? '(default)'}` },
      { status: 404 },
    )
  }

  const fixturePath = applyDiffFixturePath(fixture.rangePackFile)
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
        'x-apply-diff-bench-case': item.id,
        'x-apply-diff-bench-mode': 'range-pack',
        'x-apply-diff-bench-token': fixture.id,
        'x-runtime-bench-throttle': condition.name,
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
      'x-apply-diff-bench-case': item.id,
      'x-apply-diff-bench-mode': 'range-pack',
      'x-apply-diff-bench-token': fixture.id,
      'x-runtime-bench-throttle': condition.name,
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
