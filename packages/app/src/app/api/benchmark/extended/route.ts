import { existsSync, readFileSync } from 'fs'
import { NextResponse } from 'next/server'
import { join } from 'path'

export type { ExtBenchRow } from '@/lib/bench-types'

export async function GET() {
  const filePath = join(process.cwd(), 'benchmark-results', 'results-extended.json')

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'No results found. Run: yarn benchmark:run:extended' },
      { status: 404 },
    )
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8'))

  return NextResponse.json(data)
}
