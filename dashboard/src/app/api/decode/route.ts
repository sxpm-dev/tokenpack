import { NextRequest, NextResponse } from 'next/server'
import '@tp/codecs/register-all'
import { decodeFromBuffer } from '@tp/decoder'

export interface FileEntry {
  path: string
  size: number
  content: string
  isBinary: boolean
}

function parseCart(data: Buffer): FileEntry[] {
  const entries: FileEntry[] = []
  const fileCount = data.readUInt32BE(4)
  let offset = 8
  for (let i = 0; i < fileCount; i++) {
    const pathLen = data.readUInt16BE(offset)
    offset += 2
    const filePath = data.slice(offset, offset + pathLen).toString('utf8')
    offset += pathLen
    const contentLen = data.readUInt32BE(offset)
    offset += 4
    const content = data.slice(offset, offset + contentLen)
    offset += contentLen
    const isBinary = content.some(b => b === 0 || (b < 9 && b !== 0))
    entries.push({
      path: filePath,
      size: contentLen,
      content: isBinary ? `[binary: ${contentLen} bytes]` : content.toString('utf8'),
      isBinary,
    })
  }
  return entries
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('token') as File | null
  const key = form.get('key') as string | null
  if (!file) return NextResponse.json({ error: 'No token provided' }, { status: 400 })

  try {
    const imgBuf = Buffer.from(await file.arrayBuffer())
    // Detect file extension for format-aware decoding
    const ext = file.name ? ('.' + file.name.split('.').pop()?.toLowerCase()) : '.png'
    const decoded = await decodeFromBuffer(imgBuf, key ?? undefined, ext)
    const magic = decoded.slice(0, 4).toString('ascii')

    if (magic === 'CART') {
      const files = parseCart(decoded)
      return NextResponse.json({ type: 'filesystem', files })
    }

    const isBinary = decoded.some(b => b === 0)
    if (isBinary) {
      return NextResponse.json({ type: 'binary', size: decoded.length })
    }

    return NextResponse.json({ type: 'text', content: decoded.toString('utf8') })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
