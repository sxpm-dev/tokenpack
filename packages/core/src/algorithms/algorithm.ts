import path from 'path'
import { PassThrough, type Readable } from 'stream'

import type { AbstractCodec } from '../codecs/types'
import { isStreamingCodec } from '../codecs/types'
import { compressorRegistry } from '../compressors/registry'
import type { AbstractCompressor } from '../compressors/types'
import { encryptData } from '../crypto'
import { DenseDrawer, pickDrawerForOptions } from '../drawers'
import type { AbstractDrawer, DrawContext } from '../drawers/types'
import { fecRegistry } from '../fec/registry'
import { surfaceRegistry } from '../surfaces/registry'
import type { AbstractSurface } from '../surfaces/types'
import type { DecodeOptions, EncodeOptions } from '../types'
import {
  AbstractAlgorithm,
  type AlgorithmCapabilities,
  type AlgorithmCatalogEntry,
  type AlgorithmOption,
} from './types'

export interface AlgorithmInit {
  codec: AbstractCodec
  name?: string
  compressor?: AbstractCompressor
  drawer?: AbstractDrawer
  surface?: AbstractSurface
  defaults?: Partial<Omit<EncodeOptions, 'algo'>>
  title?: string
  description?: string
  browserFriendly?: boolean
  nodeOnly?: boolean
  options?: AlgorithmOption[]
}

const DEFAULT_OPTIONS: AlgorithmOption[] = [
  {
    name: 'compressionMode',
    label: 'Compression',
    type: 'select',
    defaultValue: 'brotli-11',
    values: compressorRegistry.listModes(),
  },
  {
    name: 'channels',
    label: 'Bytes per pixel',
    type: 'select',
    defaultValue: 3,
    values: [1, 2, 3, 4],
  },
  {
    name: 'format',
    label: 'Surface',
    type: 'select',
    defaultValue: 'png',
    values: ['png', 'webp', 'avif'],
  },
  {
    name: 'fecMode',
    label: 'Error correction',
    type: 'select',
    defaultValue: 'none',
    values: fecRegistry.listModes(),
  },
]

function chunkPaths(out: string, total: number): string[] {
  if (total === 1) return [out]
  const ext = path.extname(out)
  const base = out.slice(0, -ext.length)

  return Array.from({ length: total }, (_, i) => `${base}_${i + 1}of${total}${ext}`)
}

function resolveCompressionMode(opts: Partial<EncodeOptions>): string {
  if (opts.compressionMode) return opts.compressionMode
  if (opts.compress === true) return 'brotli-11'

  return 'none'
}

export class Algorithm extends AbstractAlgorithm {
  readonly id: number
  readonly name: string
  readonly title: string
  readonly description: string
  readonly codec: AbstractCodec
  readonly compressor: AbstractCompressor
  readonly drawer: AbstractDrawer
  readonly surface: AbstractSurface
  readonly capabilities: AlgorithmCapabilities
  readonly options: AlgorithmOption[]
  readonly defaults: Partial<Omit<EncodeOptions, 'algo'>>

  readonly stream = {
    decode: (input: Readable, key?: string): Readable => {
      const out = new PassThrough()

      import('../stream-decoder')
        .then(({ createTokenDecodeStream }) => {
          input.pipe(createTokenDecodeStream(key)).pipe(out)
        })
        .catch(err => out.destroy(err))

      return out
    },
  }

  constructor(init: AlgorithmInit) {
    super()
    this.codec = init.codec
    this.compressor = init.compressor ?? compressorRegistry.byMode('brotli-11')
    this.drawer = init.drawer ?? new DenseDrawer()
    this.surface = init.surface ?? surfaceRegistry.byFormat('png')
    this.id = init.codec.id
    this.name = init.name ?? init.codec.name
    const meta = init.codec.metadata

    this.title = init.title ?? meta?.description?.split('.')[0] ?? this.name
    this.description = init.description ?? meta?.description ?? `${init.codec.name} algorithm`
    this.options = init.options ?? DEFAULT_OPTIONS
    this.defaults = init.defaults ?? {}
    this.validateCompatibility()
    const streamable = this.surface.streamable || isStreamingCodec(this.codec)
    const decodeOnFlight =
      this.surface.streamable && isStreamingCodec(this.codec) && this.compressor.streamableDecode

    this.capabilities = {
      streamable,
      decodeOnFlight,
      browserFriendly: init.browserFriendly ?? meta?.feFriendly !== 'no',
      nodeOnly: init.nodeOnly ?? meta?.feFriendly === 'no',
    }
  }

