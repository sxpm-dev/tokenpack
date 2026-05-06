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

// Compress/decompress are async because browser implementations use
// CompressionStream / DecompressionStream — both are inherently async APIs.
// Node implementations wrap their sync zlib calls in Promise.resolve.
export abstract class AbstractCompressor {
  abstract readonly id: CompressionMode
  abstract readonly label: string
  abstract readonly headerLevel: number
  abstract readonly streamableDecode: boolean
  abstract readonly requiresFullHeader: boolean

  abstract compress(input: Buffer): Promise<CompressionResult>
  abstract decompress(input: Buffer, meta?: CompressionMeta): Promise<Buffer>

  // Optional Node Transform stream — only Node-side compressors implement it.
  createDecodeStream?(): Transform
}
