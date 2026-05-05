import fs from 'fs'
import { PNG } from 'pngjs'

import { ImageSurface } from './image-surface'
import type { SurfacePixels } from './types'

// PNG colorType: bpp=1,2,3 → RGB (2), bpp=4 → RGBA (6).
function pngColorType(fileChannels: 3 | 4): 2 | 6 {
  return fileChannels === 4 ? 6 : 2
}

// Pack fileChannels-bytes-per-pixel data into pngjs's RGBA buffer.
function packRgba(target: Buffer, pixels: Uint8Array, n: number, fileChannels: 3 | 4): void {
  if (fileChannels === 4) {
    for (let i = 0; i < n; i++) {
      target[i * 4] = pixels[i * 4]
      target[i * 4 + 1] = pixels[i * 4 + 1]
      target[i * 4 + 2] = pixels[i * 4 + 2]
      target[i * 4 + 3] = pixels[i * 4 + 3]
    }
    return
  }
  for (let i = 0; i < n; i++) {
    target[i * 4] = pixels[i * 3]
    target[i * 4 + 1] = pixels[i * 3 + 1]
    target[i * 4 + 2] = pixels[i * 3 + 2]
    target[i * 4 + 3] = 255
  }
}

// Detect bpp=4 in pngjs RGBA output: full-header magic 0xC0DEAE54 or compact-header bppBits=3.
function detectFileChannels(d: Buffer, colorType: number): 3 | 4 {
  if (colorType !== 6) return 3
  const isFull4 = d[0] === 0xc0 && d[1] === 0xde && d[2] === 0xae && d[3] === 0x54
  if (isFull4) return 4
  const isCompact = d[0] === 0xc1
  if (isCompact && ((d[2] >> 2) & 0b11) === 3) return 4
  return 3
}

function parsePngjs(png: ReturnType<typeof PNG.sync.read>): SurfacePixels {
  const n = png.width * png.height
  const fileChannels = detectFileChannels(png.data, png.colorType)

  if (fileChannels === 4) {
    const out4 = new Uint8Array(n * 4)
    for (let i = 0; i < n; i++) {
      out4[i * 4] = png.data[i * 4]
      out4[i * 4 + 1] = png.data[i * 4 + 1]
      out4[i * 4 + 2] = png.data[i * 4 + 2]
      out4[i * 4 + 3] = png.data[i * 4 + 3]
    }
    return { pixels: out4, width: png.width, height: png.height, fileChannels: 4 }
  }

  const out3 = new Uint8Array(n * 3)
  for (let i = 0; i < n; i++) {
    out3[i * 3] = png.data[i * 4]
    out3[i * 3 + 1] = png.data[i * 4 + 1]
    out3[i * 3 + 2] = png.data[i * 4 + 2]
  }
  return { pixels: out3, width: png.width, height: png.height, fileChannels: 3 }
}

export class PngSurface extends ImageSurface {
  constructor() {
    super({
      id: 'png',
      label: 'PNG',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      preservesAlpha: true,
      maxBpp: 4,
    })
  }

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    PngSurface.encodeSync(filePath, image)
  }

  // Sync pngjs writer — used by surface.write and by tools that want a guaranteed-sync write.
  static encodeSync(filePath: string, image: SurfacePixels): void {
    const { pixels, width, height, fileChannels } = image
    const png = new PNG({ width, height, filterType: -1 })
    png.data = Buffer.alloc(width * height * 4)
    packRgba(png.data, pixels, width * height, fileChannels)
    fs.writeFileSync(
      filePath,
      PNG.sync.write(png, { colorType: pngColorType(fileChannels), inputColorType: 6 }),
    )
  }

  // Sync pngjs reader — kept for tooling that can't use sharp's async API.
  static decodeSync(filePath: string): SurfacePixels {
    return parsePngjs(PNG.sync.read(fs.readFileSync(filePath)))
  }
}
