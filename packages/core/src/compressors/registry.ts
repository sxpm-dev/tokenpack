import { BrotliCompressor } from './brotli-compressor'
import { DeflateCompressor } from './deflate-compressor'
import { NoneCompressor } from './none-compressor'
import { AbstractCompressor, type CompressionMode } from './types'

export class CompressorRegistry {
  private readonly factories = new Map<CompressionMode, () => AbstractCompressor>()

  constructor() {
    this.register('none', () => new NoneCompressor())
    this.register('deflate-1', () => new DeflateCompressor('deflate-1'))
    this.register('deflate-6', () => new DeflateCompressor('deflate-6'))
    this.register('deflate-9', () => new DeflateCompressor('deflate-9'))
    this.register('brotli-4', () => new BrotliCompressor('brotli-4'))
    this.register('brotli-6', () => new BrotliCompressor('brotli-6'))
    this.register('brotli-11', () => new BrotliCompressor('brotli-11'))
  }

  register(mode: CompressionMode, factory: () => AbstractCompressor): void {
    this.factories.set(mode, factory)
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
