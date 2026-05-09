// Dot-mode rendering helpers — relocated from `core/src/render.ts` because
// these functions are surface-level concerns: they compute the 2D image
// layout from a stream of data cells and place data pixels into the grid.

import { HEADER_PIXELS } from '../header'
import { CHANNELS } from './channels'

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
  channels = CHANNELS,
): Uint8Array {
  const { imageWidth, imageHeight, gridWidth } = layout
  const pixels = new Uint8Array(imageWidth * imageHeight * channels)
  const dotOffset = Math.floor(cellSize / 2)

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
