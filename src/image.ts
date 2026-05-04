import { PNG } from 'pngjs'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import type { ImageFormat } from './types'

// RGB: 3 bytes per pixel. Kept for backward compat in image.test.ts.
export const CHANNELS = 3

// PNG colorType for writing: bpp=1,2,3 all write RGB (colorType=2), bpp=4 writes RGBA (colorType=6)
function pngColorType(fileChannels: number): 2 | 6 {
  if (fileChannels === 4) return 6   // RGBA
  return 2                            // RGB for fileChannels=3
}

// Write fileChannels-channel pixel data to a PNG file.
// fileChannels is always 3 (for bpp=1,2,3) or 4 (for bpp=4).
// pixels has fileChannels bytes per pixel.
function _writePNG(filePath: string, pixels: Uint8Array, width: number, height: number, fileChannels: 3 | 4): void {
  const colorType = pngColorType(fileChannels)
  const png = new PNG({ width, height, filterType: -1 })
  png.data = Buffer.alloc(width * height * 4)
  const n = width * height

  for (let i = 0; i < n; i++) {
    if (fileChannels === 4) {
      png.data[i * 4] = pixels[i * 4]
      png.data[i * 4 + 1] = pixels[i * 4 + 1]
      png.data[i * 4 + 2] = pixels[i * 4 + 2]
      png.data[i * 4 + 3] = pixels[i * 4 + 3]
    } else {
      // fileChannels=3 (RGB)
      png.data[i * 4] = pixels[i * 3]
      png.data[i * 4 + 1] = pixels[i * 3 + 1]
      png.data[i * 4 + 2] = pixels[i * 3 + 2]
      png.data[i * 4 + 3] = 255
    }
  }
  // Pass colorType and inputColorType explicitly so pngjs writes the correct PNG color type
  fs.writeFileSync(filePath, PNG.sync.write(png, { colorType, inputColorType: 6 }))
}

// Shared PNG parse logic — pngjs always outputs RGBA internally.
function _parsePNG(png: ReturnType<typeof PNG.sync.read>): { pixels: Uint8Array; width: number; height: number; fileChannels: 3 | 4 } {
  const n = png.width * png.height
  const d = png.data  // always RGBA (4 bytes/pixel) from pngjs

  // pngjs colorType tells us the actual file format:
  //   colorType=2: true RGB PNG (new tokens written with explicit colorType option) → 3 channels
  //   colorType=6: RGBA PNG (old bpp=3 tokens OR new bpp=4 tokens)
  //     - For bpp=4: the 4th byte of pixel 0 is the 4th magic header byte (0x54)
  //     - For old bpp=3: the 4th byte of pixel 0 is alpha=255 (never 0x54)

  if (png.colorType === 6) {
    // Detect bpp=4 by checking the 4th byte of pixel 0
    // Full header bpp=4: d[0..3] = 0xC0, 0xDE, 0xAE, 0x54
    const isFull4 = d[0] === 0xc0 && d[1] === 0xde && d[2] === 0xae && d[3] === 0x54
    if (isFull4) {
      const out4 = new Uint8Array(n * 4)
      for (let i = 0; i < n; i++) {
        out4[i * 4] = d[i * 4]; out4[i * 4 + 1] = d[i * 4 + 1]
        out4[i * 4 + 2] = d[i * 4 + 2]; out4[i * 4 + 3] = d[i * 4 + 3]
      }
      return { pixels: out4, width: png.width, height: png.height, fileChannels: 4 }
    }
    // Compact header bpp=4: d[2] has bppBits=3
    const isCompact = d[0] === 0xc1
    if (isCompact && ((d[2] >> 2) & 0b11) === 3) {
      const out4 = new Uint8Array(n * 4)
      for (let i = 0; i < n; i++) {
        out4[i * 4] = d[i * 4]; out4[i * 4 + 1] = d[i * 4 + 1]
        out4[i * 4 + 2] = d[i * 4 + 2]; out4[i * 4 + 3] = d[i * 4 + 3]
      }
      return { pixels: out4, width: png.width, height: png.height, fileChannels: 4 }
    }
    // Old bpp=3 token or new bpp=3 compact
    const out3 = new Uint8Array(n * 3)
    for (let i = 0; i < n; i++) {
      out3[i * 3] = d[i * 4]; out3[i * 3 + 1] = d[i * 4 + 1]; out3[i * 3 + 2] = d[i * 4 + 2]
    }
    return { pixels: out3, width: png.width, height: png.height, fileChannels: 3 }
  }

  // colorType=2 (true RGB file): always 3-channel
  const out3 = new Uint8Array(n * 3)
  for (let i = 0; i < n; i++) {
    out3[i * 3] = d[i * 4]; out3[i * 3 + 1] = d[i * 4 + 1]; out3[i * 3 + 2] = d[i * 4 + 2]
  }
  return { pixels: out3, width: png.width, height: png.height, fileChannels: 3 }
}

