import sharp from 'sharp'
import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

import { sharpReadBuffer, sharpReadFile } from './sharp-read'

export class AvifSurface extends ImageSurface {
  static override readonly optionsSchema: OptionsSchema = {
    channels: enumOption([3, 4], 3, { label: 'Channels per pixel' }),
  }

  constructor() {
    super({
      id: 'avif',
      label: 'AVIF',
      description:
        'AVIF container — newest format, best ratios, slower encode, requires modern decoder.',
      format: 'avif',
      extension: '.avif',
      mimeType: 'image/avif',
      preservesAlpha: true,
      maxBpp: 4,
    })
  }

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    const { pixels, width, height, fileChannels } = image

    await sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength), {
      raw: { width, height, channels: fileChannels },
    })
      .avif({ lossless: true, quality: 100 })
      .toFile(filePath)
  }

  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    const { pixels, width, height, fileChannels } = image

    return sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength), {
      raw: { width, height, channels: fileChannels },
    })
      .avif({ lossless: true, quality: 100 })
      .toBuffer()
  }

  readFile(filePath: string): Promise<SurfacePixels> {
    return sharpReadFile(filePath)
  }

  readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return sharpReadBuffer(buffer)
  }
}
