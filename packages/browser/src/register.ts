// Browser-side runtime setup: adds CompressionStream/DecompressionStream
// compressors and metadata-only PNG surfaces for legacy pack helpers.
//
// The concrete algorithm catalog is env-owned in `./algorithms/catalog`.

import { compressorRegistry } from 'tokenpack/compressors/registry'
import { surfaceRegistry } from 'tokenpack/surfaces/registry'

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
}

registerBrowserDefaults()
