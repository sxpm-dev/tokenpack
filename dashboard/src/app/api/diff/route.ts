import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const CODEART_ROOT = join(process.cwd(), '..')

function runTokenpack(args: string[]): Buffer {
  return execFileSync('yarn', ['tokenpack', ...args], {
    cwd: CODEART_ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 100 * 1024 * 1024,
  })
}

export async function POST(req: NextRequest) {
  const form  = await req.formData()
  const fileA = form.get('tokenA') as File | null
  const fileB = form.get('tokenB') as File | null
  const mode  = (form.get('mode') as string | null) ?? 'image'

  if (!fileA || !fileB) return NextResponse.json({ error: 'Two tokens required' }, { status: 400 })

  const id    = randomUUID()
  const pathA = join(tmpdir(), `tp-da-${id}.png`)
  const pathB = join(tmpdir(), `tp-db-${id}.png`)
  const pathO = join(tmpdir(), `tp-do-${id}.png`)

  try {
    writeFileSync(pathA, Buffer.from(await fileA.arrayBuffer()))
    writeFileSync(pathB, Buffer.from(await fileB.arrayBuffer()))

    if (mode === 'text') {
      const out = runTokenpack(['diff', pathA, pathB, '--text'])
      return NextResponse.json({ type: 'text', content: out.toString('utf8') })
    }

    runTokenpack(['diff', pathA, pathB, '-o', pathO])
    const png = readFileSync(pathO)
    return new NextResponse(png, {
      headers: { 'Content-Type': 'image/png' },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    try { unlinkSync(pathA) } catch {}
    try { unlinkSync(pathB) } catch {}
    try { unlinkSync(pathO) } catch {}
  }
}
