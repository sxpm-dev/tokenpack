/**
 * Streaming token decoder — PNG format only.
 *
 * Pipeline:
 *   HTTP/file bytes
 *   → PNGChunkParser (parses PNG structure, decompresses IDAT via inflate)
 *   → scanline bytes (with filter bytes)
 *   → TokenPixelDecoder (strips filter, reads header, routes to codec)
 *   → codec.decodeChunk() if codec implements StreamingCodec, else linear pass-through
 *   → streaming brotli/deflate decompressor (if outer compression is set)
 *   → original bytes
 *
 * Codecs that implement StreamingCodec are decoded incrementally as rows arrive.
 * Non-streaming codecs fall back to the linear pass-through path (pixels = data bytes).
 * Only PNG format (WebP/AVIF have no streaming decoder in Node.js).
 */

import './algorithms/register-all'

import { Duplex, type Transform } from 'stream'
import zlib from 'zlib'

import { getAlgorithmById } from './algorithms/registry'
import type { Codec, StreamCodecState } from './codecs/types'
import { isStreamingCodec } from './codecs/types'
import { getCompressorByHeaderLevel } from './compressors'
import {
  COMPACT_HEADER_PIXELS,
  HEADER_PIXELS,
  isCompactToken,
  readCompactHeader,
  readHeader,
} from './header'
import { fromFileChannels } from './surfaces/channels'

// ── PNG filter reconstruction ─────────────────────────────────────────────

function unfilter(
  filterType: number,
  line: Uint8Array,
  prev: Uint8Array,
  channels: number,
): Buffer {
  const out = Buffer.from(line)

  for (let i = 0; i < out.length; i++) {
    const a = i >= channels ? out[i - channels] : 0
    const b = prev[i] ?? 0
    const c = i >= channels ? (prev[i - channels] ?? 0) : 0

    if (filterType === 1) out[i] = (out[i] + a) & 0xff
    else if (filterType === 2) out[i] = (out[i] + b) & 0xff
    else if (filterType === 3) out[i] = (out[i] + Math.floor((a + b) / 2)) & 0xff
    else if (filterType === 4) out[i] = (out[i] + paeth(a, b, c)) & 0xff
  }

  return out
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a),
    pb = Math.abs(p - b),
    pc = Math.abs(p - c)

  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

// ── Main streaming decoder ────────────────────────────────────────────────

/**
 * Returns a Duplex stream: pipe PNG token bytes in, read original bytes out.
 * The first output byte is emitted as soon as the decompressor produces output
 * — well before the full PNG is received.
 */
