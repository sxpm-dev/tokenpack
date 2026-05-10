import '@tokenpack/node'

import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { existsSync, readFileSync } from 'fs'
import { NextResponse } from 'next/server'
import { join } from 'path'

type BenchResultRow = {
  scenario?: string
}

function supportsScenario(row: BenchResultRow): boolean {
  const match = /^(.*)-c([1-4])$/.exec(row.scenario ?? '')

  if (!match) return true

  try {
    return algorithmCatalog
      .getByName(match[1])
      .capabilities.channels.includes(Number(match[2]) as 1 | 2 | 3 | 4)
  } catch {
    return false
  }
}

export async function GET() {
  const filePath = join(process.cwd(), 'benchmark-results', 'results.json')

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'No results found. Run: yarn benchmark:run' },
      { status: 404 },
    )
  }

  const data = (JSON.parse(readFileSync(filePath, 'utf-8')) as BenchResultRow[]).filter(
    supportsScenario,
  )

  return NextResponse.json(data)
}
