import sharp from 'sharp'

import { ImageSurface } from './image-surface'
import type { SurfacePixels } from './types'

export class WebpSurface extends ImageSurface {
  constructor() {
    super({
      id: 'webp',
      label: 'WebP',
      format: 'webp',
      extension: '.webp',
      mimeType: 'image/webp',
      preservesAlpha: false,
      maxBpp: 3,
    })
  }

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    const { pixels, width, height, fileChannels } = image
    await sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength), {
      raw: { width, height, channels: fileChannels },
    })
      .webp({ lossless: true, quality: 100 })
      .toFile(filePath)
  }
}