export function createTokenDecodeStream(_key?: string): Duplex {
  // Internal state
  let pngBuf = Buffer.alloc(0)
  let pngState: 'sig' | 'chunk' | 'done' = 'sig'
  let width = 0
  let fileChannels: 3 | 4 = 3
  let scanlineLen = 0

  // Pixel accumulation
  let scanlineBuf: Buffer = Buffer.alloc(0)
  let prevLine: Buffer = Buffer.alloc(0)
  let pixelBuf: Buffer = Buffer.alloc(0)

  // Token header state
  let headerParsed = false
  let headerBytes = 0
  let bpp: 1 | 2 | 3 | 4 = 3
  let dataLength = 0
  let compressionLevel = 0
  let fedToDecomp = 0
  let decompressor: Transform | null = null

  // Streaming codec state (null = linear/pass-through path)
  let activeCodec: Codec | null = null
  let codecState: StreamCodecState | null = null

  let outputEnded = false

  // Create the Duplex
  const stream = new Duplex({
    // Write side: accepts PNG bytes
    write(chunk: Buffer, _enc, cb) {
      pngBuf = Buffer.concat([pngBuf, chunk])
      parsePNG(cb)
    },
    final(cb) {
      cb()
    },
    // Read side: push decoded bytes (handled by decompressor events)
    read() {},
  })

  function parsePNG(cb: () => void) {
    while (true) {
      if (pngState === 'sig') {
        if (pngBuf.length < 8) break
        pngBuf = pngBuf.slice(8)
        pngState = 'chunk'
      }

      if (pngState === 'chunk') {
        if (pngBuf.length < 8) break
        const len = pngBuf.readUInt32BE(0)

        if (pngBuf.length < 12 + len) break
        const type = pngBuf.slice(4, 8).toString('ascii')
        const data = pngBuf.slice(8, 8 + len)

        pngBuf = pngBuf.slice(12 + len)

        if (type === 'IHDR') {
          width = data.readUInt32BE(0)
          fileChannels = data[9] === 6 ? 4 : 3
          scanlineLen = 1 + width * fileChannels
          prevLine = Buffer.alloc(width * fileChannels)
        } else if (type === 'IDAT') {
          // Feed IDAT through inflate synchronously via inflateSync for simplicity
          // For streaming, we'd use async inflate — but inflateRaw on each chunk works
          // because PNG uses a single deflate stream across all IDAT chunks.
          // We accumulate all IDAT data and inflate incrementally.
          onIDATChunk(data)
        } else if (type === 'IEND') {
          pngState = 'done'
          flushInflate()
          break
        }
      }
    }
    cb()
  }

  // We use zlib.inflate in streaming mode across all IDAT chunks
  let inflater: zlib.Inflate | null = null
  let idatDone = false

  function onIDATChunk(data: Buffer) {
    if (!inflater) {
      inflater = zlib.createInflate()
      inflater.on('data', (chunk: Buffer) => onScanlineBytes(chunk))
      inflater.on('end', () => {
        idatDone = true
        // For compressionLevel>0: decompressor.end() is called by feedDataPixels when
        // all data bytes have been fed — don't call it here (would cause double-end).
        // For compressionLevel===0: feedDataPixels pushes null; this is a safety net.
        if (!decompressor && !outputEnded) {
          stream.push(null)
          outputEnded = true
        }
      })
      inflater.on('error', e => stream.destroy(e))
    }
    inflater.write(data)
  }

  function flushInflate() {
    if (inflater && !idatDone) inflater.end()
  }

  function onScanlineBytes(chunk: Buffer) {
    scanlineBuf = Buffer.concat([scanlineBuf, chunk])

    while (scanlineLen > 0 && scanlineBuf.length >= scanlineLen) {
      const filterByte = scanlineBuf[0]
      const rawLine = scanlineBuf.slice(1, scanlineLen)

      scanlineBuf = scanlineBuf.slice(scanlineLen)

      const line = unfilter(filterByte, rawLine, prevLine, fileChannels)

      prevLine = line

      onPixelRow(line)
    }
  }

  function onPixelRow(pixels: Buffer) {
    if (!headerParsed) {
      pixelBuf = Buffer.concat([pixelBuf, pixels])

      if (pixelBuf.length >= COMPACT_HEADER_PIXELS * fileChannels && isCompactToken(pixelBuf)) {
        const needed = COMPACT_HEADER_PIXELS * fileChannels

        if (pixelBuf.length < needed) return
        const ch = readCompactHeader(pixelBuf)

        bpp = ch.channels
        compressionLevel = ch.flags & 0b10 ? 2 : 0
        dataLength = ch.dataLength
        headerBytes = needed
        activeCodec = getAlgorithmById(ch.algoId).codec ?? null
        finishHeader()
      } else if (pixelBuf.length >= HEADER_PIXELS * fileChannels) {
        const needed = HEADER_PIXELS * fileChannels

        try {
          readHeader(pixelBuf)
        } catch {
          return
        } // not a valid full header yet
        const h = readHeader(pixelBuf)

        bpp = h.channels
        compressionLevel = h.compressionLevel
        dataLength = h.fileLength
        headerBytes = needed
        activeCodec = getAlgorithmById(h.algorithmId).codec ?? null
        finishHeader()
      }

      return
    }

    feedDataPixels(pixels)
  }

  function finishHeader() {
    headerParsed = true
    if (activeCodec && isStreamingCodec(activeCodec)) {
      codecState = activeCodec.createDecodeState()
    }
    initDecompressor()
    const dataPixels = pixelBuf.slice(headerBytes)

    pixelBuf = Buffer.alloc(0)
    if (dataPixels.length > 0) feedDataPixels(dataPixels)
  }

  function initDecompressor() {
    if (compressionLevel === 0) {
      // No compression: pixel bytes are the data directly
      return
    }

    decompressor = getCompressorByHeaderLevel(compressionLevel).createDecodeStream?.() ?? null
    if (!decompressor) {
      stream.destroy(
        new Error(`Compression level ${compressionLevel} does not support streaming decode`),
      )

      return
    }
    decompressor.on('data', (c: Buffer) => stream.push(c))
    decompressor.on('end', () => {
      if (!outputEnded) {
        stream.push(null)
        outputEnded = true
      }
    })
    decompressor.on('error', e => stream.destroy(e))
  }

  function feedDataPixels(pixels: Buffer) {
    if (fedToDecomp >= dataLength) return

    const pixelCount = Math.floor(pixels.length / fileChannels)

    if (pixelCount === 0) return

    const fcBytes = pixels.slice(0, pixelCount * fileChannels)
    const bppBytes = fromFileChannels(fcBytes, pixelCount, fileChannels, bpp)

    // Route through codec.decodeChunk for StreamingCodec, otherwise treat bpp bytes as data directly
    let dataBytes: Buffer

    if (activeCodec && isStreamingCodec(activeCodec) && codecState !== null) {
      const result = activeCodec.decodeChunk(bppBytes, codecState)

      codecState = result.state
      dataBytes = result.bytes
    } else {
      dataBytes = Buffer.from(bppBytes)
    }

    const remaining = dataLength - fedToDecomp
    const toFeed = dataBytes.slice(0, Math.min(remaining, dataBytes.length))

    fedToDecomp += toFeed.length

    if (compressionLevel === 0) {
      // No decompressor — output directly
      stream.push(toFeed)
      if (fedToDecomp >= dataLength && !outputEnded) {
        stream.push(null)
        outputEnded = true
      }
    } else if (decompressor) {
      decompressor.write(toFeed)
      if (fedToDecomp >= dataLength) {
        decompressor.end()
      }
    }
  }

  return stream
}
