import type { AbstractCodec } from '../codecs/types'
import type { AbstractSurface, SurfacePixels } from '../surfaces/types'
import type { Style } from '../types'

export interface DrawerCapabilities {
  streamable: boolean
  decodeOnFlight: boolean
  requiresLosslessSurface: boolean
  requiresAlpha: boolean
  supportedChannels: ReadonlySet<1 | 2 | 3 | 4>
}

export interface DrawContext {
  codec: AbstractCodec
  surface: AbstractSurface
  bpp: 1 | 2 | 3 | 4
  style?: Partial<Style>
  compressionLevel: number
  uncompressedLength: number
  encrypted: boolean
  cellSize: number
  width?: number
  requiresFullHeader: boolean
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
  chunkIndex: number
  chunkTotal: number
  streamId: number
}

export abstract class AbstractDrawer {
  abstract readonly id: string
  abstract readonly label: string
  abstract readonly outputKind: 'raster-pixels'
  abstract readonly capabilities: DrawerCapabilities

  abstract write(input: Buffer, ctx: DrawContext): DrawnArtifact
  abstract read(image: SurfacePixels, ctx: ReadContext): ChunkReadResult
}
