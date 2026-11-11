import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const file = path.join(process.cwd(), 'benchmark-results', 'provenance.json')

  return NextResponse.json(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null)
}
