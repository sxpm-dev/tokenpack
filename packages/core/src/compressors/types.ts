import type { Transform } from 'stream'

export type CompressionMode =
  | 'none'
  | 'deflate-1'
  | 'deflate-6'
  | 'deflate-9'
  | 'brotli-4'
  | 'brotli-6'
  | 'brotli-11'

export interface CompressionResult {
  data: Buffer
  level: number
  uncompressedLength: number
}

export interface CompressionMeta {
  level: number
  uncompressedLength: number
}

export abstract class AbstractCompressor {
  abstract readonly id: CompressionMode
  abstract readonly label: string
  abstract readonly headerLevel: number
  abstract readonly streamableDecode: boolean
  abstract readonly requiresFullHeader: boolean

  abstract compress(input: Buffer): CompressionResult
  abstract decompress(input: Buffer, meta?: CompressionMeta): Buffer

  createDecodeStream?(): Transform
}
