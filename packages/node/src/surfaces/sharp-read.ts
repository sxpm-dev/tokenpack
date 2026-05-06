import sharp from 'sharp'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

// Sharp-based raster reader, shared by AVIF and WebP surfaces. Sharp is a
// native binary so it lives in `@tokenpack/node` only.
async function readSharp(input: string | Buffer): Promise<SurfacePixels> {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true })
  const fileChannels = (info.channels >= 4 ? 4 : 3) as 3 | 4

  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
    fileChannels,
  }
}

export function sharpReadFile(filePath: string): Promise<SurfacePixels> {
  return readSharp(filePath)
}

export function sharpReadBuffer(buffer: Buffer): Promise<SurfacePixels> {
  return readSharp(buffer)
}
