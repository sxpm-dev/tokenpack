// PixelAlgorithm — base for algorithms whose data is encoded into image pixels.
//
// Implements the standard pipeline:
//   encode: compress → encrypt → fec.encode → drawer.write → surface.writeBuffer
//   decode: surface.readBuffer → drawer.read → finalizeChunks
//
// Concrete algorithm classes (LinearPngBrotli, BitshufflePngBrotli, etc.)
// extend PixelAlgorithm and just declare their static Codec/Surface/Compressor/
// Drawer bindings. The pipeline body is shared.
//
// Future PixelRange* algorithms store data in image-format ancillary chunks
// instead of pixels — they extend AbstractAlgorithm directly with their own
// encode/decode bodies.

import type { Codec, StreamCodecState } from '../codecs/types'
import { isStreamingCodec } from '../codecs/types'
import { compressorRegistry } from '../compressors/registry'
import { encryptData } from '../crypto'
import { pickDrawerForPixels } from '../drawers'
import type { ChunkReadResult, DrawContext, DrawnChunk } from '../drawers/types'
import { finalizeChunks } from '../finalize-chunks'
import {
  COMPACT_HEADER_PIXELS,
  HEADER_PIXELS,
  isCompactToken,
  readCompactHeader,
  readHeader,
} from '../header'
import { fromFileChannels } from '../surfaces/channels'
import type { SurfacePixels, SurfaceStreamHandle } from '../surfaces/types'
import {
  AbstractAlgorithm,
  type AlgorithmCtor,
  type AlgorithmOptions,
  type DecodeOptions,
} from './types'

interface PixelOpts extends AlgorithmOptions {
  surface?: { channels?: 1 | 2 | 3 | 4 }
}

export abstract class PixelAlgorithm extends AbstractAlgorithm {
  /**
   * Run the encode pipeline up through `drawer.write`, returning pixel chunks.
   * Browser uses this and writes its own canvas-PNG; Node `encode()` calls
   * this and then runs the chunk through `surface.writeBuffer`.
   */
  async encodeToChunks(input: Uint8Array, opts: AlgorithmOptions = {}): Promise<DrawnChunk[]> {
    const merged: PixelOpts = { ...this.opts, ...opts }
    const requestedChannels = merged.surface?.channels ?? 3
    const requiredChannels = this.codec.metadata?.requiredChannels
    const codecBpp = (requiredChannels ?? requestedChannels) as 1 | 2 | 3 | 4
    const bpp = this.surface.coerceBpp(codecBpp)

    let data: Buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    let compressionLevel = 0
    let uncompressedLength = 0

    if (this.compressor.id !== 'none') {
      const result = await this.compressor.compress(data)

      if (result.data.length < data.length) {
        uncompressedLength = data.length
        data = result.data
        compressionLevel = result.level
      }
    }

    let encrypted = false
    const key = merged.key

    if (key) {
      data = Buffer.from(await encryptData(data, key))
      encrypted = true
    }

    let fecLevel = 0
    let preFecLength = 0

    if (this.fec) {
      preFecLength = data.length
      const fecResult = this.fec.encode(data)

      data = fecResult.data
      fecLevel = fecResult.level
    }

    const algorithmId = (this.constructor as unknown as { id: number }).id
    const ctx: DrawContext = {
      algorithmId,
      codec: this.codec,
      surface: this.surface,
      bpp,
      compressionLevel,
      uncompressedLength,
      encrypted,
      cellSize: 1,
      requiresFullHeader: this.compressor.requiresFullHeader || fecLevel > 0,
      fecLevel,
      preFecLength,
    }

    return this.drawer.write(data, ctx).chunks
  }

  async encode(input: Uint8Array, opts: AlgorithmOptions = {}): Promise<Buffer> {
    const chunks = await this.encodeToChunks(input, opts)

    if (chunks.length > 1) {
      throw new Error(
        `PixelAlgorithm.encode: payload requires ${chunks.length} chunks; multi-chunk not implemented`,
      )
    }

    return this.surface.writeBuffer(chunks[0])
  }

  /**
   * Decode from pre-decoded pixel images. Browser path: it has already done
   * the canvas → ImageData pipeline, so this skips `surface.readBuffer`.
   */
  async decodeFromImages(images: SurfacePixels[], opts: DecodeOptions = {}): Promise<Buffer> {
    const reads: ChunkReadResult[] = images.map(image => {
      const drawer = pickDrawerForPixels(image.pixels)

      return drawer.read(image, { codec: this.codec })
    })

    return finalizeChunks(reads, opts.key ?? this.opts.key)
  }

  async decode(source: Buffer | Uint8Array, opts: DecodeOptions = {}): Promise<Buffer> {
    const buf = Buffer.isBuffer(source)
      ? source
      : Buffer.from(source.buffer, source.byteOffset, source.byteLength)
    const image: SurfacePixels = await this.surface.readBuffer(buf)
    const result = await this.decodeFromImages([image], opts)

    return result
  }

