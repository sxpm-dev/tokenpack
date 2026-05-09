// Returns a TokenPack-encoded benchmark script.
//
//   GET /api/runtime-benchmark/script-token?algo=linear-stream-deflate&ch=3
//   GET /api/runtime-benchmark/script-token?...&live=1 → encode on-the-fly

import '@tokenpack/node'

import { encode as tokenpackEncode } from '@tokenpack/node'
import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'

import { buildScript } from '../_script-builder'
import { networkConditionFor, NO_CACHE_HEADERS, param, throttledBody } from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RUNTIME_FIXTURES = path.join(process.cwd(), 'runtime-fixtures')

export async function GET(req: NextRequest) {
  const algoName = param(req, 'algo') ?? 'linear-stream-deflate'
  const channels = (Number(param(req, 'ch') ?? '3') as 1 | 2 | 3 | 4) || 3
  const live = param(req, 'live') === '1'
  const condition = networkConditionFor(param(req, 'throttle'))

  let Ctor

  try {
    Ctor = algorithmCatalog.getByName(algoName)
  } catch {
    return NextResponse.json({ error: `unknown algorithm: ${algoName}` }, { status: 400 })
  }
  const surface = new (Ctor.Surface as unknown as new () => { extension: string; mimeType: string })()
  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-type': surface.mimeType,
  }

  if (!live) {
    const fixturePath = path.join(
      RUNTIME_FIXTURES,
      `script.${algoName}-c${channels}${surface.extension}`,
    )

    if (!fs.existsSync(fixturePath)) {
      return NextResponse.json(
        {
          error: `pre-generated fixture not found: ${fixturePath}. Run \`yarn benchmark:generate:runtime\` or use \`?live=1\`.`,
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

  const script = buildScript(performance.now())
  const body = await tokenpackEncode(Buffer.from(script, 'utf-8'), {
    algo: algoName,
    algoOptions: { surface: { channels } },
  })

  headers['content-length'] = String(body.length)
  headers['x-runtime-bench-mode'] = 'live'
  headers['x-runtime-bench-throttle'] = condition.name

  return new NextResponse(throttledBody(body, condition), { headers })
}
