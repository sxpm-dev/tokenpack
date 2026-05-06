// Browser PNG surface — metadata-only.
//
// The browser flow never calls `surface.write` (encode goes through canvas →
// Blob in `encode.ts`) and never calls `surface.readFile`/`readBuffer`
// (decode goes through `createImageBitmap` → canvas → ImageData in `decode.ts`).
//
// But `algorithm.encodeBytes` consults `surfaceRegistry.byFormat(...)` for
// metadata (`coerceBpp`, `format`, `streamable`, `preservesAlpha`). So we
// register surfaces that expose the same metadata but throw on the file-I/O
// methods — they should never be called in a browser.

import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

const browserOnly = (method: string) =>
  new Error(
    `${method}() is not available in the browser surface. Browser encode/decode bypass surface I/O ` +
      `(canvas → Blob, createImageBitmap → ImageData). If you need file-I/O, run in Node via @tokenpack/node.`,
  )

export class BrowserPngSurface extends ImageSurface {
  constructor() {
    super({
      id: 'png',
      label: 'PNG (browser)',
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

  async readBuffer(_buffer: Buffer): Promise<SurfacePixels> {
    throw browserOnly('PngSurface.readBuffer')
  }
}

export class BrowserStreamingPngSurface extends ImageSurface {
  constructor() {
    super({
      id: 'png-stream',
      label: 'Streaming PNG (browser)',
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

  async readBuffer(_buffer: Buffer): Promise<SurfacePixels> {
    throw browserOnly('StreamingPngSurface.readBuffer')
  }
}
