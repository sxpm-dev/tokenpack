// Zstd-backed codec — Node-only because zstd support comes from Node 22's
// built-in zlib `zstdCompressSync`/`zstdDecompressSync` or the optional
// `@mongodb-js/zstd` native module. Browsers have no native zstd, so this
// codec is registered exclusively by @tokenpack/node.

import { createRequire } from 'module'
import { AbstractCodec, type PixelBuffer } from 'tokenpack/codecs/types'
import { zstdpixInfo } from 'tokenpack/codecs/zstdpix-metadata'
import zlibBuiltin from 'zlib'

type ZstdSync = {
  compress: (buf: Buffer, level?: number) => Buffer
  decompress: (buf: Buffer) => Buffer
}

function detectZstd(): ZstdSync | null {
  // Node 22+ native zstd (lives on the already-imported zlib built-in).
  const zlib = zlibBuiltin as unknown as Record<string, unknown>

  if (
    typeof zlib['zstdCompressSync'] === 'function' &&
    typeof zlib['zstdDecompressSync'] === 'function'
  ) {
    const compressFn = zlib['zstdCompressSync'] as (buf: Buffer, opts?: object) => Buffer
    const decompressFn = zlib['zstdDecompressSync'] as (buf: Buffer) => Buffer
    const constants = zlibBuiltin.constants as unknown as Record<string, number>
    const LEVEL_PARAM = constants['ZSTD_c_compressionLevel'] ?? 100

    return {
      compress: (buf: Buffer, level = 3) => {
        try {
          return compressFn(buf, { params: { [LEVEL_PARAM]: level } })
        } catch {
          return compressFn(buf)
        }
      },
      decompress: buf => decompressFn(buf),
    }
  }

  // Fallback: @mongodb-js/zstd (optional package, sync API only).
  try {
    const _require = createRequire(import.meta.url)
    const mongoZstd = _require('@mongodb-js/zstd') as unknown as Record<string, unknown>

    if (typeof mongoZstd['compressSync'] === 'function') {
      const compressFn = mongoZstd['compressSync'] as (buf: Buffer, level?: number) => Buffer
      const decompressFn = mongoZstd['decompressSync'] as (buf: Buffer) => Buffer

      return {
        compress: (buf, level = 3) => compressFn(buf, level),
        decompress: buf => decompressFn(buf),
      }
    }
  } catch {
    // package not installed
  }

  return null
}

let _zstd: ZstdSync | null | undefined = undefined

function getZstd(): ZstdSync {
  if (_zstd === undefined) _zstd = detectZstd()
  if (_zstd === null) {
    throw new Error('zstdpix requires Node.js ≥22 or @mongodb-js/zstd package')
  }

  return _zstd
}

export function hasZstd(): boolean {
  if (_zstd === undefined) _zstd = detectZstd()

  return _zstd !== null
}

export class ZstdpixCodec extends AbstractCodec {
  readonly id = zstdpixInfo.id
  readonly name = zstdpixInfo.name
  readonly metadata = zstdpixInfo.metadata

  estimateDataPixels(input: Buffer, channels = 3): number {
    if (input.length === 0) return 1
    const compressed = getZstd().compress(input, 3)

    return Math.ceil(compressed.length / channels) + 1
  }

  encode(input: Buffer, dataPixelCount: number, _w: number, _h: number, channels = 3): PixelBuffer {
    const pixels = new Uint8Array(dataPixelCount * channels)

    if (input.length === 0) return pixels
    const compressed = getZstd().compress(input, 3)

    pixels.set(compressed.subarray(0, Math.min(compressed.length, pixels.length)))

    return pixels
  }

  // The Zstd frame self-describes its size, so trailing pixel-padding is harmless.
  decode(pixels: PixelBuffer, length: number): Buffer {
    if (length === 0) return Buffer.alloc(0)
    const raw = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)

    return getZstd().decompress(raw).subarray(0, length)
  }
}

export const zstdpixCodec = new ZstdpixCodec()