// Read a PNG file → returns { pixels (fileChannels bytes/pixel), width, height, fileChannels }
// fileChannels is 3 for RGB PNGs, 4 for RGBA PNGs
function _readPNG(filePath: string): { pixels: Uint8Array; width: number; height: number; fileChannels: 3 | 4 } {
  return _parsePNG(PNG.sync.read(fs.readFileSync(filePath)))
}

function _readPNGFromBuffer(buffer: Buffer): { pixels: Uint8Array; width: number; height: number; fileChannels: 3 | 4 } {
  return _parsePNG(PNG.sync.read(buffer))
}

// Convert bpp-channel pixel data to fileChannels for writing to file.
// For bpp < fileChannels: zeros fill remaining channels, alpha=255 if fc=4.
export function toFileChannels(pixels: Uint8Array, n: number, bpp: number, fc: number): Uint8Array {
  if (bpp === fc) return pixels
  const out = new Uint8Array(n * fc)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < Math.min(bpp, fc); c++) {
      out[i * fc + c] = pixels[i * bpp + c]
    }
    if (fc === 4 && bpp < 4) out[i * 4 + 3] = 255
  }
  return out
}

// Convert fileChannels-channel pixel data back to bpp channels.
// Extracts first bpp channels from each fc-channel pixel.
export function fromFileChannels(pixels: Uint8Array, n: number, fc: number, bpp: number): Uint8Array {
  if (bpp === fc) return pixels
  const out = new Uint8Array(n * bpp)
  if (bpp === 3 && fc === 4) {
    for (let i = 0; i < n; i++) {
      out[i * 3]     = pixels[i * 4]
      out[i * 3 + 1] = pixels[i * 4 + 1]
      out[i * 3 + 2] = pixels[i * 4 + 2]
    }
    return out
  }
  const minCh = Math.min(bpp, fc)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < minCh; c++) out[i * bpp + c] = pixels[i * fc + c]
  }
  return out
}

