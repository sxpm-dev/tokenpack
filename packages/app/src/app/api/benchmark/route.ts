import { existsSync, readFileSync } from 'fs'
import { NextResponse } from 'next/server'
import { join } from 'path'

export async function GET() {
  const filePath = join(process.cwd(), 'benchmark-results', 'results.json')

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'No results found. Run: yarn benchmark:run' },
      { status: 404 },
    )
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8'))

  return NextResponse.json(data)
}
