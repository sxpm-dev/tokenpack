// PixelRange (PNG · Brotli) — default-binding variant. Pack data lives in a
// `tpAK` PNG ancillary chunk; IDAT carries arbitrary decoration. Range-fetch
// friendly: chunk bytes are at known absolute file offsets so a consumer can
// `Range: bytes=A-B` to pull a region without decoding pixels.

import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import { LinearCodec } from 'tokenpack/codecs/linear'
import { DenseDrawer } from 'tokenpack/drawers'

import { BrotliCompressor } from '../compressors/brotli-compressor'
import { PngSurface } from '../surfaces/png'
import { extractTpakChunk, insertTpakChunk } from './pixel-range-png-base'

export class PixelRangePngBrotli extends PixelRangeAlgorithm {
  // 100+ range reserved for PixelRange* algorithms (vs <100 codec-derived).
  static override readonly id = 100
  static override readonly title = 'PixelRange · PNG · Brotli'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; pixels are decoration. Range-fetch friendly.'

  // Codec/Drawer are decoration-only here — the data path bypasses them.
  static override readonly Codec = LinearCodec
  static override readonly Surface = PngSurface
  static override readonly Compressor = BrotliCompressor
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
    const buf = extractTpakChunk(artifactBytes)

    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
}
