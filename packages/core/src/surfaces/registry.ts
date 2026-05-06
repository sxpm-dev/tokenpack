import type { ImageFormat } from '../types'
import { AbstractSurface, type SurfaceId } from './types'

// Append-only registry. Core stays env-neutral; it registers no surfaces
// itself. `@tokenpack/node` registers PNG (pngjs), streaming-PNG (pngjs),
// AVIF (sharp) and WebP (sharp) on import. `@tokenpack/browser` registers
// browser-native PNG / streaming-PNG (Canvas + createImageBitmap).
export class SurfaceRegistry {
  private readonly factories = new Map<SurfaceId, () => AbstractSurface>()

  register(id: SurfaceId, factory: () => AbstractSurface): void {
    // Idempotent: webpack chunk splitting can re-evaluate the env-package
    // register module per server chunk. Skip silently on duplicate `id` —
    // the first registration wins. Append-only invariant intact at the data
    // level (existing surface can't be overridden).
    if (this.factories.has(id)) return
    this.factories.set(id, factory)
  }

  has(id: SurfaceId): boolean {
    return this.factories.has(id)
  }

  byId(id: SurfaceId): AbstractSurface {
    const factory = this.factories.get(id)

    if (!factory) throw new Error(`Unknown surface id: ${id}. No env package registered it.`)

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

  listIds(): SurfaceId[] {
    return [...this.factories.keys()]
  }
}

export const surfaceRegistry = new SurfaceRegistry()