  /**
   * Streaming decode. Orchestrates entity composition:
   *
   *   surface.decodeStream(stream)               → AsyncIterable<pixelRow>
   *   → codec header read from initial rows      (token-format concern)
   *   → codec.decodeChunk(rows, state)           → data byte chunks
   *   → compressor.decompressWebStream(stream)   → final payload bytes
   *
   * Returns a `ReadableStream<Uint8Array>` of decoded payload bytes, matching
   * `AbstractAlgorithm.decodeStream`. True-streaming surfaces (StreamingPng)
   * + compressors (browser deflate/brotli) deliver byte overlap with
   * download. Surfaces or compressors without streaming overrides fall back
   * to buffered defaults — the orchestration is unchanged.
   */
  override decodeStream(
    source: ReadableStream<Uint8Array>,
    opts: DecodeOptions = {},
  ): ReadableStream<Uint8Array> {
    const algorithm = this

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const decoded = await runDecodeStream(algorithm, source, opts)
          const reader = decoded.getReader()

          while (true) {
            const { done, value } = await reader.read()

            if (done) break
            controller.enqueue(value)
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })
  }

  /** Pixel-header sniff. Recipes whose ID is in the pixel data inherit this. */
  override canHandle(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 6) return false
    const ctor = this.constructor as unknown as { id: number }

    try {
      if (isCompactToken(buffer)) return readCompactHeader(buffer).algoId === ctor.id

      return readHeader(buffer).algorithmId === ctor.id
    } catch {
      return false
    }
  }
}

export async function decodeSurfaceStream(
  algorithm: PixelAlgorithm,
  handle: SurfaceStreamHandle,
  opts: DecodeOptions = {},
): Promise<Buffer> {
  return collectDecodedStream(runDecodeSurfaceStream(algorithm, handle, opts), opts)
}

/**
 * Implementation of `PixelAlgorithm.decodeStream`. Lifted out of the class so
 * the inner closure functions don't capture `this` — the algorithm is passed
 * explicitly. Pipes:
 *
 *   surface.decodeStream(source)        → SurfaceStreamHandle (rows iterator)
 *   → loop: read header → run codec    → push to internal data-byte stream
 *   → compressor.decompressWebStream    → final payload bytes (concatenated)
 *
 * Each entity owns its part of the pipeline; this function is just wiring.
 */
async function runDecodeStream(
  algorithm: PixelAlgorithm,
  source: ReadableStream<Uint8Array>,
  opts: DecodeOptions,
): Promise<ReadableStream<Uint8Array>> {
  const handle: SurfaceStreamHandle = await algorithm.surface.decodeStream(source)

  return runDecodeSurfaceStream(algorithm, handle, opts)
}

