import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const filePath = join(process.cwd(), '..', 'benchmark', 'results.json')
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'No results found. Run: yarn tsx benchmark/run.ts' }, { status: 404 })
  }
  const data = JSON.parse(readFileSync(filePath, 'utf-8'))
  return NextResponse.json(data)
}
