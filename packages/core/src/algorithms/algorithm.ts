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
  readonly compressor: AbstractCompressor
  readonly drawer: AbstractDrawer
  readonly surface: AbstractSurface
  readonly capabilities: AlgorithmCapabilities
  readonly options: AlgorithmOption[]
  readonly defaults: Partial<Omit<EncodeOptions, 'algo'>>

  // Stream decode lives in a Node-only adapter (`@tokenpack/node` after Phase 2)
  // because it requires Node `stream.PassThrough`. Browser callers use the
  // Web Streams variant from `@tokenpack/browser` (Phase 3 / Phase 1 stream-decoder rewrite).
  readonly stream = {
    decode: async (input: unknown, key?: string): Promise<unknown> => {
      const { createTokenDecodeStream } = await import('../stream-decoder')
      const { PassThrough } = await import('stream')
      const out = new PassThrough()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(input as any).pipe(createTokenDecodeStream(key)).pipe(out)

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
      const result = compressor.compress(dataToEncode)

      if (result.data.length < dataToEncode.length) {
        const inputLen = dataToEncode.length
        dataToEncode = result.data
        compressionLevel = result.level
        uncompressedLength = inputLen
        const ratio = ((1 - result.data.length / inputLen) * 100).toFixed(1)

        console.log(`Compressed [${compressor.id}] ${inputLen} → ${result.data.length} bytes (${ratio}% smaller)`)
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
      console.log(`FEC [${fec.id}] ${preFecLength} → ${dataToEncode.length} bytes (+${dataToEncode.length - preFecLength})`)
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
