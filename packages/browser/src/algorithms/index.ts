// Browser-side concrete algorithm classes. Mirror the Node side but bind to
// browser surface/compressor implementations (CompressionStream-backed compressors,
// canvas-based PNG surface). Same algorithm IDs/names so tokens encoded server-
// side decode here.

import { definePixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import {
  BitplaneCodec,
  BitshuffleCodec,
  DeltaChainCodec,
  DeltaCodec,
  InterleavedCodec,
  LinearCodec,
  PredictCodec,
  RleCodec,
  XorCodec,
} from 'tokenpack/codecs'
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

export const InterleavedPngBrotli = definePixelAlgorithm({
  id: 1,
  name: 'interleaved',
  title: 'Interleaved · PNG · Brotli',
  Codec: InterleavedCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const BitplanePngBrotli = definePixelAlgorithm({
  id: 2,
  name: 'bitplane',
  title: 'Bitplane · PNG · Brotli',
  Codec: BitplaneCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const DeltaPngBrotli = definePixelAlgorithm({
  id: 3,
  name: 'delta',
  title: 'Delta · PNG · Brotli',
  Codec: DeltaCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const XorPngBrotli = definePixelAlgorithm({
  id: 4,
  name: 'xor',
  title: 'XOR · PNG · Brotli',
  Codec: XorCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const DeltaChainPngBrotli = definePixelAlgorithm({
  id: 5,
  name: 'delta-chain',
  title: 'Delta-Chain · PNG · Brotli',
  Codec: DeltaChainCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const RlePngBrotli = definePixelAlgorithm({
  id: 6,
  name: 'rle',
  title: 'RLE · PNG · Brotli',
  Codec: RleCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const PredictPngBrotli = definePixelAlgorithm({
  id: 7,
  name: 'predict',
  title: 'Predict · PNG · Brotli',
  Codec: PredictCodec,
  Surface: BrowserPngSurface,
  Compressor: BrowserBrotliCompressor,
  Drawer: DenseDrawer,
})

export const BitshufflePngBrotli = definePixelAlgorithm({
  id: 8,
  name: 'bitshuffle',
  title: 'Bitshuffle · PNG · Brotli',
  Codec: BitshuffleCodec,
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

// No-compression variant — useful for wrapping pre-compressed payloads
// (PackBuilder regions, diff bytes) so the pixel layer doesn't re-compress.
export const LinearPngNone = definePixelAlgorithm({
  id: 16,
  name: 'linear-none',
  title: 'Linear · PNG · None',
  Codec: LinearCodec,
  Surface: BrowserPngSurface,
  Compressor: NoneCompressor,
  Drawer: DenseDrawer,
})

// upng-js variants — pure-JS PNG codec, bypasses canvas. Byte-exact 4-channel
// encode/decode in browser (canvas premultiplies alpha; upng-js doesn't). The
// brotli variant matches `linear` (decode-only — browser can't encode brotli);
// the deflate variant is round-trip-capable end-to-end in browser.
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

// zstdpix encode is node-only (depends on zstd); browser only needs decode.
// We don't register it here — server-encoded zstdpix tokens come through the
// stream-decode path which doesn't go through algorithmCatalog.

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

export {
  PixelRangePngBrotli,
  PixelRangePngDeflate,
  PixelRangePngNone,
  PixelRangeStreamPngDeflate,
}

export const ALL_BROWSER_ALGORITHMS = [
  LinearPngBrotli,
  InterleavedPngBrotli,
  BitplanePngBrotli,
  DeltaPngBrotli,
  XorPngBrotli,
  DeltaChainPngBrotli,
  RlePngBrotli,
  PredictPngBrotli,
  BitshufflePngBrotli,
  LinearPngDeflate,
  LinearStreamingPngDeflate,
  LinearStreamingPngBrotli,
  LinearPngNone,
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
