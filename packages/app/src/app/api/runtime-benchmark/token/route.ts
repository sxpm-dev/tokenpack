// Returns a TokenPack-encoded source as PNG/WebP.
//
//   GET /api/runtime-benchmark/token?source=react-dom-dev&scenario=stream-def3        → static (pre-generated)
//   GET /api/runtime-benchmark/token?source=react-dom-dev&scenario=stream-def3&live=1 → encode on-the-fly
//
// Static reads from packages/app/runtime-fixtures/<source>.<scenario>.<ext>
// (produced by `yarn benchmark:generate:runtime`). Live re-encodes the source
// bytes per request via @tokenpack/node — useful for measuring encode-CPU cost.

import { encode as tokenpackEncode } from '@tokenpack/node'
import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'

import {
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  SCENARIOS,
  sourcePathFor,
  throttledBody,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RUNTIME_FIXTURES = path.join(process.cwd(), 'runtime-fixtures')

interface ScenarioOpts {
  algo: string
  compressionMode: string
  format: 'png' | 'webp'
  channels: 1 | 2 | 3 | 4
  streaming: boolean
}

const SCENARIO_OPTS: Record<string, ScenarioOpts> = {
  'max-webp3': {
    algo: 'linear',
    compressionMode: 'brotli-11',
    format: 'webp',
    channels: 3,
    streaming: false,
  },
  'max-png3': {
    algo: 'linear',
    compressionMode: 'brotli-11',
    format: 'png',
    channels: 3,
    streaming: false,
  },
  'max-def3': {
    algo: 'linear',
    compressionMode: 'deflate-6',
    format: 'png',
    channels: 3,
    streaming: false,
  },
  'stream-png3': {
    algo: 'linear',
    compressionMode: 'brotli-6',
    format: 'png',
    channels: 3,
    streaming: true,
  },
  'stream-def3': {
    algo: 'linear',
    compressionMode: 'deflate-6',
    format: 'png',
    channels: 3,
    streaming: true,
  },
}

export async function GET(req: NextRequest) {
  const source = param(req, 'source') ?? 'react-dom-dev'
  const scenario = param(req, 'scenario') ?? 'stream-def3'
  const live = param(req, 'live') === '1'
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!(SCENARIOS as readonly string[]).includes(scenario)) {
    return NextResponse.json({ error: `unknown scenario: ${scenario}` }, { status: 400 })
  }

  const opts = SCENARIO_OPTS[scenario]
  const mime = opts.format === 'webp' ? 'image/webp' : 'image/png'
  const ext = opts.format === 'webp' ? '.webp' : '.png'

  if (!live) {
    const fixturePath = path.join(RUNTIME_FIXTURES, `${source}.${scenario}${ext}`)

    if (!fs.existsSync(fixturePath)) {
      return NextResponse.json(
        {
          error: `pre-generated fixture not found: ${fixturePath}. Run \`yarn benchmark:generate:runtime\``,
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

  // Live: encode the source on-the-fly per request.
  const sourceInfo = sourcePathFor(source)

  if (!sourceInfo) {
    return NextResponse.json({ error: `unknown source: ${source}` }, { status: 404 })
  }

  const raw = fs.readFileSync(sourceInfo.path)
  const body = await tokenpackEncode(raw, opts)

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
