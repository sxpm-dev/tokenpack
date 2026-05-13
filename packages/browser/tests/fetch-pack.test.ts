import { createServer, type Server } from 'node:http'

import { afterEach, describe, expect, it } from 'vitest'

let server: Server | null = null

describe('fetch-pack', () => {
  afterEach(async () => {
    if (!server) return
    const s = server

    server = null
    await new Promise<void>((resolve, reject) => s.close(err => (err ? reject(err) : resolve())))
  })

  it('decompresses deflate pack files when imported as a direct browser subpath', async () => {
    const { fetchPackFile, fetchPackFileStream, fetchPackManifest } = await import(
      '../src/fetch-pack'
    )
    const { decompressRaw } = await import('tokenpack/compressors')
    const { encode, PackBuilder } = await import('@tokenpack/node')
    const source = new TextEncoder().encode('export const value = "range-fetch coverage";')
    const builder = new PackBuilder().withFile('src/module.js', source)
    const token = await encode(builder, {
      algo: 'pixel-range-none',
      compressor: 'deflate-9',
      algoOptions: { surface: { channels: 3 } },
    })
    const url = await serveToken(token.bytes)
    const remote = await fetchPackManifest(url)

    const buffered = await fetchPackFile(remote, 'src/module.js', decompressRaw)
    const streamed = await readStream((await fetchPackFileStream(remote, 'src/module.js')).stream)

    expect(new TextDecoder().decode(buffered)).toBe('export const value = "range-fetch coverage";')
    expect(buffered).toEqual(source)
    expect(streamed).toEqual(source)
  })
})

async function serveToken(bytes: Uint8Array): Promise<string> {
  server = createServer((req, res) => {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': '*',
      'accept-ranges': 'bytes',
      'content-type': 'image/png',
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers).end()

      return
    }

    const range = parseRange(req.headers.range, bytes.byteLength)

    if (!range) {
      res
        .writeHead(200, {
          ...headers,
          'content-length': String(bytes.byteLength),
        })
        .end(bytes)

      return
    }

    res
      .writeHead(206, {
        ...headers,
        'content-length': String(range.end - range.start + 1),
        'content-range': `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
      })
      .end(bytes.subarray(range.start, range.end + 1))
  })

  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
  const address = server.address()

  if (!address || typeof address === 'string') throw new Error('server did not bind to TCP')

  return `http://127.0.0.1:${address.port}/pack.png`
}

function parseRange(
  header: string | string[] | undefined,
  size: number,
): { start: number; end: number } | null {
  if (!header || Array.isArray(header)) return null
  const match = /^bytes=(\d+)-(\d+)$/.exec(header)

  if (!match) return null
  const start = Number(match[1])
  const end = Math.min(Number(match[2]), size - 1)

  return Number.isInteger(start) && Number.isInteger(end) && start <= end ? { start, end } : null
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break
      if (!value) continue
      chunks.push(value)
      total += value.byteLength
    }
  } finally {
    reader.releaseLock()
  }

  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}
