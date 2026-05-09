import fs from 'fs'
import { PNG } from 'pngjs'
import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import { ImageSurface } from 'tokenpack/surfaces'
import { decodeStreamingPng } from 'tokenpack/surfaces/streaming-png-decoder'
import type { SurfacePixels, SurfaceStreamHandle } from 'tokenpack/surfaces/types'

function detectFileChannels(d: Buffer, colorType: number): 3 | 4 {
  if (colorType !== 6) return 3
  const isFull4 = d[0] === 0xc0 && d[1] === 0xde && d[2] === 0xae && d[3] === 0x54

  if (isFull4) return 4
  const isCompact = d[0] === 0xc1

  if (isCompact && ((d[2] >> 2) & 0b11) === 3) return 4

  return 3
}

interface PngLike {
  data: Buffer
  width: number
  height: number
  colorType: number
}

function parsePngjs(png: PngLike): SurfacePixels {
  const n = png.width * png.height
  const fileChannels = detectFileChannels(png.data, png.colorType)

  if (fileChannels === 4) {
    const out4 = new Uint8Array(n * 4)

    for (let i = 0; i < n; i++) {
      out4[i * 4] = png.data[i * 4]
      out4[i * 4 + 1] = png.data[i * 4 + 1]
      out4[i * 4 + 2] = png.data[i * 4 + 2]
      out4[i * 4 + 3] = png.data[i * 4 + 3]
    }

    return { pixels: out4, width: png.width, height: png.height, fileChannels: 4 }
  }

  const out3 = new Uint8Array(n * 3)

  for (let i = 0; i < n; i++) {
    out3[i * 3] = png.data[i * 4]
    out3[i * 3 + 1] = png.data[i * 4 + 1]
    out3[i * 3 + 2] = png.data[i * 4 + 2]
  }

  return { pixels: out3, width: png.width, height: png.height, fileChannels: 3 }
}

// PNG written with many small IDAT chunks so a streaming decoder processes pixels
// progressively as bytes arrive. deflateLevel=0 skips PNG-internal compression
// because the pixel bytes are already compressed (codec output).
export class StreamingPngSurface extends ImageSurface {
  static override readonly optionsSchema: OptionsSchema = {
    channels: enumOption([3, 4], 3, { label: 'Channels per pixel' }),
  }

  constructor() {
    super({
      id: 'png-stream',
      label: 'Streaming PNG',
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

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    const { pixels, width, height, fileChannels } = image
    const png = new PNG({
      width,
      height,
      colorType: fileChannels === 4 ? 6 : 2,
      inputColorType: 6,
      filterType: 0,
      deflateLevel: 0,
      deflateChunkSize: 1024,
    })

    png.data = Buffer.alloc(width * height * 4)
    const n = width * height

    if (fileChannels === 4) {
      for (let i = 0; i < n; i++) {
        png.data[i * 4] = pixels[i * 4]
        png.data[i * 4 + 1] = pixels[i * 4 + 1]
        png.data[i * 4 + 2] = pixels[i * 4 + 2]
        png.data[i * 4 + 3] = pixels[i * 4 + 3]
      }
    } else {
      for (let i = 0; i < n; i++) {
        png.data[i * 4] = pixels[i * 3]
        png.data[i * 4 + 1] = pixels[i * 3 + 1]
        png.data[i * 4 + 2] = pixels[i * 3 + 2]
        png.data[i * 4 + 3] = 255
      }
    }

    return new Promise((resolve, reject) => {
      const buf: Buffer[] = []

      png
        .pack()
        .on('data', (c: Buffer) => buf.push(c))
        .on('end', () => {
          fs.writeFileSync(filePath, Buffer.concat(buf))
          resolve()
        })
        .on('error', reject)
    })
  }

  async writeBuffer(image: SurfacePixels): Promise<Buffer> {
    const { pixels, width, height, fileChannels } = image
    const png = new PNG({
      width,
      height,
      colorType: fileChannels === 4 ? 6 : 2,
      inputColorType: 6,
      filterType: 0,
      deflateLevel: 0,
      deflateChunkSize: 1024,
    })

    png.data = Buffer.alloc(width * height * 4)
    const n = width * height

    if (fileChannels === 4) {
      for (let i = 0; i < n; i++) {
        png.data[i * 4] = pixels[i * 4]
        png.data[i * 4 + 1] = pixels[i * 4 + 1]
        png.data[i * 4 + 2] = pixels[i * 4 + 2]
        png.data[i * 4 + 3] = pixels[i * 4 + 3]
      }
    } else {
      for (let i = 0; i < n; i++) {
        png.data[i * 4] = pixels[i * 3]
        png.data[i * 4 + 1] = pixels[i * 3 + 1]
        png.data[i * 4 + 2] = pixels[i * 3 + 2]
        png.data[i * 4 + 3] = 255
      }
    }

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []

      png
        .pack()
        .on('data', (c: Buffer) => chunks.push(c))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject)
    })
  }

  // Decoders are format-agnostic; streaming-PNG output is still standard PNG
  // bytes, so we reuse pngjs sync read.
  async readFile(filePath: string): Promise<SurfacePixels> {
    return parsePngjs(PNG.sync.read(fs.readFileSync(filePath)))
  }

  async readBuffer(buffer: Buffer): Promise<SurfacePixels> {
    return parsePngjs(PNG.sync.read(buffer))
  }

  /**
   * Streaming-decode override. Uses the env-agnostic shared PNG-streaming
   * helper from `tokenpack/surfaces/streaming-png-decoder` (Web Streams +
   * `DecompressionStream`, both available natively in Node ≥ 18).
   *
   * Algorithm.decodeStream consumes the yielded pixel rows; codec / outer
   * compressor work happens there per the entity-composition contract.
   */
  override async decodeStream(stream: ReadableStream<Uint8Array>): Promise<SurfaceStreamHandle> {
    return decodeStreamingPng(stream)
  }
}
