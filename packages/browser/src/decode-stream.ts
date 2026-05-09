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

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { decompressRaw } from 'tokenpack/compressors'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { Pack } from 'tokenpack/pack/types'

import { buildDiffToFn } from './build-diff-to'
import { decode, type DecodeOptions } from './decode'

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
    return decode(await streamToBlob(stream), options)
  }

  // Find the algorithm. We need pixel data to read the codec id, so give
  // up here and route through the buffered detect path. Once the catalog
  // grows a "detect from streaming source" helper this becomes one call.
  const blob = await streamToBlob(stream)
  const buffer = Buffer.from(await blob.arrayBuffer())
  const Ctor = await algorithmCatalog.detectFromBuffer(buffer, '.png')
  const algorithm = new Ctor({ key: options.key })

  // Delegate the streaming decode to the algorithm — surface owns the PNG
  // parser, compressor owns the inflate, codec owns per-row decode.
  // We need to re-create a stream from the buffered bytes here because
  // detection consumed the original. For a true zero-buffer streaming
  // path the catalog needs a stream-aware detection API.
  const decodedStream = algorithm.decodeStream(blobToStream(blob), {
    key: options.key,
  })
  const decoded = await readAll(decodedStream)

  return fromBytes(decoded, {
    decompress: options.decompress ?? decompressRaw,
    // Curry the source-decoded algorithm so `prevPack.diffTo(nextPack)`
    // produces a diff token packaged with the same algorithm as the inputs.
    diffTo: buildDiffToFn(algorithm),
  })
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunks: any[] = []
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
  }

  return new Blob(chunks)
}

function blobToStream(blob: Blob): ReadableStream<Uint8Array> {
  return blob.stream()
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
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
