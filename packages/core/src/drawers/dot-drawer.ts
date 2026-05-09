import { enumOption, type OptionsSchema } from '../components/options'
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

export class DotDrawer extends AbstractDrawer {
  static override readonly optionsSchema: OptionsSchema = {
    cellSize: enumOption([3, 5, 7, 9], 5, { label: 'Dot size (pixels per cell)' }),
  }

  readonly id = 'dot'
  readonly label = 'Dot'
  override readonly description =
    'Sparse cells of configurable size — visually distinct, larger token, decode-after-download.'
  readonly outputKind = 'raster-pixels' as const
  readonly capabilities = DOT_CAPABILITIES

  write(input: Buffer, ctx: DrawContext): DrawnArtifact {
    const fc = fileChannelsForBpp(ctx.bpp)
    const cellSize = Math.max(1, ctx.cellSize)
    const dataPixelCount =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)
    const layout = dotLayout(HEADER_PIXELS + dataPixelCount, cellSize)
    const { imageWidth, imageHeight, gridWidth, gridHeight } = layout

    const headerData: HeaderData = {
      version: 1,
      algorithmId: ctx.algorithmId,
      fileLength: input.length,
      width: imageWidth,
      height: imageHeight,
      ecLevel: encodeEcByte(ctx.encrypted, ctx.fecLevel),
      compressionLevel: ctx.compressionLevel,
      uncompressedLength: ctx.uncompressedLength,
      cellSize,
      dataPixelCount,
      channels: ctx.bpp,
      preFecLength: ctx.preFecLength,
    }

    const dataRaw = ctx.codec.encode(input, dataPixelCount, gridWidth, gridHeight, ctx.bpp)
    const dataExpanded = toFileChannels(dataRaw, dataPixelCount, ctx.bpp, fc)
    const pixels = renderDots(dataExpanded, dataPixelCount, cellSize, layout, fc)

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
      fecLevel: ec.fecLevel,
      preFecLength: header.preFecLength,
    }
  }
}
