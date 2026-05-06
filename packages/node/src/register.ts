// Node-side registrations.
//
// ORDER IS LOAD-BEARING. The `Algorithm` constructor calls
// `compressorRegistry.byMode('brotli-11')` and `surfaceRegistry.byFormat('png')`
// to grab default fields. So compressors + surfaces MUST be in core's registries
// BEFORE the algorithm catalog gets populated with codec-derived `Algorithm`
// instances.
//
// To enforce this with synchronous, top-level ES imports we (a) import only
// the registries from core (which don't transitively trigger algorithm
// registration), (b) populate them, and (c) THEN import `register-all` (which
// constructs algorithms using the now-populated registries). Doing it in this
// order in static-import space alone is brittle, so we import `register-all`
// via a synchronous side-effect helper invoked after population.

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { compressorRegistry } from 'tokenpack/compressors/registry'
import { surfaceRegistry } from 'tokenpack/surfaces/registry'

import { zstdpixCodec } from './codecs/zstdpix'
import { BrotliCompressor } from './compressors/brotli'
import { DeflateCompressor } from './compressors/deflate'
import { AvifSurface } from './surfaces/avif'
import { PngSurface } from './surfaces/png'
import { StreamingPngSurface } from './surfaces/streaming-png'
import { WebpSurface } from './surfaces/webp'

if (!compressorRegistry.has('deflate-1')) {
  compressorRegistry.register('deflate-1', () => new DeflateCompressor('deflate-1'))
  compressorRegistry.register('deflate-6', () => new DeflateCompressor('deflate-6'))
  compressorRegistry.register('deflate-9', () => new DeflateCompressor('deflate-9'))
  compressorRegistry.register('brotli-4', () => new BrotliCompressor('brotli-4'))
  compressorRegistry.register('brotli-6', () => new BrotliCompressor('brotli-6'))
  compressorRegistry.register('brotli-11', () => new BrotliCompressor('brotli-11'))
}

if (!surfaceRegistry.has('png')) {
  surfaceRegistry.register('png', () => new PngSurface())
  surfaceRegistry.register('png-stream', () => new StreamingPngSurface())
  surfaceRegistry.register('avif', () => new AvifSurface())
  surfaceRegistry.register('webp', () => new WebpSurface())
}

// Node-only codec: register on the algorithm catalog. `register-all` (loaded
// transitively through `algorithmCatalog`'s consumers) populates env-neutral
// codecs first. zstdpix appends here.
try {
  algorithmCatalog.registerCodec(zstdpixCodec)
} catch {
  // already registered (HMR / re-import); ignore
}

export function registerNodeDefaults(): void {
  // No-op now — registrations happen at module-load time. Kept for API
  // compatibility so callers that explicitly opt into Node defaults still work.
}
