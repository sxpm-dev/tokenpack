// Browser-side concrete algorithm classes. Mirror the Node side but bind to
// browser surface/compressor implementations (CompressionStream-backed compressors,
// canvas-based PNG surface). Same algorithm IDs/names so tokens encoded server-
// side decode here.

import { definePixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
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
// We register a stub here so the algorithm shows up in the dashboard dropdown;
// fe-eligibility marks it as server-only so FE-encode is never attempted.
import { PixelRangeAlgorithm } from 'tokenpack/algorithms/pixel-range-algorithm'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const TPAK_TYPE = 'tpAK'

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)

  for (let n = 0; n < 256; n++) {
    let c = n

    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }

  return table
})()

function crc32(bytes: Buffer): number {
  let c = 0xffffffff

  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)

  return (c ^ 0xffffffff) >>> 0
}

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
      value: 'pixel-range-png-brotli',
      configurable: true,
    })
  }

  protected embedData(imageBytes: Buffer, packBytes: Uint8Array): Buffer {
    const ihdrEnd = 8 + 25
    const dataBuf = Buffer.from(packBytes.buffer, packBytes.byteOffset, packBytes.byteLength)
    const length = Buffer.alloc(4)

    length.writeUInt32BE(dataBuf.length, 0)
    const type = Buffer.from(TPAK_TYPE, 'ascii')
    const crc = Buffer.alloc(4)

    crc.writeUInt32BE(crc32(Buffer.concat([type, dataBuf])), 0)
    const chunk = Buffer.concat([length, type, dataBuf, crc])

    return Buffer.concat([imageBytes.subarray(0, ihdrEnd), chunk, imageBytes.subarray(ihdrEnd)])
  }

  protected extractData(artifactBytes: Buffer): Uint8Array {
    if (artifactBytes.length < 8 || !artifactBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
      throw new Error('not a PNG')
    }
    let pos = 8

    while (pos + 8 <= artifactBytes.length) {
      const length = artifactBytes.readUInt32BE(pos)
      const type = artifactBytes.subarray(pos + 4, pos + 8).toString('ascii')

      if (type === 'tpAK') {
        const data = artifactBytes.subarray(pos + 8, pos + 8 + length)

        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
      }
      if (type === 'IEND') break
      pos = pos + 8 + length + 4
    }
    throw new Error('no tpAK chunk found in PNG')
  }
}

export { PixelRangePngBrotli }

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
] as const

// Mark BrowserStreamingPngSurface as exported so it remains tree-shake-stable
// for consumers that need it directly (decode-stream.ts).
export { BrowserStreamingPngSurface }
