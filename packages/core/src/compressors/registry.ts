import { NoneCompressor } from './none-compressor'
import { AbstractCompressor, type CompressionMode } from './types'

// Append-only registry. Core stays env-neutral and registers only `none`
// (pure JS, works everywhere). Node-zlib-backed compressors (deflate-*,
// brotli-*) are registered by `@tokenpack/node` on import. Browser-side
// CompressionStream/DecompressionStream-backed compressors are registered
// by `@tokenpack/browser` on import.
export class CompressorRegistry {
  private readonly factories = new Map<CompressionMode, () => AbstractCompressor>()

  constructor() {
    this.register('none', () => new NoneCompressor())
  }

  register(mode: CompressionMode, factory: () => AbstractCompressor): void {
    // Idempotent: webpack chunk splitting can evaluate the side-effecting
    // env-package register module more than once. Subsequent registrations
    // with the same `mode` are silently ignored — the first one wins, the
    // append-only invariant holds at the data level.
    if (this.factories.has(mode)) return
    this.factories.set(mode, factory)
  }

  has(mode: CompressionMode): boolean {
    return this.factories.has(mode)
  }

  byMode(mode: CompressionMode | string | undefined): AbstractCompressor {
    const factory = this.factories.get((mode ?? 'none') as CompressionMode)

    if (!factory) return new NoneCompressor()

    return factory()
  }

  byHeaderLevel(level: number): AbstractCompressor {
    for (const [, factory] of this.factories) {
      const compressor = factory()

      if (compressor.headerLevel === level) return compressor
    }

    return new NoneCompressor()
  }

  list(): AbstractCompressor[] {
    return [...this.factories.values()].map(f => f())
  }

  listModes(): CompressionMode[] {
    return [...this.factories.keys()]
  }
}

export const compressorRegistry = new CompressorRegistry()
