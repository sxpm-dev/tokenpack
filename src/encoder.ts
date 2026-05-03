import fs from 'fs'
import { getCodecByName } from './codecs/registry.js'
import { writeHeader, HEADER_PIXELS } from './header.js'
import { writePNG } from './image.js'
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

  writeHeader(pixels, {
    version: 1,
    algorithmId: codec.id,
    fileLength: input.length,
    width,
    height,
    styleFlags: 0,
    ecLevel: 0,
    codecMeta: new Uint8Array(16),
    gradientFrom: [0, 0, 0],
    gradientTo: [0, 0, 0],
    gradientDirection: 0,
    backgroundOpacity: 0,
    backgroundColor: [0, 0, 0],
  })

  writePNG(options.out, pixels, width, height)
}

export function encodeFile(inputPath: string, options: EncodeOptions): void {
  encode(fs.readFileSync(inputPath), options)
}
