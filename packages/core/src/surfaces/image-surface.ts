import type { ImageFormat } from '../types'
import { AbstractSurface, type SurfaceId, type SurfacePixels } from './types'

export interface ImageSurfaceInit {
  id: SurfaceId
  label: string
  description?: string
  format: ImageFormat
  extension: string
  mimeType: string
  streamable?: boolean
  preservesAlpha?: boolean
  maxBpp?: 1 | 2 | 3 | 4
}

// Env-neutral base class for raster surfaces. Concrete subclasses live in
// env packages: pngjs/sharp impls in `@tokenpack/node`, Canvas/createImageBitmap
// impls in `@tokenpack/browser`. The abstract `write` / `readFile` / `readBuffer`
// methods are required — there is no Node-only fallback in core.
export abstract class ImageSurface extends AbstractSurface {
  readonly id: SurfaceId
  readonly label: string
  readonly description: string
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
    this.description = init.description ?? ''
    this.format = init.format
    this.extension = init.extension
    this.mimeType = init.mimeType
    this.streamable = init.streamable ?? false
    this.preservesAlpha = init.preservesAlpha ?? init.format !== 'webp'
    this.maxBpp = init.maxBpp ?? 4
  }

  abstract write(filePath: string, image: SurfacePixels): Promise<void>
  abstract readFile(filePath: string): Promise<SurfacePixels>
  abstract readBuffer(buffer: Buffer): Promise<SurfacePixels>
  abstract writeBuffer(image: SurfacePixels): Promise<Buffer>
}
