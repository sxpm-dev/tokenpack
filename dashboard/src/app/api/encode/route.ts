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

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const text     = form.get('text')     as string | null
  const file     = form.get('file')     as File   | null
  const preset   = form.get('preset')  as string | null
  const algo     = form.get('algo')    as string | null
  const compress = form.get('compress') === 'true'
  const cellSize = form.get('cellSize') as string | null

  const id      = randomUUID()
  const inPath  = join(tmpdir(), `tp-in-${id}`)
  const outPath = join(tmpdir(), `tp-out-${id}.png`)

  try {
    if (text) {
      writeFileSync(inPath, text, 'utf8')
    } else if (file) {
      writeFileSync(inPath, Buffer.from(await file.arrayBuffer()))
    } else {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 })
    }

    const args = ['encode', inPath, '-o', outPath]
    if (preset && preset !== 'none') {
      args.push('--preset', preset)
    } else {
      if (algo) args.push('--algo', algo)
      if (cellSize) args.push('--cell-size', cellSize)
    }
    if (compress) args.push('--compress')

    runTokenpack(args)

    const png = readFileSync(outPath)
    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="token.png"',
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    try { unlinkSync(inPath)  } catch {}
    try { unlinkSync(outPath) } catch {}
  }
}