function runDecodeSurfaceStream(
  algorithm: PixelAlgorithm,
  handle: SurfaceStreamHandle,
  _opts: DecodeOptions,
): ReadableStream<Uint8Array> {
  const { fileChannels, rows } = handle

  // Internal stream of codec-data bytes. The pump (loop below) writes to it
  // as rows arrive; the compressor reads from it via decompressWebStream.
  type DataController = ReadableStreamDefaultController<Uint8Array>
  let dataController!: DataController
  const dataStream = new ReadableStream<Uint8Array>({
    start(c) {
      dataController = c
    },
  })

  // Header-parse state
  let headerParsed = false
  let bpp: 1 | 2 | 3 | 4 = 3
  let dataLength = 0
  let compressionLevel = 0
  let activeCodec: Codec | null = null
  let codecState: StreamCodecState | null = null
  let pixelBuf: Uint8Array = new Uint8Array(0)
  let fedToOuter = 0

  let resolveHeader!: () => void
  const headerReady = new Promise<void>(resolve => {
    resolveHeader = resolve
  })

  function appendBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    if (a.byteLength === 0) return b
    if (b.byteLength === 0) return a
    const out = new Uint8Array(a.byteLength + b.byteLength)

    out.set(a, 0)
    out.set(b, a.byteLength)

    return out
  }

  async function finishHeader(headerBytes: number) {
    headerParsed = true
    if (activeCodec && isStreamingCodec(activeCodec)) {
      codecState = activeCodec.createDecodeState()
    }
    resolveHeader()
    const dataPixels = pixelBuf.subarray(headerBytes)

    pixelBuf = new Uint8Array(0)
    if (dataPixels.byteLength > 0) {
      feedDataPixels(new Uint8Array(dataPixels))
    }
  }

  function feedDataPixels(pixels: Uint8Array) {
    if (fedToOuter >= dataLength) return
    const pixelCount = Math.floor(pixels.byteLength / fileChannels)

    if (pixelCount === 0) return
    const fcBytes = pixels.subarray(0, pixelCount * fileChannels)
    const bppBytes = fromFileChannels(
      Buffer.from(fcBytes.buffer, fcBytes.byteOffset, fcBytes.byteLength),
      pixelCount,
      fileChannels,
      bpp,
    )

    let dataBytes: Uint8Array

    if (activeCodec && isStreamingCodec(activeCodec) && codecState) {
      const result = activeCodec.decodeChunk(bppBytes, codecState)

      codecState = result.state
      dataBytes = new Uint8Array(
        result.bytes.buffer,
        result.bytes.byteOffset,
        result.bytes.byteLength,
      )
    } else {
      dataBytes = new Uint8Array(bppBytes.buffer, bppBytes.byteOffset, bppBytes.byteLength)
    }

    const remaining = dataLength - fedToOuter
    const toFeed = dataBytes.subarray(0, Math.min(remaining, dataBytes.byteLength))

    fedToOuter += toFeed.byteLength
    dataController.enqueue(new Uint8Array(toFeed))
  }

  // Output stream: pipe dataStream → compressor. Starts as soon
  // as the header is parsed (we need compressionLevel to pick the
  // compressor). Runs concurrently with the row pump below.
  const outputStreamPromise = (async (): Promise<ReadableStream<Uint8Array>> => {
    await headerReady

    return compressionLevel === 0
      ? dataStream
      : compressorRegistry.byHeaderLevel(compressionLevel).decompressWebStream(dataStream)
  })()

  const pumpPromise = (async () => {
    // Row pump: each yielded row is `width * fileChannels` pixel bytes (no
    // PNG filter byte — surface unfiltered them already).
    try {
      for await (const row of rows) {
        if (!headerParsed) {
          pixelBuf = appendBytes(pixelBuf, row)
          const compactBytes = COMPACT_HEADER_PIXELS * fileChannels
          const fullBytes = HEADER_PIXELS * fileChannels

          if (pixelBuf.byteLength >= compactBytes && isCompactToken(pixelBuf)) {
            const ch = readCompactHeader(pixelBuf)

            bpp = ch.channels
            compressionLevel = ch.flags & 0b10 ? 2 : 0
            dataLength = ch.dataLength
            activeCodec = algorithm.codec
            await finishHeader(compactBytes)
          } else if (pixelBuf.byteLength >= fullBytes) {
            try {
              const h = readHeader(pixelBuf)
              const fecLevel = (h.ecLevel >> 1) & 0b111

              if (fecLevel > 0) {
                throw new Error('FEC tokens cannot be streamed; use decode() with the full blob')
              }
              bpp = h.channels
              compressionLevel = h.compressionLevel
              dataLength = h.fileLength
              activeCodec = algorithm.codec
              await finishHeader(fullBytes)
            } catch {
              // Not enough bytes yet — keep accumulating.
            }
          }
          continue
        }
        feedDataPixels(row)
      }
      dataController.close()
    } catch (e) {
      dataController.error(e)
      throw e
    }
  })()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const outBytes = await outputStreamPromise
        const reader = outBytes.getReader()

        while (true) {
          const { done, value } = await reader.read()

          if (done) break
          controller.enqueue(value)
        }
        await pumpPromise
        controller.close()
      } catch (e) {
        controller.error(e)
      }
    },
  })
}

async function collectDecodedStream(
  stream: ReadableStream<Uint8Array>,
  opts: DecodeOptions,
): Promise<Buffer> {
  const reader = stream.getReader()
  const collected: Uint8Array[] = []
  let total = 0
  let sawFirstChunk = false

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    if (!sawFirstChunk) {
      sawFirstChunk = true
      opts.onFirstDecodedChunk?.(value)
    }
    collected.push(value)
    total += value.byteLength
  }
  const out = new Uint8Array(total)
  let offset = 0

  for (const c of collected) {
    out.set(c, offset)
    offset += c.byteLength
  }

  return Buffer.from(out.buffer, out.byteOffset, out.byteLength)
}

/**
 * Helper for declaring a concrete pixel-data algorithm class. Returns a class
 * extending PixelAlgorithm with the given component bindings as static fields.
 */
export function definePixelAlgorithm(spec: {
  id: number
  name: string
  title: string
  description?: string
  Codec: typeof PixelAlgorithm.Codec
  Surface: typeof PixelAlgorithm.Surface
  Compressor: typeof PixelAlgorithm.Compressor
  Drawer: typeof PixelAlgorithm.Drawer
  Fec?: typeof PixelAlgorithm.Fec
}): AlgorithmCtor<PixelAlgorithm> {
  // Built dynamically so each registration produces a fresh class. Static
  // fields cast through unknown because TS tracks `static name: string` on
  // every Function and we're overriding it with the algorithm's name field.
  const Cls = class extends PixelAlgorithm {} as unknown as {
    new (opts?: ConstructorParameters<typeof PixelAlgorithm>[0]): PixelAlgorithm
    id: number
    name: string
    title: string
    description?: string
    Codec: typeof PixelAlgorithm.Codec
    Surface: typeof PixelAlgorithm.Surface
    Compressor: typeof PixelAlgorithm.Compressor
    Drawer: typeof PixelAlgorithm.Drawer
    Fec?: typeof PixelAlgorithm.Fec
  }

  Cls.id = spec.id
  Cls.title = spec.title
  Cls.description = spec.description
  Cls.Codec = spec.Codec
  Cls.Surface = spec.Surface
  Cls.Compressor = spec.Compressor
  Cls.Drawer = spec.Drawer
  Cls.Fec = spec.Fec
  Object.defineProperty(Cls, 'name', { value: spec.name, configurable: true })

  return Cls as unknown as AlgorithmCtor<PixelAlgorithm>
}
