import { Buffer } from 'buffer'
import { PixelAlgorithm } from 'tokenpack/algorithms/pixel-algorithm'
import type { AbstractAlgorithm } from 'tokenpack/algorithms/types'
import { decompressRaw } from 'tokenpack/compressors'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { Pack } from 'tokenpack/pack/types'
import type { DecompressFn } from 'tokenpack/pack-format/decompress'

import { browserAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import { buildDiffToFn } from './build-diff-to'
import type { DecodeOptions, DecodeSource } from './decode'

export async function decodeSourceToPack(
  source: DecodeSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  const { bytes, algorithm } = await decodeSourceToPayload(source, options)

  return payloadToPack(bytes, algorithm, options.decompress)
}

export async function decodeSourceToPayload(
  source: DecodeSource,
  options: DecodeOptions = {},
): Promise<{ bytes: Uint8Array; algorithm: AbstractAlgorithm }> {
  const buffer = await sourceToBytes(source)
  const { Ctor, image } = await algorithmCatalog.detectWithImage(buffer, '.png')
  const algorithm = new Ctor({ key: options.key })
  const decodeOptions = { key: options.key, ext: '.png' }
  const result =
    image && algorithm instanceof PixelAlgorithm
      ? await algorithm.decodeFromImages([image], decodeOptions)
      : await algorithm.decode(buffer, decodeOptions)
  const bytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength)

  return { bytes, algorithm }
}

export async function detectSourceAlgorithmName(source: DecodeSource): Promise<string> {
  const buffer = await sourceToBytes(source)
  const Ctor = await algorithmCatalog.detectFromBuffer(buffer, '.png')

  return Ctor.name
}

export function payloadToPack(
  bytes: Uint8Array,
  algorithm: AbstractAlgorithm,
  decompress?: DecompressFn,
): Pack {
  return fromBytes(bytes, {
    decompress: decompress ?? decompressRaw,
    diffTo: buildDiffToFn(algorithm),
  })
}

export async function sourceToBytes(source: DecodeSource): Promise<Buffer> {
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
    const bitmap = source instanceof ImageBitmap ? source : await imageElementToBitmap(source)
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
