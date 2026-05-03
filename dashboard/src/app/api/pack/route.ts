import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import AdmZip from 'adm-zip'

const CODEART_ROOT = join(process.cwd(), '..')

function runTokenpack(args: string[]): void {
  execFileSync('yarn', ['tokenpack', ...args], {
    cwd: CODEART_ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 100 * 1024 * 1024,
  })
}

export async function POST(req: NextRequest) {
  const form     = await req.formData()
  const file     = form.get('file')    as File   | null
  const unzip    = form.get('unzip')   === 'true'
  const preset   = form.get('preset') as string | null
  const algo     = form.get('algo')   as string | null
  const compress = form.get('compress') === 'true'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const id      = randomUUID()
  const tmpDir  = join(tmpdir(), `tp-pack-${id}`)
  const outPath = join(tmpdir(), `tp-out-${id}.png`)

  try {
    mkdirSync(tmpDir, { recursive: true })
    const bytes = Buffer.from(await file.arrayBuffer())

    if (unzip && (file.name.endsWith('.zip') || file.type === 'application/zip')) {
      const zip = new AdmZip(bytes)
      zip.extractAllTo(tmpDir, true)
    } else {
      writeFileSync(join(tmpDir, file.name), bytes)
    }

    const args = ['pack', tmpDir, '-o', outPath]
    if (preset && preset !== 'none') {
      args.push('--preset', preset)
    } else {
      if (algo) args.push('--algo', algo)
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
    try { rmSync(tmpDir, { recursive: true }) } catch {}
    try { unlinkSync(outPath) } catch {}
  }
}
