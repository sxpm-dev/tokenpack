import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const CODEART_ROOT = join(process.cwd(), '..')

function runTokenpack(args: string[]): void {
  execFileSync('yarn', ['tokenpack', ...args], {
    cwd: CODEART_ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 100 * 1024 * 1024,
  })
}

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
    const pathLen    = data.readUInt16BE(offset); offset += 2
    const filePath   = data.slice(offset, offset + pathLen).toString('utf8'); offset += pathLen
    const contentLen = data.readUInt32BE(offset); offset += 4
    const content    = data.slice(offset, offset + contentLen); offset += contentLen
    const isBinary   = content.some(b => b === 0 || (b < 9 && b !== 0))
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
  if (!file) return NextResponse.json({ error: 'No token provided' }, { status: 400 })

  const id      = randomUUID()
  const inPath  = join(tmpdir(), `tp-tok-${id}.png`)
  const outPath = join(tmpdir(), `tp-dec-${id}`)

  try {
    writeFileSync(inPath, Buffer.from(await file.arrayBuffer()))
    runTokenpack(['decode', inPath, '-o', outPath])

    const decoded = readFileSync(outPath)
    const magic   = decoded.slice(0, 4).toString('ascii')

    if (magic === 'CART') {
      const files = parseCart(decoded)
      return NextResponse.json({ type: 'filesystem', files })
    }

    // Detect if binary
    const isBinary = decoded.some(b => b === 0)
    if (isBinary) {
      return NextResponse.json({ type: 'binary', size: decoded.length })
    }

    return NextResponse.json({ type: 'text', content: decoded.toString('utf8') })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    try { unlinkSync(inPath)  } catch {}
    try { unlinkSync(outPath) } catch {}
  }
}
