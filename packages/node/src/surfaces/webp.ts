import sharp from 'sharp'
import { ImageSurface } from 'tokenpack/surfaces'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

// Phase 2 target — replaces packages/core/src/surfaces/webp-surface.ts.
// Currently a scaffold; not yet wired into the core registry. Phase 2 will:
//   1. Import this file from `@tokenpack/node`'s index.
//   2. Call `surfaceRegistry.register('webp', () => new WebpSurface())`.
//   3. Delete packages/core/src/surfaces/webp-surface.ts and remove from registry.ts auto-registration.

export class WebpSurface extends ImageSurface {
  constructor() {
    super({
      id: 'webp',
      label: 'WebP',
      format: 'webp',
      extension: '.webp',
      mimeType: 'image/webp',
      preservesAlpha: false,
      maxBpp: 3,
    })
  }

  async write(filePath: string, image: SurfacePixels): Promise<void> {
    const { pixels, width, height, fileChannels } = image

    await sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength), {
      raw: { width, height, channels: fileChannels },
    })
      .webp({ lossless: true, quality: 100 })
      .toFile(filePath)
  }
}
