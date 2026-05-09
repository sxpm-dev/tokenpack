// Returns a TokenPack-encoded source as PNG.
//
//   GET /api/runtime-benchmark/token?source=react-dom-dev&algo=linear-stream-deflate&ch=3
//   GET /api/runtime-benchmark/token?...&live=1   → encode on-the-fly
//
// Static reads from packages/app/runtime-fixtures/<source>.<algo>-c<ch>.png
// (produced by `yarn benchmark:generate:runtime`). Live re-encodes per request
// via @tokenpack/node.

import '@tokenpack/node'

import { encode as tokenpackEncode } from '@tokenpack/node'
import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'

import {
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  sourcePathFor,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RUNTIME_FIXTURES = path.join(process.cwd(), 'runtime-fixtures')

interface ResolvedAlgo {
  Ctor: ReturnType<typeof algorithmCatalog.getByName>
  ext: string
  mime: string
}

function resolveAlgo(algoName: string): ResolvedAlgo | { error: string } {
  let Ctor

  try {
    Ctor = algorithmCatalog.getByName(algoName)
  } catch {
    return { error: `unknown algorithm: ${algoName}` }
  }
  // Read the bound surface to get extension + mime — every algorithm carries
  // a Surface class whose instance exposes these.
  const surface = new (Ctor.Surface as unknown as new () => { extension: string; mimeType: string })()

  return { Ctor, ext: surface.extension, mime: surface.mimeType }
}

export async function GET(req: NextRequest) {
  const source = param(req, 'source') ?? 'react-dom-dev'
  const algoName = param(req, 'algo') ?? 'linear-stream-deflate'
  const channels = (Number(param(req, 'ch') ?? '3') as 1 | 2 | 3 | 4) || 3
  const live = param(req, 'live') === '1'
  const condition = networkConditionFor(param(req, 'throttle'))

  const resolved = resolveAlgo(algoName)

  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 })
  }
  const { mime, ext } = resolved

  if (!live) {
    const fixturePath = path.join(RUNTIME_FIXTURES, `${source}.${algoName}-c${channels}${ext}`)

    if (!fs.existsSync(fixturePath)) {
      return NextResponse.json(
        {
          error: `pre-generated fixture not found: ${fixturePath}. Run \`yarn benchmark:generate:runtime\` or use \`?live=1\`.`,
        },
        { status: 404 },
      )
    }

    const body = fs.readFileSync(fixturePath)

    return new NextResponse(throttledBody(body, condition), {
      headers: {
        ...NO_CACHE_HEADERS,
        'content-type': mime,
        'content-length': String(body.length),
        'x-runtime-bench-mode': 'static',
        'x-runtime-bench-throttle': condition.name,
      },
    })
  }

  const sourceInfo = sourcePathFor(source)

  if (!sourceInfo) {
    return NextResponse.json({ error: `unknown source: ${source}` }, { status: 404 })
  }

  const raw = fs.readFileSync(sourceInfo.path)
  const body = await tokenpackEncode(raw, {
    algo: algoName,
    algoOptions: { surface: { channels } },
  })

  return new NextResponse(throttledBody(body, condition), {
    headers: {
      ...NO_CACHE_HEADERS,
      'content-type': mime,
      'content-length': String(body.length),
      'x-runtime-bench-mode': 'live',
      'x-runtime-bench-throttle': condition.name,
    },
  })
}
