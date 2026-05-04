import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'
import {
  readHeader,
  readCompactHeader,
  isCompactToken,
  HEADER_PIXELS,
  COMPACT_HEADER_PIXELS,
} from './header'
import { readImage, readImageFromBuffer, fromFileChannels } from './image'
import { decryptData } from './crypto'
import { getCodecById } from './codecs/registry'
import { reverseStyle } from './style'
import { dotLayout, readDots } from './render'
import type { DecodeOptions, ImageFormat } from './types'

function decompress(buf: Buffer, level: number): Buffer {
  // levels 1, 3, 4 = deflate variants (inflate to decompress)
  if (level === 1 || level === 3 || level === 4) return zlib.inflateSync(buf)
  // levels 2, 5, 6 = brotli variants
  if (level === 2 || level === 5 || level === 6) return zlib.brotliDecompressSync(buf)
  return buf  // level 0 = no compression
}

function extToFormat(ext: string): ImageFormat {
  if (ext === '.avif') return 'avif'
  if (ext === '.webp') return 'webp'
  return 'png'
}

type ChunkResult = {
  bytes: Buffer
  compressionLevel: number
  uncompressedLength: number
  encrypted: boolean
  chunkIndex: number
  chunkTotal: number
  streamId: number
}

function processPixels(
  pixels: Uint8Array,
  width: number,
  height: number,
  fileChannels: 3 | 4,
): ChunkResult {
  if (isCompactToken(pixels)) {
    const ch = readCompactHeader(pixels)
    const bpp = ch.channels
    const codec = getCodecById(ch.algoId)
    const dataPixelsFc = pixels.slice(COMPACT_HEADER_PIXELS * fileChannels)
    const dataPixelCount = width * height - COMPACT_HEADER_PIXELS
    const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp)
    return {
      bytes: codec.decode(dataPixels, ch.dataLength, width, height, bpp),
      compressionLevel: (ch.flags & 0b10) ? 2 : 0,
      encrypted: (ch.flags & 0b01) !== 0,
      uncompressedLength: 0,
      chunkIndex: 0,
      chunkTotal: 1,
      streamId: 0,
    }
  }

  const header = readHeader(pixels)
  const codec = getCodecById(header.algorithmId)
  const bpp = header.channels

  if (header.cellSize > 1) {
    const dataPixelCount = header.dataPixelCount || Math.ceil(header.fileLength / bpp)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, header.cellSize)
    const dataRawFc = readDots(pixels, dataPixelCount, header.cellSize, layout, fileChannels)
    const dataRaw = fromFileChannels(dataRawFc, dataPixelCount, fileChannels, bpp)
    return {
      bytes: codec.decode(dataRaw, header.fileLength, layout.gridWidth, layout.gridHeight, bpp),
      compressionLevel: header.compressionLevel,
      encrypted: (header.ecLevel & 1) !== 0,
      uncompressedLength: header.uncompressedLength,
      chunkIndex: header.chunkIndex,
      chunkTotal: header.chunkTotal,
      streamId: header.streamId,
    }
  }

  if (header.styleFlags & 0b01) {
    const opacity = header.backgroundOpacity === 0 ? 1.0 : 1 - header.backgroundOpacity / 255
    reverseStyle(pixels, width, height, header, opacity, fileChannels)
  }
  const dataPixelsFc = pixels.slice(HEADER_PIXELS * fileChannels)
  const dataPixelCount = width * height - HEADER_PIXELS
  const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp)
  return {
    bytes: codec.decode(dataPixels, header.fileLength, width, height, bpp),
    compressionLevel: header.compressionLevel,
    encrypted: (header.ecLevel & 1) !== 0,
    uncompressedLength: header.uncompressedLength,
    chunkIndex: header.chunkIndex,
    chunkTotal: header.chunkTotal,
    streamId: header.streamId,
  }
}

