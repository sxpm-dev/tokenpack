import type { AbstractCodec } from '../codecs/types'
import { isStreamingCodec } from '../codecs/types'
import { compressorRegistry } from '../compressors/registry'
import type { AbstractCompressor } from '../compressors/types'
import { encryptData } from '../crypto'
import { DenseDrawer, pickDrawerForOptions, pickDrawerForPixels } from '../drawers'
import type { AbstractDrawer, DrawContext, DrawnChunk } from '../drawers/types'
import { fecRegistry } from '../fec/registry'
import { finalizeChunks } from '../finalize-chunks'
import { surfaceRegistry } from '../surfaces/registry'
import type { AbstractSurface, SurfacePixels } from '../surfaces/types'
import type { EncodeOptions, ImageFormat } from '../types'
import {
  AbstractAlgorithm,
  type AlgorithmCapabilities,
  type AlgorithmCatalogEntry,
  type AlgorithmEnvironment,
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
  // Pure string op (no Node `path.extname`) so this stays browser-safe.
  const dot = out.lastIndexOf('.')
  const slash = out.lastIndexOf('/')
  const ext = dot > slash ? out.slice(dot) : ''
  const base = ext ? out.slice(0, -ext.length) : out

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
  readonly drawer: AbstractDrawer
  readonly capabilities: AlgorithmCapabilities
  readonly options: AlgorithmOption[]
  readonly defaults: Partial<Omit<EncodeOptions, 'algo'>>

  // Default surface/compressor are stored as identifiers, not concrete instances.
  // Resolution happens lazily through the `surface` / `compressor` getters because
  // the env package (@tokenpack/node or @tokenpack/browser) may not have populated
  // the registries yet at the moment Algorithm instances are constructed (chunk-eval
  // order during webpack bundling). By the time anything reads these getters, the
  // env-side side-effect imports have run.
  readonly defaultFormat: ImageFormat
  readonly defaultCompressionMode: string
  private readonly explicitCompressor?: AbstractCompressor
  private readonly explicitSurface?: AbstractSurface

  constructor(init: AlgorithmInit) {
    super()
    this.codec = init.codec
    this.drawer = init.drawer ?? new DenseDrawer()
    this.explicitCompressor = init.compressor
    this.explicitSurface = init.surface
    this.defaultFormat = init.surface?.format ?? init.defaults?.format ?? 'png'
    this.defaultCompressionMode = init.compressor?.id ?? 'brotli-11'
    this.id = init.codec.id
    this.name = init.name ?? init.codec.name
    const meta = init.codec.metadata

    this.title = init.title ?? meta?.description?.split('.')[0] ?? this.name
    this.description = init.description ?? meta?.description ?? `${init.codec.name} algorithm`
    this.options = init.options ?? DEFAULT_OPTIONS
    this.defaults = init.defaults ?? {}

    // Only validate when init carries explicit instances. With defaults the
    // resolved surface comes from the env-package registry and is always sound.
    if (init.surface || init.drawer) this.validateExplicitCompatibility(init)

    const nodeOnly = init.nodeOnly ?? meta?.feFriendly === 'no'
    const browserFriendly = init.browserFriendly ?? meta?.feFriendly !== 'no'
    const environments: AlgorithmEnvironment[] = nodeOnly
      ? ['node']
      : browserFriendly
        ? ['node', 'browser']
        : ['node']
    // Streaming capability is intrinsic to (codec × compressor mode); the
    // surface contributes the `png-stream` flag at encode time. We report
    // the optimistic case here.
    const streamable = isStreamingCodec(this.codec)

    this.capabilities = {
      streamable,
      decodeOnFlight: streamable,
      browserFriendly,
      nodeOnly,
      environments,
    }
  }

  get compressor(): AbstractCompressor {
    if (this.explicitCompressor) return this.explicitCompressor

    return compressorRegistry.has(this.defaultCompressionMode as never)
      ? compressorRegistry.byMode(this.defaultCompressionMode)
      : compressorRegistry.byMode('none')
  }

  get surface(): AbstractSurface {
    if (this.explicitSurface) return this.explicitSurface
    if (surfaceRegistry.has(this.defaultFormat)) return surfaceRegistry.byFormat(this.defaultFormat)
    throw new Error(
      `No surface registered for format "${this.defaultFormat}". ` +
        `Make sure @tokenpack/node or @tokenpack/browser is imported before using this algorithm.`,
    )
  }

  // Pure browser-safe encode: returns raw pixel chunks. No fs, no surface.write.
  // Consumers wrap chunks into PNG/WebP bytes (canvas/upng-js in browser, sharp/pngjs in node).
  async encodeBytes(
    input: Uint8Array,
    options: Omit<EncodeOptions, 'algo' | 'out'>,
  ): Promise<DrawnChunk[]> {
    const merged: Omit<EncodeOptions, 'algo' | 'out'> = { ...this.defaults, ...options }
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

    // Buffer.from(uint8) is a zero-copy view when input is Uint8Array — keeps
    // the existing compressor/drawer Buffer-typed signatures working.
    let dataToEncode: Buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    let compressionLevel = 0
    let uncompressedLength = 0

    if (compressor.id !== 'none') {
      const result = await compressor.compress(dataToEncode)

      if (result.data.length < dataToEncode.length) {
        const inputLen = dataToEncode.length

        dataToEncode = result.data
        compressionLevel = result.level
        uncompressedLength = inputLen
        const ratio = ((1 - result.data.length / inputLen) * 100).toFixed(1)

        console.log(
          `Compressed [${compressor.id}] ${inputLen} → ${result.data.length} bytes (${ratio}% smaller)`,
        )
      } else {
        console.log('Compression skipped (file too small to benefit)')
      }
    }

    let encrypted = false

    if (merged.key) {
      dataToEncode = Buffer.from(await encryptData(dataToEncode, merged.key))
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
      requiresFullHeader: compressor.requiresFullHeader || fec.headerLevel > 0,
      fecLevel: fec.headerLevel,
      preFecLength,
    }

    const { chunks } = drawer.write(dataToEncode, ctx)

    if (chunks.length > 1)
      console.log(`Chunking into ${chunks.length} images (${DenseDrawer.MAX_WIDTH}px max width)`)

    return chunks
  }

  // Pure browser-safe decode: takes already-extracted pixel buffers and returns
  // the original payload. Browser callers feed `<img>`/canvas-decoded pixels here.
  async decodeBytes(images: SurfacePixels[], key?: string): Promise<Buffer> {
    const reads = images.map(image => {
      const drawer = pickDrawerForPixels(image.pixels)

      return drawer.read(image, { codec: this.codec })
    })

    return finalizeChunks(reads, key)
  }

  // fs convenience wrapper — Node-only; relocates to `@tokenpack/node` in Phase 2.
  async encode(input: Buffer, options: Omit<EncodeOptions, 'algo'>): Promise<string[]> {
    const out = options.out ?? this.defaults.out!
    const surface = surfaceRegistry.byFormat(
      options.format ?? this.defaults.format ?? this.surface.format,
      options.streaming ?? this.defaults.streaming ?? false,
    )
    const chunks = await this.encodeBytes(input, options)
    const paths = chunkPaths(out, chunks.length)

    for (let i = 0; i < chunks.length; i++) {
      await surface.write(paths[i], chunks[i])
      if (chunks.length > 1) console.log(`  Chunk ${i + 1}/${chunks.length} → ${paths[i]}`)
    }

    return paths
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

  // Validates that an explicitly-supplied (drawer, surface) pair is sound.
  // Only invoked when init carries a custom drawer or surface — default
  // configs (DenseDrawer + registry-resolved 'png') skip this because the
  // pair is always valid by construction.
  private validateExplicitCompatibility(init: AlgorithmInit): void {
    if (!init.surface) return
    const { drawer } = this
    const surface = init.surface

    if (drawer.outputKind !== surface.inputKind) {
      throw new Error(
        `Algorithm "${this.name}" is invalid: drawer ${drawer.id} cannot feed surface ${surface.id}`,
      )
    }
    if (drawer.capabilities.requiresLosslessSurface && !surface.lossless) {
      throw new Error(
        `Algorithm "${this.name}" is invalid: drawer ${drawer.id} requires a lossless surface`,
      )
    }
    if (drawer.capabilities.requiresAlpha && !surface.preservesAlpha) {
      throw new Error(
        `Algorithm "${this.name}" is invalid: drawer ${drawer.id} requires alpha-preserving surface`,
      )
    }
  }
}
