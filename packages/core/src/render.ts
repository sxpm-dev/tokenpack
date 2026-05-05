import { HEADER_PIXELS } from './header'
import { CHANNELS } from './image'
import type { HeaderData } from './types'

export interface DotLayout {
  gridWidth: number
  gridHeight: number
  imageWidth: number
  imageHeight: number
}

export function dotLayout(
  totalCells: number,
  cellSize: number,
  requestedGridWidth?: number,
): DotLayout {
  const gridSide = Math.ceil(Math.sqrt(Math.max(totalCells, 33)))
  const gridWidth = requestedGridWidth ?? gridSide
  const gridHeight = Math.ceil(totalCells / gridWidth)

  return {
    gridWidth,
    gridHeight,
    imageWidth: gridWidth * cellSize,
    imageHeight: gridHeight * cellSize,
  }
}

export function renderDots(
  dataRgba: Uint8Array, // flat data from codec (fileChannels bytes per data pixel)
  dataCount: number,
  cellSize: number,
  layout: DotLayout,
  header: HeaderData,
  channels = CHANNELS,
): Uint8Array {
  const { imageWidth, imageHeight, gridWidth } = layout
  const pixels = new Uint8Array(imageWidth * imageHeight * channels)
  const hasGradient = (header.styleFlags & 0b01) !== 0
  const dotOffset = Math.floor(cellSize / 2)
  const from = header.gradientFrom
  const to = header.gradientTo
  const dir = header.gradientDirection
  const maxW = Math.max(imageWidth - 1, 1)
  const maxH = Math.max(imageHeight - 1, 1)

  for (let py = 0; py < imageHeight; py++) {
    for (let px = 0; px < imageWidth; px++) {
      const idx = (py * imageWidth + px) * channels

      if (hasGradient) {
        const t =
          dir === 1
            ? px / maxW
            : dir === 2
              ? py / maxH
              : dir === 3
                ? (px / maxW + py / maxH) / 2
                : 0

        pixels[idx] = Math.round(from[0] + (to[0] - from[0]) * t)
        pixels[idx + 1] = Math.round(from[1] + (to[1] - from[1]) * t)
        pixels[idx + 2] = Math.round(from[2] + (to[2] - from[2]) * t)
      }
    }
  }

  for (let i = 0; i < dataCount; i++) {
    const cellIdx = i + HEADER_PIXELS
    const cx = cellIdx % gridWidth
    const cy = Math.floor(cellIdx / gridWidth)
    const px = cx * cellSize + dotOffset
    const py = cy * cellSize + dotOffset

    if (px < imageWidth && py < imageHeight) {
      const imgIdx = (py * imageWidth + px) * channels

      pixels.set(dataRgba.subarray(i * channels, i * channels + channels), imgIdx)
    }
  }

  return pixels
}

export function readDots(
  pixels: Uint8Array,
  dataCount: number,
  cellSize: number,
  layout: DotLayout,
  channels = CHANNELS,
): Uint8Array {
  const { imageWidth, gridWidth } = layout
  const result = new Uint8Array(dataCount * channels)
  const dotOffset = Math.floor(cellSize / 2)

  for (let i = 0; i < dataCount; i++) {
    const cellIdx = i + HEADER_PIXELS
    const cx = cellIdx % gridWidth
    const cy = Math.floor(cellIdx / gridWidth)
    const px = cx * cellSize + dotOffset
    const py = cy * cellSize + dotOffset

    if (px < imageWidth) {
      const imgIdx = (py * imageWidth + px) * channels

      result.set(pixels.subarray(imgIdx, imgIdx + channels), i * channels)
    }
  }

  return result
}
