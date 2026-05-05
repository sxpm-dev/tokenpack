import { ImageSurface } from './image-surface'

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
}
