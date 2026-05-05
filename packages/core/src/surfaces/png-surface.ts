import { ImageSurface } from './image-surface'

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
}
