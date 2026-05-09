// Browser PNG surface — canvas-based read/write.
//
// `writeBuffer(image)` puts the pixel buffer onto a canvas, converts to a PNG
// Blob via `canvas.toBlob` (or `convertToBlob` for OffscreenCanvas), and returns
// the bytes. `readBuffer(buf)` does the inverse: wrap bytes in a Blob, decode
// via `createImageBitmap`, draw onto a canvas, read back ImageData, and strip
// the canvas-inserted alpha row if the source was 3-channel.
//
// `premultiplyAlpha: 'none'` and `colorSpaceConversion: 'none'` are both
// critical: 4-channel tokens use alpha for codec data, and the default browser
// behavior of pre-multiplying RGB by alpha (and applying gamma) silently
// corrupts every pixel.

import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import { ImageSurface } from 'tokenpack/surfaces'
import { decodeStreamingPng } from 'tokenpack/surfaces/streaming-png-decoder'
import type {
  SurfacePixels,
  SurfaceStreamHandle,
} from 'tokenpack/surfaces/types'

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

function expandRgbToRgba(rgb: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height * 4)

  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    out[j] = rgb[i]
    out[j + 1] = rgb[i + 1]
    out[j + 2] = rgb[i + 2]
    out[j + 3] = 255
  }

  return out
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
    const bitmap = await createImageBitmap(blob, BITMAP_OPTS)

    return bitmapToPixels(bitmap, fileChannels)
  }

  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    const { pixels, width, height, fileChannels } = image
    const canvas = makeCanvas(width, height)
    const ctx = get2dContext(canvas)
    const rgba = fileChannels === 4 ? pixels : expandRgbToRgba(pixels, width, height)
    const clamped = new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength)
    const imageData = new ImageData(clamped as never, width, height)

    ;(ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).putImageData(
      imageData,
      0,
      0,
    )

    let blob: Blob

    if ('convertToBlob' in canvas) {
      blob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' })
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        ;(canvas as HTMLCanvasElement).toBlob(b => {
          if (b) resolve(b)
          else reject(new Error('canvas.toBlob returned null'))
        }, 'image/png')
      })
    }

    const ab = await blob.arrayBuffer()

    return Buffer.from(ab)
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
   * we produce the same canvas-PNG bytes as the regular surface — the
   * resulting file is a valid PNG with whatever IDAT framing canvas emits.
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
