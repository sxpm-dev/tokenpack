import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { createHash, randomUUID } from 'crypto'
import { tmpdir } from 'os'
import { encryptData } from './crypto'
import { getCodecByName } from './codecs/registry'
import {
  writeHeader,
  writeCompactHeader,
  HEADER_PIXELS,
  COMPACT_HEADER_PIXELS,
} from './header'
import { writeImage, toFileChannels } from './image'
import { applyStyle } from './style'
import { dotLayout, renderDots } from './render'
import type { EncodeOptions, ImageFormat } from './types'
import type { Codec } from './codecs/types'

// compression modes that require full header (compact header only has 1 bit for compression info)
const FULL_HEADER_COMPRESSION_MODES = new Set(['deflate-1', 'deflate-6', 'deflate-9', 'brotli-4', 'brotli-6'])

function compressData(input: Buffer, mode: string): { data: Buffer; level: number } {
  switch (mode) {
    case 'none':
      return { data: input, level: 0 }
    case 'deflate-1':
      return { data: zlib.deflateSync(input, { level: 1 }), level: 3 }
    case 'deflate-6':
      return { data: zlib.deflateSync(input, { level: 6 }), level: 1 }
    case 'deflate-9':
      return { data: zlib.deflateSync(input, { level: 9 }), level: 4 }
    case 'brotli-4':
      return {
        data: zlib.brotliCompressSync(input, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }),
        level: 5,
      }
    case 'brotli-6':
      return {
        data: zlib.brotliCompressSync(input, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } }),
        level: 6,
      }
    case 'brotli-11':
    default:
      return {
        data: zlib.brotliCompressSync(input, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }),
        level: 2,
      }
  }
}

// Images wider than this trigger chunking.
const MAX_WIDTH = 1280
const MAX_PIXELS_PER_CHUNK = MAX_WIDTH * MAX_WIDTH - HEADER_PIXELS

// fileChannels: number of channels in the image file (3 for bpp=1,2,3; 4 for bpp=4)
function fileChannels(bpp: number): 3 | 4 {
  return bpp === 4 ? 4 : 3
}

function estimatePixels(codec: Codec, data: Buffer, bpp: number): number {
  return codec.estimateDataPixels
    ? codec.estimateDataPixels(data, bpp)
    : Math.ceil(data.length / bpp)
}

export function calcDimensions(
  input: Buffer,
  codec: Codec,
  requestedWidth?: number,
  headerPixels = HEADER_PIXELS,
  bpp = 3,
): { width: number; height: number } {
  const dataPixelEst = estimatePixels(codec, input, bpp)
  const totalPixels = headerPixels + dataPixelEst
  const side = Math.ceil(Math.sqrt(Math.max(totalPixels, headerPixels + 1)))
  const width = requestedWidth ?? Math.max(side, Math.min(totalPixels, 64))
  const height = Math.ceil(totalPixels / width)
  return { width, height }
}

// Derive chunk output paths from the base output path.
// Single chunk → out as-is. Multi-chunk → out_1of3.png, out_2of3.png, ...
function chunkPaths(out: string, total: number): string[] {
  if (total === 1) return [out]
  const ext = path.extname(out)
  const base = out.slice(0, -ext.length)
  return Array.from({ length: total }, (_, i) => `${base}_${i + 1}of${total}${ext}`)
}

function streamId(data: Buffer): number {
  return createHash('sha256').update(data).digest().readUInt32BE(0)
}

// Write a single dense-mode image chunk.
// pixels buffer uses fileChannels (3 or 4) bytes per pixel.
async function writeChunk(
  chunkData: Buffer,
  outPath: string,
  codec: Codec,
  chunkIndex: number,
  chunkTotal: number,
  sid: number,
  compressionLevel: number,
  uncompressedLength: number,
  encrypted: boolean,
  hasGradient: boolean,
  gradFrom: number[],
  gradTo: number[],
  gradDir: number,
  blendAmount: number,
  bgColor: number[],
  opacity: number,
  style: EncodeOptions['style'],
  bpp: 1 | 2 | 3 | 4,
  format: ImageFormat,
  streaming: boolean,
): Promise<void> {
  const fc = fileChannels(bpp)
  const dataPixelEst = estimatePixels(codec, chunkData, bpp)
  const totalPixels = HEADER_PIXELS + dataPixelEst
  const side = Math.min(MAX_WIDTH, Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1))))
  const width = side
  const height = Math.ceil(totalPixels / width)
  const dataPixelCount = width * height - HEADER_PIXELS

  // Pixel buffer uses fc bytes per pixel
  const pixels = new Uint8Array(width * height * fc)

  // Encode data → bpp bytes/pixel → expand to fc bytes/pixel → put after header
  const codecOut = codec.encode(chunkData, dataPixelCount, width, height, bpp)
  const expanded = toFileChannels(codecOut, dataPixelCount, bpp, fc)
  pixels.set(expanded, HEADER_PIXELS * fc)

  const headerData = {
    version: 1,
    algorithmId: codec.id,
    fileLength: chunkData.length,
    width,
    height,
    styleFlags: (hasGradient ? 0b01 : 0) | (style?.background ? 0b10 : 0),
    ecLevel: encrypted ? 1 : 0,
    codecMeta: new Uint8Array(16),
    gradientFrom: gradFrom as [number, number, number],
    gradientTo: gradTo as [number, number, number],
    gradientDirection: gradDir,
    backgroundOpacity: blendAmount,
    backgroundColor: bgColor as [number, number, number],
    compressionLevel,
    uncompressedLength,
    cellSize: 1,
    dataPixelCount: 0,
    chunkIndex,
    chunkTotal,
    streamId: sid,
    channels: bpp,
  }

  writeHeader(pixels, headerData)
  if (hasGradient && blendAmount > 0) applyStyle(pixels, width, height, headerData, opacity)
  await writeImage(outPath, pixels, width, height, fc, format, streaming)
}

