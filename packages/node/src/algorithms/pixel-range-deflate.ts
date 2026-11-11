// PixelRange · PNG · Deflate — pack data in tpAK chunk, deflate-bound.
// Browser-safe: deflate decode works in every shipping browser.

import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import { LinearCodec } from 'tokenpack/codecs/linear'
import { DenseDrawer } from 'tokenpack/drawers'

import { DeflateCompressor } from '../compressors/deflate-compressor'
import { PngSurface } from '../surfaces/png'
import { extractTpakChunk, insertTpakChunk } from './pixel-range-png-base'

export class PixelRangePngDeflate extends PixelRangeAlgorithm {
  static override readonly id = 101
  static override readonly title = 'PixelRange · PNG · Deflate'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; deflate-compressed pack data. Browser-decodable.'

  static override readonly Codec = LinearCodec
  static override readonly Surface = PngSurface
  static override readonly Compressor = DeflateCompressor
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
    const buf = extractTpakChunk(artifactBytes)

    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
}
