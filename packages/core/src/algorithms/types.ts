import type { AbstractCodec, Friendliness } from '../codecs/types'
import type { AbstractCompressor } from '../compressors/types'
import type { DrawnChunk } from '../drawers/types'
import type { AbstractDrawer } from '../drawers/types'
import type { AbstractSurface, SurfacePixels } from '../surfaces/types'
import type { DecodeOptions, EncodeOptions } from '../types'

export type AlgorithmOptionType = 'select' | 'number' | 'boolean' | 'color' | 'gradient'

export interface AlgorithmOption {
  name: string
  label: string
  type: AlgorithmOptionType
  defaultValue?: unknown
  values?: unknown[]
  description?: string
}

export interface AlgorithmCapabilities {
  streamable: boolean
  decodeOnFlight: boolean
  browserFriendly: boolean
  nodeOnly: boolean
}

export interface AlgorithmCatalogEntry {
  id: number
  name: string
  title: string
  description: string
  composition: string
  pixelLayout: string
  writeStyle: string
  dependencies: string
  beFriendly: Friendliness
  feFriendly: Friendliness
  streamFriendly: Friendliness
  approxRatio: string
  capabilities: AlgorithmCapabilities
  options: AlgorithmOption[]
  optionLabels: string[]
}

export abstract class AbstractAlgorithm {
  abstract readonly id: number
  abstract readonly name: string
  abstract readonly title: string
  abstract readonly description: string
  abstract readonly codec: AbstractCodec
  abstract readonly compressor: AbstractCompressor
  abstract readonly drawer: AbstractDrawer
  abstract readonly surface: AbstractSurface
  abstract readonly capabilities: AlgorithmCapabilities
  abstract readonly options: AlgorithmOption[]

  // Pure browser-safe encode: returns raw pixel chunks. Consumers wrap these
  // into PNG/WebP via canvas/upng-js (browser) or sharp/pngjs (node).
  abstract encodeBytes(
    input: Uint8Array,
    options: Omit<EncodeOptions, 'algo' | 'out'>,
  ): Promise<DrawnChunk[]>

  // Pure browser-safe decode: takes already-extracted pixel buffers
  // (from canvas getImageData / sharp / etc.) and returns the original payload.
  abstract decodeBytes(images: SurfacePixels[], key?: string): Promise<Buffer>

  // fs/file convenience wrappers — Node-only. Will physically relocate to
  // `@tokenpack/node` in Phase 2.
  abstract encode(input: Buffer, options: Omit<EncodeOptions, 'algo'>): Promise<string[]>
  abstract decode(inputPath: string, options: DecodeOptions): Promise<void>
  abstract decodeToBuffer(inputPath: string, key?: string): Promise<Buffer>
  abstract decodeFromBuffer(imageBuffer: Buffer, key?: string, ext?: string): Promise<Buffer>

  // Stream decode (Node Readable in / Readable out). Lazy-loaded internally;
  // the `unknown` here keeps `@tokenpack/core` from importing `node:stream`.
  abstract stream: {
    decode(input: unknown, key?: string): Promise<unknown>
  }

  abstract toCatalogEntry(): AlgorithmCatalogEntry
}
