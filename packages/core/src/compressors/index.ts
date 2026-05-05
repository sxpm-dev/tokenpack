export { BrotliCompressor } from './brotli-compressor'
export { DeflateCompressor } from './deflate-compressor'
export { NoneCompressor } from './none-compressor'
export { CompressorRegistry, compressorRegistry } from './registry'
export {
  AbstractCompressor,
  type CompressionMeta,
  type CompressionMode,
  type CompressionResult,
} from './types'

import { compressorRegistry } from './registry'
import type { AbstractCompressor, CompressionMode } from './types'

export function getCompressorByMode(
  mode: CompressionMode | string | undefined,
): AbstractCompressor {
  return compressorRegistry.byMode(mode)
}

export function getCompressorByHeaderLevel(level: number): AbstractCompressor {
  return compressorRegistry.byHeaderLevel(level)
}
