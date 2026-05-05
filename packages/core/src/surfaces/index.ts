import type { ImageFormat } from '../types'
import { surfaceRegistry } from './registry'
import type { AbstractSurface } from './types'

export { AvifSurface } from './avif-surface'
export { ImageSurface, type ImageSurfaceInit } from './image-surface'
export { PngSurface } from './png-surface'
export { SurfaceRegistry, surfaceRegistry } from './registry'
export { StreamingPngSurface } from './streaming-png-surface'
export { AbstractSurface, type SurfaceId, type SurfacePixels } from './types'
export { WebpSurface } from './webp-surface'

export function createSurface(format: ImageFormat = 'png', streaming = false): AbstractSurface {
  return surfaceRegistry.byFormat(format, streaming)
}
