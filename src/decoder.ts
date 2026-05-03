import fs from 'fs'
import zlib from 'zlib'
import { readHeader, HEADER_PIXELS } from './header.js'
import { readPNG } from './image.js'
import { getCodecById } from './codecs/registry.js'
import { reverseStyle } from './style.js'
import { dotLayout, readDots } from './render.js'
import type { DecodeOptions } from './types.js'

export function decode(inputPath: string, options: DecodeOptions): void {
  const { pixels, width: imageWidth, height: imageHeight } = readPNG(inputPath)
  const header = readHeader(pixels)
  const codec  = getCodecById(header.algorithmId)
  const cellSize = header.cellSize > 1 ? header.cellSize : 1

  let output: Buffer

  if (cellSize > 1) {
    // Dot mode: use the exact pixel count stored by the encoder
    const dataPixelCount = header.dataPixelCount || Math.ceil(header.fileLength / 3)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, cellSize)
    const gridWidth  = layout.gridWidth
    const gridHeight = layout.gridHeight

    const dataRgb = readDots(pixels, dataPixelCount, cellSize, layout)
    output = codec.decode(dataRgb, header.fileLength, gridWidth, gridHeight)
  } else {
    // Dense mode
    if (header.styleFlags & 0b01) {
      const opacity = header.backgroundOpacity === 0 ? 1.0 : 1 - (header.backgroundOpacity / 255)
      reverseStyle(pixels, imageWidth, imageHeight, header, opacity)
    }
    const dataPixels = pixels.slice(HEADER_PIXELS * 3)
    output = codec.decode(dataPixels, header.fileLength, imageWidth, imageHeight)
  }

  // Decompress if needed
  if (header.compressionLevel === 1) {
    output = zlib.inflateSync(output)
  } else if (header.compressionLevel === 2) {
    output = zlib.brotliDecompressSync(output)
  }

  fs.writeFileSync(options.out, output)
}

export function decodeToBuffer(inputPath: string): Buffer {
  const { pixels, width: imageWidth, height: imageHeight } = readPNG(inputPath)
  const header = readHeader(pixels)
  const codec  = getCodecById(header.algorithmId)
  const cellSize = header.cellSize > 1 ? header.cellSize : 1

  let output: Buffer

  if (cellSize > 1) {
    const dataPixelCount = header.dataPixelCount || Math.ceil(header.fileLength / 3)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, cellSize)
    const dataRgb = readDots(pixels, dataPixelCount, cellSize, layout)
    output = codec.decode(dataRgb, header.fileLength, layout.gridWidth, layout.gridHeight)
  } else {
    if (header.styleFlags & 0b01) {
      const opacity = header.backgroundOpacity === 0 ? 1.0 : 1 - (header.backgroundOpacity / 255)
      reverseStyle(pixels, imageWidth, imageHeight, header, opacity)
    }
    const dataPixels = pixels.slice(HEADER_PIXELS * 3)
    output = codec.decode(dataPixels, header.fileLength, imageWidth, imageHeight)
  }

  if (header.compressionLevel === 1) output = zlib.inflateSync(output)
  else if (header.compressionLevel === 2) output = zlib.brotliDecompressSync(output)

  return output
}
