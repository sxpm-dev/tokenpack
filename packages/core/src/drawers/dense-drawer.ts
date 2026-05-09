import {
  COMPACT_HEADER_PIXELS,
  decodeEcByte,
  encodeEcByte,
  HEADER_PIXELS,
  isCompactToken,
  readCompactHeader,
  readHeader,
  writeCompactHeader,
  writeHeader,
} from '../header'
import { fromFileChannels, toFileChannels } from '../surfaces/channels'
import type { SurfacePixels } from '../surfaces/types'
import type { HeaderData } from '../types'
import {
  AbstractDrawer,
  type ChunkReadResult,
  type DrawContext,
  type DrawerCapabilities,
  type DrawnArtifact,
  type DrawnChunk,
  type ReadContext,
} from './types'

// Single-chunk cap. PNG itself supports up to 2^31 px per side; mainstream
// browsers decode up to ~16384 px reliably. We pick 4096 → 16M pixels =
// ~50MB raw payload at c3, comfortably above any single-file source we
// encode. Multi-chunk encode is not supported in the bound-recipe model —
// large payloads should use PackBuilder regions instead.
const MAX_WIDTH = 4096
const MAX_PIXELS_PER_CHUNK = MAX_WIDTH * MAX_WIDTH - HEADER_PIXELS

const DENSE_CAPABILITIES: DrawerCapabilities = {
  streamable: true,
  decodeOnFlight: true,
  requiresLosslessSurface: true,
  requiresAlpha: false,
  supportedChannels: new Set([1, 2, 3, 4]),
}

function fileChannelsForBpp(bpp: number): 3 | 4 {
  return bpp === 4 ? 4 : 3
}

function denseDimensions(
  dataPixelEst: number,
  headerPixels: number,
  requestedWidth?: number,
): { width: number; height: number } {
  const totalPixels = headerPixels + dataPixelEst
  const side = Math.ceil(Math.sqrt(Math.max(totalPixels, headerPixels + 1)))
  const width = requestedWidth ?? Math.max(side, Math.min(totalPixels, 64))
  const height = Math.ceil(totalPixels / width)

  return { width, height }
}

function denseChunkDimensions(dataPixelEst: number): { width: number; height: number } {
  const totalPixels = HEADER_PIXELS + dataPixelEst
  const side = Math.min(MAX_WIDTH, Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1))))
  const width = side
  const height = Math.ceil(totalPixels / width)

  return { width, height }
}

export class DenseDrawer extends AbstractDrawer {
  readonly id = 'dense'
  readonly label = 'Dense'
  override readonly description =
    'Packs bytes into adjacent pixels — smallest token, fastest decode, no visual structure.'
  readonly outputKind = 'raster-pixels' as const
  readonly capabilities = DENSE_CAPABILITIES

  static readonly MAX_WIDTH = MAX_WIDTH
  static readonly MAX_PIXELS_PER_CHUNK = MAX_PIXELS_PER_CHUNK

  write(input: Buffer, ctx: DrawContext): DrawnArtifact {
    const fc = fileChannelsForBpp(ctx.bpp)
    const dataPixelEst =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)

    if (dataPixelEst > MAX_PIXELS_PER_CHUNK) {
      throw new Error(
        `DenseDrawer.write: payload exceeds single-chunk cap (${dataPixelEst} > ${MAX_PIXELS_PER_CHUNK} pixels)`,
      )
    }

    if (this.canUseCompact(ctx, dataPixelEst)) {
      return { chunks: [this.writeCompact(input, ctx, fc)] }
    }

