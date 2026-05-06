// Side-effect import: registers Node compressors + surfaces with core.
import '@tokenpack/node'

import AdmZip from 'adm-zip'
import { randomUUID } from 'crypto'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { tmpdir } from 'os'
import { join } from 'path'
import { packDirs } from 'tokenpack/archive'
import { encodeToBuffer } from 'tokenpack/encoder'
import type { Style } from 'tokenpack/types'
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'zlib'

function parseStyle(value: FormDataEntryValue | null): Partial<Style> | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined

  return JSON.parse(value) as Partial<Style>
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const unzip = form.get('unzip') === 'true'
  const preset = form.get('preset') as string | null
  const algo = form.get('algo') as string | null
  const compress = form.has('compress') ? form.get('compress') === 'true' : undefined
  const compressionMode = form.get('compressionMode') as string | null
  const cellSize = form.get('cellSize') as string | null
  const key = form.get('key') as string | null
  const channels = parseInt((form.get('channels') as string) || '3', 10) as 1 | 2 | 3 | 4
  const format = form.get('format') as string | null as 'png' | 'avif' | 'webp' | null
  const streaming = form.get('streaming') === 'true'
  const style = parseStyle(form.get('style'))

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
    let resolvedCellSize: number | undefined
    let resolvedCompress = compress
    let resolvedCompressionMode: string | undefined = compressionMode ?? undefined

    if (preset && preset !== 'none') {
      resolvedAlgo = preset
    } else if (algo) {
      resolvedAlgo = algo
      resolvedCellSize = cellSize ? parseInt(cellSize, 10) : 1
    } else {
      resolvedCellSize = 1
    }

    const archive = packDirs([tmpDir], [], tmpDir)
    const buffers = await encodeToBuffer(archive, {
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
  } finally {
    try {
      rmSync(tmpDir, { recursive: true })
    } catch {}
  }
}
