// PixelRange · Streaming PNG · Brotli — pack data in tpAK chunk, streaming
// PNG surface for the decoration layer. Brotli requires DecompressionStream('br')
// in the browser, so this variant is node-only for the bench matrix.

import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import { LinearCodec } from 'tokenpack/codecs/linear'
import { DenseDrawer } from 'tokenpack/drawers'

import { BrotliCompressor } from '../compressors/brotli-compressor'
import { StreamingPngSurface } from '../surfaces/streaming-png'
import { extractTpakChunk, insertTpakChunk } from './pixel-range-png-base'

export class PixelRangeStreamPngBrotli extends PixelRangeAlgorithm {
  static override readonly id = 103
  static override readonly title = 'PixelRange · Streaming PNG · Brotli'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; streaming-PNG decoration layer; brotli pack data.'

  static override readonly Codec = LinearCodec
  static override readonly Surface = StreamingPngSurface
  static override readonly Compressor = BrotliCompressor
  static override readonly Drawer = DenseDrawer
  static {
    Object.defineProperty(this, 'name', {
      value: 'pixel-range-stream',
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
