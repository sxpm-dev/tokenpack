// Browser decode: turn a TokenPack source into a `DecodeResult`.
//
// Source can be:
//   - URL (string)            → fetched + decoded
//   - Blob                    → decoded directly
//   - HTMLImageElement        → drawn to canvas, pixels extracted
//   - ImageBitmap             → ditto
//   - Uint8Array / ArrayBuffer → wrapped in a Blob first
//
// Returns a unified shape:
//   { type: 'file', payload: Uint8Array }
//   | { type: 'dir', entries: [{ path, payload: Uint8Array }] }
//
// Single entry point — text/JSON consumers do their own `TextDecoder`/`JSON.parse`.

import 'tokenpack/algorithms/register-all'

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { type DecodeResult, toDecodeResult } from 'tokenpack/decode-result'
import { isCompactToken, readCompactHeader, readHeader } from 'tokenpack/header'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

export type DecodeSource = string | Blob | ArrayBuffer | Uint8Array | HTMLImageElement | ImageBitmap

export interface DecodeOptions {
  /** Decryption key, if the token was encrypted. */
  key?: string
}

/** Decode a TokenPack source to either a file payload or a directory listing. */
export async function decode(
  source: DecodeSource,
  options: DecodeOptions = {},
): Promise<DecodeResult> {
  const pixels = await sourceToPixels(source)
  const codecId = resolveCodecId(pixels.pixels)
  const algorithm = algorithmCatalog.getById(codecId)
  const result = await algorithm.decodeBytes([pixels], options.key)
  const bytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength)

  return toDecodeResult(bytes)
}

async function sourceToPixels(source: DecodeSource): Promise<SurfacePixels> {
  // For HTMLImageElement / ImageBitmap we don't have the raw container bytes, so
  // we can't sniff the original channel layout from PNG/WebP headers. We assume
  // 4-channel and let the codec fail loudly if that's wrong; in practice, every
  // browser entry point goes through Blob/URL/Uint8Array which DOES land in the
  // sniff-then-decode path below.
  if (source instanceof ImageBitmap) {
    return bitmapToPixels(source, 4)
  }
  if (source instanceof HTMLImageElement) {
    if (!source.complete) {
      await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve()
        source.onerror = () => reject(new Error('image failed to load'))
      })
    }
    const bitmap = await createImageBitmap(source, BITMAP_OPTS)

    return bitmapToPixels(bitmap, 4)
  }

  const blob = await sourceToBlob(source)
  const fileChannels = await detectChannelsFromBlob(blob)
  // `premultiplyAlpha: 'none'` is critical: 4-channel tokens use the alpha
  // channel for actual codec data, and the default browser behavior of pre-
  // multiplying RGB by alpha/255 would silently corrupt every pixel where
  // alpha < 0xff. `colorSpaceConversion: 'none'` keeps canvas from applying
  // gamma/color-management transformations to the pixel bytes.
  const bitmap = await createImageBitmap(blob, BITMAP_OPTS)

  return bitmapToPixels(bitmap, fileChannels)
}

const BITMAP_OPTS: ImageBitmapOptions = {
  premultiplyAlpha: 'none',
  colorSpaceConversion: 'none',
}

async function sourceToBlob(
  source: Exclude<DecodeSource, HTMLImageElement | ImageBitmap>,
): Promise<Blob> {
  if (source instanceof Blob) return source
  if (typeof source === 'string') {
    const response = await fetch(source)

    if (!response.ok) throw new Error(`fetch ${source}: ${response.status}`)

    return await response.blob()
  }
  if (source instanceof Uint8Array) {
    return new Blob([source as BlobPart])
  }
  if (source instanceof ArrayBuffer) {
    return new Blob([source])
  }
  throw new TypeError('decode(): unsupported source type')
}

// ── Channel detection ────────────────────────────────────────────────────────
//
// The encoder writes 3-byte-per-pixel layout for `channels=3` tokens (PNG with
// colorType=2, WebP without alpha) and 4-byte-per-pixel for `channels=4`
// (PNG colorType=6, WebP with alpha, where the alpha channel carries codec
// data). Canvas / `createImageBitmap` ALWAYS returns RGBA, so we have to know
// the original layout to either (a) strip canvas's inserted alpha bytes or
// (b) keep them as data. We sniff the container header for a deterministic
// answer rather than guessing from pixel content.
async function detectChannelsFromBlob(blob: Blob): Promise<3 | 4> {
  // 32 bytes is enough for PNG IHDR colorType + WebP RIFF/VP8L/VP8X headers.
  const head = new Uint8Array(await blob.slice(0, 32).arrayBuffer())

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A. IHDR chunk's colorType byte is at
  // file offset 25 (after 8-byte signature + 4-byte length + 4-byte 'IHDR' +
  // 4-byte width + 4-byte height + 1-byte bitDepth = 25).
  // Color types: 0=grayscale, 2=RGB, 3=palette, 4=grayscale+alpha, 6=RGBA.
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

  // WebP: 'RIFF' xxxx 'WEBP' <chunk-type-4> ...
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

    if (c === 'VP8L') {
      // Lossless WebP. VP8L data starts at file offset 20 with a 0x2F signature
      // byte; the bitstream proper begins at offset 21 and is read LSB-first.
      // Field layout: width-1 (14b) | height-1 (14b) | alpha_is_used (1b) | version (3b).
      // alpha_is_used is bit 28 of the bitstream → file[24], bit 4.
      return (head[24] & 0x10) !== 0 ? 4 : 3
    }
    if (c === 'VP8X') {
      // Extended WebP container; flags byte is at file offset 20, alpha bit = 0x10.
      return (head[20] & 0x10) !== 0 ? 4 : 3
    }
    if (c === 'VP8 ') {
      // Lossy WebP: VP8 chunk format does not carry an alpha channel.
      return 3
    }
  }

  // Unknown container — fall back to 4 (RGBA). The codec will throw a clear
  // error on header mismatch if the guess is wrong.
  return 4
}

function bitmapToPixels(bitmap: ImageBitmap, fileChannels: 3 | 4): SurfacePixels {
  const { width, height } = bitmap
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : (() => {
          const c = document.createElement('canvas')

          c.width = width
          c.height = height

          return c
        })()

  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null

  if (!ctx) throw new Error('decode(): 2D canvas context unavailable')
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

  // 3-channel encoded: canvas inserted alpha=0xff every 4th byte. Strip it.
  const n = width * height
  const rgb = new Uint8Array(n * 3)

  for (let i = 0; i < n; i++) {
    rgb[i * 3] = rgba[i * 4]
    rgb[i * 3 + 1] = rgba[i * 4 + 1]
    rgb[i * 3 + 2] = rgba[i * 4 + 2]
  }

  return { pixels: rgb, width, height, fileChannels: 3 }
}

function resolveCodecId(pixels: Uint8Array): number {
  if (isCompactToken(pixels)) return readCompactHeader(pixels).algoId

  return readHeader(pixels).algorithmId
}
