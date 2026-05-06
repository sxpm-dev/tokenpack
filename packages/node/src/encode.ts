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
  out?: string
  /** Per-file compressor for pack-format encodes (default: 'brotli-11'). */
  compressor?: string
  /** File-format only: name embedded in the token; surfaced as `pack.list[0]` on decode. */
  name?: string
}

/** Result of encoding — backwards-compatible with the old `Buffer` return. */
export type EncodeResult = Buffer & { bytes: Uint8Array }

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
  if (writtenPaths.length > 1) {
    throw new Error(
      `encode produced ${writtenPaths.length} chunks — payload too large for single-PNG output. ` +
        `Use the lower-level \`tokenpack/encoder\` API or split your payload.`,
    )
  }

  const result = fs.readFileSync(writtenPaths[0])

  if (!options.out) {
    try {
      fs.unlinkSync(writtenPaths[0])
    } catch {}
  }

  // Augment the Buffer with a `bytes` Uint8Array view for ergonomic decode().
  // Buffer extends Uint8Array, so we just attach the property.
  const augmented = result as EncodeResult

  Object.defineProperty(augmented, 'bytes', {
    get() {
      return new Uint8Array(this.buffer, this.byteOffset, this.byteLength)
    },
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
