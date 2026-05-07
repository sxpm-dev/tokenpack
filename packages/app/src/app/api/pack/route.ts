import { encode, PackBuilder } from '@tokenpack/node'
import { NextRequest, NextResponse } from 'next/server'
import type { Style } from 'tokenpack/types'
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'zlib'

function parseStyle(value: FormDataEntryValue | null): Partial<Style> | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined

  return JSON.parse(value) as Partial<Style>
}

interface ResolvedOptions {
  algo: string
  compressionMode?: string
  cellSize?: number
  channels?: 1 | 2 | 3 | 4
  format?: 'png' | 'webp' | 'avif'
  streaming?: boolean
  fecMode?: string
  style?: Partial<Style>
  key?: string
}

function resolveOptions(form: FormData): ResolvedOptions {
  const preset = form.get('preset') as string | null
  const algo = (form.get('algo') as string | null) ?? 'linear'
  const compressionMode = (form.get('compressionMode') as string | null) ?? undefined
  const cellSizeRaw = form.get('cellSize') as string | null
  const channelsRaw = form.get('channels') as string | null
  const format = form.get('format') as 'png' | 'webp' | 'avif' | null
  const streaming = form.get('streaming') === 'true'
  const fecMode = (form.get('fecMode') as string | null) ?? undefined
  const style = parseStyle(form.get('style'))
  const key = (form.get('key') as string | null) ?? undefined

  if (preset && preset !== 'none') {
    return { algo: preset, compressionMode, key }
  }

  return {
    algo,
    compressionMode,
    cellSize: cellSizeRaw ? parseInt(cellSizeRaw, 10) : 1,
    channels: channelsRaw ? (parseInt(channelsRaw, 10) as 1 | 2 | 3 | 4) : 3,
    format: format ?? 'png',
    streaming,
    fecMode,
    style,
    key,
  }
}

async function readEntries(
  form: FormData,
): Promise<{ builder: PackBuilder; concatenated: Buffer; inputBytes: number }> {
  const builder = new PackBuilder()
  const parts: Buffer[] = []
  let inputBytes = 0
  let i = 0

  while (true) {
    const path = form.get(`entry.${i}.path`)

    if (typeof path !== 'string') break

    const textValue = form.get(`entry.${i}.text`)
    const fileValue = form.get(`entry.${i}.file`)

    if (typeof textValue === 'string') {
      builder.withFile(path, textValue)
      const buf = Buffer.from(textValue, 'utf8')

      parts.push(buf)
      inputBytes += buf.length
    } else if (fileValue instanceof File) {
      const buf = Buffer.from(await fileValue.arrayBuffer())

      builder.withBuffer(path, new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))
      parts.push(buf)
      inputBytes += buf.length
    } else {
      throw new Error(`entry ${i} (${path}) has no text or file payload`)
    }
    i++
  }
  if (i === 0) throw new Error('no entries provided')

  return { builder, concatenated: Buffer.concat(parts), inputBytes }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const { builder, concatenated, inputBytes } = await readEntries(form)
    const opts = resolveOptions(form)
    const tokenBuf = await encode(builder, opts)

    const gzipSize = gzipSync(concatenated, { level: 6 }).length
    const brotliSize = brotliCompressSync(concatenated, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    }).length

    return NextResponse.json({
      token: tokenBuf.toString('base64'),
      gzipSize,
      brotliSize,
      inputBytes,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
