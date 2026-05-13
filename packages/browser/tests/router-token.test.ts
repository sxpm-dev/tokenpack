import { randomBytes } from 'node:crypto'
import { createServer, type Server } from 'node:http'

import { afterEach, describe, expect, it } from 'vitest'

let server: Server | null = null

describe('router token', () => {
  afterEach(async () => {
    if (!server) return
    const s = server

    server = null
    s.closeAllConnections()
    await new Promise<void>((resolve, reject) => s.close(err => (err ? reject(err) : resolve())))
  })

  it('loads and materializes files from colocated chunk tokens', async () => {
    const { decodeStream } = await import('../src/decode-stream')
    const { encode, TokenPack } = await import('@tokenpack/node')
    const script = 'globalThis.__routerTokenTest = 1;'
    const bundle = await encode(
      new TokenPack().router({
        chunks: [
          {
            id: 'main',
            files: [
              {
                url: 'https://example.test/assets/app.js',
                path: 'assets/app.js',
                bytes: new TextEncoder().encode(script),
                status: 200,
                headers: { 'content-type': 'application/javascript' },
              },
            ],
          },
        ],
      }),
      {
        algo: 'pixel-range-none',
        compressor: 'deflate-9',
        algoOptions: { surface: { channels: 3 } },
      },
    )

    const router = await artifactBytes(findArtifact(bundle, 'router.png'))
    const chunk = await artifactBytes(findArtifact(bundle, 'main.png'))
    const baseUrl = await serveTokens({
      '/router.png': router,
      '/main.png': chunk,
    })
    const pack = await decodeStream(`${baseUrl}/router.png`)

    expect(pack.isRouter()).toBe(true)
    if (!pack.isRouter()) throw new Error('expected decoded router pack')
    expect(
      (
        (await pack.list()) as Array<{
          path: 'assets/app.js'
        }>
      ).map(entry => entry.path),
    ).toEqual(['assets/app.js'])

    expect(await pack.text('assets/app.js')).toBe(script)
    expect(await pack.text()).toBe(script)
    expect(
      (await pack.extractAll()).map(file => ({
        path: file.path,
        text: new TextDecoder().decode(file.bytes),
      })),
    ).toEqual([{ path: 'assets/app.js', text: script }])

    const blob = await pack.blob('https://example.test/assets/app.js')

    expect(await blob.text()).toBe(script)
  })

  it('keeps overlapping file paths addressable by URL', async () => {
    const { decodeRouter } = await import('../src/router-token')
    const { encode, TokenPack } = await import('@tokenpack/node')
    const first = 'console.log("first");'
    const second = 'console.log("second");'
    const bundle = await encode(
      new TokenPack().router({
        chunks: [
          {
            id: 'a',
            files: [
              {
                url: 'https://a.example.test/assets/app.js',
                path: 'assets/app.js',
                bytes: new TextEncoder().encode(first),
                status: 200,
                headers: { 'content-type': 'application/javascript' },
              },
            ],
          },
          {
            id: 'b',
            files: [
              {
                url: 'https://b.example.test/assets/app.js',
                path: 'assets/app.js',
                bytes: new TextEncoder().encode(second),
                status: 200,
                headers: { 'content-type': 'application/javascript' },
              },
            ],
          },
        ],
      }),
    )
    const baseUrl = await serveTokens({
      '/router.png': await artifactBytes(findArtifact(bundle, 'router.png')),
      '/a.png': await artifactBytes(findArtifact(bundle, 'a.png')),
      '/b.png': await artifactBytes(findArtifact(bundle, 'b.png')),
    })
    const pack = await decodeRouter(`${baseUrl}/router.png`)

    expect((await pack.list()).map(entry => entry.url)).toEqual([
      'https://a.example.test/assets/app.js',
      'https://b.example.test/assets/app.js',
    ])
    await expect(pack.text('assets/app.js')).rejects.toThrow('router token path is ambiguous')
    expect(await pack.text('https://a.example.test/assets/app.js')).toBe(first)
    expect(await pack.text('https://b.example.test/assets/app.js')).toBe(second)
    expect(await pack.text()).toBe(`${first}${second}`)
  })

  it('loads whole routed chunk segments with full chunk PNG requests', async () => {
    const { decodeRouter } = await import('../src/router-token')
    const { encode, TokenPack } = await import('@tokenpack/node')
    const bytes = deterministicBytes(300 * 1024)
    const bundle = await encode(
      new TokenPack().withBuffer('assets/big.bin', bytes).router({
        targetChunkBytes: 1024,
        maxSegmentsPerFile: 5,
      }),
    )
    const requests: Array<{ path: string; range: string | undefined }> = []
    const files = Object.fromEntries(
      await Promise.all(
        bundle.map(async artifact => [`/${artifact.filename}`, await artifactBytes(artifact)]),
      ),
    )
    const baseUrl = await serveTokens(files, requests)
    const pack = await decodeRouter(`${baseUrl}/router.png`)

    if (!pack.isRouter()) throw new Error('expected decoded router pack')
    const blob = await pack.stream.blob('assets/big.bin')

    expect(Array.from(await blobToBytes(blob))).toEqual(Array.from(bytes))
    const chunkRequests = requests.filter(request => request.path.includes('/chunk-'))
    const uniqueChunkRequestPaths = new Set(chunkRequests.map(request => request.path))

    expect(chunkRequests.length).toBeGreaterThan(0)
    expect(chunkRequests).toHaveLength(uniqueChunkRequestPaths.size)
    expect(chunkRequests.every(request => !request.range)).toBe(true)
  })

  it('coalesces all-files router reads by chunk instead of re-fetching per file', async () => {
    const { decodeRouter } = await import('../src/router-token')
    const { encode, TokenPack } = await import('@tokenpack/node')
    const first = new Uint8Array(randomBytes(8 * 1024))
    const second = new Uint8Array(randomBytes(4 * 1024))
    const third = new Uint8Array(randomBytes(2 * 1024))
    const bundle = await encode(
      new TokenPack().router({
        chunks: [
          {
            id: 'shared',
            files: [
              {
                url: 'https://example.test/assets/first.bin',
                path: 'assets/first.bin',
                bytes: first,
                status: 200,
                headers: { 'content-type': 'application/octet-stream' },
              },
              {
                url: 'https://example.test/assets/second.bin',
                path: 'assets/second.bin',
                bytes: second,
                status: 200,
                headers: { 'content-type': 'application/octet-stream' },
              },
              {
                url: 'https://example.test/assets/third.bin',
                path: 'assets/third.bin',
                bytes: third,
                status: 200,
                headers: { 'content-type': 'application/octet-stream' },
              },
            ],
          },
        ],
      }),
    )
    const requests: Array<{ path: string; range: string | undefined }> = []
    const baseUrl = await serveTokens(
      {
        '/router.png': await artifactBytes(findArtifact(bundle, 'router.png')),
        '/shared.png': await artifactBytes(findArtifact(bundle, 'shared.png')),
      },
      requests,
    )
    const pack = await decodeRouter(`${baseUrl}/router.png`)

    if (!pack.isRouter()) throw new Error('expected decoded router pack')
    const extracted = await pack.stream.extractAll()

    expect(
      extracted.map(file => ({
        path: file.path,
        bytes: Array.from(file.bytes),
      })),
    ).toEqual([
      { path: 'assets/first.bin', bytes: Array.from(first) },
      { path: 'assets/second.bin', bytes: Array.from(second) },
      { path: 'assets/third.bin', bytes: Array.from(third) },
    ])

    const chunkRequests = requests.filter(request => request.path.includes('/shared.png'))

    expect(chunkRequests).toEqual([{ path: '/shared.png', range: undefined }])
  })

  it('loads partial routed file segments with HTTP range requests against chunk PNGs', async () => {
    const { decodeRouter } = await import('../src/router-token')
    const { encode, TokenPack } = await import('@tokenpack/node')
    const first = new Uint8Array(randomBytes(16 * 1024))
    const second = new Uint8Array(randomBytes(1024))
    const bundle = await encode(
      new TokenPack().router({
        chunks: [
          {
            id: 'shared',
            files: [
              {
                url: 'https://example.test/assets/first.bin',
                path: 'assets/first.bin',
                bytes: first,
                status: 200,
                headers: { 'content-type': 'application/octet-stream' },
              },
              {
                url: 'https://example.test/assets/second.bin',
                path: 'assets/second.bin',
                bytes: second,
                status: 200,
                headers: { 'content-type': 'application/octet-stream' },
              },
            ],
          },
        ],
      }),
    )
    const requests: Array<{ path: string; range: string | undefined }> = []
    const baseUrl = await serveTokens(
      {
        '/router.png': await artifactBytes(findArtifact(bundle, 'router.png')),
        '/shared.png': await artifactBytes(findArtifact(bundle, 'shared.png')),
      },
      requests,
    )
    const pack = await decodeRouter(`${baseUrl}/router.png`)

    if (!pack.isRouter()) throw new Error('expected decoded router pack')
    const entries = (await pack.list()) as Array<{
      path: string
      segments: Array<{ chunkId: string; offset: number; length: number }>
    }>
    const partialEntry = entries.find(entry => entry.segments.some(segment => segment.offset > 0))

    expect(partialEntry).toBeDefined()
    const expected = partialEntry?.path === 'assets/first.bin' ? first : second
    const blob = await pack.stream.blob(partialEntry!.path)

    expect(Array.from(await blobToBytes(blob))).toEqual(Array.from(expected))
    const chunkRequests = requests.filter(request => request.path.includes('/shared.png'))

    expect(chunkRequests.length).toBeGreaterThan(0)
    expect(chunkRequests.every(request => request.range?.startsWith('bytes='))).toBe(true)
    expect(chunkRequests.some(request => /^bytes=(?!0-)/.test(request.range ?? ''))).toBe(true)
  })
})

function findArtifact<T extends { filename: string }>(artifacts: T[], filename: string): T {
  const artifact = artifacts.find(item => item.filename === filename)

  if (!artifact) throw new Error(`missing encoded artifact: ${filename}`)

  return artifact
}

async function artifactBytes(artifact: { blob: Blob }): Promise<Uint8Array> {
  return new Uint8Array(await artifact.blob.arrayBuffer())
}

async function serveTokens(
  files: Record<string, Uint8Array>,
  requests: Array<{ path: string; range: string | undefined }> = [],
): Promise<string> {
  server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'
    const bytes = files[path]
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
    if (!bytes) {
      res.writeHead(404, headers).end()

      return
    }
    requests.push({
      path,
      range: Array.isArray(req.headers.range) ? req.headers.range[0] : req.headers.range,
    })
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

  return `http://127.0.0.1:${address.port}`
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

function deterministicBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  let state = 0x12345678

  for (let i = 0; i < bytes.length; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    bytes[i] = state & 0xff
  }

  return bytes
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
