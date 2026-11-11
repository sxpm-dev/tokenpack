// sw-cache scenario — server-only fixture builder. Emits raw byte fixtures
// (not data URIs) — the variant runners read them via the Cache API as
// Blob/Response objects, where the natural representation is bytes.

import { encode } from '@tokenpack/node'
import zlib from 'zlib'

import type { BuildCtx, BuildFixturesFn, FixtureFile } from '../types'

const SIZES = [10, 100, 1000] as const

export const buildSwCacheFixtures: BuildFixturesFn = async (ctx: BuildCtx) => {
  const files: FixtureFile[] = []

  for (const sizeKB of SIZES) {
    const json = ctx.payload(sizeKB)
    const buffer = bufferFrom(json)

    files.push({
      path: `payload-${sizeKB}kb.raw`,
      bytes: buffer,
      meta: { mime: 'application/json', sizeKB, payloadBytes: json.byteLength },
    })

    files.push({
      path: `payload-${sizeKB}kb.deflate`,
      bytes: zlib.deflateSync(buffer, { level: 6 }),
      meta: { mime: 'application/octet-stream', sizeKB, encoding: 'deflate-6' },
    })

    files.push({
      path: `payload-${sizeKB}kb.br`,
      bytes: zlib.brotliCompressSync(buffer, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      }),
      meta: { mime: 'application/octet-stream', sizeKB, encoding: 'brotli-6' },
    })

    const tokenDeflate = await encode(buffer, {
      algo: 'linear-deflate',
      algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
    })

    files.push({
      path: `payload-${sizeKB}kb.tokenpack-deflate.png`,
      bytes: tokenDeflate,
      meta: { mime: 'image/png', sizeKB, encoding: 'tokenpack-deflate-6' },
    })

    const tokenBrotli = await encode(buffer, {
      algo: 'linear',
      algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
    })

    files.push({
      path: `payload-${sizeKB}kb.tokenpack-brotli.png`,
      bytes: tokenBrotli,
      meta: { mime: 'image/png', sizeKB, encoding: 'tokenpack-brotli-6' },
    })
  }

  return files
}

function bufferFrom(bytes: Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes

  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}