// Write PNG with many small IDAT chunks so a streaming decoder processes pixels
// progressively as bytes arrive — pixels are already compressed so deflateLevel=0
// avoids wasting CPU re-compressing incompressible data.
function _writePNGStreaming(
  filePath: string,
  pixels: Uint8Array,
  width: number,
  height: number,
  fileChannels: 3 | 4,
): Promise<void> {
  const colorType = pngColorType(fileChannels)
  const png = new PNG({
    width,
    height,
    colorType,
    inputColorType: 6,
    filterType: 0,        // None: no prediction filter (binary data has no spatial correlation)
    deflateLevel: 0,      // Store: skip PNG-internal compression (pixels already compressed)
    deflateChunkSize: 1024, // 1 KB IDAT chunks → decoder processes pixels every ~1 KB received
  })
  png.data = Buffer.alloc(width * height * 4)
  const n = width * height
  if (fileChannels === 4) {
    for (let i = 0; i < n; i++) {
      png.data[i * 4]     = pixels[i * 4];     png.data[i * 4 + 1] = pixels[i * 4 + 1]
      png.data[i * 4 + 2] = pixels[i * 4 + 2]; png.data[i * 4 + 3] = pixels[i * 4 + 3]
    }
  } else {
    for (let i = 0; i < n; i++) {
      png.data[i * 4]     = pixels[i * 3];     png.data[i * 4 + 1] = pixels[i * 3 + 1]
      png.data[i * 4 + 2] = pixels[i * 3 + 2]; png.data[i * 4 + 3] = 255
    }
  }
  return new Promise((resolve, reject) => {
    const buf: Buffer[] = []
    png.pack()
      .on('data', (c: Buffer) => buf.push(c))
      .on('end', () => { fs.writeFileSync(filePath, Buffer.concat(buf)); resolve() })
      .on('error', reject)
  })
}

// Write pixels to file in given format.
// pixels: fileChannels bytes per pixel (fileChannels = 3 for bpp=1,2,3; 4 for bpp=4)
// fileChannels: 3 or 4
export async function writeImage(
  filePath: string,
  pixels: Uint8Array,
  width: number,
  height: number,
  fileChannels: 3 | 4,
  format: ImageFormat = 'png',
  streaming = false,
): Promise<void> {
  if (format === 'png') {
    if (streaming) return _writePNGStreaming(filePath, pixels, width, height, fileChannels)
    _writePNG(filePath, pixels, width, height, fileChannels)
    return
  }

  // For AVIF/WebP: use sharp with raw pixel data
  const s = sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength), {
    raw: { width, height, channels: fileChannels }
  })
  if (format === 'avif') {
    await s.avif({ lossless: true, quality: 100 }).toFile(filePath)
  } else {
    await s.webp({ lossless: true, quality: 100 }).toFile(filePath)
  }
}

// Read image file → returns { pixels (fileChannels bytes/pixel), fileChannels }
// fileChannels is 3 for bpp=1,2,3 tokens; 4 for bpp=4 tokens
// Uses sharp for all formats (PNG included) — much faster than pngjs for large images.
export async function readImage(filePath: string, _format?: ImageFormat): Promise<{
  pixels: Uint8Array
  width: number
  height: number
  fileChannels: 3 | 4
}> {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true })
  const fileChannels = (info.channels >= 4 ? 4 : 3) as 3 | 4
  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
    fileChannels,
  }
}

// Read image from an in-memory buffer (no disk I/O).
// Uses sharp for all formats (PNG included).
export async function readImageFromBuffer(buffer: Buffer, _format?: ImageFormat): Promise<{
  pixels: Uint8Array
  width: number
  height: number
  fileChannels: 3 | 4
}> {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const fileChannels = (info.channels >= 4 ? 4 : 3) as 3 | 4
  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
    fileChannels,
  }
}

// Keep old sync exports for backward compat (tests, diff)
export function writePNG(filePath: string, pixels: Uint8Array, width: number, height: number): void {
  _writePNG(filePath, pixels, width, height, 3)
}

export function readPNG(filePath: string): { pixels: Uint8Array; width: number; height: number; channels: 3 } {
  const result = _readPNG(filePath)
  // readPNG always returned channels:3 (RGB only)
  if (result.fileChannels === 3) {
    return { pixels: result.pixels, width: result.width, height: result.height, channels: 3 }
  }
  // Convert 4-channel to 3-channel for backward compat
  const n = result.width * result.height
  const rgb = new Uint8Array(n * 3)
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = result.pixels[i * 4]
    rgb[i * 3 + 1] = result.pixels[i * 4 + 1]
    rgb[i * 3 + 2] = result.pixels[i * 4 + 2]
  }
  return { pixels: rgb, width: result.width, height: result.height, channels: 3 }
}
