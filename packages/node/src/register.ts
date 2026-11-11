// Node-side runtime setup. The algorithm catalog is env-owned in
// `./algorithms/catalog`; this file only keeps legacy compressor/surface
// helpers registered while pack-region compression still uses them.

import { compressorRegistry } from 'tokenpack/compressors/registry'
import { surfaceRegistry } from 'tokenpack/surfaces/registry'

import { BrotliCompressor } from './compressors/brotli-compressor'
import { DeflateCompressor } from './compressors/deflate-compressor'
import { AvifSurface } from './surfaces/avif'
import { PngSurface } from './surfaces/png'
import { PngUpngSurface } from './surfaces/png-upng'
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
if (!surfaceRegistry.has('png-upng'))
  surfaceRegistry.register('png-upng', () => new PngUpngSurface())

export function registerNodeDefaults(): void {
  // No-op — registrations happen at module-load time. Kept for callers that
  // explicitly opt into Node defaults.
}
