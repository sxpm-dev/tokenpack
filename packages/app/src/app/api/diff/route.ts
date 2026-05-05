import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import 'tokenpack/algorithms/register-all'
import { diffTokens, diffText, type FileDiff } from 'tokenpack/diff'

function formatTextDiff(fileDiffs: FileDiff[]): string {
  if (!fileDiffs.length) return 'No differences found.'
  const lines: string[] = []
  for (const fd of fileDiffs) {
    lines.push(`\n${'━'.repeat(60)}`)
    lines.push(`  ${fd.filePath}  (+${fd.added} -${fd.removed})`)
    lines.push('━'.repeat(60))
    for (const hunk of fd.hunks) {
      lines.push(`  @@ line ${hunk.lineA} @@`)
      for (const line of hunk.lines) {
        const prefix = line.type === '+' ? '+ ' : line.type === '-' ? '- ' : '  '
        lines.push(`  ${prefix}${line.text}`)
      }
    }
  }
  const totalAdded = fileDiffs.reduce((s, f) => s + f.added, 0)
  const totalRemoved = fileDiffs.reduce((s, f) => s + f.removed, 0)
  lines.push(`\n${fileDiffs.length} file(s) changed  +${totalAdded} -${totalRemoved} lines`)
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const fileA = form.get('tokenA') as File | null
  const fileB = form.get('tokenB') as File | null
  const mode = (form.get('mode') as string | null) ?? 'image'

  if (!fileA || !fileB) return NextResponse.json({ error: 'Two tokens required' }, { status: 400 })

  const id = randomUUID()
  const extA = '.' + (fileA.name.split('.').pop()?.toLowerCase() || 'png')
  const extB = '.' + (fileB.name.split('.').pop()?.toLowerCase() || 'png')
  const pathA = join(tmpdir(), `tp-da-${id}${extA}`)
  const pathB = join(tmpdir(), `tp-db-${id}${extB}`)
  const pathO = join(tmpdir(), `tp-do-${id}.png`)

  try {
    writeFileSync(pathA, Buffer.from(await fileA.arrayBuffer()))
    writeFileSync(pathB, Buffer.from(await fileB.arrayBuffer()))

    if (mode === 'text') {
      const fileDiffs = await diffText(pathA, pathB)
      return NextResponse.json({ type: 'text', content: formatTextDiff(fileDiffs) })
    }

    await diffTokens(pathA, pathB, pathO)
    const png = readFileSync(pathO)
    return new NextResponse(png, { headers: { 'Content-Type': 'image/png' } })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    for (const p of [pathA, pathB, pathO]) {
      try { unlinkSync(p) } catch {}
    }
  }
}
