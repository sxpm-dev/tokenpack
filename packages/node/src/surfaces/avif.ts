import sharp from 'sharp'
import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

import { sharpReadBuffer, sharpReadFile } from './sharp-read'

export class AvifSurface extends ImageSurface {
  constructor() {
    super({
      id: 'avif',
      label: 'AVIF',
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

  readFile(filePath: string): Promise<SurfacePixels> {
    return sharpReadFile(filePath)
  }

  readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return sharpReadBuffer(buffer)
  }
}
