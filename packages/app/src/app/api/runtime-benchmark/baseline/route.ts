import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { dirname, join } from 'path'

import type { AggregatedRow, Throttle } from '@/app/browser-fetch-bench/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RuntimeTab = 'source' | 'script'

interface RuntimeBaseline {
  createdAt: string
  tab: RuntimeTab
  source: string
  throttle: Throttle
  iterations: number
  rows: AggregatedRow[]
}

type BaselineStore = Record<string, RuntimeBaseline>

const BASELINE_PATH = join(process.cwd(), 'benchmark-results', 'runtime-baselines.json')

function keyFor(tab: RuntimeTab, source: string, throttle: Throttle, iterations: number): string {
  return `${tab}:${source}:${throttle}:iters-${iterations}`
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
  const { searchParams } = req.nextUrl
  const tab = searchParams.get('tab') as RuntimeTab | null
  const source = searchParams.get('source')
  const throttle = searchParams.get('throttle') as Throttle | null
  const iterations = Number(searchParams.get('iterations'))

  if (!tab || !source || !throttle || !Number.isInteger(iterations) || iterations <= 0) {
    return NextResponse.json(
      { error: 'tab, source, throttle, and iterations are required' },
      { status: 400 },
    )
  }

  return NextResponse.json(readStore()[keyFor(tab, source, throttle, iterations)] ?? null)
}

export async function POST(req: NextRequest) {
  const baseline = (await req.json()) as RuntimeBaseline
  const iterations = Number(baseline.iterations)

  if (
    !baseline.tab ||
    !baseline.source ||
    !baseline.throttle ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !Array.isArray(baseline.rows)
  ) {
    return NextResponse.json({ error: 'invalid runtime baseline payload' }, { status: 400 })
  }

  const next: RuntimeBaseline = {
    createdAt: new Date().toISOString(),
    tab: baseline.tab,
    source: baseline.source,
    throttle: baseline.throttle,
    iterations,
    rows: baseline.rows,
  }
  const store = readStore()

  store[keyFor(next.tab, next.source, next.throttle, next.iterations)] = next
  writeStore(store)

  return NextResponse.json(next)
}
