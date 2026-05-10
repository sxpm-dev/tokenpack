// Node PNG surface backed by upng-js (pure JS, no sharp/pngjs).
//
// Why a second PNG surface? Browser-side, the canvas/toBlob round-trip
// premultiplies alpha and can corrupt 4-channel tokens (anywhere α < 255 the
// RGB bytes get mangled). upng-js bypasses canvas entirely, but its RGBA output
// has produced truncated PNGs for medium/large payloads. We therefore expose
// this surface as RGB-only while keeping it as a perf benchmark vs the existing
// pngjs-backed PngSurface.
//
// upng-js always emits colorType=6 (RGBA) PNGs; even a 3-channel codec's
// data goes through expanded to RGBA-with-α=255-padding. Inflated wire size
// is recovered by the outer compressor (alpha column compresses to almost
// nothing).
//
// fileChannels detection on read uses the same magic-byte sniff as
// PngSurface — see `detectFileChannels` for the contract.
//
// `upng-js` ships no types — see sibling `upng-js.d.ts` shim.

import fs from 'fs'
import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'
import UPNG from 'upng-js'

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

/**
 * Sniff bytes-per-pixel of the original PNG token. Mirrors `PngSurface`'s
 * detection — the codec writes magic bytes in the first few pixels that say
 * "this is actually a 3-channel codec packing." If the magic isn't there,
 * the alpha channel carries codec data (full 4-channel).
 */
function detectFileChannels(rgbaData: Uint8Array, colorType: number): 3 | 4 {
  if (colorType !== 6) return 3
  const isFull4 =
    rgbaData[0] === 0xc0 && rgbaData[1] === 0xde && rgbaData[2] === 0xae && rgbaData[3] === 0x54

  if (isFull4) return 4
  const isCompact = rgbaData[0] === 0xc1

  if (isCompact && ((rgbaData[2] >> 2) & 0b11) === 3) return 4

  return 3
}

export class PngUpngSurface extends ImageSurface {
  override readonly supportedChannels = new Set<3 | 4>([3])

  constructor() {
    super({
      id: 'png-upng',
      label: 'PNG (upng-js)',
      description:
        'Lossless 8-bit/channel PNG via upng-js — pure JS, identical bytes in node and browser, no canvas premultiplication.',
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
    // upng-js needs a fresh ArrayBuffer (not a Uint8Array view); copy if the
    // input is a partial view to avoid passing trailing/preceding bytes.
    // upng-js wants ArrayBuffer; copy if we have a partial view OR a non-
    // ArrayBuffer backing (SharedArrayBuffer).
    const sliced = rgba.slice()
    const buf = sliced.buffer as ArrayBuffer
    // `cnum=0` + `forbidPlte=true` → lossless 8-bit RGBA. Without
    // `forbidPlte`, upng-js auto-quantizes to a palette PNG when the input
    // has few unique colors (small text payloads), which corrupts the
    // codec's pixel-perfect data round-trip.
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

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    fs.writeFileSync(filePath, await this.writeBuffer(image))
  }

  async readFile(filePath: string): Promise<SurfacePixels> {
    return this.readBuffer(fs.readFileSync(filePath))
  }
}
