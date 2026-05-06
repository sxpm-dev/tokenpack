// Returns a TokenPack-encoded benchmark script.
//
//   GET /api/runtime-benchmark/script-token?scenario=stream-def3        → static (pre-generated)
//   GET /api/runtime-benchmark/script-token?scenario=stream-def3&live=1 → encode on-the-fly

import { encode as tokenpackEncode } from '@tokenpack/node'
import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'

import { buildScript } from '../_script-builder'
import { networkConditionFor, NO_CACHE_HEADERS, param, SCENARIOS, throttledBody } from '../_shared'

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
  const scenario = param(req, 'scenario') ?? 'stream-def3'
  const live = param(req, 'live') === '1'
  const condition = networkConditionFor(param(req, 'throttle'))

  if (!(SCENARIOS as readonly string[]).includes(scenario)) {
    return NextResponse.json({ error: `unknown scenario: ${scenario}` }, { status: 400 })
  }

  const opts = SCENARIO_OPTS[scenario]
  const mime = opts.format === 'webp' ? 'image/webp' : 'image/png'
  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': mime,
  }

  if (!live) {
    const ext = opts.format === 'webp' ? '.webp' : '.png'
    const fixturePath = path.join(RUNTIME_FIXTURES, `script.${scenario}${ext}`)

    if (!fs.existsSync(fixturePath)) {
      return NextResponse.json(
        {
          error: `pre-generated fixture not found: ${fixturePath}. Run \`yarn benchmark:generate:runtime\``,
        },
        { status: 404 },
      )
    }

    const body = fs.readFileSync(fixturePath)

    headers['content-length'] = String(body.length)
    headers['x-runtime-bench-mode'] = 'static'
    headers['x-runtime-bench-throttle'] = condition.name

    return new NextResponse(throttledBody(body, condition), { headers })
  }

  // Live: encode fresh per request (server timestamp = request time).
  const script = buildScript(performance.now())
  const body = await tokenpackEncode(Buffer.from(script, 'utf-8'), opts)

  headers['content-length'] = String(body.length)
  headers['x-runtime-bench-mode'] = 'live'
  headers['x-runtime-bench-throttle'] = condition.name

  return new NextResponse(throttledBody(body, condition), { headers })
}
