import type { HeaderData } from './types.js'

function gradientColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  channel: number
): number {
  return Math.round(from[channel] + (to[channel] - from[channel]) * t)
}

function blendFactor(x: number, y: number, width: number, height: number, direction: number): number {
  if (direction === 1) return x / Math.max(width - 1, 1)
  if (direction === 2) return y / Math.max(height - 1, 1)
  if (direction === 3) return (x / Math.max(width - 1, 1) + y / Math.max(height - 1, 1)) / 2
  return 0
}

export function applyStyle(
  pixels: Uint8Array,
  width: number,
  height: number,
  header: HeaderData,
  opacity: number
): void {
  if (opacity >= 1.0) return
  if (!(header.styleFlags & 0b01)) return

  for (let pixelIdx = 32; pixelIdx < width * height; pixelIdx++) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)
    const t = blendFactor(x, y, width, height, header.gradientDirection)
    for (let c = 0; c < 3; c++) {
      const dataVal = pixels[pixelIdx * 3 + c]
      const gradVal = gradientColor(header.gradientFrom, header.gradientTo, t, c)
      pixels[pixelIdx * 3 + c] = Math.round(dataVal * opacity + gradVal * (1 - opacity))
    }
  }
}

export function reverseStyle(
  pixels: Uint8Array,
  width: number,
  height: number,
  header: HeaderData,
  opacity: number
): void {
  if (opacity >= 1.0) return
  if (!(header.styleFlags & 0b01)) return

  for (let pixelIdx = 32; pixelIdx < width * height; pixelIdx++) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)
    const t = blendFactor(x, y, width, height, header.gradientDirection)
    for (let c = 0; c < 3; c++) {
      const blended = pixels[pixelIdx * 3 + c]
      const gradVal = gradientColor(header.gradientFrom, header.gradientTo, t, c)
      pixels[pixelIdx * 3 + c] = Math.min(255, Math.max(0,
        Math.round((blended - gradVal * (1 - opacity)) / opacity)
      ))
    }
  }
}
