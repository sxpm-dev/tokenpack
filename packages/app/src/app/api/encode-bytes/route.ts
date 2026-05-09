// Wrap raw payload bytes in a TokenPack image. Used by the diff flow to avoid
// the browser canvas roundtrip that breaks compact-header tokens (small inputs)
// — Node's pngjs surface preserves pixel bytes deterministically.

import { encode } from '@tokenpack/node'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('bytes') as File | null

    if (!file) return NextResponse.json({ error: 'bytes file required' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const algo = (form.get('algo') as string | null) ?? 'linear-none'
    const channelsRaw = (form.get('channels') as string | null) ?? '3'
    const channels = parseInt(channelsRaw, 10) as 1 | 2 | 3 | 4

    const tokenBuf = await encode(buf, {
      algo,
      algoOptions: { surface: { channels } },
    })

    return NextResponse.json({ token: tokenBuf.toString('base64') })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
