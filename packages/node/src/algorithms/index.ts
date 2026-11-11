// Concrete algorithm classes — one per codec, default-bound to PNG + Brotli + Dense.
//
// Naming: <Codec><Surface><Compressor>. To add a different binding (e.g. WebP
// or Deflate variants), declare another class. Each is its own concrete recipe;
// the catalog stores the Ctors.

import { definePixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import { LinearCodec } from 'tokenpack/codecs'
import { DenseDrawer } from 'tokenpack/drawers'

import { BrotliCompressor } from '../compressors/brotli-compressor'
import { DeflateCompressor } from '../compressors/deflate-compressor'
import { PngSurface } from '../surfaces/png'
import { PngUpngSurface } from '../surfaces/png-upng'
import { StreamingPngSurface } from '../surfaces/streaming-png'
import { WebpSurface } from '../surfaces/webp'

export { PixelRangePngBrotli } from './pixel-range-png-brotli'
import { PixelRangePngBrotli } from './pixel-range-png-brotli'

export { PixelRangePngDeflate } from './pixel-range-deflate'
import { PixelRangePngDeflate } from './pixel-range-deflate'

export { PixelRangePngNone } from './pixel-range-none'
import { PixelRangePngNone } from './pixel-range-none'

export { PixelRangeStreamPngBrotli } from './pixel-range-stream'
export { PixelRangeStreamPngDeflate } from './pixel-range-stream-deflate'
import { PixelRangeStreamPngDeflate } from './pixel-range-stream-deflate'

// ── Default-binding (PNG + Brotli + Dense) for each pixel-data codec ────────

export const LinearPngBrotli = definePixelAlgorithm({
  id: 0,
  name: 'linear',
  title: 'Linear · PNG · Brotli',
  Codec: LinearCodec,
  Surface: PngSurface,
  Compressor: BrotliCompressor,
  Drawer: DenseDrawer,
})

// Deflate-compressor variants. Required for any consumer that decodes packs
// from a browser via `decodeStream`: Chromium's `DecompressionStream` supports
// only 'deflate' / 'deflate-raw' / 'gzip' — never 'br'. Brotli-bound packs
// fail to decode with `Failed to construct 'DecompressionStream':
// Unsupported compression format: 'br'`. Streaming PNG variant pairs with
// the streaming-bundle hypothesis (decode pipelined with download).
export const LinearPngDeflate = definePixelAlgorithm({
  id: 11,
  name: 'linear-deflate',
  title: 'Linear · PNG · Deflate',
  Codec: LinearCodec,
  Surface: PngSurface,
  Compressor: DeflateCompressor,
  Drawer: DenseDrawer,
})

export const LinearStreamingPngDeflate = definePixelAlgorithm({
  id: 12,
  name: 'linear-stream-deflate',
  title: 'Linear · Streaming PNG · Deflate',
  Codec: LinearCodec,
  Surface: StreamingPngSurface,
  Compressor: DeflateCompressor,
  Drawer: DenseDrawer,
})

export const LinearStreamingPngBrotli = definePixelAlgorithm({
  id: 15,
  name: 'linear-stream',
  title: 'Linear · Streaming PNG · Brotli',
  Codec: LinearCodec,
  Surface: StreamingPngSurface,
  Compressor: BrotliCompressor,
  Drawer: DenseDrawer,
})

// WebP / AVIF variants — different surfaces, same codec/compressor/drawer.
export const LinearWebpBrotli = definePixelAlgorithm({
  id: 13,
  name: 'linear-webp',
  title: 'Linear · WebP · Brotli',
  Codec: LinearCodec,
  Surface: WebpSurface,
  Compressor: BrotliCompressor,
  Drawer: DenseDrawer,
})

// upng-js variants — pure-JS PNG codec. Identical RGB wire format to the
// pngjs-backed `linear-deflate` recipe; the difference is the codec library
// used to encode/decode the pixels. RGB-only for now because upng-js RGBA
// output has produced truncated PNGs for larger benchmark payloads.
export const LinearPngUpngBrotli = definePixelAlgorithm({
  id: 17,
  name: 'linear-upng',
  title: 'Linear · PNG (upng) · Brotli',
  Codec: LinearCodec,
  Surface: PngUpngSurface,
  Compressor: BrotliCompressor,
  Drawer: DenseDrawer,
})

export const LinearPngUpngDeflate = definePixelAlgorithm({
  id: 18,
  name: 'linear-upng-deflate',
  title: 'Linear · PNG (upng) · Deflate',
  Codec: LinearCodec,
  Surface: PngUpngSurface,
  Compressor: DeflateCompressor,
  Drawer: DenseDrawer,
})

export const ALL_NODE_ALGORITHMS = [
  LinearPngBrotli,
  PixelRangePngBrotli,
  PixelRangePngDeflate,
  PixelRangePngNone,
  PixelRangeStreamPngDeflate,
  LinearPngDeflate,
  LinearStreamingPngDeflate,
  LinearStreamingPngBrotli,
  LinearWebpBrotli,
  LinearPngUpngBrotli,
  LinearPngUpngDeflate,
] as const
