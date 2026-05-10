// Browser PNG surface backed by upng-js (pure JS — no canvas).
//
// Why not the canvas-based BrowserPngSurface? Canvas premultiplies alpha
// during the toBlob/getImageData round-trip; for any pixel with α < 255 the
// RGB bytes lose precision. upng-js bypasses canvas entirely, but its RGBA
// output has produced truncated PNGs for medium/large payloads. We therefore
// expose this surface as RGB-only.
//
// Identical encode/decode logic to `@tokenpack/node`'s PngUpngSurface — only
// the `write`/`readFile` overrides differ (browser throws; node uses fs).
//
// `upng-js` ships no types — see the sibling `upng-js.d.ts` shim, which is
// picked up by the package's own tsconfig include and re-shimmed at the
// app-package level via `packages/app/src/types/upng-js.d.ts` for Next's
// isolated typecheck pipeline.

import { Buffer } from 'buffer'
import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'
import UPNG from 'upng-js'

const browserOnly = (method: string) =>
  new Error(
    `${method}() is not available in the browser surface — use writeBuffer/readBuffer for byte-level I/O.`,
  )

function expandRgbToRgba(rgb: Uint8Array, n: number): Uint8Array {
  const out = new Uint8Array(n * 4)

  for (let i = 0, j = 0; i < n; i += 1, j += 4) {
    out[j] = rgb[i * 3]
    out[j + 1] = rgb[i * 3 + 1]
    out[j + 2] = rgb[i * 3 + 2]
    out[j + 3] = 255
  }

  return out
}

function stripAlpha(rgba: Uint8Array, n: number): Uint8Array {
  const rgb = new Uint8Array(n * 3)

  for (let i = 0; i < n; i += 1) {
    rgb[i * 3] = rgba[i * 4]
    rgb[i * 3 + 1] = rgba[i * 4 + 1]
    rgb[i * 3 + 2] = rgba[i * 4 + 2]
  }

  return rgb
}

function detectFileChannels(rgbaData: Uint8Array, colorType: number): 3 | 4 {
  if (colorType !== 6) return 3
  const isFull4 =
    rgbaData[0] === 0xc0 && rgbaData[1] === 0xde && rgbaData[2] === 0xae && rgbaData[3] === 0x54

  if (isFull4) return 4
  const isCompact = rgbaData[0] === 0xc1

  if (isCompact && ((rgbaData[2] >> 2) & 0b11) === 3) return 4

  return 3
}

export class BrowserPngUpngSurface extends ImageSurface {
  override readonly supportedChannels = new Set<3 | 4>([3])

  constructor() {
    super({
      id: 'png-upng',
      label: 'PNG (upng-js, browser)',
      description:
        'Lossless 8-bit/channel PNG via upng-js — pure JS, no canvas, byte-exact RGB encode/decode.',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      preservesAlpha: true,
      maxBpp: 3,
    })
  }

  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    const { pixels, width, height, fileChannels } = image
    const n = width * height
    const rgba = fileChannels === 4 ? pixels : expandRgbToRgba(pixels, n)
    const sliced = rgba.slice()
    const buf = sliced.buffer as ArrayBuffer
    // See `@tokenpack/node`'s PngUpngSurface for the `forbidPlte=true`
    // rationale: without it, upng-js auto-quantizes small inputs to palette
    // PNGs, breaking the codec's byte-exact round-trip.
    const png = UPNG.encode([buf], width, height, 0, undefined, true)

    return Buffer.from(png)
  }

  async readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    const ab = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer
    const img = UPNG.decode(ab)
    const rgbaFrames = UPNG.toRGBA8(img)
    const rgba = new Uint8Array(rgbaFrames[0])
    const fileChannels = detectFileChannels(rgba, img.ctype)
    const n = img.width * img.height

    if (fileChannels === 4) {
      return { pixels: rgba, width: img.width, height: img.height, fileChannels: 4 }
    }

    return { pixels: stripAlpha(rgba, n), width: img.width, height: img.height, fileChannels: 3 }
  }

  async write(_filePath: string, _image: SurfacePixels): Promise<void> {
    throw browserOnly('PngUpngSurface.write')
  }

  async readFile(_filePath: string): Promise<SurfacePixels> {
    throw browserOnly('PngUpngSurface.readFile')
  }
}
