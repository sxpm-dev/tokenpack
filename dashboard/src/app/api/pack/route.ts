import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'zlib'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import AdmZip from 'adm-zip'
import '@tp/codecs/register-all'
import { encodeToBuffer } from '@tp/encoder'
import { packDirs } from '@tp/archive'
import { getPreset } from '@tp/presets'
import type { Style } from '@tp/types'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const unzip = form.get('unzip') === 'true'
  const preset = form.get('preset') as string | null
  const algo = form.get('algo') as string | null
  const compress = form.get('compress') === 'true'
  const compressionMode = form.get('compressionMode') as string | null
  const key = form.get('key') as string | null
  const channels = parseInt(form.get('channels') as string || '3', 10) as 1 | 2 | 3 | 4
  const format = (form.get('format') as string | null) as 'png' | 'avif' | 'webp' | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const id = randomUUID()
  const tmpDir = join(tmpdir(), `tp-pack-${id}`)

  try {
    mkdirSync(tmpDir, { recursive: true })
    const bytes = Buffer.from(await file.arrayBuffer())

    const gzipSize = gzipSync(bytes, { level: 6 }).length
    const brotliSize = brotliCompressSync(bytes, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    }).length

    if (unzip && (file.name.endsWith('.zip') || file.type === 'application/zip')) {
      const zip = new AdmZip(bytes)
      zip.extractAllTo(tmpDir, true)
    } else {
      writeFileSync(join(tmpDir, file.name), bytes)
    }

    let resolvedAlgo = 'linear'
    let resolvedCellSize: number = 1
    let resolvedCompress = compress
    let resolvedCompressionMode: string | undefined = compressionMode ?? undefined
    let style: Partial<Style> | undefined

    if (preset && preset !== 'none') {
      const p = getPreset(preset)
      if (p) {
        resolvedAlgo = p.algo ?? 'linear'
        resolvedCellSize = p.cellSize
        resolvedCompress = compress || (p.compress ?? true)
        style = p.style
      }
    } else if (algo) {
      resolvedAlgo = algo
    }

    const archive = packDirs([tmpDir], [], tmpDir)
    const buffers = await encodeToBuffer(archive, {
      algo: resolvedAlgo,
      compress: resolvedCompress,
      compressionMode: resolvedCompressionMode,
      cellSize: resolvedCellSize,
      key: key ?? undefined,
      style,
      channels,
      format: format ?? 'png',
    })

    return NextResponse.json({
      token: buffers[0].toString('base64'),
      gzipSize,
      brotliSize,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    try {
      rmSync(tmpDir, { recursive: true })
    } catch {}
  }
}
