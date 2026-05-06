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
import { applyStyle, reverseStyle } from '../style'
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

const MAX_WIDTH = 1280
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

// FNV-1a 32-bit hash. Used only as a stream identifier to verify multi-chunk
// tokens belong together (decoder cross-checks but never recomputes), so a
// non-cryptographic hash is sufficient and avoids a Web Crypto async cascade
// through the encode pipeline.
function streamId(data: Uint8Array): number {
  let h = 0x811c9dc5

  for (let i = 0; i < data.length; i++) {
    h ^= data[i]
    h = Math.imul(h, 0x01000193)
  }

  // Force unsigned 32-bit result so consumers reading via UInt32BE get the same value back.
  return h >>> 0
}

function dirCode(direction: string | undefined): number {
  if (direction === 'horizontal') return 1
  if (direction === 'vertical') return 2
  if (direction === 'diagonal') return 3

  return 0
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
  readonly outputKind = 'raster-pixels' as const
  readonly capabilities = DENSE_CAPABILITIES

  static readonly MAX_WIDTH = MAX_WIDTH
  static readonly MAX_PIXELS_PER_CHUNK = MAX_PIXELS_PER_CHUNK

  write(input: Buffer, ctx: DrawContext): DrawnArtifact {
    const fc = fileChannelsForBpp(ctx.bpp)
    const dataPixelEst =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)
    const hasGradient = !!ctx.style?.gradient
    const hasBackground = !!ctx.style?.background

    if (this.canUseCompact(ctx, dataPixelEst, hasGradient, hasBackground)) {
      return { chunks: [this.writeCompact(input, ctx, fc)] }
    }

    if (dataPixelEst <= MAX_PIXELS_PER_CHUNK) {
      return { chunks: [this.writeFull(input, ctx, fc, 0, 1, 0, hasGradient, hasBackground)] }
    }

    return { chunks: this.writeChunked(input, ctx, fc, hasGradient, hasBackground) }
  }

  read(image: SurfacePixels, ctx: ReadContext): ChunkReadResult {
    return isCompactToken(image.pixels) ? this.readCompact(image, ctx) : this.readFull(image, ctx)
  }

  private canUseCompact(
    ctx: DrawContext,
    dataPixelEst: number,
    hasGradient: boolean,
    hasBackground: boolean,
  ): boolean {
    return (
      !hasGradient &&
      !hasBackground &&
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
      algoId: ctx.codec.id,
      flags,
      dataLength: input.length,
      channels: ctx.bpp,
    })

    return { pixels, width, height, fileChannels: fc }
  }

  private writeFull(
    input: Buffer,
    ctx: DrawContext,
    fc: 3 | 4,
    chunkIndex: number,
    chunkTotal: number,
    sid: number,
    hasGradient: boolean,
    hasBackground: boolean,
  ): DrawnChunk {
    const dataPixelEst =
      ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp)
    const { width, height } = denseChunkDimensions(dataPixelEst)
    const dataPixelCount = width * height - HEADER_PIXELS
    const pixels = new Uint8Array(width * height * fc)
    const codecOut = ctx.codec.encode(input, dataPixelCount, width, height, ctx.bpp)
    const expanded = toFileChannels(codecOut, dataPixelCount, ctx.bpp, fc)

    pixels.set(expanded, HEADER_PIXELS * fc)

    const blendAmount = hasGradient ? Math.round((1 - (ctx.style?.opacity ?? 1.0)) * 255) : 0
    const headerData: HeaderData = {
      version: 1,
      algorithmId: ctx.codec.id,
      fileLength: input.length,
      width,
      height,
      styleFlags: (hasGradient ? 0b01 : 0) | (hasBackground ? 0b10 : 0),
      ecLevel: encodeEcByte(ctx.encrypted, ctx.fecLevel),
      codecMeta: new Uint8Array(16),
      gradientFrom: ctx.style?.gradient?.from ?? [0, 0, 0],
      gradientTo: ctx.style?.gradient?.to ?? [0, 0, 0],
      gradientDirection: dirCode(ctx.style?.gradient?.direction),
      backgroundOpacity: blendAmount,
      backgroundColor: ctx.style?.background ?? [0, 0, 0],
      compressionLevel: ctx.compressionLevel,
      uncompressedLength: ctx.uncompressedLength,
      cellSize: 1,
      dataPixelCount: 0,
      chunkIndex,
      chunkTotal,
      streamId: sid,
      channels: ctx.bpp,
      preFecLength: ctx.preFecLength,
    }

    writeHeader(pixels, headerData)
    if (hasGradient && blendAmount > 0) {
      const opacity = 1 - blendAmount / 255

      applyStyle(pixels, width, height, headerData, opacity)
    }

    return { pixels, width, height, fileChannels: fc }
  }

  private writeChunked(
    input: Buffer,
    ctx: DrawContext,
    fc: 3 | 4,
    hasGradient: boolean,
    hasBackground: boolean,
  ): DrawnChunk[] {
    const maxBytesPerChunk = MAX_PIXELS_PER_CHUNK * ctx.bpp
    const chunkCount = Math.ceil(input.length / maxBytesPerChunk)
    const sid = streamId(input)
    const chunks: DrawnChunk[] = []

    for (let i = 0; i < chunkCount; i++) {
      const start = i * maxBytesPerChunk
      const slice = input.slice(start, start + maxBytesPerChunk)

      chunks.push(this.writeFull(slice, ctx, fc, i, chunkCount, sid, hasGradient, hasBackground))
    }

    return chunks
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
      chunkIndex: 0,
      chunkTotal: 1,
      streamId: 0,
      fecLevel: 0,
      preFecLength: 0,
    }
  }

  private readFull(image: SurfacePixels, ctx: ReadContext): ChunkReadResult {
    const { pixels, width, height, fileChannels } = image
    const header = readHeader(pixels)
    const bpp = header.channels

    if (header.styleFlags & 0b01) {
      const opacity = header.backgroundOpacity === 0 ? 1.0 : 1 - header.backgroundOpacity / 255

      reverseStyle(pixels, width, height, header, opacity, fileChannels)
    }
    const dataPixelsFc = pixels.slice(HEADER_PIXELS * fileChannels)
    const dataPixelCount = width * height - HEADER_PIXELS
    const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp)

    const ec = decodeEcByte(header.ecLevel)

    return {
      bytes: ctx.codec.decode(dataPixels, header.fileLength, width, height, bpp),
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
