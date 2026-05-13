// Single unified encode for @tokenpack/node.
//
//   encode(buffer)         → encode raw bytes (file format)
//   encode('./file.txt')   → read file, encode contents (file format)
//   encode('./src')        → walk directory, pack as CART, encode (legacy file format)
//   encode(builder)        → encode a PackBuilder as pack format (per-file regions)
//
// Returns the encoded image bytes plus a `bytes` field for direct use with `decode()`.

import fs from 'fs'
import {
  isRouterTokenPack,
  PackBuilder,
  planRouterBundle,
  ROUTER_MANIFEST_PATH,
  ROUTER_TOKEN_FILE,
  type RouterTokenPack,
} from 'tokenpack'
import type { AlgorithmOptions } from 'tokenpack/algorithms/types'
import { packDirs } from 'tokenpack/archive'
import { compressRaw } from 'tokenpack/compressors'
import { wrapFileWithName } from 'tokenpack/pack-format/encode-file'
import { encodePack } from 'tokenpack/pack-format/encode-pack'

import { nodeAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'

export type EncodeInput = string | Buffer | Uint8Array | PackBuilder | RouterTokenPack

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

export interface EncodedTokenArtifact {
  filename: string
  mimetype: string
  blob: Blob
}

export function encode(
  input: RouterTokenPack,
  options?: EncodeNodeOptions,
): Promise<EncodedTokenArtifact[]>
export function encode(
  input: Exclude<EncodeInput, RouterTokenPack>,
  options?: EncodeNodeOptions,
): Promise<EncodeResult>
export async function encode(
  input: EncodeInput,
  options: EncodeNodeOptions = {},
): Promise<EncodeResult | EncodedTokenArtifact[]> {
  if (isRouterTokenPack(input)) return encodeRouter(input, options)

  return encodeOne(input, options)
}

async function encodeOne(
  input: Exclude<EncodeInput, RouterTokenPack>,
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

async function encodeRouter(
  input: RouterTokenPack,
  options: EncodeNodeOptions,
): Promise<EncodedTokenArtifact[]> {
  const bundle = await planRouterBundle(input)
  const artifacts: EncodedTokenArtifact[] = []

  for (const chunk of bundle.chunks) {
    const token = await encodeOne(Buffer.from(chunk.bytes), {
      ...routerChunkEncodeOptions(options),
      out: undefined,
    })

    artifacts.push(artifactFromToken(chunk.href, token))
  }

  const routerToken = await encodeOne(Buffer.from(JSON.stringify(bundle.manifest), 'utf8'), {
    ...routerManifestEncodeOptions(options),
    out: undefined,
    name: ROUTER_MANIFEST_PATH,
  })

  return [artifactFromToken(ROUTER_TOKEN_FILE, routerToken), ...artifacts]
}

function routerManifestEncodeOptions(options: EncodeNodeOptions): EncodeNodeOptions {
  return {
    ...options,
    algo: 'linear-stream-deflate',
    compressor: 'deflate-9',
    algoOptions: {
      ...(options.algoOptions ?? {}),
      surface: {
        ...((options.algoOptions?.surface as object | undefined) ?? {}),
        channels: 3,
      },
    },
  }
}

function routerChunkEncodeOptions(options: EncodeNodeOptions): EncodeNodeOptions {
  const algoOptions = {
    ...(options.algoOptions ?? {}),
    decoration: {
      kind: 'gradient',
      size: 8,
      colorFrom: '#ff5050',
      colorTo: '#5050ff',
    },
    surface: {
      ...((options.algoOptions?.surface as object | undefined) ?? {}),
      channels: 3,
    },
  } as AlgorithmOptions

  return {
    ...options,
    algo: 'pixel-range-none',
    compressor: 'none',
    algoOptions,
  }
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

function artifactFromToken(filename: string, token: EncodeResult): EncodedTokenArtifact {
  const bytes = token.buffer.slice(
    token.byteOffset,
    token.byteOffset + token.byteLength,
  ) as ArrayBuffer

  return {
    filename,
    mimetype: 'image/png',
    blob: new Blob([bytes], { type: 'image/png' }),
  }
}

async function coerceToBuffer(input: string | Buffer | Uint8Array): Promise<Buffer> {
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
