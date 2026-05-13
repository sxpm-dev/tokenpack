import { Buffer } from 'buffer'
import { decodeSurfaceStream, PixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import type { AbstractAlgorithm } from 'tokenpack/algorithms/types'
import {
  COMPACT_HEADER_PIXELS,
  HEADER_PIXELS,
  isCompactToken,
  readCompactHeader,
  readHeader,
} from 'tokenpack/header'
import type { Pack } from 'tokenpack/pack/types'
import type { SurfaceStreamHandle } from 'tokenpack/surfaces/types'

import { nodeAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import type { DecodeOptions } from './decode'
import { decodeSourceToPayload, payloadToPack } from './decode-core'
import { maybeRouterToken } from './router-token'
import { loadSource } from './source-loader'
import { StreamingPngSurface } from './surfaces/streaming-png'

export type DecodeStreamSource =
  | ReadableStream<Uint8Array>
  | AsyncIterable<Uint8Array | Buffer>
  | Buffer
  | Uint8Array
  | string
  | URL

export async function decodeStream(
  source: DecodeStreamSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  const originalSource = source
  const { bytes, algorithm } = await decodeStreamPayload(source, options)
  const pack = payloadToPack(bytes, algorithm)

  if (typeof originalSource === 'string' || originalSource instanceof URL) {
    return maybeRouterToken(pack, originalSource, options)
  }

  return pack
}

export async function decodeStreamPayload(
  source: DecodeStreamSource,
  options: DecodeOptions = {},
): Promise<{ bytes: Uint8Array; algorithm: AbstractAlgorithm }> {
  const { stream, peek } = await peekAndRebuild(source)

  if (!isPng(peek)) {
    return decodeSourceToPayload(await streamToBuffer(stream), options)
  }

  const pixelRangeAlgorithmId = detectPixelRangeAlgorithmIdFromPngPrefix(peek)

  if (pixelRangeAlgorithmId !== null) {
    const Ctor = algorithmCatalog.getById(pixelRangeAlgorithmId)
    const algorithm = new Ctor({ key: options.key })

    if (algorithm instanceof PixelRangeAlgorithm) {
      const decoded = await streamToBuffer(algorithm.decodeStream(stream, options))

      return {
        bytes: new Uint8Array(decoded.buffer, decoded.byteOffset, decoded.byteLength),
        algorithm,
      }
    }
  }

  const [detectStream, fallbackStream] = stream.tee()
  const surface = new StreamingPngSurface()
  const handle = await surface.decodeStream(detectStream)
  let detected: Awaited<ReturnType<typeof detectAlgorithmFromRows>>

  try {
    detected = await detectAlgorithmFromRows(handle)
  } catch {
    return decodeSourceToPayload(await streamToBuffer(fallbackStream), options)
  }

  const Ctor = algorithmCatalog.getById(detected.algorithmId)
  const algorithm = new Ctor({ key: options.key })

  if (!(algorithm instanceof PixelAlgorithm) || !Ctor.capabilities.streamable) {
    return decodeSourceToPayload(await streamToBuffer(fallbackStream), options)
  }

  fallbackStream.cancel().catch(() => undefined)
  const decoded = await decodeSurfaceStream(algorithm, detected.handle, options)

  return { bytes: decoded, algorithm }
}

async function detectAlgorithmFromRows(handle: SurfaceStreamHandle): Promise<{
  algorithmId: number
  handle: SurfaceStreamHandle
}> {
  const iterator = handle.rows[Symbol.asyncIterator]()
  const queued: Uint8Array[] = []
  let pixelBuf: Uint8Array<ArrayBufferLike> = new Uint8Array(0)

  while (true) {
    const { done, value } = await iterator.next()

    if (done) break
    queued.push(value)

    const compactBytes = COMPACT_HEADER_PIXELS * handle.fileChannels
    const fullBytes = HEADER_PIXELS * handle.fileChannels
    const needHeaderBytes = Math.max(0, fullBytes - pixelBuf.byteLength)

    if (needHeaderBytes > 0) {
      pixelBuf = appendBytes(pixelBuf, value.subarray(0, needHeaderBytes))
    }

    if (pixelBuf.byteLength >= compactBytes && isCompactToken(pixelBuf)) {
      return {
        algorithmId: readCompactHeader(pixelBuf).algoId,
        handle: replayHandle(handle, queued, iterator),
      }
    }

    if (pixelBuf.byteLength >= fullBytes) {
      try {
        return {
          algorithmId: readHeader(pixelBuf).algorithmId,
          handle: replayHandle(handle, queued, iterator),
        }
      } catch {
        // Keep accumulating until enough rows are available for a valid header.
      }
    }
  }

  throw new Error('decodeStream(): input ended before TokenPack header')
}

function replayHandle(
  handle: SurfaceStreamHandle,
  queued: Uint8Array[],
  iterator: AsyncIterator<Uint8Array>,
): SurfaceStreamHandle {
  const rows = (async function* () {
    for (const row of queued) yield row
    while (true) {
      const { done, value } = await iterator.next()

      if (done) return
      yield value
    }
  })()

  return { ...handle, rows }
}

function appendBytes(
  a: Uint8Array<ArrayBufferLike>,
  b: Uint8Array<ArrayBufferLike>,
): Uint8Array<ArrayBufferLike> {
  if (a.byteLength === 0) return b
  if (b.byteLength === 0) return a
  const out = new Uint8Array(a.byteLength + b.byteLength)

  out.set(a, 0)
  out.set(b, a.byteLength)

  return out
}

function detectPixelRangeAlgorithmIdFromPngPrefix(peek: Uint8Array): number | null {
  if (peek.byteLength < 52 || !isPng(peek)) return null

  const ihdrPos = 8
  const ihdrLen = readU32be(peek, ihdrPos)
  const ihdrType = ascii4(peek, ihdrPos + 4)

  if (ihdrType !== 'IHDR') return null
  const nextPos = ihdrPos + 8 + ihdrLen + 4

  if (nextPos + 19 > peek.byteLength) return null
  const chunkType = ascii4(peek, nextPos + 4)

  if (chunkType !== 'tpAK') return null
  const dataPos = nextPos + 8

  if (ascii4(peek, dataPos) !== 'TPK1') return null

  return (peek[dataPos + 4] << 8) | peek[dataPos + 5]
}

function readU32be(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  )
}

function ascii4(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

function isPng(peek: Uint8Array): boolean {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

  if (peek.byteLength < sig.length) return false
  for (let i = 0; i < sig.length; i++) if (peek[i] !== sig[i]) return false

  return true
}

const PEEK_BYTES_FOR_DETECTION = 64

async function peekAndRebuild(
  source: DecodeStreamSource,
): Promise<{ stream: ReadableStream<Uint8Array>; peek: Uint8Array }> {
  const raw = sourceToReadable(source)
  const reader = raw.getReader()
  const peekChunks: Uint8Array[] = []
  let total = 0

  while (total < PEEK_BYTES_FOR_DETECTION) {
    const { done, value } = await reader.read()

    if (done) break
    peekChunks.push(value)
    total += value.byteLength
  }
  const peek = concat(peekChunks, total)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (peek.byteLength > 0) controller.enqueue(peek)
    },
    async pull(controller) {
      const { done, value } = await reader.read()

      if (done) {
        controller.close()

        return
      }
      controller.enqueue(value)
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => undefined)
    },
  })

  return { stream, peek }
}

function sourceToReadable(source: DecodeStreamSource): ReadableStream<Uint8Array> {
  if (source instanceof ReadableStream) return source
  if (typeof source === 'string' || source instanceof URL) return sourceToWebStream(source)
  if (source instanceof Uint8Array) {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(source)
        controller.close()
      },
    })
  }

  const iterator = source[Symbol.asyncIterator]()

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await iterator.next()

      if (done) {
        controller.close()

        return
      }
      controller.enqueue(value)
    },
    async cancel() {
      if (iterator.return) await iterator.return()
    },
  })
}

function sourceToWebStream(source: string | URL): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { bytes } = await loadSource(source)

        controller.enqueue(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
    total += value.byteLength
  }

  return Buffer.from(concat(chunks, total))
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}
