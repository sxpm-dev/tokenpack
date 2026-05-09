// Node-side registrations. Order is load-bearing:
//   1. Register compressors + surfaces (algorithm classes need their static
//      capabilities/options getters to read from these at registration time).
//   2. Register concrete algorithm Ctors (one per codec/recipe).

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { compressorRegistry } from 'tokenpack/compressors/registry'
import { surfaceRegistry } from 'tokenpack/surfaces/registry'

import { ALL_NODE_ALGORITHMS } from './algorithms'
import { BrotliCompressor } from './compressors/brotli-compressor'
import { DeflateCompressor } from './compressors/deflate-compressor'
import { AvifSurface } from './surfaces/avif'
import { PngSurface } from './surfaces/png'
import { StreamingPngSurface } from './surfaces/streaming-png'
import { WebpSurface } from './surfaces/webp'

compressorRegistry.register(BrotliCompressor)
compressorRegistry.register(DeflateCompressor)

if (!surfaceRegistry.has('png')) {
  surfaceRegistry.register('png', () => new PngSurface())
  surfaceRegistry.register('png-stream', () => new StreamingPngSurface())
  surfaceRegistry.register('avif', () => new AvifSurface())
  surfaceRegistry.register('webp', () => new WebpSurface())
}

for (const Ctor of ALL_NODE_ALGORITHMS) {
  algorithmCatalog.register(Ctor as never)
}

export function registerNodeDefaults(): void {
  // No-op — registrations happen at module-load time. Kept for callers that
  // explicitly opt into Node defaults.
}
