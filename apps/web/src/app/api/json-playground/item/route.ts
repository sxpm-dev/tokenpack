import { type NextRequest, NextResponse } from 'next/server'

import {
  encodedBody,
  getRecordById,
  networkConditionFor,
  param,
  parseEncoding,
  responseHeaders,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const id = param(req, 'id')

  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const record = getRecordById(id)

  if (!record) return NextResponse.json({ error: `record not found: ${id}` }, { status: 404 })

  const encoding = parseEncoding(param(req, 'encoding'))
  const condition = networkConditionFor(param(req, 'throttle'))
  const body = Buffer.from(JSON.stringify(record), 'utf-8')
  const encoded = encodedBody(body, encoding)

  return new NextResponse(throttledBody(encoded.body, condition), {
    headers: responseHeaders(
      encoded.body,
      encoding,
      'application/json; charset=utf-8',
      param(req, 'throttle'),
    ),
  })
}
