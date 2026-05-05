import { ImageSurface } from './image-surface'

export class StreamingPngSurface extends ImageSurface {
  constructor() {
    super({
      id: 'png-stream',
      label: 'Streaming PNG',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      streamable: true,
      preservesAlpha: true,
      maxBpp: 4,
    })
  }
}
