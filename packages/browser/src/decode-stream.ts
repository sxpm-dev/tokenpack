// Streaming TokenPack decoder — Web Streams port of
// `packages/core/src/stream-decoder.ts`.
//
// Pipeline (PNG only — WebP has no streaming decoder in browsers):
//   1. Read PNG bytes from input ReadableStream
//   2. Parse PNG chunks (signature → IHDR → IDAT* → IEND)
//   3. Pipe IDAT bytes through `DecompressionStream('deflate')`
//   4. Strip per-row PNG filter byte, reconstruct via Sub/Up/Average/Paeth
//   5. Read TokenPack header from first pixel rows (compact or full)
//   6. Codec decode (linear = identity; StreamingCodec = decodeChunk per row)
//   7. Pipe data bytes through outer `DecompressionStream('deflate'|'br')`
//   8. Concat output chunks → return as `DecodeResult`
//
// Decompression overlaps with download — first decoded byte can land before
// the last network byte arrives, which is the entire point of `stream-*`
// scenarios. Non-streamable PNG inputs (e.g. `max-png3` with one big IDAT
// block) also work, just with more decode work bunched at the tail.

import 'tokenpack/algorithms/register-all'

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import type { AbstractCodec, StreamCodecState } from 'tokenpack/codecs/types'
import { isStreamingCodec } from 'tokenpack/codecs/types'
import { compressorRegistry, decompressRaw } from 'tokenpack/compressors'
import {
  COMPACT_HEADER_PIXELS,
  HEADER_PIXELS,
  isCompactToken,
  readCompactHeader,
  readHeader,
} from 'tokenpack/header'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { Pack } from 'tokenpack/pack/types'
import { fromFileChannels } from 'tokenpack/surfaces/channels'

import { buildDiffToFn } from './build-diff-to'
import { decode, type DecodeOptions } from './decode'

export type DecodeStreamSource = ReadableStream<Uint8Array> | Blob | string

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/**
 * Stream-decode a TokenPack from a network response or any ReadableStream.
 *
 * Falls back to the buffered `decode()` path for WebP (createImageBitmap is
 * the only browser-available path; there's no streaming WebP decoder).
 */
export async function decodeStream(
  source: DecodeStreamSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  const { stream, peek } = await peekAndRebuild(source)

  if (!isPng(peek)) {
    // Non-PNG (WebP) — collect to Blob, run buffered decode.
    return decode(await streamToBlob(stream), options)
  }

  return decodeStreamPng(stream, options)
}

function isPng(peek: Uint8Array): boolean {
  if (peek.byteLength < PNG_SIGNATURE.length) return false
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (peek[i] !== PNG_SIGNATURE[i]) return false
  }

  return true
}

