import { HEADER_PIXELS } from './header'
import { CHANNELS } from './image'
import type { HeaderData } from './types'

export function applyStyle(
  pixels: Uint8Array,
  width: number,
  height: number,
  header: HeaderData,
  opacity: number,
  channels = CHANNELS,
): void {
  if (opacity >= 1.0 || !(header.styleFlags & 0b01)) return

  const from = header.gradientFrom
  const to = header.gradientTo
  const dir = header.gradientDirection
  const maxW = Math.max(width - 1, 1)
  const maxH = Math.max(height - 1, 1)

  for (let pixelIdx = HEADER_PIXELS; pixelIdx < width * height; pixelIdx++) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)
    const t =
      dir === 1 ? x / maxW : dir === 2 ? y / maxH : dir === 3 ? (x / maxW + y / maxH) / 2 : 0
    const base = pixelIdx * channels

    for (let c = 0; c < 3; c++) {
      const gradVal = Math.round(from[c] + (to[c] - from[c]) * t)

      pixels[base + c] = Math.round(pixels[base + c] * opacity + gradVal * (1 - opacity))
    }
  }
}

export function reverseStyle(
  pixels: Uint8Array,
  width: number,
  height: number,
  header: HeaderData,
  opacity: number,
  channels = CHANNELS,
): void {
  if (opacity >= 1.0 || !(header.styleFlags & 0b01)) return

  const from = header.gradientFrom
  const to = header.gradientTo
  const dir = header.gradientDirection
  const maxW = Math.max(width - 1, 1)
  const maxH = Math.max(height - 1, 1)

  for (let pixelIdx = HEADER_PIXELS; pixelIdx < width * height; pixelIdx++) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)
    const t =
      dir === 1 ? x / maxW : dir === 2 ? y / maxH : dir === 3 ? (x / maxW + y / maxH) / 2 : 0
    const base = pixelIdx * channels

    for (let c = 0; c < 3; c++) {
      const gradVal = Math.round(from[c] + (to[c] - from[c]) * t)

      pixels[base + c] = Math.min(
        255,
        Math.max(0, Math.round((pixels[base + c] - gradVal * (1 - opacity)) / opacity)),
      )
    }
  }
}
