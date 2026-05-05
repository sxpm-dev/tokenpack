import { readImage, readImageFromBuffer, writeImage } from '../image'
import type { ImageFormat } from '../types'
import { AbstractSurface, type SurfaceId, type SurfacePixels } from './types'

export interface ImageSurfaceInit {
  id: SurfaceId
  label: string
  format: ImageFormat
  extension: string
  mimeType: string
  streamable?: boolean
  preservesAlpha?: boolean
  maxBpp?: 1 | 2 | 3 | 4
}

export class ImageSurface extends AbstractSurface {
  readonly id: SurfaceId
  readonly label: string
  readonly format: ImageFormat
  readonly extension: string
  readonly mimeType: string
  readonly inputKind = 'raster-pixels' as const
  readonly lossless = true
  readonly streamable: boolean
  readonly supportedChannels = new Set<3 | 4>([3, 4])
  readonly preservesAlpha: boolean
  readonly maxBpp: 1 | 2 | 3 | 4

  constructor(init: ImageSurfaceInit) {
    super()
    this.id = init.id
    this.label = init.label
    this.format = init.format
    this.extension = init.extension
    this.mimeType = init.mimeType
    this.streamable = init.streamable ?? false
    this.preservesAlpha = init.preservesAlpha ?? init.format !== 'webp'
    this.maxBpp = init.maxBpp ?? 4
  }

  write(filePath: string, image: SurfacePixels): Promise<void> {
    return writeImage(
      filePath,
      image.pixels,
      image.width,
      image.height,
      image.fileChannels,
      this.format,
      this.streamable,
    )
  }

  readFile(filePath: string): Promise<SurfacePixels> {
    return readImage(filePath, this.format)
  }

  readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return readImageFromBuffer(buffer, this.format)
  }
}
