import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import { dirname, join } from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Baseline {
  caseId: string
  throttle: string
  iterations: number
  rows: unknown[]
  createdAt: string
}

type BaselineStore = Record<string, Baseline>

const BASELINE_PATH = join(process.cwd(), 'benchmark-results', 'apply-diff-baselines.json')

function keyFor(caseId: string, throttle: string, iterations: number): string {
  return `${caseId}:${throttle}:iters-${iterations}`
}

function readStore(): BaselineStore {
  if (!existsSync(BASELINE_PATH)) return {}

  return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as BaselineStore
}

function writeStore(store: BaselineStore) {
  mkdirSync(dirname(BASELINE_PATH), { recursive: true })
  writeFileSync(BASELINE_PATH, JSON.stringify(store, null, 2))
}

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get('case')
  const throttle = req.nextUrl.searchParams.get('throttle')
  const iterations = Number(req.nextUrl.searchParams.get('iterations'))

  if (!caseId || !throttle || !Number.isInteger(iterations) || iterations <= 0) {
    return NextResponse.json(
      { error: 'case, throttle, and iterations are required' },
      { status: 400 },
    )
  }

  return NextResponse.json(readStore()[keyFor(caseId, throttle, iterations)] ?? null)
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Baseline>
  const iterations = Number(body.iterations)

  if (
    !body.caseId ||
    !body.throttle ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !Array.isArray(body.rows)
  ) {
    return NextResponse.json({ error: 'invalid apply-diff baseline payload' }, { status: 400 })
  }

  const next: Baseline = {
    caseId: body.caseId,
    throttle: body.throttle,
    iterations,
    rows: body.rows,
    createdAt: new Date().toISOString(),
  }
  const store = readStore()

  store[keyFor(next.caseId, next.throttle, next.iterations)] = next
  writeStore(store)

  return NextResponse.json(next)
}
