import {
  AbstractCompressor,
  type CompressionMode,
  type CompressionResult,
} from 'tokenpack/compressors/types'
import zlib from 'zlib'

type DeflateMode = Extract<CompressionMode, 'deflate-1' | 'deflate-6' | 'deflate-9'>

const HEADER_LEVEL: Record<DeflateMode, number> = {
  'deflate-1': 3,
  'deflate-6': 1,
  'deflate-9': 4,
}

export class DeflateCompressor extends AbstractCompressor {
  readonly id: DeflateMode
  readonly label: string
  readonly streamableDecode = true
  readonly zlibLevel: number
  readonly headerLevel: number
  readonly requiresFullHeader = true

  constructor(mode: DeflateMode) {
    super()
    this.id = mode
    this.label = `Deflate ${mode.split('-')[1]}`
    this.zlibLevel = Number(mode.split('-')[1])
    this.headerLevel = HEADER_LEVEL[mode]
  }

  async compress(input: Buffer): Promise<CompressionResult> {
    return {
      data: zlib.deflateSync(input, { level: this.zlibLevel }),
      level: this.headerLevel,
      uncompressedLength: input.length,
    }
  }

  async decompress(input: Buffer): Promise<Buffer> {
    return zlib.inflateSync(input)
  }

  createDecodeStream() {
    return zlib.createInflate()
  }
}
