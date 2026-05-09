// PixelRange · PNG · None — pack data in tpAK chunk, no compression.
// Useful when pack data is already compressed (PackBuilder regions) so the
// pixel layer doesn't re-compress. Browser-decodable.

import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import { LinearCodec } from 'tokenpack/codecs/linear'
import { NoneCompressor } from 'tokenpack/compressors'
import { DenseDrawer } from 'tokenpack/drawers'

import { PngSurface } from '../surfaces/png'

import { extractTpakChunk, insertTpakChunk } from './pixel-range-png-base'

export class PixelRangePngNone extends PixelRangeAlgorithm {
  static override readonly id = 102
  static override readonly title = 'PixelRange · PNG · None'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; no compression. Browser-decodable.'

  static override readonly Codec = LinearCodec
  static override readonly Surface = PngSurface
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
    const buf = extractTpakChunk(artifactBytes)

    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
}