async function peekAndRebuild(
  source: DecodeStreamSource,
): Promise<{ stream: ReadableStream<Uint8Array>; peek: Uint8Array }> {
  const raw = await sourceToReadable(source)
  const reader = raw.getReader()
  const peekBuf: Uint8Array[] = []
  let peekTotal = 0

  while (peekTotal < PNG_SIGNATURE.length) {
    const { done, value } = await reader.read()

    if (done) break
    peekBuf.push(value)
    peekTotal += value.byteLength
  }
  const peek = concatChunks(peekBuf, peekTotal)
  // Re-emit the peeked bytes ahead of the rest of the source. We hold the
  // original reader so the rebuilt stream can pull from it directly without
  // copying the whole body into memory.
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

// ── Streaming PNG decoder ──────────────────────────────────────────────────

async function decodeStreamPng(
  stream: ReadableStream<Uint8Array>,
  _options: DecodeOptions,
): Promise<Pack> {
  const reader = stream.getReader()

  // PNG container parsing state. `Uint8Array<any>` keeps the buffer-slot
  // generic from clashing with what `concat`/`subarray` return under TS 5.7+.

  let pngBuf: Uint8Array<any> = new Uint8Array(0)
  let pngState: 'sig' | 'chunk' | 'done' = 'sig'
  let width = 0
  let fileChannels: 3 | 4 = 3
  let scanlineLen = 0

  // Pixel-row reconstruction state.
  //
  // Inflated scanline bytes arrive in many small chunks (the streaming-PNG
  // surface uses 1024-byte stored deflate blocks). We keep a deque of pending
  // chunks instead of repeatedly concat-ing into a growing buffer — that
  // avoids O(n²) memcpy as bytes accumulate across 60+ inflate emissions.
  // Each scanline materializes via `takeScanline`, which copies bytes exactly
  // once into the row's own Uint8Array.

  const scanlineQueue: Uint8Array<any>[] = []
  let scanlineQueueBytes = 0

  let prevLine: Uint8Array<any> = new Uint8Array(0)

  let pixelBuf: Uint8Array<any> = new Uint8Array(0)

  function takeScanline(): Uint8Array | null {
    if (scanlineLen === 0) return null
    if (scanlineQueueBytes < scanlineLen) return null

    const out = new Uint8Array(scanlineLen)
    let written = 0

    while (written < scanlineLen) {
      const head = scanlineQueue[0]
      const need = scanlineLen - written

      if (head.byteLength <= need) {
        out.set(head, written)
        written += head.byteLength
        scanlineQueueBytes -= head.byteLength
        scanlineQueue.shift()
      } else {
        out.set(head.subarray(0, need), written)
        written += need
        scanlineQueueBytes -= need
        scanlineQueue[0] = head.subarray(need)
      }
    }

    return out
  }

  // TokenPack header state
  let headerParsed = false
  let bpp: 1 | 2 | 3 | 4 = 3
  let dataLength = 0
  let compressionLevel = 0
  let fedToOuter = 0
  let activeCodec: AbstractCodec | null = null
  let codecState: StreamCodecState | null = null

  // Long-lived DecompressionStreams. PNG IDAT chunks share one inflate stream.
  let idatInflate: { writer: WritableStreamDefaultWriter; pump: Promise<void> } | null = null
  let outer: { writer: WritableStreamDefaultWriter; pump: Promise<void> } | null = null
  let outerClosed = false

  // Output collector — chunks pushed by either the linear-codec path
  // (compressionLevel=0) or the outer DecompressionStream's reader pump.
  const outputChunks: Uint8Array[] = []
  let outputBytes = 0

  function pushOutput(chunk: Uint8Array) {
    outputChunks.push(chunk)
    outputBytes += chunk.byteLength
  }

  // ── PNG chunk parser ─────────────────────────────────────────────
  async function parsePng() {
    while (true) {
      if (pngState === 'sig') {
        if (pngBuf.byteLength < 8) return
        pngBuf = pngBuf.subarray(8)
        pngState = 'chunk'
      }
      if (pngState === 'chunk') {
        if (pngBuf.byteLength < 8) return
        const len = readUint32BE(pngBuf, 0)

        if (pngBuf.byteLength < 12 + len) return
        const type = String.fromCharCode(pngBuf[4], pngBuf[5], pngBuf[6], pngBuf[7])
        const data = pngBuf.subarray(8, 8 + len)

        pngBuf = pngBuf.subarray(12 + len)

        if (type === 'IHDR') {
          width = readUint32BE(data, 0)
          // colorType byte: 2=RGB, 6=RGBA. Anything else is unsupported here
          // (TokenPack encoders only emit these two).
          fileChannels = data[9] === 6 ? 4 : 3
          scanlineLen = 1 + width * fileChannels
          prevLine = new Uint8Array(width * fileChannels)
        } else if (type === 'IDAT') {
          await onIdatChunk(data)
        } else if (type === 'IEND') {
          pngState = 'done'
          if (idatInflate) {
            await idatInflate.writer.close()
            await idatInflate.pump
          }

          return
        }
      }
      if (pngState === 'done') return
    }
  }

  async function onIdatChunk(data: Uint8Array) {
    if (!idatInflate) idatInflate = makeInflate('deflate', onScanlineBytes)
    await writeChunk(idatInflate.writer, data)
  }

  async function onScanlineBytes(chunk: Uint8Array) {
    scanlineQueue.push(chunk)
    scanlineQueueBytes += chunk.byteLength

    while (true) {
      const row = takeScanline()

      if (!row) break
      // `row` owns its bytes (allocated in takeScanline); unfilter modifies in
      // place and returns a subarray view — `prevLine` then aliases that view
      // safely until the next scanline is allocated.
      const filterByte = row[0]
      const line = unfilterInPlace(row, filterByte, prevLine, fileChannels)

      prevLine = line
      await onPixelRow(line)
    }
  }

  async function onPixelRow(pixels: Uint8Array) {
    if (!headerParsed) {
      pixelBuf = concat(pixelBuf, pixels)
      const compactBytes = COMPACT_HEADER_PIXELS * fileChannels
      const fullBytes = HEADER_PIXELS * fileChannels

      if (pixelBuf.byteLength >= compactBytes && isCompactToken(pixelBuf)) {
        const ch = readCompactHeader(pixelBuf)

        bpp = ch.channels
        compressionLevel = ch.flags & 0b10 ? 2 : 0
        dataLength = ch.dataLength
        activeCodec = algorithmCatalog.getById(ch.algoId).codec
        await finishHeader(compactBytes)
      } else if (pixelBuf.byteLength >= fullBytes) {
        let h

        try {
          h = readHeader(pixelBuf)
        } catch {
          return
        }
        const fecLevel = (h.ecLevel >> 1) & 0b111

        if (fecLevel > 0) {
          throw new Error('FEC tokens cannot be streamed; use decode() with the full blob')
        }
        bpp = h.channels
        compressionLevel = h.compressionLevel
        dataLength = h.fileLength
        activeCodec = algorithmCatalog.getById(h.algorithmId).codec
        await finishHeader(fullBytes)
      }

      return
    }
    await feedDataPixels(pixels)
  }

  async function finishHeader(headerBytes: number) {
    headerParsed = true
    if (activeCodec && isStreamingCodec(activeCodec)) {
      codecState = activeCodec.createDecodeState()
    }
    initOuter()
    const dataPixels = pixelBuf.subarray(headerBytes)

    pixelBuf = new Uint8Array(0)
    if (dataPixels.byteLength > 0) {
      await feedDataPixels(new Uint8Array(dataPixels))
    }
  }

  function initOuter() {
    if (compressionLevel === 0) return
    const compressor = compressorRegistry.byHeaderLevel(compressionLevel)
    const isBrotli = compressor.id.startsWith('brotli-')
    const format = isBrotli ? 'br' : 'deflate'

    outer = makeInflate(format, async chunk => pushOutput(chunk))
  }

  async function feedDataPixels(pixels: Uint8Array) {
    if (fedToOuter >= dataLength) return

    const pixelCount = Math.floor(pixels.byteLength / fileChannels)

    if (pixelCount === 0) return

    const fcBytes = pixels.subarray(0, pixelCount * fileChannels)
    const bppBytes = fromFileChannels(fcBytes, pixelCount, fileChannels, bpp)

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
      dataBytes = bppBytes
    }

    const remaining = dataLength - fedToOuter
    const toFeed = dataBytes.subarray(0, Math.min(remaining, dataBytes.byteLength))

    fedToOuter += toFeed.byteLength

    if (compressionLevel === 0) {
      // No outer compression: pixel bytes ARE the data bytes. Push directly.
      pushOutput(new Uint8Array(toFeed))

      return
    }
    if (!outer) return

    await writeChunk(outer.writer, toFeed)
    if (fedToOuter >= dataLength && !outerClosed) {
      outerClosed = true
      await outer.writer.close()
    }
  }

  // ── Main loop: pull bytes, feed parsePng ─────────────────────────
  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    pngBuf = concat(pngBuf, value)
    await parsePng()
    // TS doesn't track parsePng's mutation across the await — assert at runtime.
    if ((pngState as string) === 'done') break
  }

  // TS doesn't track mutations across the parsePng await, so re-bind through
  // locals so we can use them after the loop.
  const inflateHandle = idatInflate as InflateHandle | null
  const outerHandle = outer as InflateHandle | null

  // Best-effort drain in case the input ended without a clean IEND.
  if ((pngState as string) !== 'done' && inflateHandle) {
    try {
      await inflateHandle.writer.close()
    } catch {
      // already closed
    }
    await inflateHandle.pump.catch(() => undefined)
  }

  // Outer decompression: drain whatever's still in the buffer. If we never
  // reached `dataLength` (truncated input) close now to surface any error.
  if (outerHandle) {
    if (!outerClosed) {
      try {
        await outerHandle.writer.close()
      } catch {
        // already closed
      }
      outerClosed = true
    }
    await outerHandle.pump.catch(() => undefined)
  }

  return fromBytes(concatChunks(outputChunks, outputBytes), {
    decompress: decompressRaw,
    diffTo: buildDiffToFn(),
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────

interface InflateHandle {
  writer: WritableStreamDefaultWriter
  pump: Promise<void>
}

function makeInflate(
  format: 'deflate' | 'br',
  onChunk: (chunk: Uint8Array) => Promise<void> | void,
): InflateHandle {
  // TS lib.dom only types CompressionFormat as 'deflate' | 'gzip' | 'deflate-raw'.
  // 'br' is supported at runtime in Chromium ≥ 124 / Firefox ≥ 126 / Safari ≥ 18.

  const Decompress = DecompressionStream as any
  const ds = new Decompress(format)
  const writer = ds.writable.getWriter() as WritableStreamDefaultWriter
  const reader = ds.readable.getReader() as ReadableStreamDefaultReader<Uint8Array>

  // Drain-but-discard on error: if `onChunk` throws (e.g. the codec rejects a
  // header, or `new DecompressionStream('br')` fails on an unsupported browser),
  // we keep pulling bytes from the reader until it's done. Skipping `reader.read`
  // would leave the readable side buffered, and a later `writer.close()` would
  // then hang waiting for the drain that never happens. We re-throw the first
  // captured error after the reader is fully drained so the pump's awaiter
  // sees a rejected promise.
  const pump = (async () => {
    let firstError: unknown = null

    while (true) {
      const { done, value } = await reader.read()

      if (done) break
      if (firstError !== null) continue
      try {
        await onChunk(value)
      } catch (e) {
        firstError = e
      }
    }
    if (firstError !== null) throw firstError
  })()

  return { writer, pump }
}

async function writeChunk(writer: WritableStreamDefaultWriter, chunk: Uint8Array): Promise<void> {
  // Cast away the BufferSource ↔ Uint8Array<ArrayBufferLike> variance mismatch.

  await writer.write(chunk as any)
}

/**
 * Reconstruct a PNG scanline in place. `row` is a freshly-allocated buffer of
 * shape `[filterByte, ...lineBytes]` (length = scanlineLen). For
 * filterType === 0 — the common case in streaming PNGs (encoder sets
 * `filterType: 0`) — this is a zero-cost subarray view; for other filter types
 * we mutate `row` directly and return the subarray view over the modified
 * line bytes. `prev` is the previous scanline's reconstructed bytes.
 */
function unfilterInPlace(
  row: Uint8Array<any>,
  filterType: number,

  prev: Uint8Array<any>,
  channels: number,
): Uint8Array {
  const len = row.byteLength - 1

  if (filterType === 0) {
    return row.subarray(1)
  }

  for (let i = 0; i < len; i++) {
    const idx = 1 + i
    const a = i >= channels ? row[idx - channels] : 0
    const b = prev[i] ?? 0
    const c = i >= channels ? (prev[i - channels] ?? 0) : 0

    if (filterType === 1) row[idx] = (row[idx] + a) & 0xff
    else if (filterType === 2) row[idx] = (row[idx] + b) & 0xff
    else if (filterType === 3) row[idx] = (row[idx] + ((a + b) >>> 1)) & 0xff
    else if (filterType === 4) row[idx] = (row[idx] + paeth(a, b, c)) & 0xff
  }

  return row.subarray(1)
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)

  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

function readUint32BE(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0
  )
}

// `Uint8Array<any>` to escape TS 5.7+ strict generic on the buffer slot. The
// state vars and stream chunks have inconsistent generics in browser type defs;
// the runtime contract is the same, so we relax the type and validate by use.

function concat(a: Uint8Array<any>, b: Uint8Array<any>): Uint8Array<any> {
  if (a.byteLength === 0) return b
  if (b.byteLength === 0) return a
  const out = new Uint8Array(a.byteLength + b.byteLength)

  out.set(a, 0)
  out.set(b, a.byteLength)

  return out
}

function concatChunks(chunks: Uint8Array[], total?: number): Uint8Array {
  const t = total ?? chunks.reduce((s, c) => s + c.byteLength, 0)
  const out = new Uint8Array(t)
  let offset = 0

  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }

  return out
}
