import zlib from 'zlib'

import { AbstractCompressor, type CompressionMode, type CompressionResult } from './types'

type BrotliMode = Extract<CompressionMode, 'brotli-4' | 'brotli-6' | 'brotli-11'>

const HEADER_LEVEL: Record<BrotliMode, number> = {
  'brotli-4': 5,
  'brotli-6': 6,
  'brotli-11': 2,
}

const QUALITY: Record<BrotliMode, number> = {
  'brotli-4': 4,
  'brotli-6': 6,
  'brotli-11': 11,
}

export class BrotliCompressor extends AbstractCompressor {
  readonly id: BrotliMode
  readonly label: string
  readonly streamableDecode = true
  readonly quality: number
  readonly headerLevel: number
  readonly requiresFullHeader: boolean

  constructor(mode: BrotliMode) {
    super()
    this.id = mode
    this.label = `Brotli ${mode.split('-')[1]}`
    this.quality = QUALITY[mode]
    this.headerLevel = HEADER_LEVEL[mode]
    this.requiresFullHeader = mode !== 'brotli-11'
  }

  compress(input: Buffer): CompressionResult {
    return {
      data: zlib.brotliCompressSync(input, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: this.quality },
      }),
      level: this.headerLevel,
      uncompressedLength: input.length,
    }
  }

  decompress(input: Buffer): Buffer {
    return zlib.brotliDecompressSync(input)
  }

  createDecodeStream() {
    return zlib.createBrotliDecompress()
  }
}
