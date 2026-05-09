// Browser decode — thin proxy: normalize source → detect algorithm → delegate.

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { decompressRaw } from 'tokenpack/compressors'
import type { DecompressFn } from 'tokenpack/pack-format/decompress'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { Pack } from 'tokenpack/pack/types'

import { buildDiffToFn } from './build-diff-to'

export type DecodeSource = string | Blob | ArrayBuffer | Uint8Array | HTMLImageElement | ImageBitmap

export interface DecodeOptions {
  key?: string
  decompress?: DecompressFn
}

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  const buffer = await sourceToBytes(source)
  const Ctor = await algorithmCatalog.detectFromBuffer(buffer, '.png')
  const algorithm = new Ctor({ key: options.key })
  const result = await algorithm.decode(buffer, { key: options.key, ext: '.png' })
  const bytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength)

  return fromBytes(bytes, {
    decompress: options.decompress ?? decompressRaw,
    // Curry the source-decoded algorithm so `prevPack.diffTo(nextPack)`
    // produces a diff token packaged with the same algorithm as the inputs.
    diffTo: buildDiffToFn(algorithm),
  })
}

async function sourceToBytes(source: DecodeSource): Promise<Buffer> {
  if (source instanceof Uint8Array) {
    return Buffer.from(source.buffer, source.byteOffset, source.byteLength)
  }
  if (source instanceof ArrayBuffer) {
    return Buffer.from(source)
  }
  if (source instanceof Blob) {
    return Buffer.from(await source.arrayBuffer())
  }
  if (typeof source === 'string') {
    const response = await fetch(source)

    if (!response.ok) throw new Error(`fetch ${source}: ${response.status}`)

    return Buffer.from(await response.arrayBuffer())
  }
  if (source instanceof HTMLImageElement || source instanceof ImageBitmap) {
    // For pre-decoded image elements we don't have the original bytes.
    // Render to canvas → toBlob → bytes so the algorithm can re-read via its surface.
    const bitmap =
      source instanceof ImageBitmap ? source : await imageElementToBitmap(source)
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(bitmap.width, bitmap.height)
        : (() => {
            const c = document.createElement('canvas')

            c.width = bitmap.width
            c.height = bitmap.height

            return c
          })()
    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null

    if (!ctx) throw new Error('decode(): 2D canvas context unavailable')
    ctx.drawImage(bitmap, 0, 0)
    let blob: Blob

    if ('convertToBlob' in canvas) {
      blob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' })
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        ;(canvas as HTMLCanvasElement).toBlob(b => {
          if (b) resolve(b)
          else reject(new Error('canvas.toBlob returned null'))
        }, 'image/png')
      })
    }

    return Buffer.from(await blob.arrayBuffer())
  }
  throw new TypeError('decode(): unsupported source type')
}

async function imageElementToBitmap(img: HTMLImageElement): Promise<ImageBitmap> {
  if (!img.complete) {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image failed to load'))
    })
  }

  return createImageBitmap(img, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
}