  async encode(input: Buffer, options: Omit<EncodeOptions, 'algo'>): Promise<string[]> {
    const merged: Omit<EncodeOptions, 'algo'> = {
      ...this.defaults,
      ...options,
      out: options.out ?? this.defaults.out!,
    }
    const compressor = compressorRegistry.byMode(resolveCompressionMode(merged))
    const surface = surfaceRegistry.byFormat(
      merged.format ?? this.surface.format,
      merged.streaming ?? false,
    )
    const drawer = pickDrawerForOptions(merged.cellSize)
    const fec = fecRegistry.byMode(merged.fecMode)

    if (merged.streaming && fec.id !== 'none') {
      throw new Error(
        `streaming and FEC are incompatible (got fecMode=${fec.id}, streaming=true). Disable one or the other.`,
      )
    }

    const requested = (merged.channels ?? 3) as 1 | 2 | 3 | 4
    const required = this.codec.metadata?.requiredChannels
    const codecBpp: 1 | 2 | 3 | 4 = required ?? requested
    const bpp: 1 | 2 | 3 | 4 = surface.coerceBpp(codecBpp)

    let dataToEncode = input
    let compressionLevel = 0
    let uncompressedLength = 0

    if (compressor.id !== 'none') {
      const result = compressor.compress(input)

      if (result.data.length < input.length) {
        dataToEncode = result.data
        compressionLevel = result.level
        uncompressedLength = input.length
        const ratio = ((1 - result.data.length / input.length) * 100).toFixed(1)

        console.log(
          `Compressed [${compressor.id}] ${input.length} → ${result.data.length} bytes (${ratio}% smaller)`,
        )
      } else {
        console.log(`Compression skipped (file too small to benefit)`)
      }
    }

    let encrypted = false

    if (merged.key) {
      dataToEncode = encryptData(dataToEncode, merged.key)
      encrypted = true
      console.log(`Encrypted → ${dataToEncode.length} bytes`)
    }

    let preFecLength = 0

    if (fec.id !== 'none') {
      preFecLength = dataToEncode.length
      const fecResult = fec.encode(dataToEncode)

      dataToEncode = fecResult.data
      console.log(
        `FEC [${fec.id}] ${preFecLength} → ${dataToEncode.length} bytes (+${dataToEncode.length - preFecLength})`,
      )
    }

    const ctx: DrawContext = {
      codec: this.codec,
      surface,
      bpp,
      style: merged.style,
      compressionLevel,
      uncompressedLength,
      encrypted,
      cellSize: merged.cellSize ?? 1,
      width: merged.width,
      // FEC requires full header (compact has no room for fecLevel + preFecLength).
      requiresFullHeader: compressor.requiresFullHeader || fec.headerLevel > 0,
      fecLevel: fec.headerLevel,
      preFecLength,
    }

    const { chunks } = drawer.write(dataToEncode, ctx)
    const paths = chunkPaths(merged.out, chunks.length)

    if (chunks.length > 1)
      console.log(`Chunking into ${chunks.length} images (${DenseDrawer.MAX_WIDTH}px max width)`)

    for (let i = 0; i < chunks.length; i++) {
      await surface.write(paths[i], chunks[i])
      if (chunks.length > 1) console.log(`  Chunk ${i + 1}/${chunks.length} → ${paths[i]}`)
    }

    return paths
  }

  async decode(inputPath: string, options: DecodeOptions): Promise<void> {
    const { decodeFile } = await import('../decoder')

    return decodeFile(inputPath, options)
  }

  async decodeToBuffer(inputPath: string, key?: string): Promise<Buffer> {
    const { decodeToBuffer } = await import('../decoder')

    return decodeToBuffer(inputPath, key)
  }

  async decodeFromBuffer(imageBuffer: Buffer, key?: string, ext = '.png'): Promise<Buffer> {
    const { decodeFromBuffer } = await import('../decoder')

    return decodeFromBuffer(imageBuffer, key, ext)
  }

  toCatalogEntry(): AlgorithmCatalogEntry {
    const meta = this.codec.metadata

    return {
      id: this.id,
      name: this.name,
      title: this.title,
      description: this.description,
      composition: `${this.codec.name} + ${this.compressor.id} + ${this.drawer.id} + ${this.surface.id}`,
      pixelLayout: meta?.pixelLayout ?? 'RGB · 3 bytes/px',
      writeStyle: meta?.writeStyle ?? 'sequential',
      dependencies: meta?.dependencies ?? 'none (pure JS)',
      beFriendly: meta?.beFriendly ?? 'yes',
      feFriendly: meta?.feFriendly ?? 'yes',
      streamFriendly: meta?.streamFriendly ?? 'no',
      approxRatio: meta?.approxRatio ?? 'unknown',
      capabilities: this.capabilities,
      options: this.options,
      optionLabels: this.buildOptionLabels(),
    }
  }

  private buildOptionLabels(): string[] {
    const required = this.codec.metadata?.requiredChannels
    const channels = required ? `channels: ${required}` : 'channels: 1-4'
    const compressors = compressorRegistry
      .list()
      .filter(c => c.id !== 'none')
      .map(c => c.id.split('-')[0])
    const compressionFamilies = Array.from(new Set(compressors)).join(' / ')

    return [channels, `outer compression: none / ${compressionFamilies}`]
  }

  private validateCompatibility(): void {
    if (this.drawer.outputKind !== this.surface.inputKind) {
      throw new Error(
        `Algorithm "${this.name}" is invalid: drawer ${this.drawer.id} cannot feed surface ${this.surface.id}`,
      )
    }
    if (this.drawer.capabilities.requiresLosslessSurface && !this.surface.lossless) {
      throw new Error(
        `Algorithm "${this.name}" is invalid: drawer ${this.drawer.id} requires a lossless surface`,
      )
    }
    if (this.drawer.capabilities.requiresAlpha && !this.surface.preservesAlpha) {
      throw new Error(
        `Algorithm "${this.name}" is invalid: drawer ${this.drawer.id} requires alpha-preserving surface`,
      )
    }
  }
}
