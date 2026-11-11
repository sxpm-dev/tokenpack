import { NextRequest, NextResponse } from 'next/server'

import { ensureRootPack, parseTokenAlgo } from '../_shared'
export async function POST(request: NextRequest) {
  const meta = await ensureRootPack(
    'lazy',
    parseTokenAlgo(request.nextUrl.searchParams.get('algo')),
  )

  return NextResponse.json({ ready: true, bytes: meta.tokenBytes })
}
