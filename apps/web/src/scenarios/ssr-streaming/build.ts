// ssr-streaming scenario — server-only fixture builder. Emits a single
// 100 KB payload as raw JSON + its TokenPack PNG counterpart. The override
// page reads these from `runtime-fixtures/ssr-streaming/` at request time and
// inlines them into the streamed HTML.

import { encode } from '@tokenpack/node'

import type { BuildCtx, BuildFixturesFn, FixtureFile } from '../types'

const SIZE_KB = 100

export const buildSsrStreamingFixtures: BuildFixturesFn = async (ctx: BuildCtx) => {
  const json = ctx.payload(SIZE_KB)
  const buffer = bufferFrom(json)

  const tokenDeflate = await encode(buffer, {
    algo: 'linear-deflate',
    algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
  })

  const files: FixtureFile[] = [
    {
      path: `payload-${SIZE_KB}kb.json`,
      bytes: buffer,
      meta: { mime: 'application/json', sizeKB: SIZE_KB, payloadBytes: json.byteLength },
    },
    {
      path: `payload-${SIZE_KB}kb.tokenpack-deflate.png`,
      bytes: tokenDeflate,
      meta: { mime: 'image/png', sizeKB: SIZE_KB, encoding: 'tokenpack-deflate-6' },
    },
  ]

  return files
}

function bufferFrom(bytes: Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes

  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}
