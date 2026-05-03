import fs from 'fs'
import { readHeader, HEADER_PIXELS } from './header.js'
import { readPNG } from './image.js'
import { getCodecById } from './codecs/registry.js'
import { reverseStyle } from './style.js'
import type { DecodeOptions } from './types.js'

export function decode(inputPath: string, options: DecodeOptions): void {
  const { pixels, width, height } = readPNG(inputPath)
  const header = readHeader(pixels)
  const codec = getCodecById(header.algorithmId)

  if (header.styleFlags & 0b01) {
    // backgroundOpacity stores (1 - opacity) * 255
    const opacity = header.backgroundOpacity === 0 ? 1.0 : 1 - (header.backgroundOpacity / 255)
    reverseStyle(pixels, width, height, header, opacity)
  }

  const dataPixels = pixels.slice(HEADER_PIXELS * 3)
  const output = codec.decode(dataPixels, header.fileLength, width, height)
  fs.writeFileSync(options.out, output)
}
