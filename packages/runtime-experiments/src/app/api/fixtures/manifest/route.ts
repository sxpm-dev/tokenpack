// Serves the fixture manifest produced by `scripts/generate-fixtures.ts`.
// Pages call this on mount to discover what fixtures + sizes are available.

import fs from 'fs'
import { NextResponse } from 'next/server'
import path from 'path'

const FIXTURES_DIR = path.join(process.cwd(), 'runtime-fixtures')
const MANIFEST_PATH = path.join(FIXTURES_DIR, 'manifest.json')

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return NextResponse.json(
      {
        error:
          'manifest.json not found. Run `yarn workspace tokenpack-runtime-experiments generate:fixtures` first.',
      },
      { status: 404 },
    )
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))

  return NextResponse.json(manifest, {
    headers: {
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
