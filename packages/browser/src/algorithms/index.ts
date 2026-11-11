// Browser-side concrete algorithm classes. Mirror the Node side but bind to
// browser surface/compressor implementations (CompressionStream-backed compressors,
// canvas-based PNG surface). Same algorithm IDs/names so tokens encoded server-
// side decode here.

import { definePixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import { LinearCodec } from 'tokenpack/codecs'
import { NoneCompressor } from 'tokenpack/compressors'
import { DenseDrawer } from 'tokenpack/drawers'

import { BrowserBrotliCompressor } from '../compressors/brotli-compressor'
import { BrowserDeflateCompressor } from '../compressors/deflate-compressor'
import { BrowserPngSurface, BrowserStreamingPngSurface } from '../surfaces/png'
import { BrowserPngUpngSurface } from '../surfaces/png-upng'
import { extractTpakChunk, insertTpakChunk } from './pixel-range-png-base'

export const LinearPngBrotli = definePixelAlgorithm({
  id: 0,
  name: 'linear',
  title: 'Linear · PNG · Brotli',
  Codec: LinearCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

// Deflate-bound variants — browser can encode these (CompressionStream supports
// 'deflate'). Brotli variants encode only on the server.
export const LinearPngDeflate = definePixelAlgorithm({
  id: 11,
  name: 'linear-deflate',
  title: 'Linear · PNG · Deflate',
  Codec: LinearCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserDeflateCompressor,
  Drawer: DenseDrawer,
})

export const LinearStreamingPngDeflate = definePixelAlgorithm({
  id: 12,
  name: 'linear-stream-deflate',
  title: 'Linear · Streaming PNG · Deflate',
  Codec: LinearCodec,
  Surface: BrowserStreamingPngSurface,
  Compressor: BrowserDeflateCompressor,
  Drawer: DenseDrawer,
})

export const LinearStreamingPngBrotli = definePixelAlgorithm({
  id: 15,
  name: 'linear-stream',
  title: 'Linear · Streaming PNG · Brotli',
  Codec: LinearCodec,
  Surface: BrowserStreamingPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

// upng-js variants — pure-JS PNG codec, bypasses canvas. RGB-only for now
// because upng-js RGBA output has produced truncated PNGs for larger benchmark
// payloads. The brotli variant matches `linear` (decode-only — browser can't
// encode brotli); the deflate variant is round-trip-capable end-to-end in browser.
export const LinearPngUpngBrotli = definePixelAlgorithm({
  id: 17,
  name: 'linear-upng',
  title: 'Linear · PNG (upng) · Brotli',
  Codec: LinearCodec,
  Surface: BrowserPngUpngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const LinearPngUpngDeflate = definePixelAlgorithm({
  id: 18,
  name: 'linear-upng-deflate',
  title: 'Linear · PNG (upng) · Deflate',
  Codec: LinearCodec,
  Surface: BrowserPngUpngSurface,
  Compressor: BrowserDeflateCompressor,
  Drawer: DenseDrawer,
})

// PixelRange* — server-only encode (browser PNG surface can't writeBuffer).
// We register stubs here so tokens encoded on the server decode in the browser
// via the standard catalog path.

class PixelRangePngBrotli extends PixelRangeAlgorithm {
  static override readonly id = 100
  static override readonly title = 'PixelRange · PNG · Brotli'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; pixels are decoration. Range-fetch friendly.'
  static override readonly Codec = LinearCodec
  static override readonly Surface = BrowserPngSurface
  static override readonly Compressor = BrowserBrotliCompressor
  static override readonly Drawer = DenseDrawer
  static {
    Object.defineProperty(this, 'name', {
      value: 'pixel-range',
      configurable: true,
    })
  }

  protected embedData(imageBytes: Buffer, packBytes: Uint8Array): Buffer {
    return insertTpakChunk(imageBytes, packBytes)
  }

  protected extractData(artifactBytes: Buffer): Uint8Array {
    return extractTpakChunk(artifactBytes)
  }
}

class PixelRangePngDeflate extends PixelRangeAlgorithm {
  static override readonly id = 101
  static override readonly title = 'PixelRange · PNG · Deflate'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; deflate-compressed pack data. Browser-decodable.'
  static override readonly Codec = LinearCodec
  static override readonly Surface = BrowserPngSurface
  static override readonly Compressor = BrowserDeflateCompressor
  static override readonly Drawer = DenseDrawer
  static {
    Object.defineProperty(this, 'name', {
      value: 'pixel-range-deflate',
      configurable: true,
    })
  }

  protected embedData(imageBytes: Buffer, packBytes: Uint8Array): Buffer {
    return insertTpakChunk(imageBytes, packBytes)
  }

  protected extractData(artifactBytes: Buffer): Uint8Array {
    return extractTpakChunk(artifactBytes)
  }
}

class PixelRangePngNone extends PixelRangeAlgorithm {
  static override readonly id = 102
  static override readonly title = 'PixelRange · PNG · None'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; no compression. Browser-decodable.'
  static override readonly Codec = LinearCodec
  static override readonly Surface = BrowserPngSurface
  static override readonly Compressor = NoneCompressor
  static override readonly Drawer = DenseDrawer
  static {
    Object.defineProperty(this, 'name', {
      value: 'pixel-range-none',
      configurable: true,
    })
  }

  protected embedData(imageBytes: Buffer, packBytes: Uint8Array): Buffer {
    return insertTpakChunk(imageBytes, packBytes)
  }

  protected extractData(artifactBytes: Buffer): Uint8Array {
    return extractTpakChunk(artifactBytes)
  }
}

class PixelRangeStreamPngDeflate extends PixelRangeAlgorithm {
  static override readonly id = 104
  static override readonly title = 'PixelRange · Streaming PNG · Deflate'
  static override readonly description =
    'Pack data in a tpAK PNG chunk; streaming-PNG decoration; deflate pack data. Browser-decodable.'
  static override readonly Codec = LinearCodec
  static override readonly Surface = BrowserStreamingPngSurface
  static override readonly Compressor = BrowserDeflateCompressor
  static override readonly Drawer = DenseDrawer
  static {
    Object.defineProperty(this, 'name', {
      value: 'pixel-range-stream-deflate',
      configurable: true,
    })
  }

  protected embedData(imageBytes: Buffer, packBytes: Uint8Array): Buffer {
    return insertTpakChunk(imageBytes, packBytes)
  }

  protected extractData(artifactBytes: Buffer): Uint8Array {
    return extractTpakChunk(artifactBytes)
  }
}

export { PixelRangePngBrotli, PixelRangePngDeflate, PixelRangePngNone, PixelRangeStreamPngDeflate }

export const ALL_BROWSER_ALGORITHMS = [
  LinearPngBrotli,
  LinearPngDeflate,
  LinearStreamingPngDeflate,
  LinearStreamingPngBrotli,
  LinearPngUpngBrotli,
  LinearPngUpngDeflate,
  PixelRangePngBrotli,
  PixelRangePngDeflate,
  PixelRangePngNone,
  PixelRangeStreamPngDeflate,
] as const

// Mark BrowserStreamingPngSurface as exported so it remains tree-shake-stable
// for consumers that need it directly (decode-stream.ts).
export { BrowserStreamingPngSurface }
