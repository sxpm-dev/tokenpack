// Browser-side registrations: adds CompressionStream/DecompressionStream
// compressors and metadata-only PNG surfaces to core's append-only registries.
//
// Browser does NOT register AVIF/WebP surfaces — encode happens via canvas.toBlob
// directly in `encode.ts`, so there's no need for a registry entry. Decode of
// AVIF/WebP tokens works through `createImageBitmap` which doesn't consult the
// registry either.

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { compressorRegistry } from 'tokenpack/compressors/registry'
import { surfaceRegistry } from 'tokenpack/surfaces/registry'

import { ALL_BROWSER_ALGORITHMS } from './algorithms'
import { BrowserBrotliCompressor } from './compressors/brotli-compressor'
import { BrowserDeflateCompressor } from './compressors/deflate-compressor'
import { BrowserPngSurface, BrowserStreamingPngSurface } from './surfaces/png'
import { BrowserPngUpngSurface } from './surfaces/png-upng'

let registered = false

function registerBrowserDefaults(): void {
  if (registered) return
  registered = true

  compressorRegistry.register(BrowserBrotliCompressor)
  compressorRegistry.register(BrowserDeflateCompressor)

  if (!surfaceRegistry.has('png')) {
    surfaceRegistry.register('png', () => new BrowserPngSurface())
  }
  if (!surfaceRegistry.has('png-stream')) {
    surfaceRegistry.register('png-stream', () => new BrowserStreamingPngSurface())
  }
  if (!surfaceRegistry.has('png-upng')) {
    surfaceRegistry.register('png-upng', () => new BrowserPngUpngSurface())
  }

  for (const Ctor of ALL_BROWSER_ALGORITHMS) algorithmCatalog.register(Ctor as never)
}

registerBrowserDefaults()