export async function encode(input: Buffer, options: EncodeOptions): Promise<string[]> {
  const codec = getCodecByName(options.algo ?? 'linear')
  const cellSize = Math.max(1, options.cellSize ?? 1)
  const format: ImageFormat = options.format ?? 'png'

  // bpp: bytes of data per pixel. Semantic codec always forces bpp=3.
  // WebP lossless premultiplies alpha before encoding — alpha=0 zeros RGB, destroying data.
  let bpp: 1 | 2 | 3 | 4 = options.channels ?? 3
  if (codec.name === 'semantic') bpp = 3
  if (format === 'webp' && bpp === 4) bpp = 3

  const fc = fileChannels(bpp)

  // ── Compression ─────────────────────────────────────────────────────────────
  let dataToEncode = input
  let compressionLevel = 0
  let uncompressedLength = 0

  // Resolve effective compression mode: compressionMode > compress flag > none
  const effectiveMode = options.compressionMode
    ?? (options.compress ? 'brotli-11' : 'none')

  if (effectiveMode !== 'none') {
    const { data: compressed, level } = compressData(input, effectiveMode)
    if (compressed.length < input.length) {
      dataToEncode = compressed
      compressionLevel = level
      uncompressedLength = input.length
      const ratio = ((1 - compressed.length / input.length) * 100).toFixed(1)
      console.log(`Compressed [${effectiveMode}] ${input.length} → ${compressed.length} bytes (${ratio}% smaller)`)
    } else {
      console.log(`Compression skipped (file too small to benefit)`)
    }
  }

  // Modes other than none/brotli-11 require full header
  const forceFullHeader = FULL_HEADER_COMPRESSION_MODES.has(effectiveMode)

  // ── Encryption (after compression, before pixel encoding) ───────────────────
  let encrypted = false
  if (options.key) {
    dataToEncode = encryptData(dataToEncode, options.key)
    encrypted = true
    console.log(`Encrypted → ${dataToEncode.length} bytes`)
  }

  // ── Style metadata ───────────────────────────────────────────────────────────
  const style = options.style
  const hasGradient = !!style?.gradient
  const gradFrom = style?.gradient?.from ?? [0, 0, 0]
  const gradTo = style?.gradient?.to ?? [0, 0, 0]
  const dirMap: Record<string, number> = { horizontal: 1, vertical: 2, diagonal: 3 }
  const gradDir = style?.gradient ? (dirMap[style.gradient.direction] ?? 0) : 0
  const bgColor = style?.background ?? [0, 0, 0]
  const blendAmount = hasGradient ? Math.round((1 - (style?.opacity ?? 1.0)) * 255) : 0
  const opacity = 1 - blendAmount / 255

  // ── Compact mode: 2-pixel header, no style, wide-strip layout ───────────────
  // Semantic is intentionally visual — skip compact so patterns are readable.
  // Skip compact if chunking will be needed (compact has no chunk metadata).
  // Skip compact for bpp=1 or bpp=2 (compact header needs 6 bytes = 2 pixels × 3 channels,
  //   but bpp=1,2 don't cleanly fit the 6-byte header in 2 pixels).
  const dataPixelEstCheck = estimatePixels(codec, dataToEncode, bpp)
  const useCompact = cellSize === 1 && !hasGradient && !(style?.background)
    && codec.name !== 'semantic'
    && bpp !== 1 && bpp !== 2
    && dataPixelEstCheck <= MAX_PIXELS_PER_CHUNK
    && !forceFullHeader
  if (useCompact) {
    const { width, height } = calcDimensions(dataToEncode, codec, options.width, COMPACT_HEADER_PIXELS, bpp)
    const dataPixelCount = width * height - COMPACT_HEADER_PIXELS
    // Use fc bytes/pixel for the pixel buffer
    const pixels = new Uint8Array(width * height * fc)
    const codecOut = codec.encode(dataToEncode, dataPixelCount, width, height, bpp)
    const expanded = toFileChannels(codecOut, dataPixelCount, bpp, fc)
    pixels.set(expanded, COMPACT_HEADER_PIXELS * fc)
    const flags = (compressionLevel > 0 ? 0b10 : 0) | (encrypted ? 0b01 : 0)
    writeCompactHeader(pixels, { algoId: codec.id, flags, dataLength: dataToEncode.length, channels: bpp })
    await writeImage(options.out, pixels, width, height, fc, format)
    return [options.out]
  }

  // ── Dot mode ─────────────────────────────────────────────────────────────────
  if (cellSize > 1) {
    const dataPixelCount = estimatePixels(codec, dataToEncode, bpp)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, cellSize)
    const { imageWidth, imageHeight, gridWidth, gridHeight } = layout

    const headerData = {
      version: 1,
      algorithmId: codec.id,
      fileLength: dataToEncode.length,
      width: imageWidth,
      height: imageHeight,
      styleFlags: hasGradient ? 0b01 : 0,
      ecLevel: 0,
      codecMeta: new Uint8Array(16),
      gradientFrom: gradFrom as [number, number, number],
      gradientTo: gradTo as [number, number, number],
      gradientDirection: gradDir,
      backgroundOpacity: blendAmount,
      backgroundColor: bgColor as [number, number, number],
      compressionLevel,
      uncompressedLength,
      cellSize,
      dataPixelCount,
      chunkIndex: 0,
      chunkTotal: 1,
      streamId: 0,
      channels: bpp,
    }

    // Dot mode always uses 3 channels (fc for bpp=4 would be 4 but dots are typically bpp=3)
    const dataRaw = codec.encode(dataToEncode, dataPixelCount, gridWidth, gridHeight, bpp)
    const dataExpanded = toFileChannels(dataRaw, dataPixelCount, bpp, fc)
    const pixels = renderDots(dataExpanded, dataPixelCount, cellSize, layout, headerData, fc)
    writeHeader(pixels, headerData)
    await writeImage(options.out, pixels, imageWidth, imageHeight, fc, format)
    return [options.out]
  }

  // ── Dense mode with chunking ─────────────────────────────────────────────────
  const dataPixelEst = estimatePixels(codec, dataToEncode, bpp)
  const needsChunking = dataPixelEst > MAX_PIXELS_PER_CHUNK

  if (!needsChunking) {
    await writeChunk(dataToEncode, options.out, codec, 0, 1, 0,
      compressionLevel, uncompressedLength, encrypted,
      hasGradient, gradFrom, gradTo, gradDir, blendAmount, bgColor, opacity, style,
      bpp, format, options.streaming ?? false)
    return [options.out]
  }

  // Split dataToEncode into chunks of MAX_PIXELS_PER_CHUNK * bpp bytes each
  const maxBytesPerChunk = MAX_PIXELS_PER_CHUNK * bpp
  const chunkCount = Math.ceil(dataToEncode.length / maxBytesPerChunk)
  const sid = streamId(dataToEncode)
  const paths = chunkPaths(options.out, chunkCount)

  console.log(`Chunking into ${chunkCount} images (${MAX_WIDTH}px max width)`)

  for (let i = 0; i < chunkCount; i++) {
    const start = i * maxBytesPerChunk
    const chunk = dataToEncode.slice(start, start + maxBytesPerChunk)
    await writeChunk(chunk, paths[i], codec, i, chunkCount, sid,
      compressionLevel, uncompressedLength, encrypted,
      hasGradient, gradFrom, gradTo, gradDir, blendAmount, bgColor, opacity, style,
      bpp, format, options.streaming ?? false)
    console.log(`  Chunk ${i + 1}/${chunkCount} → ${paths[i]}`)
  }
  return paths
}

export async function encodeFile(inputPath: string, options: EncodeOptions): Promise<void> {
  await encode(fs.readFileSync(inputPath), options)
}

export async function encodeToBuffer(input: Buffer, options: Omit<EncodeOptions, 'out'>): Promise<Buffer[]> {
  const ext = options.format === 'avif' ? '.avif' : options.format === 'webp' ? '.webp' : '.png'
  const tmpBase = path.join(tmpdir(), `tp-enc-${randomUUID()}${ext}`)
  const writtenPaths = await encode(input, { ...options, out: tmpBase })
  try {
    return writtenPaths.map(p => fs.readFileSync(p))
  } finally {
    for (const p of writtenPaths) {
      try { fs.unlinkSync(p) } catch {}
    }
  }
}
