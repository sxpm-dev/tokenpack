import type { ImageFormat } from '../types'

export type SurfaceId = ImageFormat | 'png-stream'

export interface SurfacePixels {
  pixels: Uint8Array
  width: number
  height: number
  fileChannels: 3 | 4
}

export abstract class AbstractSurface {
  abstract readonly id: SurfaceId
  abstract readonly label: string
  abstract readonly format: ImageFormat
  abstract readonly extension: string
  abstract readonly mimeType: string
  abstract readonly inputKind: 'raster-pixels'
  abstract readonly lossless: boolean
  abstract readonly streamable: boolean
  abstract readonly supportedChannels: ReadonlySet<3 | 4>
  abstract readonly preservesAlpha: boolean
  abstract readonly maxBpp: 1 | 2 | 3 | 4

  abstract write(filePath: string, image: SurfacePixels): Promise<void>
  abstract readFile(filePath: string): Promise<SurfacePixels>
  abstract readBuffer(buffer: Buffer): Promise<SurfacePixels>

  coerceBpp(bpp: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
    return bpp > this.maxBpp ? this.maxBpp : bpp
  }
}
