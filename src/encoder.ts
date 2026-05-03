import fs from 'fs'
import { getCodecByName } from './codecs/registry.js'
import { writeHeader, HEADER_PIXELS } from './header.js'
import { writePNG } from './image.js'
import { applyStyle } from './style.js'
import type { EncodeOptions } from './types.js'

export function calcDimensions(dataBytes: number, requestedWidth?: number): { width: number; height: number } {
  const totalPixels = HEADER_PIXELS + Math.ceil(dataBytes / 3)
  const side = Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1)))
  const width = requestedWidth ?? side
  const height = Math.ceil(totalPixels / width)
  return { width, height }
}

export function encode(input: Buffer, options: EncodeOptions): void {
  const codec = getCodecByName(options.algo ?? 'linear')
  const { width, height } = calcDimensions(input.length, options.width)
  const dataPixelCount = width * height - HEADER_PIXELS
  const totalPixels = width * height

  const pixels = new Uint8Array(totalPixels * 3)
  const dataRgb = codec.encode(input, dataPixelCount, width, height)
  pixels.set(dataRgb, HEADER_PIXELS * 3)

  const style = options.style
  const hasGradient = !!(style?.gradient)
  const gradFrom = style?.gradient?.from ?? [0, 0, 0]
  const gradTo = style?.gradient?.to ?? [0, 0, 0]
  const dirMap: Record<string, number> = { horizontal: 1, vertical: 2, diagonal: 3 }
  const gradDir = style?.gradient ? (dirMap[style.gradient.direction] ?? 0) : 0
  const bgColor = style?.background ?? [0, 0, 0]

  // Quantize opacity to 8-bit so apply and reverse use the exact same value
  const rawOpacity = style?.opacity ?? 1.0
  const blendAmount = hasGradient ? Math.round((1 - rawOpacity) * 255) : 0
  const opacity = 1 - blendAmount / 255

  const headerData = {
    version: 1,
    algorithmId: codec.id,
    fileLength: input.length,
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
  }

  writeHeader(pixels, headerData)

  if (hasGradient && blendAmount > 0) applyStyle(pixels, width, height, headerData, opacity)

  writePNG(options.out, pixels, width, height)
}

export function encodeFile(inputPath: string, options: EncodeOptions): void {
  encode(fs.readFileSync(inputPath), options)
}
