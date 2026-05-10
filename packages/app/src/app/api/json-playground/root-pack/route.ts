import { closeSync, openSync, readSync, statSync } from 'node:fs'

import { type NextRequest, NextResponse } from 'next/server'

import {
  ensureRootPack,
  JsonPlaygroundFixtureError,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  parsePackMode,
  rootPackPath,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    await ensureRootPack(parsePackMode(param(req, 'mode')))
  } catch (error) {
    if (!(error instanceof JsonPlaygroundFixtureError)) throw error

    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  const fixturePath = rootPackPath()
  const totalBytes = statSync(fixturePath).size
  const range = parseRange(req.headers.get('range'), totalBytes)
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!range) {
    const body = readFileSlice(fixturePath, 0, totalBytes - 1)

    return new NextResponse(throttledBody(body, condition), {
      headers: {
        ...NO_CACHE_HEADERS,
        'accept-ranges': 'bytes',
        'content-length': String(totalBytes),
        'content-type': 'image/png',
        'x-json-playground-mode': 'root-pack',
        'x-json-playground-throttle': condition.name,
      },
    })
  }

  const chunk = readFileSlice(fixturePath, range.start, range.end)

  return new NextResponse(throttledBody(chunk, condition), {
    status: 206,
    headers: {
      ...NO_CACHE_HEADERS,
      'accept-ranges': 'bytes',
      'content-length': String(chunk.length),
      'content-range': `bytes ${range.start}-${range.end}/${totalBytes}`,
      'content-type': 'image/png',
      'x-json-playground-mode': 'root-pack',
      'x-json-playground-throttle': condition.name,
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
