// Core ships only the env-neutral `NoneCompressor`. Node-zlib compressors
// (deflate-*, brotli-*) live in `@tokenpack/node`. Browser CompressionStream-
// backed compressors live in `@tokenpack/browser`. Both env packages register
// themselves on import.
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

// Pack-format helpers — compress/decompress raw bytes with a named compressor.
// `compressRaw` returns the metadata needed to populate a manifest entry;
// `decompressRaw` accepts the same metadata back via `meta`.

export interface CompressRawResult {
  bytes: Uint8Array
  /** Compressor mode (e.g. 'brotli-11', 'none'). */
  compressor: string
  /** Level returned by the compressor — passed back to `decompress` meta. */
  level: number
  /** Original (uncompressed) byte length. */
  originalSize: number
}

export async function compressRaw(
  bytes: Uint8Array,
  mode: CompressionMode | string,
): Promise<CompressRawResult> {
  const compressor = compressorRegistry.byMode(mode)
  const buffer = bytesToBuffer(bytes)
  const result = await compressor.compress(buffer)
  // `none` returns level=0 / uncompressedLength=0 — explicit 0 is fine,
  // decompressor doesn't need the length to no-op.
  const compressedBytes = bufferToUint8(result.data)

  return {
    bytes: compressedBytes,
    compressor: compressor.id,
    level: result.level,
    originalSize: bytes.length,
  }
}

export async function decompressRaw(
  bytes: Uint8Array,
  mode: CompressionMode | string,
  meta: { level: number; uncompressedLength: number },
): Promise<Uint8Array> {
  const compressor = compressorRegistry.byMode(mode)
  const buffer = bytesToBuffer(bytes)
  const out = await compressor.decompress(buffer, {
    level: meta.level,
    uncompressedLength: meta.uncompressedLength,
  })

  return bufferToUint8(out)
}

// Buffer↔Uint8Array helpers. In Node, `Buffer extends Uint8Array` so the
// runtime conversion is zero-copy. In browser, `buffer` polyfill provides
// the same semantics.
function bytesToBuffer(bytes: Uint8Array): Buffer {
  const B: any = (globalThis as any).Buffer

  if (B && typeof B.from === 'function') {
    return B.from(bytes.buffer, bytes.byteOffset, bytes.byteLength) as Buffer
  }

  // Last-resort: cast — semantically equivalent for compressors that only
  // touch the .length / index access pattern.
  return bytes as unknown as Buffer
}

function bufferToUint8(buf: Buffer | Uint8Array): Uint8Array {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}
