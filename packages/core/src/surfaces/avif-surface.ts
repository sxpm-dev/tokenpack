import sharp from 'sharp'

import { ImageSurface } from './image-surface'
import type { SurfacePixels } from './types'

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
}
