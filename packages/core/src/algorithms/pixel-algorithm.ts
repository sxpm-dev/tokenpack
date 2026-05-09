// PixelAlgorithm — base for algorithms whose data is encoded into image pixels.
//
// Implements the standard pipeline:
//   encode: compress → encrypt → fec.encode → drawer.write → surface.writeBuffer
//   decode: surface.readBuffer → drawer.read → finalizeChunks
//
// Concrete algorithm classes (LinearPngBrotli, BitshufflePngBrotli, etc.)
// extend PixelAlgorithm and just declare their static Codec/Surface/Compressor/
// Drawer bindings. The pipeline body is shared.
//
// Future PixelRange* algorithms store data in image-format ancillary chunks
// instead of pixels — they extend AbstractAlgorithm directly with their own
// encode/decode bodies.

import { encryptData } from '../crypto'
import { pickDrawerForPixels } from '../drawers'
import type { ChunkReadResult, DrawContext, DrawnChunk } from '../drawers/types'
import { finalizeChunks } from '../finalize-chunks'
import { isCompactToken, readCompactHeader, readHeader } from '../header'
import type { SurfacePixels } from '../surfaces/types'
import {
  AbstractAlgorithm,
  type AlgorithmCtor,
  type AlgorithmOptions,
  type DecodeOptions,
} from './types'

interface PixelOpts extends AlgorithmOptions {
  surface?: { channels?: 1 | 2 | 3 | 4 }
}

export abstract class PixelAlgorithm extends AbstractAlgorithm {
  /**
   * Run the encode pipeline up through `drawer.write`, returning pixel chunks.
   * Browser uses this and writes its own canvas-PNG; Node `encode()` calls
   * this and then runs the chunk through `surface.writeBuffer`.
   */
  async encodeToChunks(input: Uint8Array, opts: AlgorithmOptions = {}): Promise<DrawnChunk[]> {
    const merged: PixelOpts = { ...this.opts, ...opts }
    const requestedChannels = merged.surface?.channels ?? 3
    const requiredChannels = this.codec.metadata?.requiredChannels
    const codecBpp = (requiredChannels ?? requestedChannels) as 1 | 2 | 3 | 4
    const bpp = this.surface.coerceBpp(codecBpp)

    let data: Buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    let compressionLevel = 0
    let uncompressedLength = 0

    if (this.compressor.id !== 'none') {
      const result = await this.compressor.compress(data)

      if (result.data.length < data.length) {
        uncompressedLength = data.length
        data = result.data
        compressionLevel = result.level
      }
    }

    let encrypted = false
    const key = merged.key

    if (key) {
      data = Buffer.from(await encryptData(data, key))
      encrypted = true
    }

    let fecLevel = 0
    let preFecLength = 0

    if (this.fec) {
      preFecLength = data.length
      const fecResult = this.fec.encode(data)

      data = fecResult.data
      fecLevel = fecResult.level
    }

    const algorithmId = (this.constructor as unknown as { id: number }).id
    const ctx: DrawContext = {
      algorithmId,
      codec: this.codec,
      surface: this.surface,
      bpp,
      compressionLevel,
      uncompressedLength,
      encrypted,
      cellSize: 1,
      requiresFullHeader: this.compressor.requiresFullHeader || fecLevel > 0,
      fecLevel,
      preFecLength,
    }

    return this.drawer.write(data, ctx).chunks
  }

  async encode(input: Uint8Array, opts: AlgorithmOptions = {}): Promise<Buffer> {
    const chunks = await this.encodeToChunks(input, opts)

    if (chunks.length > 1) {
      throw new Error(
        `PixelAlgorithm.encode: payload requires ${chunks.length} chunks; multi-chunk not implemented`,
      )
    }

    return this.surface.writeBuffer(chunks[0])
  }

  /**
   * Decode from pre-decoded pixel images. Browser path: it has already done
   * the canvas → ImageData pipeline, so this skips `surface.readBuffer`.
   */
  async decodeFromImages(images: SurfacePixels[], opts: DecodeOptions = {}): Promise<Buffer> {
    const reads: ChunkReadResult[] = images.map(image => {
      const drawer = pickDrawerForPixels(image.pixels)

      return drawer.read(image, { codec: this.codec })
    })

    return finalizeChunks(reads, opts.key ?? this.opts.key)
  }

  async decode(source: Buffer | Uint8Array, opts: DecodeOptions = {}): Promise<Buffer> {
    const buf = Buffer.isBuffer(source)
      ? source
      : Buffer.from(source.buffer, source.byteOffset, source.byteLength)
    const image: SurfacePixels = await this.surface.readBuffer(buf)
    const result = await this.decodeFromImages([image], opts)

    return result
  }

  /** Pixel-header sniff. Recipes whose ID is in the pixel data inherit this. */
  override canHandle(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 6) return false
    const ctor = this.constructor as unknown as { id: number }

    try {
      if (isCompactToken(buffer)) return readCompactHeader(buffer).algoId === ctor.id

      return readHeader(buffer).algorithmId === ctor.id
    } catch {
      return false
    }
  }
}

/**
 * Helper for declaring a concrete pixel-data algorithm class. Returns a class
 * extending PixelAlgorithm with the given component bindings as static fields.
 */
export function definePixelAlgorithm(spec: {
  id: number
  name: string
  title: string
  description?: string
  Codec: typeof PixelAlgorithm.Codec
  Surface: typeof PixelAlgorithm.Surface
  Compressor: typeof PixelAlgorithm.Compressor
  Drawer: typeof PixelAlgorithm.Drawer
  Fec?: typeof PixelAlgorithm.Fec
}): AlgorithmCtor<PixelAlgorithm> {
  // Built dynamically so each registration produces a fresh class. Static
  // fields cast through unknown because TS tracks `static name: string` on
  // every Function and we're overriding it with the algorithm's name field.
  const Cls = class extends PixelAlgorithm {} as unknown as {
    new (opts?: ConstructorParameters<typeof PixelAlgorithm>[0]): PixelAlgorithm
    id: number
    name: string
    title: string
    description?: string
    Codec: typeof PixelAlgorithm.Codec
    Surface: typeof PixelAlgorithm.Surface
    Compressor: typeof PixelAlgorithm.Compressor
    Drawer: typeof PixelAlgorithm.Drawer
    Fec?: typeof PixelAlgorithm.Fec
  }

  Cls.id = spec.id
  Cls.title = spec.title
  Cls.description = spec.description
  Cls.Codec = spec.Codec
  Cls.Surface = spec.Surface
  Cls.Compressor = spec.Compressor
  Cls.Drawer = spec.Drawer
  Cls.Fec = spec.Fec
  Object.defineProperty(Cls, 'name', { value: spec.name, configurable: true })

  return Cls as unknown as AlgorithmCtor<PixelAlgorithm>
}
