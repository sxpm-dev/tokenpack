import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface ArchiveTimeEntry {
  source: string
  format: string
  encodeMs: number
  decodeMs: number
  bytes: number
  originalBytes: number
}

export async function GET() {
  const filePath = join(process.cwd(), '..', '..', 'benchmark', 'archive-times.json')
  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'No archive times found. Run: yarn tsx benchmark/generate.ts' },
      { status: 404 },
    )
  }
  const data: ArchiveTimeEntry[] = JSON.parse(readFileSync(filePath, 'utf-8'))
  return NextResponse.json(data)
}
