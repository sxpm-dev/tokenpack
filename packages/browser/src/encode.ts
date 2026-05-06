// Browser encode: Uint8Array → PNG via canvas.toBlob (or OffscreenCanvas).
//
// Uses `algorithmCatalog.encodeBytes` from @tokenpack/core to produce raw pixel
// chunks, then wraps each chunk in a PNG via the browser's native encoder.

import 'tokenpack/algorithms/register-all'

import { PackBuilder } from 'tokenpack'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { compressRaw } from 'tokenpack/compressors'
import type { DrawnChunk } from 'tokenpack/drawers/types'
import { wrapFileWithName } from 'tokenpack/pack-format/encode-file'
import { encodePack } from 'tokenpack/pack-format/encode-pack'
import type { EncodeOptions } from 'tokenpack/types'

export interface EncodeResult {
  /** PNG bytes for each chunk. Most encodes produce a single chunk. */
  blobs: Blob[]
  /** Raw token bytes (await-extracted from blobs[0]) — for direct `decode()` use. */
  bytes: Uint8Array
  /** Object URL pointing at blobs[0] — convenient for `<img src={…}>` immediately. */
  objectURL: string
  /** Data URL pointing at blobs[0]. */
  dataURL: string
  /** Detached `<img>` element with `src` set to the object URL — drop into the DOM. */
  image: HTMLImageElement
}

export interface EncodeBrowserOptions extends Omit<EncodeOptions, 'algo' | 'out' | 'format'> {
  /** Algorithm name (default: 'linear'). */
  algo?: string
  /** Per-file compressor for pack-format encodes (default: 'brotli-11'). */
  compressor?: string
  /** File-format only: name embedded in the token; surfaced as `pack.list[0]` on decode. */
  name?: string
}

/**
 * Encode `content` to a PNG (returned as a Blob, plus convenience handles).
 *
 * `content` can be:
 *  - `string`: encoded as UTF-8
 *  - `Uint8Array` / `ArrayBuffer`: copied raw
 *  - `Blob`: read via `arrayBuffer()`
 *  - `PackBuilder`: each entry compressed independently into a pack-format token
 */
export async function encode(
  content: string | Uint8Array | ArrayBuffer | Blob | PackBuilder,
  options: EncodeBrowserOptions = {},
): Promise<EncodeResult> {
  let bytes: Uint8Array
  let runtimeOptions: EncodeBrowserOptions

  if (content instanceof PackBuilder) {
    const entries = await content.build()
    const compressor = options.compressor ?? 'brotli-11'

    bytes = await encodePack(entries, async b => {
      const r = await compressRaw(b, compressor)

      return {
        bytes: r.bytes,
        compressor: r.compressor,
        level: r.level,
        originalSize: r.originalSize,
      }
    })
    // Outer pipeline must NOT recompress — region bytes are already compressed.
    runtimeOptions = { ...options, compressionMode: 'none' }
  } else {
    const raw = await coerceToBytes(content)

    bytes = options.name ? wrapFileWithName(options.name, raw) : raw
    runtimeOptions = options
  }

  const algoName = runtimeOptions.algo ?? 'linear'
  const algorithm = algorithmCatalog.getByName(algoName)
  const chunks = await algorithm.encodeBytes(bytes, runtimeOptions)

  const blobs = await Promise.all(chunks.map(chunkToPngBlob))
  const objectURL = URL.createObjectURL(blobs[0])
  const dataURL = await blobToDataURL(blobs[0])
  const image = new Image()
  const tokenBytes = new Uint8Array(await blobs[0].arrayBuffer())

  image.src = objectURL

  return { blobs, bytes: tokenBytes, objectURL, dataURL, image }
}

async function coerceToBytes(input: string | Uint8Array | ArrayBuffer | Blob): Promise<Uint8Array> {
  if (typeof input === 'string') return new TextEncoder().encode(input)
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  if (input instanceof Blob) return new Uint8Array(await input.arrayBuffer())
  throw new TypeError('encode(): unsupported input type')
}

async function chunkToPngBlob(chunk: DrawnChunk): Promise<Blob> {
  const { pixels, width, height, fileChannels } = chunk
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : (() => {
          const c = document.createElement('canvas')

          c.width = width
          c.height = height

          return c
        })()

  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('encode(): 2D canvas context unavailable')

  // Canvas always uses RGBA; expand 3-channel pixels with full-alpha bytes.
  const rgba = fileChannels === 4 ? pixels : expandRgbToRgba(pixels, width, height)
  const clamped = new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength)
  // TS 5.7+ Uint8ClampedArray<ArrayBufferLike> trips ImageData's BufferSource expectation.

  const imageData = new ImageData(clamped as any, width, height)

  ;(ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).putImageData(
    imageData,
    0,
    0,
  )

  if ('convertToBlob' in canvas) {
    return await canvas.convertToBlob({ type: 'image/png' })
  }

  return await new Promise<Blob>((resolve, reject) => {
    ;(canvas as HTMLCanvasElement).toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob returned null'))
    }, 'image/png')
  })
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

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
