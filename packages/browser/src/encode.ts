// Browser encode — thin proxy: normalize input → look up algorithm → delegate.

import { PackBuilder } from 'tokenpack'
import { browserAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import type { AlgorithmOptions } from 'tokenpack/algorithms/types'
import { compressRaw } from 'tokenpack/compressors'
import { wrapFileWithName } from 'tokenpack/pack-format/encode-file'
import { encodePack } from 'tokenpack/pack-format/encode-pack'

export interface EncodeResult {
  blobs: Blob[]
  bytes: Uint8Array
  objectURL: string
  dataURL: string
  image: HTMLImageElement
}

export interface EncodeBrowserOptions {
  /** Catalog algorithm name. Defaults to 'linear' (PNG + Brotli + Dense). */
  algo?: string
  /** Per-pack-region compressor for PackBuilder input (default: deflate-9 — FE-friendly). */
  compressor?: string
  /** File-format only: name embedded in the token; surfaced as `pack.list[0]` on decode. */
  name?: string
  /** Encryption key — applied symmetrically by encode/decode. */
  key?: string
  /** Nested algorithm options (e.g. `{ compressor: { level: 11 }, surface: { channels: 4 } }`). */
  algoOptions?: AlgorithmOptions
}

export async function encode(
  content: string | Uint8Array | ArrayBuffer | Blob | PackBuilder,
  options: EncodeBrowserOptions = {},
): Promise<EncodeResult> {
  let bytes: Uint8Array
  let runtimeOptions: EncodeBrowserOptions = options

  if (content instanceof PackBuilder) {
    const entries = await content.build()
    // Browser-side default: deflate (CompressionStream('deflate') is always
    // available). Brotli encode requires the server. Callers that explicitly
    // want brotli for per-file regions can pass `options.compressor: 'brotli-11'`
    // — that path goes through server-encode, not this browser flow.
    const compressor = options.compressor ?? 'deflate-9'

    bytes = await encodePack(entries, async b => {
      const r = await compressRaw(b, compressor)

      return {
        bytes: r.bytes,
        compressor: r.compressor,
        level: r.level,
        originalSize: r.originalSize,
      }
    })
    // Keep the outer pixel recipe browser-decodable. Pack regions are already
    // compressed, but `linear-none` is no longer part of the curated catalog.
    runtimeOptions = { ...options, algo: options.algo ?? 'linear-deflate' }
  } else {
    const raw = await coerceToBytes(content)

    bytes = options.name ? wrapFileWithName(options.name, raw) : raw
  }

  const algoName = runtimeOptions.algo ?? 'linear'
  const Ctor = algorithmCatalog.getByName(algoName)
  const algoOpts: AlgorithmOptions = { ...(runtimeOptions.algoOptions ?? {}) }

  if (runtimeOptions.key) algoOpts.key = runtimeOptions.key
  const algorithm = new Ctor(algoOpts)
  const pngBytes = await algorithm.encode(bytes, algoOpts)
  const surface = new (Ctor.Surface as unknown as new () => { mimeType: string })()

  // Build conveniences: Blob, objectURL, dataURL, <img>.
  const blob = new Blob([pngBytes as unknown as BlobPart], { type: surface.mimeType })
  const objectURL = URL.createObjectURL(blob)
  const dataURL = await blobToDataURL(blob)
  const image = new Image()

  image.src = objectURL
  const tokenBytes = new Uint8Array(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength)

  return { blobs: [blob], bytes: tokenBytes, objectURL, dataURL, image }
}

async function coerceToBytes(input: string | Uint8Array | ArrayBuffer | Blob): Promise<Uint8Array> {
  if (typeof input === 'string') return new TextEncoder().encode(input)
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  if (input instanceof Blob) return new Uint8Array(await input.arrayBuffer())
  throw new TypeError('encode(): unsupported input type')
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
