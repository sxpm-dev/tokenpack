import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { NextRequest, NextResponse } from 'next/server'

import { fixtureFingerprint } from '@/lib/benchmark-provenance.server'

export const dynamic = 'force-dynamic'
const scopes = new Set([
  'json',
  'apply-diff',
  'diff-matrix',
  'scenario',
  'partial-fetch',
  'bench-app',
  'browser-fetch',
])
const directory = path.join(process.cwd(), 'benchmark-results', 'playground-runs')

function runPath(scope: string, config: string) {
  return path.join(
    directory,
    `${scope}-${createHash('sha256').update(`${process.env.NODE_ENV}:${config}`).digest('hex')}.json`,
  )
}
export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get('scope') ?? ''
  const config = request.nextUrl.searchParams.get('config') ?? ''

  if (!scopes.has(scope) || config.length > 10000)
    return NextResponse.json({ error: 'Invalid run configuration' }, { status: 400 })
  const file = runPath(scope, config)

  if (!existsSync(file)) return NextResponse.json(null)
  const saved = JSON.parse(readFileSync(file, 'utf8'))

  return NextResponse.json(
    saved.mode === process.env.NODE_ENV && saved.fingerprint === fixtureFingerprint()
      ? saved
      : null,
  )
}
export async function POST(request: NextRequest) {
  const { scope, config, result } = await request.json()

  if (
    !scopes.has(scope) ||
    typeof config !== 'string' ||
    config.length > 10000 ||
    result === undefined
  ) {
    return NextResponse.json({ error: 'Invalid run configuration' }, { status: 400 })
  }
  const saved = {
    scope,
    config,
    result,
    fingerprint: fixtureFingerprint(),
    createdAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    mode: process.env.NODE_ENV,
  }

  mkdirSync(directory, { recursive: true })
  const file = runPath(scope, config)
  const temporary = `${file}.${crypto.randomUUID()}.tmp`

  writeFileSync(temporary, JSON.stringify(saved, null, 2))
  renameSync(temporary, file)

  return NextResponse.json(saved)
}
