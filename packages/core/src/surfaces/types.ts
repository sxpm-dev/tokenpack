import type { OptionsSchema } from '../components/options'
import type { ImageFormat } from '../types'

export type SurfaceId = ImageFormat | 'png-stream' | 'png-upng'

export interface SurfacePixels {
  pixels: Uint8Array
  width: number
  height: number
  fileChannels: 3 | 4
}

/**
 * Streaming-decode result: a header carrying width / channels / etc, plus
 * an async iterable of pixel rows. Each row is exactly
 * `width * fileChannels` raw pixel bytes (no PNG filter byte; reconstruction
 * happens inside the surface).
 *
 * Surfaces that don't have a true streaming decoder (e.g. WebP, AVIF, plain
 * `png` via canvas/sharp) implement this by buffering — they read the whole
 * stream, decode via `readBuffer`, then yield the pixel buffer once as a
 * single "row" of size `width*height*fileChannels`. That's a valid
 * degenerate iterator and keeps the contract uniform.
 */
export interface SurfaceStreamHandle {
  width: number
  height: number
  fileChannels: 3 | 4
  rows: AsyncIterable<Uint8Array>
}

export abstract class AbstractSurface {
  /** Tunable options for this surface (channels, etc.). Subclasses override. */
  static readonly optionsSchema: OptionsSchema = {}

  abstract readonly id: SurfaceId
  abstract readonly label: string
  abstract readonly format: ImageFormat
  abstract readonly extension: string
  abstract readonly mimeType: string
  abstract readonly inputKind: 'raster-pixels'
  abstract readonly lossless: boolean
  abstract readonly streamable: boolean
  abstract readonly supportedChannels: ReadonlySet<3 | 4>
  abstract readonly preservesAlpha: boolean
  abstract readonly maxBpp: 1 | 2 | 3 | 4

  abstract write(filePath: string, image: SurfacePixels): Promise<void>
  abstract readFile(filePath: string): Promise<SurfacePixels>
  abstract readBuffer(buffer: Buffer): Promise<SurfacePixels>

  /**
   * Encode pixels to artifact bytes (PNG/WebP/AVIF). Default falls back to
   * `write(tmpfile)` + read; concrete surfaces should override with the
   * library's native buffer-producing API for efficiency. Recipe-shape
   * algorithms call this to produce bytes without filesystem ceremony.
   */
  abstract writeBuffer(image: SurfacePixels): Promise<Buffer>

  /**
   * Streaming decode entry point. The Algorithm calls this when it wants to
   * pipeline decompression / codec work with the network transfer; the
   * surface owns the container-format parsing and yields raw pixel rows.
   *
   * Default implementation buffers the entire stream and then yields one
   * "row" containing the whole image — appropriate for surfaces that don't
   * have a streaming decoder (WebP, AVIF, plain canvas-based PNG). True
   * streaming surfaces (`StreamingPngSurface`) override this with a
   * chunk-by-chunk parser.
   */
  async decodeStream(stream: ReadableStream<Uint8Array>): Promise<SurfaceStreamHandle> {
    const buffer = await readAllToBuffer(stream)
    const image = await this.readBuffer(buffer)

    // Single-row degenerate iterator: yields the full image bytes once.
    const rows = (async function* () {
      yield image.pixels
    })()

    return {
      width: image.width,
      height: image.height,
      fileChannels: image.fileChannels,
      rows,
    }
  }

  coerceBpp(bpp: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
    return bpp > this.maxBpp ? this.maxBpp : bpp
  }
}

async function readAllToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
    total += value.byteLength
  }
  const out = new Uint8Array(total)
  let offset = 0

  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }

  return Buffer.from(out.buffer, out.byteOffset, out.byteLength)
}
