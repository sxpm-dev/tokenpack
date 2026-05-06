import { decodeEcByte, encodeEcByte, HEADER_PIXELS, readHeader, writeHeader } from '../header'
import { fromFileChannels, toFileChannels } from '../surfaces/channels'
import { dotLayout, readDots, renderDots } from '../surfaces/dot-render'
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

const DOT_CAPABILITIES: DrawerCapabilities = {
  streamable: false,
  decodeOnFlight: false,
  requiresLosslessSurface: true,
  requiresAlpha: false,
  supportedChannels: new Set([1, 2, 3, 4]),
}

function fileChannelsForBpp(bpp: number): 3 | 4 {
  return bpp === 4 ? 4 : 3
}

function dirCode(direction: string | undefined): number {
  if (direction === 'horizontal') return 1
  if (direction === 'vertical') return 2
  if (direction === 'diagonal') return 3

  return 0
}

export class DotDrawer extends AbstractDrawer {
  readonly id = 'dot'
  readonly label = 'Dot'
  readonly outputKind = 'raster-pixels' as const
  readonly capabilities = DOT_CAPABILITIES

  write(input: Buffer, ctx: DrawContext): DrawnArtifact {
    const fc = fileChannelsForBpp(ctx.bpp)
    const cellSize = Math.max(1, ctx.cellSize)
    const dataPixelCount =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, cellSize)
    const { imageWidth, imageHeight, gridWidth, gridHeight } = layout

    const hasGradient = !!ctx.style?.gradient
    const blendAmount = hasGradient ? Math.round((1 - (ctx.style?.opacity ?? 1.0)) * 255) : 0

    const headerData: HeaderData = {
      version: 1,
      algorithmId: ctx.codec.id,
      fileLength: input.length,
      width: imageWidth,
      height: imageHeight,
      styleFlags: hasGradient ? 0b01 : 0,
      ecLevel: encodeEcByte(ctx.encrypted, ctx.fecLevel),
      codecMeta: new Uint8Array(16),
      gradientFrom: ctx.style?.gradient?.from ?? [0, 0, 0],
      gradientTo: ctx.style?.gradient?.to ?? [0, 0, 0],
      gradientDirection: dirCode(ctx.style?.gradient?.direction),
      backgroundOpacity: blendAmount,
      backgroundColor: ctx.style?.background ?? [0, 0, 0],
      compressionLevel: ctx.compressionLevel,
      uncompressedLength: ctx.uncompressedLength,
      cellSize,
      dataPixelCount,
      chunkIndex: 0,
      chunkTotal: 1,
      streamId: 0,
      channels: ctx.bpp,
      preFecLength: ctx.preFecLength,
    }

    const dataRaw = ctx.codec.encode(input, dataPixelCount, gridWidth, gridHeight, ctx.bpp)
    const dataExpanded = toFileChannels(dataRaw, dataPixelCount, ctx.bpp, fc)
    const pixels = renderDots(dataExpanded, dataPixelCount, cellSize, layout, headerData, fc)

    writeHeader(pixels, headerData)
    const chunk: DrawnChunk = { pixels, width: imageWidth, height: imageHeight, fileChannels: fc }

    return { chunks: [chunk] }
  }

  read(image: SurfacePixels, ctx: ReadContext): ChunkReadResult {
    const { pixels, fileChannels } = image
    const header = readHeader(pixels)
    const bpp = header.channels
    const dataPixelCount = header.dataPixelCount || Math.ceil(header.fileLength / bpp)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, header.cellSize)
    const dataRawFc = readDots(pixels, dataPixelCount, header.cellSize, layout, fileChannels)
    const dataRaw = fromFileChannels(dataRawFc, dataPixelCount, fileChannels, bpp)

    const ec = decodeEcByte(header.ecLevel)

    return {
      bytes: ctx.codec.decode(dataRaw, header.fileLength, layout.gridWidth, layout.gridHeight, bpp),
      compressionLevel: header.compressionLevel,
      encrypted: ec.encrypted,
      uncompressedLength: header.uncompressedLength,
      chunkIndex: header.chunkIndex,
      chunkTotal: header.chunkTotal,
      streamId: header.streamId,
      fecLevel: ec.fecLevel,
      preFecLength: header.preFecLength,
    }
  }
}