// Extract raw encoded bytes from a single image file (no decompression or decryption).
async function extractChunkBytes(filePath: string): Promise<ChunkResult> {
  const format = extToFormat(path.extname(filePath).toLowerCase())
  const { pixels, width, height, fileChannels } = await readImage(filePath, format)
  return processPixels(pixels, width, height, fileChannels)
}

// Extract raw encoded bytes from an in-memory image buffer (no disk I/O).
async function extractChunkBytesFromBuffer(buffer: Buffer, format: ImageFormat): Promise<ChunkResult> {
  const { pixels, width, height, fileChannels } = await readImageFromBuffer(buffer, format)
  return processPixels(pixels, width, height, fileChannels)
}

// Auto-discover sibling chunk files from the path of chunk 0.
// token_1of3.png → [token_1of3.png, token_2of3.png, token_3of3.png]
function discoverChunks(firstPath: string, total: number): string[] {
  if (total === 1) return [firstPath]
  const ext = path.extname(firstPath)
  const dir = path.dirname(firstPath)
  const base = path.basename(firstPath, ext)
  // Strip existing _NofT suffix if present
  const stripped = base.replace(/_\d+of\d+$/, '')
  return Array.from({ length: total }, (_, i) => path.join(dir, `${stripped}_${i + 1}of${total}${ext}`))
}

function finalizeChunks(chunks: ChunkResult[], key?: string): Buffer {
  chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)

  if (chunks.length > 1) {
    const sid = chunks[0].streamId
    for (const c of chunks) {
      if (c.streamId !== sid) throw new Error(`Stream ID mismatch — chunks are from different tokens`)
    }
  }

  const { compressionLevel, encrypted } = chunks[0]

  let combined: Buffer
  if (encrypted) {
    if (!key) throw new Error('Token is encrypted — provide --key to decode')
    combined = Buffer.concat(chunks.map(c => decryptData(c.bytes, key)))
  } else {
    combined = Buffer.concat(chunks.map(c => c.bytes))
  }

  return decompress(combined, compressionLevel)
}

export async function decode(inputPath: string, options: DecodeOptions): Promise<void> {
  const first = await extractChunkBytes(inputPath)
  const paths = first.chunkTotal > 1 ? discoverChunks(inputPath, first.chunkTotal) : [inputPath]
  for (const p of paths) {
    if (!fs.existsSync(p)) throw new Error(`Missing chunk: ${p}`)
  }
  const chunks = first.chunkTotal > 1
    ? [first, ...await Promise.all(paths.slice(1).map(p => extractChunkBytes(p)))]
    : [first]
  fs.writeFileSync(options.out, finalizeChunks(chunks, options.key))
}

export async function decodeToBuffer(inputPath: string, key?: string): Promise<Buffer> {
  const first = await extractChunkBytes(inputPath)
  if (first.chunkTotal === 1) return finalizeChunks([first], key)
  const paths = discoverChunks(inputPath, first.chunkTotal)
  const rest = await Promise.all(paths.slice(1).map(p => extractChunkBytes(p)))
  return finalizeChunks([first, ...rest], key)
}

export async function decodeFromBuffer(imageBuffer: Buffer, key?: string, ext = '.png'): Promise<Buffer> {
  const format = extToFormat(ext)
  const first = await extractChunkBytesFromBuffer(imageBuffer, format)
  if (first.chunkTotal === 1) return finalizeChunks([first], key)
  // Multi-chunk: sibling discovery requires filesystem paths — write first chunk to temp file.
  const tmpPath = path.join(tmpdir(), `tp-dec-${randomUUID()}${ext}`)
  fs.writeFileSync(tmpPath, imageBuffer)
  try {
    const paths = discoverChunks(tmpPath, first.chunkTotal)
    const rest = await Promise.all(paths.slice(1).map(p => extractChunkBytes(p)))
    return finalizeChunks([first, ...rest], key)
  } finally {
    try { fs.unlinkSync(tmpPath) } catch {}
  }
}
