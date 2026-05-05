// Browser decode: PNG (Blob/URL/`<img>`) → Uint8Array via createImageBitmap.
//
// Uses `algorithmCatalog.decodeBytes` from @tokenpack/core to recover the
// payload from already-extracted pixels.

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import 'tokenpack/algorithms/register-all'
import { isCompactToken, readCompactHeader, readHeader } from 'tokenpack/header'
import type { SurfacePixels } from 'tokenpack/surfaces/types'

export type DecodeSource =
  | string                  // URL (fetched)
  | Blob
  | ArrayBuffer
  | Uint8Array
  | HTMLImageElement
  | ImageBitmap

export interface DecodeOptions {
  /** Decryption key, if the token was encrypted. */
  key?: string
}

/**
 * Decode a TokenPack image back to its original payload bytes.
 *
 * Accepts whatever you have:
 *   - URL → fetched and decoded
 *   - Blob (e.g., from `<input type="file">`) → decoded directly
 *   - HTMLImageElement → drawn to canvas, pixels extracted
 *   - Uint8Array / ArrayBuffer → wrapped as a Blob first
 */
export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Uint8Array> {
  const pixels = await sourceToPixels(source)
  const codecId = resolveCodecId(pixels.pixels)
  const algorithm = algorithmCatalog.getById(codecId)
  const result = await algorithm.decodeBytes([pixels], options.key)

  return new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
}

/** Decode and parse the result as UTF-8 text. */
export async function decodeText(source: DecodeSource, options: DecodeOptions = {}): Promise<string> {
  return new TextDecoder('utf-8').decode(await decode(source, options))
}

/** Decode and parse the result as JSON. */
export async function decodeJSON<T = unknown>(source: DecodeSource, options: DecodeOptions = {}): Promise<T> {
  return JSON.parse(await decodeText(source, options)) as T
}

async function sourceToPixels(source: DecodeSource): Promise<SurfacePixels> {
  let bitmap: ImageBitmap

  if (source instanceof ImageBitmap) {
    bitmap = source
  } else if (source instanceof HTMLImageElement) {
    if (!source.complete) {
      await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve()
        source.onerror = () => reject(new Error('image failed to load'))
      })
    }
    bitmap = await createImageBitmap(source)
  } else {
    const blob = await sourceToBlob(source)

    bitmap = await createImageBitmap(blob)
  }

  return bitmapToPixels(bitmap)
}

async function sourceToBlob(source: Exclude<DecodeSource, HTMLImageElement | ImageBitmap>): Promise<Blob> {
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

function bitmapToPixels(bitmap: ImageBitmap): SurfacePixels {
  const { width, height } = bitmap
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : (() => {
        const c = document.createElement('canvas')
        c.width = width
        c.height = height
        return c
      })()

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null

  if (!ctx) throw new Error('decode(): 2D canvas context unavailable')
  ctx.drawImage(bitmap, 0, 0)

  const imageData = ctx.getImageData(0, 0, width, height)
  // Browser canvas always returns RGBA. The codec layer can read either —
  // tokens encoded with 3-channel surfaces reads the leading 3 bytes per pixel.
  const pixels = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength)

  return { pixels, width, height, fileChannels: 4 }
}

function resolveCodecId(pixels: Uint8Array): number {
  if (isCompactToken(pixels)) return readCompactHeader(pixels).algoId

  return readHeader(pixels).algorithmId
}
