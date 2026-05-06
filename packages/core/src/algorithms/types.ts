import type { AbstractCodec, Friendliness } from '../codecs/types'
import type { AbstractCompressor } from '../compressors/types'
import type { DrawnChunk } from '../drawers/types'
import type { AbstractDrawer } from '../drawers/types'
import type { AbstractSurface, SurfacePixels } from '../surfaces/types'
import type { EncodeOptions } from '../types'

export type AlgorithmOptionType = 'select' | 'number' | 'boolean' | 'color' | 'gradient'

export type AlgorithmEnvironment = 'node' | 'browser'

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
  /**
   * Environments where this algorithm can run end-to-end (encode + decode).
   * Determined dynamically from which compressors/surfaces are registered when
   * `toCatalogEntry()` is called — e.g. an algorithm that defaults to brotli-11
   * is `['node']` only because browsers can decode but not encode brotli.
   */
  environments: AlgorithmEnvironment[]
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

  // Pure (env-neutral) encode: returns raw pixel chunks. Consumers wrap these
  // into PNG/WebP via canvas/createImageBitmap (browser) or sharp/pngjs (node).
  abstract encodeBytes(
    input: Uint8Array,
    options: Omit<EncodeOptions, 'algo' | 'out'>,
  ): Promise<DrawnChunk[]>

  // Pure (env-neutral) decode: takes already-extracted pixel buffers
  // (from canvas getImageData / sharp / etc.) and returns the original payload.
  abstract decodeBytes(images: SurfacePixels[], key?: string): Promise<Buffer>

  // fs/file convenience wrapper — Node-only. Browser implementations should throw.
  abstract encode(input: Buffer, options: Omit<EncodeOptions, 'algo'>): Promise<string[]>

  abstract toCatalogEntry(): AlgorithmCatalogEntry
}
