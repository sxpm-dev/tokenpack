import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import {
  AbstractCompressor,
  type CompressionMode,
  type CompressionResult,
} from 'tokenpack/compressors/types'
import zlib from 'zlib'

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
  static override readonly familyId = 'brotli'
  static override readonly description =
    'Brotli — strongest ratio (~15% smaller than deflate-9), slow encode at quality 11. Server-only on the browser side (no native CompressionStream).'
  static override readonly optionsSchema: OptionsSchema = {
    level: enumOption([4, 6, 11], 11, { label: 'Quality level' }),
  }

  /** Factory: build instance from opts (recipe layer calls this). */
  static fromOptions(opts: { level?: number } = {}): BrotliCompressor {
    const level = opts.level ?? 11
    const mode = `brotli-${level}` as BrotliMode

    return new BrotliCompressor(mode)
  }

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

  async compress(input: Buffer): Promise<CompressionResult> {
    return {
      data: zlib.brotliCompressSync(input, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: this.quality },
      }),
      level: this.headerLevel,
      uncompressedLength: input.length,
    }
  }

  async decompress(input: Buffer): Promise<Buffer> {
    return zlib.brotliDecompressSync(input)
  }

  createDecodeStream() {
    return zlib.createBrotliDecompress()
  }
}
