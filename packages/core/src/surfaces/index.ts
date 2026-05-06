import type { ImageFormat } from '../types'
import { surfaceRegistry } from './registry'
import type { AbstractSurface } from './types'

// Core only exports the abstract base + helpers. Concrete surfaces ship in
// `@tokenpack/node` (PNG, streaming-PNG via pngjs; AVIF, WebP via sharp) and
// `@tokenpack/browser` (Canvas-backed PNG / streaming-PNG).
export { CHANNELS, fromFileChannels, toFileChannels } from './channels'
export { ImageSurface, type ImageSurfaceInit } from './image-surface'
export { SurfaceRegistry, surfaceRegistry } from './registry'
export { AbstractSurface, type SurfaceId, type SurfacePixels } from './types'

export function createSurface(format: ImageFormat = 'png', streaming = false): AbstractSurface {
  return surfaceRegistry.byFormat(format, streaming)
}
