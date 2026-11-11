// PixelRange · Streaming PNG · Deflate — pack data in tpAK chunk, streaming
// PNG surface, deflate-bound. Hits all four bench quadrants together with the
// other pixel-range variants: this one is node + browser, streaming.

import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'
import { LinearCodec } from 'tokenpack/codecs/linear'
import { DenseDrawer } from 'tokenpack/drawers'

import { DeflateCompressor } from '../compressors/deflate-compressor'
import { StreamingPngSurface } from '../surfaces/streaming-png'
import { extractTpakChunk, insertTpakChunk } from './pixel-range-png-base'

export class PixelRangeStreamPngDeflate extends PixelRangeAlgorithm {
  static override readonly id = 104
  static override readonly title = 'PixelRange · Streaming PNG · Deflate'
  static override readonly description =
    'Pack data stored in a tpAK PNG chunk; streaming-PNG decoration; deflate pack data. Browser-decodable.'

  static override readonly Codec = LinearCodec
  static override readonly Surface = StreamingPngSurface
  static override readonly Compressor = DeflateCompressor
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
    const buf = extractTpakChunk(artifactBytes)

    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
}
