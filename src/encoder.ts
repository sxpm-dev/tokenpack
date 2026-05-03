import fs from 'fs'
import zlib from 'zlib'
import { getCodecByName } from './codecs/registry.js'
import { writeHeader, HEADER_PIXELS } from './header.js'
import { writePNG } from './image.js'
import { applyStyle } from './style.js'
import { dotLayout, renderDots } from './render.js'
import type { EncodeOptions } from './types.js'
import type { Codec } from './codecs/types.js'

export function calcDimensions(
  input: Buffer,
  codec: Codec,
  requestedWidth?: number,
): { width: number; height: number } {
  const dataPixelEst = codec.estimateDataPixels
    ? codec.estimateDataPixels(input)
    : Math.ceil(input.length / 3)
  const totalPixels = HEADER_PIXELS + dataPixelEst
  const side = Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1)))
  const width = requestedWidth ?? side
  const height = Math.ceil(totalPixels / width)
  return { width, height }
}

export function encode(input: Buffer, options: EncodeOptions): void {
  const codec = getCodecByName(options.algo ?? 'linear')
  const cellSize = Math.max(1, options.cellSize ?? 1)

  // ── Compression ─────────────────────────────────────────────────────────────
  let dataToEncode = input
  let compressionLevel = 0
  let uncompressedLength = 0

  if (options.compress) {
    const compressed = zlib.brotliCompressSync(input, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    })
    if (compressed.length < input.length) {
      dataToEncode = compressed
      compressionLevel = 2
      uncompressedLength = input.length
      const ratio = ((1 - compressed.length / input.length) * 100).toFixed(1)
      console.log(`Compressed ${input.length} → ${compressed.length} bytes (${ratio}% smaller)`)
    } else {
      console.log(`Compression skipped (file too small to benefit)`)
    }
  }

  // ── Style metadata ───────────────────────────────────────────────────────────
  const style = options.style
  const hasGradient = !!(style?.gradient)
  const gradFrom = style?.gradient?.from ?? [0, 0, 0]
  const gradTo   = style?.gradient?.to   ?? [0, 0, 0]
  const dirMap: Record<string, number> = { horizontal: 1, vertical: 2, diagonal: 3 }
  const gradDir  = style?.gradient ? (dirMap[style.gradient.direction] ?? 0) : 0
  const bgColor  = style?.background ?? [0, 0, 0]
  const rawOpacity  = style?.opacity ?? 1.0
  const blendAmount = hasGradient ? Math.round((1 - rawOpacity) * 255) : 0
  const opacity     = 1 - blendAmount / 255

  // ── Build image ──────────────────────────────────────────────────────────────
  if (cellSize > 1) {
    // Dot mode: sparse grid, gradient on background, data as center dots
    const dataPixelCount = codec.estimateDataPixels
      ? codec.estimateDataPixels(dataToEncode)
      : Math.ceil(dataToEncode.length / 3)

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
      dataPixelCount: 0,  // filled in below after encode
    }

    const dataRgb = codec.encode(dataToEncode, dataPixelCount, gridWidth, gridHeight)
    headerData.dataPixelCount = dataPixelCount
    const pixels  = renderDots(dataRgb, dataPixelCount, cellSize, layout, headerData)
    writeHeader(pixels, headerData)
    writePNG(options.out, pixels, imageWidth, imageHeight)

  } else {
    // Dense mode: every pixel is data
    const { width, height } = calcDimensions(dataToEncode, codec, options.width)
    const dataPixelCount = width * height - HEADER_PIXELS
    const totalPixels    = width * height

    const pixels = new Uint8Array(totalPixels * 3)
    const dataRgb = codec.encode(dataToEncode, dataPixelCount, width, height)
    pixels.set(dataRgb, HEADER_PIXELS * 3)

    const headerData = {
      version: 1,
      algorithmId: codec.id,
      fileLength: dataToEncode.length,
      width,
      height,
      styleFlags: (hasGradient ? 0b01 : 0) | (style?.background ? 0b10 : 0),
      ecLevel: 0,
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
    }

    writeHeader(pixels, headerData)
    if (hasGradient && blendAmount > 0) applyStyle(pixels, width, height, headerData, opacity)
    writePNG(options.out, pixels, width, height)
  }
}

export function encodeFile(inputPath: string, options: EncodeOptions): void {
  encode(fs.readFileSync(inputPath), options)
}
