import fs from 'fs'
import { PNG } from 'pngjs'
import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

// PNG colorType: bpp=1,2,3 → RGB (2), bpp=4 → RGBA (6).
function pngColorType(fileChannels: 3 | 4): 2 | 6 {
  return fileChannels === 4 ? 6 : 2
}

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

function detectFileChannels(d: Buffer, colorType: number): 3 | 4 {
  if (colorType !== 6) return 3
  const isFull4 = d[0] === 0xc0 && d[1] === 0xde && d[2] === 0xae && d[3] === 0x54

  if (isFull4) return 4
  const isCompact = d[0] === 0xc1

  if (isCompact && ((d[2] >> 2) & 0b11) === 3) return 4

  return 3
}

interface PngLike {
  data: Buffer
  width: number
  height: number
  colorType: number
}

function parsePngjs(png: PngLike): SurfacePixels {
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
  static override readonly optionsSchema: OptionsSchema = {
    channels: enumOption([3, 4], 3, { label: 'Channels per pixel' }),
  }

  constructor() {
    super({
      id: 'png',
      label: 'PNG',
      description: 'Lossless 8-bit/channel PNG. Universal browser support, full alpha.',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      preservesAlpha: true,
      maxBpp: 4,
    })
  }

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    fs.writeFileSync(filePath, await this.writeBuffer(image))
  }

  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    const { pixels, width, height, fileChannels } = image
    const png = new PNG({ width, height, filterType: -1 })

    png.data = Buffer.alloc(width * height * 4)
    packRgba(png.data, pixels, width * height, fileChannels)

    return PNG.sync.write(png, { colorType: pngColorType(fileChannels), inputColorType: 6 })
  }

  async readFile(filePath: string): Promise<SurfacePixels> {
    return parsePngjs(PNG.sync.read(fs.readFileSync(filePath)))
  }

  async readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return parsePngjs(PNG.sync.read(buffer))
  }
}
