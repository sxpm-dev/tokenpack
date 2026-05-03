import type { HeaderData } from './types.js'

// ── Gradient helpers (shared with style.ts, duplicated to avoid coupling) ────

function gradientAt(
  from: [number, number, number],
  to: [number, number, number],
  x: number,
  y: number,
  width: number,
  height: number,
  direction: number,
  channel: number,
): number {
  let t = 0
  if (direction === 1) t = x / Math.max(width - 1, 1)
  else if (direction === 2) t = y / Math.max(height - 1, 1)
  else if (direction === 3) t = (x / Math.max(width - 1, 1) + y / Math.max(height - 1, 1)) / 2
  return Math.round(from[channel] + (to[channel] - from[channel]) * t)
}

// ── Dot grid dimensions ───────────────────────────────────────────────────────

export interface DotLayout {
  gridWidth: number   // data cells per row
  gridHeight: number  // data cells per column
  imageWidth: number  // gridWidth  * cellSize
  imageHeight: number // gridHeight * cellSize
}

export function dotLayout(
  totalCells: number,   // HEADER_PIXELS + dataPixelCount
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

// ── Render: data pixels → dot image ──────────────────────────────────────────

/**
 * Build a full image buffer in dot mode.
 *
 * Each data pixel occupies the center of a cellSize×cellSize cell.
 * Cell background is filled with the gradient color.
 * The caller must write the header (first 32 pixels) AFTER this call,
 * which overwrites those cells with the actual header bytes.
 */
export function renderDots(
  dataRgb: Uint8Array,    // flat RGB from codec (3 bytes per data pixel)
  dataCount: number,
  cellSize: number,
  layout: DotLayout,
  header: HeaderData,
): Uint8Array {
  const { imageWidth, imageHeight, gridWidth } = layout
  const pixels = new Uint8Array(imageWidth * imageHeight * 3)
  const hasGradient = (header.styleFlags & 0b01) !== 0
  const dotOffset = Math.floor(cellSize / 2)

  // ── 1. Fill entire image with gradient background (or black if no gradient) ─
  for (let py = 0; py < imageHeight; py++) {
    for (let px = 0; px < imageWidth; px++) {
      const idx = (py * imageWidth + px) * 3
      if (hasGradient) {
        for (let c = 0; c < 3; c++) {
          pixels[idx + c] = gradientAt(
            header.gradientFrom, header.gradientTo,
            px, py, imageWidth, imageHeight,
            header.gradientDirection, c,
          )
        }
      }
      // else: stays 0 (black)
    }
  }

  // ── 2. Place data dots (exact codec bytes — no blending, fully lossless) ────
  // Cell index 0..31 are reserved for the header; data starts at cell 32.
  for (let i = 0; i < dataCount; i++) {
    const cellIdx = i + 32
    const cx = cellIdx % gridWidth
    const cy = Math.floor(cellIdx / gridWidth)
    const px = cx * cellSize + dotOffset
    const py = cy * cellSize + dotOffset
    if (px < imageWidth && py < imageHeight) {
      const imgIdx = (py * imageWidth + px) * 3
      pixels[imgIdx]     = dataRgb[i * 3]
      pixels[imgIdx + 1] = dataRgb[i * 3 + 1]
      pixels[imgIdx + 2] = dataRgb[i * 3 + 2]
    }
  }

  return pixels
}

// ── Read: dot image → data pixels ────────────────────────────────────────────

/**
 * Extract data pixels from a dot-mode image.
 * Reads the center pixel of each cell, skipping the first 32 cells (header).
 */
export function readDots(
  pixels: Uint8Array,
  dataCount: number,
  cellSize: number,
  layout: DotLayout,
): Uint8Array {
  const { imageWidth, gridWidth } = layout
  const result = new Uint8Array(dataCount * 3)
  const dotOffset = Math.floor(cellSize / 2)

  for (let i = 0; i < dataCount; i++) {
    const cellIdx = i + 32
    const cx = cellIdx % gridWidth
    const cy = Math.floor(cellIdx / gridWidth)
    const px = cx * cellSize + dotOffset
    const py = cy * cellSize + dotOffset
    if (px < imageWidth) {
      const imgIdx = (py * imageWidth + px) * 3
      result[i * 3]     = pixels[imgIdx]
      result[i * 3 + 1] = pixels[imgIdx + 1]
      result[i * 3 + 2] = pixels[imgIdx + 2]
    }
  }

  return result
}
