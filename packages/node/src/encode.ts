// Single unified encode for @tokenpack/node.
//
//   encode(buffer)         → encode raw bytes (file format)
//   encode('./file.txt')   → read file, encode contents (file format)
//   encode('./src')        → walk directory, pack as CART, encode (legacy file format)
//   encode(builder)        → encode a PackBuilder as pack format (per-file regions)
//
// Returns the encoded image bytes plus a `bytes` field for direct use with `decode()`.

import fs from 'fs'
import { PackBuilder } from 'tokenpack'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import type { AlgorithmOptions } from 'tokenpack/algorithms/types'
import { packDirs } from 'tokenpack/archive'
import { compressRaw } from 'tokenpack/compressors'
import { wrapFileWithName } from 'tokenpack/pack-format/encode-file'
import { encodePack } from 'tokenpack/pack-format/encode-pack'

export type EncodeInput = string | Buffer | Uint8Array | PackBuilder

export interface EncodeNodeOptions {
  /** Algorithm name from the catalog (default: 'linear'). */
  algo?: string
  /** Output file path. When set, the encoded bytes are also written to disk. */
  out?: string
  /** Encryption key — applied symmetrically by encode/decode. */
  key?: string
  /** Per-file compressor for pack-format encodes (default: 'brotli-11'). */
  compressor?: string
  /** File-format only: name embedded in the token; surfaced as `pack.list[0]` on decode. */
  name?: string
  /**
   * Nested algorithm-options (e.g. `{ surface: { channels: 4 }, compressor: { level: 11 } }`).
   * Merged into the algorithm constructor.
   */
  algoOptions?: AlgorithmOptions
}

/** Encoded artifact bytes. Buffer extension preserves single-call ergonomics. */
export type EncodeResult = Buffer & {
  /** Same bytes as the underlying Buffer, exposed as a `Uint8Array` view. */
  bytes: Uint8Array
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

    return runImagePipeline(
      Buffer.from(packBytes.buffer, packBytes.byteOffset, packBytes.byteLength),
      options,
    )
  }

  const raw = await coerceToBuffer(input)
  const wrapped = options.name
    ? Buffer.from(wrapFileWithName(options.name, new Uint8Array(raw)).buffer)
    : raw

  return runImagePipeline(wrapped, options)
}

async function runImagePipeline(bytes: Buffer, options: EncodeNodeOptions): Promise<EncodeResult> {
  const algoName = options.algo ?? 'linear'
  const Ctor = algorithmCatalog.getByName(algoName)
  const algoOpts: AlgorithmOptions = { ...(options.algoOptions ?? {}) }

  if (options.key) algoOpts.key = options.key
  const algo = new Ctor(algoOpts)
  const out = await algo.encode(
    new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    algoOpts,
  )

  if (options.out) fs.writeFileSync(options.out, out)

  return augment(out)
}

function augment(buffer: Buffer): EncodeResult {
  const result = buffer as EncodeResult

  Object.defineProperty(result, 'bytes', {
    get() {
      return new Uint8Array(this.buffer, this.byteOffset, this.byteLength)
    },
  })

  return result
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
