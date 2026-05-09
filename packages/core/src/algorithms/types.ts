// Single source of truth for the algorithm abstraction.
//
// An Algorithm is a concrete recipe binding codec/surface/compressor/drawer/fec
// component classes. Tunable options are composed from those components. The
// catalog stores algorithm Ctors (classes); consumers `new Ctor(opts)` to use one.
//
// There is no longer a generic codec-wrapper Algorithm; every algorithm is its
// own subclass (LinearPngBrotli, BitshufflePngBrotli, PixelRangePngBrotli, etc).

import type { AbstractCodec } from '../codecs/types'
import { composeEnvironments, composeOptions } from '../components/compose'
import type { OptionsSchema } from '../components/options'
import type { AbstractCompressor } from '../compressors/types'
import {
  computeTextDiff,
  defaultDiffCompress,
  type FileDiff,
  packToEntries,
} from '../diff'
import type { AbstractDrawer } from '../drawers/types'
import type { AbstractFec } from '../fec/types'
import { encodeDiff } from '../pack-format/encode-diff'
import type { Pack } from '../pack/types'
import type { AbstractSurface } from '../surfaces/types'
import type { ImageFormat } from '../types'

export type AlgorithmEnvironment = 'node' | 'browser'

export interface AlgorithmCapabilities {
  environments: AlgorithmEnvironment[]
  surface: ImageFormat
  channels: (1 | 2 | 3 | 4)[]
  streamable: boolean
  lossless: boolean
}

export interface ComponentCtor<T> {
  new (...args: never[]): T
  optionsSchema: OptionsSchema
  fromOptions?(opts: Record<string, unknown>): T
}

export interface AlgorithmStaticBindings {
  readonly id: number
  readonly name: string
  readonly title: string
  readonly description?: string

  readonly Codec: ComponentCtor<AbstractCodec>
  readonly Surface: ComponentCtor<AbstractSurface>
  readonly Compressor: ComponentCtor<AbstractCompressor> & { familyId: string }
  readonly Drawer: ComponentCtor<AbstractDrawer>
  readonly Fec?: ComponentCtor<AbstractFec>
}

/** Algorithm Ctor — what the catalog stores. Use `new Ctor(opts)` to instantiate. */
export interface AlgorithmCtor<T extends AbstractAlgorithm = AbstractAlgorithm>
  extends AlgorithmStaticBindings {
  new (opts?: AlgorithmOptions): T
  readonly optionsSchema: OptionsSchema
  readonly capabilities: AlgorithmCapabilities
}

/** Per-instance algorithm options. Keys are namespaced per component
 *  (e.g. `{ compressor: { level: 9 }, surface: { channels: 4 } }`). */
export interface AlgorithmOptions {
  /** Encryption key — applied symmetrically by encode/decode. */
  key?: string
  codec?: Record<string, unknown>
  surface?: Record<string, unknown>
  compressor?: Record<string, unknown>
  drawer?: Record<string, unknown>
  fec?: Record<string, unknown>
}

export interface DecodeOptions {
  key?: string
  /** File extension used to pick the surface decoder. Defaults to '.png'. */
  ext?: string
}

/**
 * Result of `algo.diff(packA, packB)`. Lazy: pick the shape you want.
 *
 *   .text()  → `FileDiff[]` line-level diff per file
 *   .token() → diff token bytes (decode → DiffPack with `.entries`/`.apply()`)
 */
export interface DiffResult {
  text(): Promise<FileDiff[]>
  token(): Promise<Uint8Array>
}

/** Abstract algorithm — the single concept. Concrete subclasses bind components. */
export abstract class AbstractAlgorithm {
  // Static class bindings — subclass MUST override.
  static readonly id: number
  static readonly name: string
  static readonly title: string
  static readonly description?: string

  static readonly Codec: ComponentCtor<AbstractCodec>
  static readonly Surface: ComponentCtor<AbstractSurface>
  static readonly Compressor: ComponentCtor<AbstractCompressor> & { familyId: string }
  static readonly Drawer: ComponentCtor<AbstractDrawer>
  static readonly Fec?: ComponentCtor<AbstractFec>

  /** Options schema composed from component bindings. Read at the catalog/dashboard layer. */
  static get optionsSchema(): OptionsSchema {
    const parts: Record<string, OptionsSchema> = {
      codec: this.Codec?.optionsSchema ?? {},
      surface: this.Surface?.optionsSchema ?? {},
      compressor: this.Compressor?.optionsSchema ?? {},
      drawer: this.Drawer?.optionsSchema ?? {},
    }

    if (this.Fec) parts.fec = this.Fec.optionsSchema

    return composeOptions(parts)
  }

