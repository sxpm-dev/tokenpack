import { Buffer } from 'buffer'
import { decodeSurfaceStream, PixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import { decompressRaw } from 'tokenpack/compressors'
import {
  COMPACT_HEADER_PIXELS,
  HEADER_PIXELS,
  isCompactToken,
  readCompactHeader,
  readHeader,
} from 'tokenpack/header'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { Pack } from 'tokenpack/pack/types'
import type { SurfaceStreamHandle } from 'tokenpack/surfaces/types'

import { nodeAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import { buildDiffToFn } from './build-diff-to'
import type { DecodeOptions } from './decode'
import { decodeSourceToPack } from './decode-core'
import { StreamingPngSurface } from './surfaces/streaming-png'

export type DecodeStreamSource =
  | ReadableStream<Uint8Array>
  | AsyncIterable<Uint8Array | Buffer>
  | Buffer
  | Uint8Array

export async function decodeStream(
  source: DecodeStreamSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  const { stream, peek } = await peekAndRebuild(source)

  if (!isPng(peek)) {
    return decodeSourceToPack(await streamToBuffer(stream), options)
  }

  const [detectStream, fallbackStream] = stream.tee()
  const surface = new StreamingPngSurface()
  const handle = await surface.decodeStream(detectStream)
  let detected: Awaited<ReturnType<typeof detectAlgorithmFromRows>>

  try {
    detected = await detectAlgorithmFromRows(handle)
  } catch {
    return decodeSourceToPack(await streamToBuffer(fallbackStream), options)
  }

  const Ctor = algorithmCatalog.getById(detected.algorithmId)
  const algorithm = new Ctor({ key: options.key })

  if (!(algorithm instanceof PixelAlgorithm) || !Ctor.capabilities.streamable) {
    return decodeSourceToPack(await streamToBuffer(fallbackStream), options)
  }

  fallbackStream.cancel().catch(() => undefined)
  const decoded = await decodeSurfaceStream(algorithm, detected.handle, options)

  return fromBytes(decoded, {
    decompress: decompressRaw,
    diffTo: buildDiffToFn(algorithm),
  })
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
    pixelBuf = appendBytes(pixelBuf, value)

    const compactBytes = COMPACT_HEADER_PIXELS * handle.fileChannels

    if (pixelBuf.byteLength >= compactBytes && isCompactToken(pixelBuf)) {
      return {
        algorithmId: readCompactHeader(pixelBuf).algoId,
        handle: replayHandle(handle, queued, iterator),
      }
    }

    const fullBytes = HEADER_PIXELS * handle.fileChannels

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
