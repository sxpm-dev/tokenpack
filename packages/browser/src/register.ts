// Browser-side registrations: adds CompressionStream/DecompressionStream
// compressors and metadata-only PNG surfaces to core's append-only registries.
//
// Browser does NOT register AVIF/WebP surfaces — encode happens via canvas.toBlob
// directly in `encode.ts`, so there's no need for a registry entry. Decode of
// AVIF/WebP tokens works through `createImageBitmap` which doesn't consult the
// registry either.

import { compressorRegistry } from 'tokenpack/compressors/registry'
import { surfaceRegistry } from 'tokenpack/surfaces/registry'

import { BrowserBrotliCompressor } from './compressors/brotli'
import { BrowserDeflateCompressor } from './compressors/deflate'
import { BrowserPngSurface, BrowserStreamingPngSurface } from './surfaces/png'

let registered = false

export function registerBrowserDefaults(): void {
  if (registered) return
  registered = true

  if (!compressorRegistry.has('deflate-1')) {
    compressorRegistry.register('deflate-1', () => new BrowserDeflateCompressor('deflate-1'))
  }
  if (!compressorRegistry.has('deflate-6')) {
    compressorRegistry.register('deflate-6', () => new BrowserDeflateCompressor('deflate-6'))
  }
  if (!compressorRegistry.has('deflate-9')) {
    compressorRegistry.register('deflate-9', () => new BrowserDeflateCompressor('deflate-9'))
  }
  if (!compressorRegistry.has('brotli-4')) {
    compressorRegistry.register('brotli-4', () => new BrowserBrotliCompressor('brotli-4'))
  }
  if (!compressorRegistry.has('brotli-6')) {
    compressorRegistry.register('brotli-6', () => new BrowserBrotliCompressor('brotli-6'))
  }
  if (!compressorRegistry.has('brotli-11')) {
    compressorRegistry.register('brotli-11', () => new BrowserBrotliCompressor('brotli-11'))
  }

  if (!surfaceRegistry.has('png')) {
    surfaceRegistry.register('png', () => new BrowserPngSurface())
  }
  if (!surfaceRegistry.has('png-stream')) {
    surfaceRegistry.register('png-stream', () => new BrowserStreamingPngSurface())
  }
}

registerBrowserDefaults()
