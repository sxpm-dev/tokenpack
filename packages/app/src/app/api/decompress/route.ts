import { NextRequest, NextResponse } from 'next/server'
import { decompressRaw } from 'tokenpack/compressors'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('bytes') as File | null
    const compressor = form.get('compressor') as string | null
    const levelRaw = form.get('level') as string | null
    const uncompRaw = form.get('uncompressedLength') as string | null

    if (!file) return NextResponse.json({ error: 'bytes file is required' }, { status: 400 })
    if (!compressor) {
      return NextResponse.json({ error: 'compressor is required' }, { status: 400 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const decompressed = await decompressRaw(bytes, compressor, {
      level: levelRaw ? parseInt(levelRaw, 10) : 0,
      uncompressedLength: uncompRaw ? parseInt(uncompRaw, 10) : 0,
    })

    return NextResponse.json({
      bytes: Buffer.from(decompressed).toString('base64'),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
