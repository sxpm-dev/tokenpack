import { nodeAlgorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { NextResponse } from 'next/server'

import { buildAlgoMeta } from '@/lib/algo-meta'

export async function GET() {
  return NextResponse.json({
    algorithms: nodeAlgorithmCatalog.list().map(Ctor => buildAlgoMeta(Ctor, ['node'])),
  })
}