  /** Capabilities derived from component classes. Static — no instantiation. */
  static get capabilities(): AlgorithmCapabilities {
    type EnvComponent = { environments?: readonly AlgorithmEnvironment[] }
    const components: EnvComponent[] = [
      this.Codec as unknown as EnvComponent,
      this.Surface as unknown as EnvComponent,
      this.Compressor as unknown as EnvComponent,
      this.Drawer as unknown as EnvComponent,
    ]

    const environments = composeEnvironments(components)
    const surfaceProbe = new this.Surface()

    return {
      environments,
      surface: surfaceProbe.format,
      channels: [...surfaceProbe.supportedChannels],
      streamable: surfaceProbe.streamable,
      lossless: surfaceProbe.lossless,
    }
  }

  // Instance — populated by AbstractAlgorithm constructor based on opts.
  readonly opts: AlgorithmOptions
  readonly codec: AbstractCodec
  readonly surface: AbstractSurface
  readonly compressor: AbstractCompressor
  readonly drawer: AbstractDrawer
  readonly fec?: AbstractFec

  constructor(opts: AlgorithmOptions = {}) {
    this.opts = opts
    const ctor = this.constructor as unknown as AlgorithmStaticBindings

    this.codec = instantiate(ctor.Codec, opts.codec)
    this.surface = instantiate(ctor.Surface, opts.surface)
    this.compressor = instantiate(ctor.Compressor, opts.compressor)
    this.drawer = instantiate(ctor.Drawer, opts.drawer)
    if (ctor.Fec) this.fec = instantiate(ctor.Fec, opts.fec)
  }

  abstract encode(input: Uint8Array, opts?: AlgorithmOptions): Promise<Buffer>
  abstract decode(source: Buffer | Uint8Array, opts?: DecodeOptions): Promise<Buffer>

  /**
   * Streaming encode. Default: collect input → run encode → emit single chunk.
   * Streaming-aware algorithms override with true pipelining.
   */
  encodeStream(
    input: ReadableStream<Uint8Array>,
    opts: AlgorithmOptions = {},
  ): ReadableStream<Uint8Array> {
    const algo = this

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const collected = await collectStream(input)
        const out = await algo.encode(collected, opts)

        controller.enqueue(new Uint8Array(out.buffer, out.byteOffset, out.byteLength))
        controller.close()
      },
    })
  }

  /**
   * Streaming decode. Default: collect source → run decode → emit single chunk.
   */
  decodeStream(
    source: ReadableStream<Uint8Array>,
    opts: DecodeOptions = {},
  ): ReadableStream<Uint8Array> {
    const algo = this

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const collected = await collectStream(source)
        const buf = Buffer.from(collected.buffer, collected.byteOffset, collected.byteLength)
        const out = await algo.decode(buf, opts)

        controller.enqueue(new Uint8Array(out.buffer, out.byteOffset, out.byteLength))
        controller.close()
      },
    })
  }

  /**
   * Pack-level diff. Returns a chainable result whose `.text()` produces a
   * line-level `FileDiff[]` and `.token()` produces a structured diff token
   * (Uint8Array). The diff token is wrapped using THIS algorithm's `encode()`
   * so applying it later (via `decode → diffPack.apply(prev)`) is symmetric
   * with the source tokens' packaging.
   *
   * Subclasses may override to redefine diff semantics (e.g. PixelRange could
   * compare `tpAK` chunks directly without re-encoding).
   */
  diff(packA: Pack, packB: Pack): DiffResult {
    const algo = this

    return {
      text: () => computeTextDiff(packA, packB),
      async token() {
        const entriesA = await packToEntries(packA)
        const entriesB = await packToEntries(packB)
        const diffBytes = await encodeDiff(entriesA, entriesB, defaultDiffCompress)
        const buf = Buffer.from(diffBytes.buffer, diffBytes.byteOffset, diffBytes.byteLength)
        const out = await algo.encode(buf)

        return new Uint8Array(out.buffer, out.byteOffset, out.byteLength)
      },
    }
  }

  /** Source detection — does this algorithm own this artifact? */
  canHandle(_buffer: Buffer, _ext?: string): boolean {
    return false
  }
}

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { value, done } = await reader.read()

    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
    }
  }
  const merged = new Uint8Array(total)
  let off = 0

  for (const c of chunks) {
    merged.set(c, off)
    off += c.length
  }

  return merged
}

function instantiate<T>(Ctor: ComponentCtor<T>, opts: unknown): T {
  const optsRecord = (opts && typeof opts === 'object' ? opts : {}) as Record<string, unknown>

  if (typeof Ctor.fromOptions === 'function') return Ctor.fromOptions(optsRecord)

  return new Ctor()
}
