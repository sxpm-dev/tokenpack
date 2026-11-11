import '@tokenpack/node'

import { PackBuilder } from '@tokenpack/node'
import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { NextRequest, NextResponse } from 'next/server'
import { compressRaw } from 'tokenpack/compressors'
import { encodePack } from 'tokenpack/pack-format/encode-pack'
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'zlib'

interface ResolvedOptions {
  algo: string
  algoOptions: Record<string, unknown>
  key?: string
}

function nestAlgoOptions(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(flat)) {
    const dotIdx = key.indexOf('.')

    if (dotIdx === -1) {
      out[key] = value
      continue
    }
    const ns = key.slice(0, dotIdx)
    const sub = key.slice(dotIdx + 1)

    out[ns] ??= {}
    ;(out[ns] as Record<string, unknown>)[sub] = value
  }

  return out
}

function resolveOptions(form: FormData): ResolvedOptions {
  const algo = (form.get('algo') as string | null) ?? defaultAlgoName()
  const key = (form.get('key') as string | null) ?? undefined
  const algoOptionsRaw = form.get('algoOptions') as string | null
  const flat: Record<string, unknown> = algoOptionsRaw ? JSON.parse(algoOptionsRaw) : {}

  return { algo, algoOptions: nestAlgoOptions(flat), key }
}

function defaultAlgoName(): string {
  const [Ctor] = algorithmCatalog.list()

  if (!Ctor) throw new Error('no algorithms registered in node catalog')

  return Ctor.name
}

function surfaceMeta(Ctor: ReturnType<typeof algorithmCatalog.getByName>): {
  extension: string
  mime: string
} {
  const surface = new (Ctor.Surface as unknown as new () => {
    extension: string
    mimeType: string
  })()

  return { extension: surface.extension, mime: surface.mimeType }
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
    }
    i++
  }

  return { builder, concatenated: Buffer.concat(parts), inputBytes }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const { builder, concatenated, inputBytes } = await readEntries(form)
    const opts = resolveOptions(form)

    // 1. Pack entries via per-file brotli compression (the pack-format flow).
    const entries = await builder.build()
    const packBytes = await encodePack(entries, async bytes => {
      const r = await compressRaw(bytes, 'brotli-11')

      return {
        bytes: r.bytes,
        compressor: r.compressor,
        level: r.level,
        originalSize: r.originalSize,
      }
    })

    // 2. Run through the algorithm — pure dispatch + delegate.
    const Ctor = algorithmCatalog.getByName(opts.algo)
    const surface = surfaceMeta(Ctor)
    const algoInit = { ...opts.algoOptions, key: opts.key }
    const algorithm = new Ctor(algoInit)
    const tokenBuf = Buffer.from(await algorithm.encode(packBytes, algoInit))

    const gzipSize = gzipSync(concatenated, { level: 6 }).length
    const brotliSize = brotliCompressSync(concatenated, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    }).length

    return NextResponse.json({
      token: tokenBuf.toString('base64'),
      gzipSize,
      brotliSize,
      inputBytes,
      algo: Ctor.name,
      mime: surface.mime,
      extension: surface.extension,
      fileName: `pack${surface.extension}`,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
