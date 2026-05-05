import { ImageSurface } from './image-surface'

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
}
