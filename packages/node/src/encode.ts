// Single unified encode for @tokenpack/node.
//
//   encode(buffer)         → encode raw bytes (file format)
//   encode('./file.txt')   → read file, encode contents (file format)
//   encode('./src')        → walk directory, pack as CART, encode (legacy file format)
//   encode(builder)        → encode a PackBuilder as pack format (per-file regions)
//
// Returns the encoded PNG bytes plus a `bytes` field for direct use with `decode()`.

import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { PackBuilder } from 'tokenpack'
import { packDirs } from 'tokenpack/archive'
import { compressRaw } from 'tokenpack/compressors'
import { encode as legacyEncode } from 'tokenpack/encoder'
import { wrapFileWithName } from 'tokenpack/pack-format/encode-file'
import { encodePack } from 'tokenpack/pack-format/encode-pack'
import type { EncodeOptions } from 'tokenpack/types'

export type EncodeInput = string | Buffer | Uint8Array | PackBuilder

export interface EncodeNodeOptions extends Omit<EncodeOptions, 'algo' | 'out'> {
  algo?: string
  /**
   * Output base path. When the payload requires multiple PNG chunks, the
   * lower-level encoder names them `<base>_1of<N>.png`, `<base>_2of<N>.png`,
   * ... A single-chunk payload writes to the bare `<base>` path.
   */
  out?: string
  /** Per-file compressor for pack-format encodes (default: 'brotli-11'). */
  compressor?: string
  /** File-format only: name embedded in the token; surfaced as `pack.list[0]` on decode. */
  name?: string
  /**
   * If true (default), payloads that exceed single-PNG capacity are written
   * as multiple chunked PNGs and surfaced via `result.chunks` / `result.paths`.
   * If false, throws when more than one chunk is produced — preserves the
   * pre-multi-chunk behaviour for callers that assume a single image.
   */
  supportChunks?: boolean
}

/**
 * Result of encoding. Back-compatible with the original `Buffer & { bytes }`
 * shape: when there's a single chunk, `bytes` and the Buffer-extension are
 * the whole payload. For multi-chunk encodes, `bytes` exposes chunk 0 and
 * the full set is on `chunks` (in order). `paths` matches when `out` was given.
 */
export type EncodeResult = Buffer & {
  bytes: Uint8Array
  chunks: Uint8Array[]
  paths: string[]
}

export async function encode(
  input: EncodeInput,
  options: EncodeNodeOptions = {},
): Promise<EncodeResult> {
  if (input instanceof PackBuilder) {
    const entries = await input.build()
    const compressor = options.compressor ?? 'brotli-11'
    const packBytes = await encodePack(entries, async bytes => {
      const r = await compressRaw(bytes, compressor)

      return {
        bytes: r.bytes,
        compressor: r.compressor,
        level: r.level,
        originalSize: r.originalSize,
      }
    })

    // Wrap pack bytes in the image pipeline with no outer compression.
    return runImagePipeline(
      Buffer.from(packBytes.buffer, packBytes.byteOffset, packBytes.byteLength),
      {
        ...options,
        compressionMode: 'none',
      },
    )
  }

  const raw = await coerceToBuffer(input)
  const wrapped = options.name
    ? Buffer.from(wrapFileWithName(options.name, new Uint8Array(raw)).buffer)
    : raw

  return runImagePipeline(wrapped, options)
}

async function runImagePipeline(bytes: Buffer, options: EncodeNodeOptions): Promise<EncodeResult> {
  const outPath =
    options.out ??
    path.join(tmpdir(), `tp-${Date.now()}-${Math.random().toString(36).slice(2)}.png`)

  const writtenPaths = await legacyEncode(bytes, { ...options, out: outPath } as EncodeOptions)

  if (writtenPaths.length === 0) throw new Error('encode produced no output')

  const supportChunks = options.supportChunks ?? true

  if (!supportChunks && writtenPaths.length > 1) {
    // Best-effort cleanup of the temporary chunks if no `out` was supplied.
    if (!options.out) {
      for (const p of writtenPaths) {
        try {
          fs.unlinkSync(p)
        } catch {}
      }
    }
    throw new Error(
      `encode produced ${writtenPaths.length} chunks — payload too large for single-PNG output. ` +
        `Pass supportChunks: true to allow multi-chunk output, or split your payload.`,
    )
  }

  const buffers = writtenPaths.map(p => fs.readFileSync(p))

  // When the caller didn't request a persistent `out`, clean up the temp files.
  if (!options.out) {
    for (const p of writtenPaths) {
      try {
        fs.unlinkSync(p)
      } catch {}
    }
  }

  // Buffer extends Uint8Array — keep the Buffer-as-result shape for back-compat.
  // `bytes` always exposes chunk 0 (matches single-chunk callers); `chunks`
  // surfaces all chunks in order; `paths` lines up 1:1 with `chunks`.
  const primary = buffers[0]
  const augmented = primary as EncodeResult

  const chunkBytes: Uint8Array[] = buffers.map(
    b => new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
  )

  Object.defineProperties(augmented, {
    bytes: {
      get() {
        return new Uint8Array(this.buffer, this.byteOffset, this.byteLength)
      },
    },
    chunks: { value: chunkBytes, enumerable: true },
    paths: { value: options.out ? writtenPaths : [], enumerable: true },
  })

  return augmented
}

async function coerceToBuffer(input: Exclude<EncodeInput, PackBuilder>): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength)
  }

  const stat = fs.statSync(input)

  if (stat.isDirectory()) {
    return packDirs([input], [], input)
  }

  return fs.readFileSync(input)
}