    return { chunks: [this.writeFull(input, ctx, fc)] }
  }

  read(image: SurfacePixels, ctx: ReadContext): ChunkReadResult {
    return isCompactToken(image.pixels) ? this.readCompact(image, ctx) : this.readFull(image, ctx)
  }

  private canUseCompact(ctx: DrawContext, dataPixelEst: number): boolean {
    return (
      ctx.bpp !== 1 &&
      ctx.bpp !== 2 &&
      dataPixelEst <= MAX_PIXELS_PER_CHUNK &&
      !ctx.requiresFullHeader
    )
  }

  private writeCompact(input: Buffer, ctx: DrawContext, fc: 3 | 4): DrawnChunk {
    const dataPixelEst =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)
    const { width, height } = denseDimensions(dataPixelEst, COMPACT_HEADER_PIXELS, ctx.width)
    const dataPixelCount = width * height - COMPACT_HEADER_PIXELS
    const pixels = new Uint8Array(width * height * fc)
    const codecOut = ctx.codec.encode(input, dataPixelCount, width, height, ctx.bpp)
    const expanded = toFileChannels(codecOut, dataPixelCount, ctx.bpp, fc)

    pixels.set(expanded, COMPACT_HEADER_PIXELS * fc)
    const flags = (ctx.compressionLevel > 0 ? 0b10 : 0) | (ctx.encrypted ? 0b01 : 0)

    writeCompactHeader(pixels, {
      algoId: ctx.algorithmId,
      flags,
      dataLength: input.length,
      channels: ctx.bpp,
    })

    return { pixels, width, height, fileChannels: fc }
  }

  private writeFull(input: Buffer, ctx: DrawContext, fc: 3 | 4): DrawnChunk {
    const dataPixelEst =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)
    const { width, height } = denseChunkDimensions(dataPixelEst)
    const dataPixelCount = width * height - HEADER_PIXELS
    const pixels = new Uint8Array(width * height * fc)
    const codecOut = ctx.codec.encode(input, dataPixelCount, width, height, ctx.bpp)
    const expanded = toFileChannels(codecOut, dataPixelCount, ctx.bpp, fc)

    pixels.set(expanded, HEADER_PIXELS * fc)

    const headerData: HeaderData = {
      version: 1,
      algorithmId: ctx.algorithmId,
      fileLength: input.length,
      width,
      height,
      ecLevel: encodeEcByte(ctx.encrypted, ctx.fecLevel),
      compressionLevel: ctx.compressionLevel,
      uncompressedLength: ctx.uncompressedLength,
      cellSize: 1,
      dataPixelCount: 0,
      channels: ctx.bpp,
      preFecLength: ctx.preFecLength,
    }

    writeHeader(pixels, headerData)

    return { pixels, width, height, fileChannels: fc }
  }

  private readCompact(image: SurfacePixels, ctx: ReadContext): ChunkReadResult {
    const { pixels, width, height, fileChannels } = image
    const ch = readCompactHeader(pixels)
    const bpp = ch.channels
    const dataPixelsFc = pixels.slice(COMPACT_HEADER_PIXELS * fileChannels)
    const dataPixelCount = width * height - COMPACT_HEADER_PIXELS
    const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp)

    return {
      bytes: ctx.codec.decode(dataPixels, ch.dataLength, width, height, bpp),
      compressionLevel: ch.flags & 0b10 ? 2 : 0,
      encrypted: (ch.flags & 0b01) !== 0,
      uncompressedLength: 0,
      fecLevel: 0,
      preFecLength: 0,
    }
  }

  private readFull(image: SurfacePixels, ctx: ReadContext): ChunkReadResult {
    const { pixels, width, height, fileChannels } = image
    const header = readHeader(pixels)
    const bpp = header.channels

    const dataPixelsFc = pixels.slice(HEADER_PIXELS * fileChannels)
    const dataPixelCount = width * height - HEADER_PIXELS
    const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp)

    const ec = decodeEcByte(header.ecLevel)

    return {
      bytes: ctx.codec.decode(dataPixels, header.fileLength, width, height, bpp),
      compressionLevel: header.compressionLevel,
      encrypted: ec.encrypted,
      uncompressedLength: header.uncompressedLength,
      fecLevel: ec.fecLevel,
      preFecLength: header.preFecLength,
    }
  }
}
