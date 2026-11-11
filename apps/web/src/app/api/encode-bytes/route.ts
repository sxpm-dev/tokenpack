// Wrap raw payload bytes in a TokenPack image. Used by the diff flow to avoid
// the browser canvas roundtrip that breaks compact-header tokens (small inputs)
// — Node's pngjs surface preserves pixel bytes deterministically.

import { encode } from '@tokenpack/node'
import { nodeAlgorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { NextRequest, NextResponse } from 'next/server'

function defaultEncodeBytesAlgo(): string {
  const Ctor =
    nodeAlgorithmCatalog.list().find(Algo => {
      const compressor = Algo.Compressor as unknown as { familyId?: string }

      return (
        Algo.capabilities.environments.includes('browser') &&
        compressor.familyId === 'deflate' &&
        !Algo.capabilities.streamable
      )
    }) ?? nodeAlgorithmCatalog.list()[0]

  if (!Ctor) throw new Error('no algorithms registered in node catalog')

  return Ctor.name
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('bytes') as File | null

    if (!file) return NextResponse.json({ error: 'bytes file required' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const algo = (form.get('algo') as string | null) ?? defaultEncodeBytesAlgo()
    const channelsRaw = (form.get('channels') as string | null) ?? '3'
    const channels = parseInt(channelsRaw, 10) as 1 | 2 | 3 | 4

    const tokenBuf = await encode(buf, {
      algo,
      algoOptions: { surface: { channels } },
    })

    return NextResponse.json({ token: tokenBuf.toString('base64') })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
