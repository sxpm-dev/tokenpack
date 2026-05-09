import type { AbstractCodec } from '../codecs/types'
import type { OptionsSchema } from '../components/options'
import type { AbstractSurface, SurfacePixels } from '../surfaces/types'

export interface DrawerCapabilities {
  streamable: boolean
  decodeOnFlight: boolean
  requiresLosslessSurface: boolean
  requiresAlpha: boolean
  supportedChannels: ReadonlySet<1 | 2 | 3 | 4>
}

export interface DrawContext {
  /** Algorithm catalog id — written into the pixel header for dispatch on
   *  decode. The reader (canHandle / detectFromBuffer / stream-decoder) looks
   *  up the algorithm Ctor by this id, NOT the codec id; the codec id only
   *  identifies the codec family inside core. */
  algorithmId: number
  codec: AbstractCodec
  surface: AbstractSurface
  bpp: 1 | 2 | 3 | 4
  compressionLevel: number
  uncompressedLength: number
  encrypted: boolean
  cellSize: number
  width?: number
  requiresFullHeader: boolean
  fecLevel: number // 0 = none, 1 = rs-5, 2 = rs-15, 3 = rs-25
  preFecLength: number // payload bytes before FEC (0 when fecLevel === 0)
}

export interface ReadContext {
  codec: AbstractCodec
}

export interface DrawnChunk {
  pixels: Uint8Array
  width: number
  height: number
  fileChannels: 3 | 4
}

export interface DrawnArtifact {
  chunks: DrawnChunk[]
}

export interface ChunkReadResult {
  bytes: Buffer
  compressionLevel: number
  uncompressedLength: number
  encrypted: boolean
  fecLevel: number
  preFecLength: number
}

export abstract class AbstractDrawer {
  /** Tunable options for this drawer (e.g. cellSize for dot drawer). */
  static readonly optionsSchema: OptionsSchema = {}

  abstract readonly id: string
  abstract readonly label: string
  /** Short human-readable explanation for UI tooltips. Subclasses override. */
  readonly description: string = ''
  abstract readonly outputKind: 'raster-pixels'
  abstract readonly capabilities: DrawerCapabilities

  abstract write(input: Buffer, ctx: DrawContext): DrawnArtifact
  abstract read(image: SurfacePixels, ctx: ReadContext): ChunkReadResult
}
