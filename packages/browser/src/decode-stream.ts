// Streaming TokenPack decoder — thin entry point.
//
// Per the entity-composition principle (see
// docs/architecture/algorithm-as-entity-composition.md):
//   * The Surface owns the container parser (PNG IHDR/IDAT/IEND etc.).
//   * The Codec owns the per-row decode (StreamingCodec.decodeChunk).
//   * The Compressor owns the streaming inflate (decompressWebStream).
//   * The Algorithm orchestrates by composition.
//
// This file is just the tiny entry-point: peek bytes to identify the
// algorithm, then delegate to `algorithm.decodeStream(stream)` and adapt
// the resulting `ReadableStream<Uint8Array>` of decoded bytes into a
// `Pack`. None of the PNG-format work happens here.
//
// History: this file used to inline a 400-line PNG parser + codec dispatch
// pipeline. That belonged on the surface and codec entities, not in a
// general entry point. The parser now lives in
// `BrowserStreamingPngSurface.decodeStream`; the orchestration in
// `PixelAlgorithm.decodeStream` (core).

import { decodeSurfaceStream, PixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
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

import { BrowserStreamingPngSurface } from './algorithms'
import { browserAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import { buildDiffToFn } from './build-diff-to'
import type { DecodeOptions } from './decode'
import { decodeSourceToPack, payloadToPack } from './decode-core'

export type DecodeStreamSource = ReadableStream<Uint8Array> | Blob | string

const PEEK_BYTES_FOR_DETECTION = 64

/**
 * Stream-decode a TokenPack from a network response, Blob, or any
 * ReadableStream. Returns the decoded `Pack` (FilePack | DirPack | DiffPack).
 *
 * The actual streaming happens inside the algorithm's surface (PNG-streaming
 * for `linear-stream-deflate` etc.; buffered fallback for non-streaming
 * surfaces like webp/avif/png-upng).
 */
export async function decodeStream(
  source: DecodeStreamSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  const { stream, peek } = await peekAndRebuild(source)

  // Resolve the algorithm. We need a peek to identify the format: the
  // surface registry indexes by extension/format, but we don't have a
  // filename here. For now we support PNG-magic detection as the dominant
  // case; non-PNG inputs collect to a Blob and use the buffered decode().
  if (!isPng(peek)) {
    return decodeSourceToPack(await streamToBlob(stream), options)
  }

  const pixelRangeAlgorithmId = detectPixelRangeAlgorithmIdFromPngPrefix(peek)

  if (pixelRangeAlgorithmId !== null) {
    const Ctor = algorithmCatalog.getById(pixelRangeAlgorithmId)
    const algorithm = new Ctor({ key: options.key })

    if (algorithm instanceof PixelRangeAlgorithm) {
      const decoded = await streamToBytes(algorithm.decodeStream(stream, options))

      return payloadToPack(decoded, algorithm, options.decompress)
    }
  }

  const [detectStream, fallbackStream] = stream.tee()
  const surface = new BrowserStreamingPngSurface()
  const handle = await surface.decodeStream(detectStream)
  let detected: Awaited<ReturnType<typeof detectAlgorithmFromRows>>

  try {
    detected = await detectAlgorithmFromRows(handle)
  } catch {
    return decodeSourceToPack(await streamToBlob(fallbackStream), options)
  }

  const Ctor = algorithmCatalog.getById(detected.algorithmId)
  const algorithm = new Ctor({ key: options.key })

  if (!(algorithm instanceof PixelAlgorithm) || !Ctor.capabilities.streamable) {
    return decodeSourceToPack(await streamToBlob(fallbackStream), options)
  }

  fallbackStream.cancel().catch(() => undefined)
  const decoded = await decodeSurfaceStream(algorithm, detected.handle, options)

  return fromBytes(decoded, {
    decompress: options.decompress ?? decompressRaw,
    // Curry the source-decoded algorithm so `prevPack.diffTo(nextPack)`
    // produces a diff token packaged with the same algorithm as the inputs.
    diffTo: buildDiffToFn(algorithm),
  })
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

async function peekAndRebuild(
  source: DecodeStreamSource,
): Promise<{ stream: ReadableStream<Uint8Array>; peek: Uint8Array }> {
  const raw = await sourceToReadable(source)
  const reader = raw.getReader()
  const peekChunks: Uint8Array[] = []
  let total = 0

  while (total < PEEK_BYTES_FOR_DETECTION) {
    const { done, value } = await reader.read()

    if (done) break
    peekChunks.push(value)
    total += value.byteLength
  }
  const peek = concatChunks(peekChunks, total)
  // Re-emit the peeked bytes ahead of the rest. The reader stays attached
  // so the rebuilt stream pulls from it directly — no full-body buffering.
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

async function sourceToReadable(source: DecodeStreamSource): Promise<ReadableStream<Uint8Array>> {
  if (source instanceof ReadableStream) return source
  if (source instanceof Blob) return source.stream()
  if (typeof source === 'string') {
    const r = await fetch(source)

    if (!r.ok) throw new Error(`fetch ${source}: ${r.status}`)
    if (!r.body) throw new Error(`fetch ${source}: response has no body`)

    return r.body
  }
  throw new TypeError('decodeStream(): unsupported source type')
}

async function streamToBlob(stream: ReadableStream<Uint8Array>): Promise<Blob> {
  const chunks: any[] = []
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
  }

  return new Blob(chunks)
}

async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    if (!value) continue
    chunks.push(value)
    total += value.byteLength
  }

  return concatChunks(chunks, total)
}

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total)
  let offset = 0

  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }

  return out
}
