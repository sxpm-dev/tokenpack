import type { ImageFormat } from '../types'
import { AvifSurface } from './avif-surface'
import { PngSurface } from './png-surface'
import { StreamingPngSurface } from './streaming-png-surface'
import { AbstractSurface, type SurfaceId } from './types'
import { WebpSurface } from './webp-surface'

export class SurfaceRegistry {
  private readonly factories = new Map<SurfaceId, () => AbstractSurface>()

  constructor() {
    this.register('png', () => new PngSurface())
    this.register('png-stream', () => new StreamingPngSurface())
    this.register('webp', () => new WebpSurface())
    this.register('avif', () => new AvifSurface())
  }

  register(id: SurfaceId, factory: () => AbstractSurface): void {
    this.factories.set(id, factory)
  }

  byId(id: SurfaceId): AbstractSurface {
    const factory = this.factories.get(id)

    if (!factory) throw new Error(`Unknown surface id: ${id}`)

    return factory()
  }

  byFormat(format: ImageFormat, streaming = false): AbstractSurface {
    if (format === 'png' && streaming) return this.byId('png-stream')

    return this.byId(format)
  }

  byExtension(extension: string): AbstractSurface {
    const normalized = extension.toLowerCase()

    for (const [, factory] of this.factories) {
      const surface = factory()

      if (surface.extension === normalized && !surface.streamable) return surface
    }

    return this.byId('png')
  }

  list(): AbstractSurface[] {
    return [...this.factories.values()].map(f => f())
  }
}

export const surfaceRegistry = new SurfaceRegistry()
