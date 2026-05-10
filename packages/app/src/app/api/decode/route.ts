import '@tokenpack/node'

import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('token') as File | null
  const key = form.get('key') as string | null

  if (!file) return NextResponse.json({ error: 'No token provided' }, { status: 400 })

  try {
    const imgBuf = Buffer.from(await file.arrayBuffer())
    const ext = file.name ? '.' + (file.name.split('.').pop()?.toLowerCase() ?? 'png') : '.png'
    const Ctor = await algorithmCatalog.detectFromBuffer(imgBuf, ext)
    const algo = new Ctor({ key: key ?? undefined })
    const decoded = await algo.decode(imgBuf, { key: key ?? undefined, ext })

    return NextResponse.json({
      bytes: decoded.toString('base64'),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
