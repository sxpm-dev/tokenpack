import { NextRequest, NextResponse } from 'next/server'
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'zlib'
import 'tokenpack/algorithms/register-all'
import { encodeToBuffer } from 'tokenpack/encoder'
import type { Style } from 'tokenpack/types'

function parseStyle(value: FormDataEntryValue | null): Partial<Style> | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined
  return JSON.parse(value) as Partial<Style>
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const text = form.get('text') as string | null
  const file = form.get('file') as File | null
  const preset = form.get('preset') as string | null
  const algo = form.get('algo') as string | null
  const compress = form.has('compress') ? form.get('compress') === 'true' : undefined
  const compressionMode = form.get('compressionMode') as string | null
  const cellSize = form.get('cellSize') as string | null
  const key = form.get('key') as string | null
  const channels = parseInt(form.get('channels') as string || '3', 10) as 1 | 2 | 3 | 4
  const format = (form.get('format') as string | null) as 'png' | 'avif' | 'webp' | null
  const streaming = form.get('streaming') === 'true'
  const style = parseStyle(form.get('style'))

  let inputBuf: Buffer
  if (text) {
    inputBuf = Buffer.from(text, 'utf8')
  } else if (file) {
    inputBuf = Buffer.from(await file.arrayBuffer())
  } else {
    return NextResponse.json({ error: 'No input provided' }, { status: 400 })
  }

  const gzipSize = gzipSync(inputBuf, { level: 6 }).length
  const brotliSize = brotliCompressSync(inputBuf, {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
  }).length

  try {
    let resolvedAlgo = 'linear'
    let resolvedCellSize: number | undefined
    let resolvedCompress = compress
    let resolvedCompressionMode: string | undefined = compressionMode ?? undefined

    if (preset && preset !== 'none') {
      resolvedAlgo = preset
    } else {
      resolvedAlgo = algo ?? 'linear'
      resolvedCellSize = cellSize ? parseInt(cellSize, 10) : undefined
    }

    const buffers = await encodeToBuffer(inputBuf, {
      algo: resolvedAlgo,
      compress: resolvedCompress,
      compressionMode: resolvedCompressionMode,
      cellSize: resolvedCellSize,
      key: key ?? undefined,
      channels,
      format: format ?? 'png',
      streaming,
      style,
    })

    return NextResponse.json({
      token: buffers[0].toString('base64'),
      gzipSize,
      brotliSize,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
