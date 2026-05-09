// Inline data URI scenario — server-only fixture builder.
//
// For the **base64-* variants** we emit a `.txt` file containing the full
// data URI string — the only honest form for inlining binary into HTML/CSS
// or atob'ing on the JS side.
//
// For the **tokenpack-* variants** we emit the raw `.png` bytes — TokenPack's
// natural delivery form. The browser-side runner fetches the PNG as a Blob
// and feeds it straight into `decode(blob)`. Wrapping it in another base64
// layer here would be a strawman tax that doesn't match real-world usage.

import { encode } from '@tokenpack/node'
import zlib from 'zlib'

import type { BuildCtx, BuildFixturesFn, FixtureFile } from '../types'

const SIZES = [10, 100, 1000] as const

export const buildInlineDataUriFixtures: BuildFixturesFn = async (ctx: BuildCtx) => {
  const files: FixtureFile[] = []

  for (const sizeKB of SIZES) {
    const json = ctx.payload(sizeKB)
    const buffer = bufferFrom(json)

    files.push(toDataURIFixture(`payload-${sizeKB}kb.raw.txt`, 'application/json', json, sizeKB))

    const deflate = zlib.deflateSync(buffer, { level: 6 })

    files.push(
      toDataURIFixture(
        `payload-${sizeKB}kb.deflate.txt`,
        'application/octet-stream',
        deflate,
        sizeKB,
      ),
    )

    const brotli = zlib.brotliCompressSync(buffer, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
    })

    files.push(
      toDataURIFixture(`payload-${sizeKB}kb.br.txt`, 'application/octet-stream', brotli, sizeKB),
    )

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

function toDataURIFixture(
  path: string,
  mime: string,
  bytes: Uint8Array | Buffer,
  sizeKB: number,
): FixtureFile {
  const b64 = bufferFrom(bytes).toString('base64')
  const dataURI = `data:${mime};base64,${b64}`

  return {
    path,
    bytes: Buffer.from(dataURI, 'utf-8'),
    meta: {
      mime,
      sizeKB,
      payloadBytes: bytes.byteLength,
      base64Length: b64.length,
      dataURIBytes: dataURI.length,
    },
  }
}

function bufferFrom(bytes: Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes

  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}
