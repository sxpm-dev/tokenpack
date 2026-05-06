import { AbstractCompressor, type CompressionMode, type CompressionResult } from './types'

export class NoneCompressor extends AbstractCompressor {
  readonly id: CompressionMode = 'none'
  readonly label = 'None'
  readonly headerLevel = 0
  readonly streamableDecode = true
  readonly requiresFullHeader = false

  async compress(input: Buffer): Promise<CompressionResult> {
    return { data: input, level: 0, uncompressedLength: 0 }
  }

  async decompress(input: Buffer): Promise<Buffer> {
    return input
  }
}
