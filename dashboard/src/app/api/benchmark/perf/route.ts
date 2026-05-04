import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import '@tp/codecs/register-all'
import { encodeToBuffer } from '@tp/encoder'
import { decodeFromBuffer } from '@tp/decoder'

const SOURCES_DIR = join(process.cwd(), '..', 'test-tokens', 'sources')

const SOURCE_FILES: Record<string, string> = {
  'react-dom-dev':  'react-dom-client.development.js',
  'react-dom-prod': 'react-dom-client.production.js',
  'screenshot':     'screenshot.jpg',
}

export async function POST(req: NextRequest) {
  const { source, algo, compressionMode, format, channels, streaming } = await req.json() as {
    source: string
    algo: string
    compressionMode: string
    format: string
    channels: number
    streaming?: boolean
  }

  const fileName = SOURCE_FILES[source]
  if (!fileName) return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 })

  const sourceBuf = readFileSync(join(SOURCES_DIR, fileName))
  const compress = compressionMode !== 'none'

  try {
    const t0 = performance.now()
    const tokens = await encodeToBuffer(sourceBuf, {
      algo,
      compress,
      compressionMode: compress ? compressionMode : undefined,
      channels: channels as 1 | 2 | 3 | 4,
      format: format as 'png' | 'webp' | 'avif',
      streaming,
    })
    const encodeMs = Math.round((performance.now() - t0) * 10) / 10
    const tokenBytes = tokens.reduce((s, b) => s + b.length, 0)

    const t1 = performance.now()
    await decodeFromBuffer(tokens[0], undefined, '.' + format)
    const decodeMs = Math.round((performance.now() - t1) * 10) / 10

    return NextResponse.json({ encodeMs, decodeMs, tokenBytes, originalBytes: sourceBuf.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
