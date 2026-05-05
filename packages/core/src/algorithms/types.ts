import type { Readable } from 'stream'

import type { AbstractCodec, CodecMetadata, Friendliness } from '../codecs/types'
import type { AbstractCompressor } from '../compressors/types'
import type { AbstractDrawer } from '../drawers/types'
import type { AbstractSurface } from '../surfaces/types'
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
  family: CodecMetadata['family']
  familyLabel: string
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
  abstract readonly family: CodecMetadata['family']
  abstract readonly familyLabel: string
  abstract readonly codec: AbstractCodec
  abstract readonly compressor: AbstractCompressor
  abstract readonly drawer: AbstractDrawer
  abstract readonly surface: AbstractSurface
  abstract readonly capabilities: AlgorithmCapabilities
  abstract readonly options: AlgorithmOption[]

  abstract encode(input: Buffer, options: Omit<EncodeOptions, 'algo'>): Promise<string[]>
  abstract decode(inputPath: string, options: DecodeOptions): Promise<void>
  abstract decodeToBuffer(inputPath: string, key?: string): Promise<Buffer>
  abstract decodeFromBuffer(imageBuffer: Buffer, key?: string, ext?: string): Promise<Buffer>
  abstract stream: {
    decode(input: Readable, key?: string): Readable
  }

  abstract toCatalogEntry(): AlgorithmCatalogEntry
}
