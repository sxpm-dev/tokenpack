// Browser PNG surface — byte-preserving write and channel-aware read.
//
// RGB reads use canvas; RGBA reads use the byte-preserving PNG decoder.
// Writes serialize scanlines directly so canvas cannot insert or premultiply alpha.

import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import { ImageSurface } from 'tokenpack/surfaces'
import { decodeStreamingPng } from 'tokenpack/surfaces/streaming-png-decoder'
import type { SurfacePixels, SurfaceStreamHandle } from 'tokenpack/surfaces/types'
import UPNG from 'upng-js'

import { createPngChunk } from '../algorithms/pixel-range-png-base'

const CHANNELS_SCHEMA: OptionsSchema = {
  channels: enumOption([3, 4], 3, { label: 'Channels per pixel' }),
}

const browserOnly = (method: string) =>
  new Error(
    `${method}() is not available in the browser surface — use writeBuffer/readBuffer for byte-level I/O.`,
  )

const BITMAP_OPTS: ImageBitmapOptions = {
  premultiplyAlpha: 'none',
  colorSpaceConversion: 'none',
}

function makeCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const c = document.createElement('canvas')

  c.width = width
  c.height = height

  return c
}

function get2dContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null

  if (!ctx) throw new Error('2D canvas context unavailable')

  return ctx
}

/** Sniff bytes-per-pixel of the original PNG/WebP/AVIF artifact. */
async function detectChannelsFromBlob(blob: Blob): Promise<3 | 4> {
  const head = new Uint8Array(await blob.slice(0, 32).arrayBuffer())

  // PNG signature + IHDR colorType byte at file offset 25.
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a
  ) {
    return head[25] === 6 ? 4 : 3
  }
  // WebP RIFF / VP8L / VP8X.
  if (
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    const c = String.fromCharCode(head[12], head[13], head[14], head[15])

    if (c === 'VP8L') return (head[24] & 0x10) !== 0 ? 4 : 3
    if (c === 'VP8X') return (head[20] & 0x10) !== 0 ? 4 : 3
    if (c === 'VP8 ') return 3
  }

  return 4
}

function bitmapToPixels(bitmap: ImageBitmap, fileChannels: 3 | 4): SurfacePixels {
  const { width, height } = bitmap
  const canvas = makeCanvas(width, height)
  const ctx = get2dContext(canvas)

  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, width, height)
  const rgba = new Uint8Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    imageData.data.byteLength,
  )

  if (fileChannels === 4) {
    return { pixels: rgba, width, height, fileChannels: 4 }
  }
  const n = width * height
  const rgb = new Uint8Array(n * 3)

  for (let i = 0; i < n; i++) {
    rgb[i * 3] = rgba[i * 4]
    rgb[i * 3 + 1] = rgba[i * 4 + 1]
    rgb[i * 3 + 2] = rgba[i * 4 + 2]
  }

  return { pixels: rgb, width, height, fileChannels: 3 }
}

export class BrowserPngSurface extends ImageSurface {
  static override readonly optionsSchema: OptionsSchema = CHANNELS_SCHEMA

  constructor() {
    super({
      id: 'png',
      label: 'PNG (browser)',
      description: 'Lossless 8-bit/channel PNG. Universal browser support, full alpha.',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      preservesAlpha: true,
      maxBpp: 4,
    })
  }

  async write(_filePath: string, _image: SurfacePixels): Promise<void> {
    throw browserOnly('PngSurface.write')
  }

  async readFile(_filePath: string): Promise<SurfacePixels> {
    throw browserOnly('PngSurface.readFile')
  }

  async readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    const blob = new Blob([buffer as unknown as BlobPart])
    const fileChannels = await detectChannelsFromBlob(blob)

    if (fileChannels === 4) {
      // Canvas premultiplies alpha; data stored in RGBA pixels must stay exact.
      const image = UPNG.decode(
        buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
      )

      return {
        pixels: new Uint8Array(UPNG.toRGBA8(image)[0]),
        width: image.width,
        height: image.height,
        fileChannels: 4,
      }
    }
    const bitmap = await createImageBitmap(blob, BITMAP_OPTS)

    try {
      return bitmapToPixels(bitmap, fileChannels)
    } finally {
      bitmap.close()
    }
  }

  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    const { pixels, width, height, fileChannels } = image
    const stride = width * fileChannels

    if (pixels.byteLength !== stride * height) throw new Error('PNG pixel buffer size mismatch')
    // PNG filter 0 preserves all channels. Canvas always exports RGBA and can
    // alter alpha-bearing data, so serialize scanlines directly instead.
    const scanlines = new Uint8Array((stride + 1) * height)

    for (let y = 0; y < height; y++)
      scanlines.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
    const compressed = new Uint8Array(
      await new Response(
        new Blob([scanlines]).stream().pipeThrough(new CompressionStream('deflate')),
      ).arrayBuffer(),
    )
    const ihdr = Buffer.alloc(13)

    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8
    ihdr[9] = fileChannels === 4 ? 6 : 2

    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      createPngChunk('IHDR', ihdr),
      createPngChunk('IDAT', compressed),
      createPngChunk('IEND', new Uint8Array()),
    ])
  }
}

export class BrowserStreamingPngSurface extends ImageSurface {
  static override readonly optionsSchema: OptionsSchema = CHANNELS_SCHEMA

  constructor() {
    super({
      id: 'png-stream',
      label: 'Streaming PNG (browser)',
      description:
        'Same PNG bytes, IDAT framing tuned for chunked decode-as-you-fetch (overlapped network + decode).',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      streamable: true,
      preservesAlpha: true,
      maxBpp: 4,
    })
  }

  async write(_filePath: string, _image: SurfacePixels): Promise<void> {
    throw browserOnly('StreamingPngSurface.write')
  }

  async readFile(_filePath: string): Promise<SurfacePixels> {
    throw browserOnly('StreamingPngSurface.readFile')
  }

  /**
   * Browser doesn't have a separate streaming-PNG path on the read side —
   * the regular `createImageBitmap` + canvas pipeline is fine for any PNG.
   */
  async readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return new BrowserPngSurface().readBuffer(buffer)
  }

  /**
   * "Streaming" PNG only matters on the decode-from-network side. For encode
   * we use the same lossless scanline writer as the regular surface.
   */
  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    return new BrowserPngSurface().writeBuffer(image)
  }

  /**
   * True streaming-PNG decoder. Owns the PNG container parsing entirely:
   *   1. Read PNG signature + IHDR (sets width/fileChannels)
   *   2. Pipe IDAT chunks through `DecompressionStream('deflate')`
   *   3. Reconstruct scanlines, undo PNG filter
   *   4. Yield raw pixel rows
   *
   * Algorithm.decodeStream consumes these rows — codec header reading,
   * codec decode, and outer-compression decoding all live there.
   */
  override async decodeStream(stream: ReadableStream<Uint8Array>): Promise<SurfaceStreamHandle> {
    return decodeStreamingPng(stream)
  }
}
