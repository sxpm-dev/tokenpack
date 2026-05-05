import sharp from 'sharp'

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

// Sharp-based raster reader shared by all raster surfaces (PNG, WebP, AVIF).
// Sharp auto-detects the format from the buffer/file header.
async function readSharp(input: string | Buffer): Promise<SurfacePixels> {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true })
  const fileChannels = (info.channels >= 4 ? 4 : 3) as 3 | 4

  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
    fileChannels,
  }
}

export abstract class ImageSurface extends AbstractSurface {
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

  abstract write(filePath: string, image: SurfacePixels): Promise<void>

  readFile(filePath: string): Promise<SurfacePixels> {
    return readSharp(filePath)
  }

  readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return readSharp(buffer)
  }
}
