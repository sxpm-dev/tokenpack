import { existsSync, readFileSync } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

import type { ExtBenchRow } from '@/lib/bench-types'

export type { ExtBenchRow } from '@/lib/bench-types'

/** Encode + decode median threshold for the default page view. Algorithms
 *  whose encode OR decode exceeds this are filtered out by default — keeps
 *  the table focused on candidates worth picking. Pass `?all=1` to include. */
const FAST_THRESHOLD_MS = 400

export async function GET(req: NextRequest) {
  const filePath = join(process.cwd(), 'benchmark-results', 'results-extended.json')

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'No results found. Run: yarn benchmark:run:extended' },
      { status: 404 },
    )
  }

  const all = JSON.parse(readFileSync(filePath, 'utf-8')) as ExtBenchRow[]
  const showAll = req.nextUrl.searchParams.get('all') === '1'

  const visible = showAll
    ? all
    : all.filter(r => {
        if (r.error) return false
        const encMs = r.encodeStats?.median ?? r.encodeMs
        const decMs = r.decodeStats?.median ?? r.decodeMs

        return encMs < FAST_THRESHOLD_MS && decMs < FAST_THRESHOLD_MS
      })

  return NextResponse.json({
    rows: visible,
    totalRows: all.length,
    visibleRows: visible.length,
    hiddenRows: all.length - visible.length,
    threshold: FAST_THRESHOLD_MS,
  })
}
