// Decoration renderer for PixelRange* algorithms.
//
// PixelRange* artifacts are real images — the data lives in an ancillary
// chunk, but the IDAT (visible pixels) still has to render *something*.
// Three modes:
//   - 'placeholder' — solid color fill at decorationSize × decorationSize
//   - 'gradient'    — left-to-right interpolation between two colors
//   - 'data-art'    — caller pre-rendered a SurfacePixels (e.g. via DenseDrawer)

import type { SurfacePixels } from './types'

export type DecorationKind = 'placeholder' | 'gradient' | 'data-art'

export interface DecorationConfig {
  kind: DecorationKind
  /** Pixel size of the decoration image (square). Ignored for 'data-art'. */
  size: number
  /** RGB triple. Used by 'placeholder' (solid fill) and 'gradient' (start). */
  colorFrom: [number, number, number]
  /** RGB triple. Used by 'gradient' (end). Ignored by 'placeholder'. */
  colorTo: [number, number, number]
  /** Pre-rendered pixels passed when kind === 'data-art'. */
  dataArtPixels?: SurfacePixels
}

export function renderDecoration(cfg: DecorationConfig): SurfacePixels {
  if (cfg.kind === 'data-art') {
    if (!cfg.dataArtPixels) {
      throw new Error('renderDecoration: dataArtPixels required when kind === "data-art"')
    }

    return cfg.dataArtPixels
  }

  const size = Math.max(1, cfg.size | 0)
  const fileChannels: 3 = 3
  const pixels = new Uint8Array(size * size * 3)

  if (cfg.kind === 'placeholder') {
    const [r, g, b] = cfg.colorFrom

    for (let i = 0; i < size * size; i++) {
      pixels[i * 3] = r
      pixels[i * 3 + 1] = g
      pixels[i * 3 + 2] = b
    }

    return { pixels, width: size, height: size, fileChannels }
  }

  // gradient — left-to-right interpolation
  const [r0, g0, b0] = cfg.colorFrom
  const [r1, g1, b1] = cfg.colorTo
  const denom = size > 1 ? size - 1 : 1

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = x / denom
      const idx = (y * size + x) * 3

      pixels[idx] = Math.round(r0 + (r1 - r0) * t)
      pixels[idx + 1] = Math.round(g0 + (g1 - g0) * t)
      pixels[idx + 2] = Math.round(b0 + (b1 - b0) * t)
    }
  }

  return { pixels, width: size, height: size, fileChannels }
}
