import fs from 'fs'
import { PNG } from 'pngjs'

import { ImageSurface } from './image-surface'
import type { SurfacePixels } from './types'

// PNG written with many small IDAT chunks so a streaming decoder processes pixels
// progressively as bytes arrive. deflateLevel=0 skips PNG-internal compression
// because the pixel bytes are already compressed (codec output).
export class StreamingPngSurface extends ImageSurface {
  constructor() {
    super({
      id: 'png-stream',
      label: 'Streaming PNG',
      format: 'png',
      extension: '.png',
      mimeType: 'image/png',
      streamable: true,
      preservesAlpha: true,
      maxBpp: 4,
    })
  }

  write(filePath: string, image: SurfacePixels): Promise<void> {
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
}
