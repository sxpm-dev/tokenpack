import '@tokenpack/node'

import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  findRuntimeFixture,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  readRuntimeManifest,
  runtimeCaseId,
  runtimeFixturePath,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function defaultCaseId(
  manifest: NonNullable<ReturnType<typeof readRuntimeManifest>>,
): string | null {
  const first = manifest.fixtures.find(
    fixture => fixture.tab === 'script' && fixture.kind === 'native' && fixture.encoding === 'raw',
  )

  return first ? runtimeCaseId(first.source, first.chunkCount, first.chunkIndex ?? 0) : null
}

function defaultRuntimeAlgo(manifest: NonNullable<ReturnType<typeof readRuntimeManifest>>) {
  const algo = manifest.algorithms[0]
  const channels = algo?.channels[0]

  return algo && channels ? { name: algo.name, channels } : null
}

export async function GET(req: NextRequest) {
  const manifest = readRuntimeManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'runtime fixtures not found. Run `yarn benchmark`.' },
      { status: 404 },
    )
  }

  const fallbackAlgo = defaultRuntimeAlgo(manifest)
  const source = param(req, 'source') ?? defaultCaseId(manifest)
  const chunkIndex = Number(param(req, 'chunk') ?? 0)
  const algoName = param(req, 'algo') ?? fallbackAlgo?.name
  const channels = Number(param(req, 'ch') ?? fallbackAlgo?.channels)
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!source)
    return NextResponse.json({ error: 'runtime manifest has no script cases' }, { status: 404 })
  if (!algoName || !channels) {
    return NextResponse.json({ error: 'runtime manifest has no token algorithms' }, { status: 404 })
  }

  let Ctor

  try {
    Ctor = algorithmCatalog.getByName(algoName)
  } catch {
    return NextResponse.json({ error: `unknown algorithm: ${algoName}` }, { status: 400 })
  }
  const surface = new (Ctor.Surface as unknown as new () => { mimeType: string })()
  const fixture = findRuntimeFixture(manifest, {
    tab: 'script',
    caseId: source,
    chunkIndex,
    kind: 'token',
    algo: algoName,
    channels,
  })

  if (!fixture) {
    return NextResponse.json(
      { error: `pre-generated script token fixture not found: ${source} ${algoName}-c${channels}` },
      { status: 404 },
    )
  }

  const body = fs.readFileSync(runtimeFixturePath(fixture))

  return new NextResponse(throttledBody(body, condition), {
    headers: {
      ...NO_CACHE_HEADERS,
      'content-type': surface.mimeType,
      'content-length': String(body.length),
      'x-runtime-bench-mode': 'static',
      'x-runtime-bench-throttle': condition.name,
      'x-runtime-bench-source': source,
      'x-runtime-bench-token-group': fixture.group ?? 'fetch',
    },
  })
}
