// Channel-count conversions between codec bpp (1-4) and surface fileChannels (3 or 4).
// Used when packing codec output into the surface's pixel buffer and when extracting it back.

export const CHANNELS = 3

// bpp < fc: zero-fill remaining channels, set alpha=255 if fc=4.
export function toFileChannels(pixels: Uint8Array, n: number, bpp: number, fc: number): Uint8Array {
  if (bpp === fc) return pixels
  const out = new Uint8Array(n * fc)

  for (let i = 0; i < n; i++) {
    for (let c = 0; c < Math.min(bpp, fc); c++) {
      out[i * fc + c] = pixels[i * bpp + c]
    }
    if (fc === 4 && bpp < 4) out[i * 4 + 3] = 255
  }

  return out
}

// Extract first bpp channels from each fc-channel pixel.
export function fromFileChannels(
  pixels: Uint8Array,
  n: number,
  fc: number,
  bpp: number,
): Uint8Array {
  if (bpp === fc) return pixels
  const out = new Uint8Array(n * bpp)

  if (bpp === 3 && fc === 4) {
    for (let i = 0; i < n; i++) {
      out[i * 3] = pixels[i * 4]
      out[i * 3 + 1] = pixels[i * 4 + 1]
      out[i * 3 + 2] = pixels[i * 4 + 2]
    }

    return out
  }
  const minCh = Math.min(bpp, fc)

  for (let i = 0; i < n; i++) {
    for (let c = 0; c < minCh; c++) out[i * bpp + c] = pixels[i * fc + c]
  }

  return out
}
