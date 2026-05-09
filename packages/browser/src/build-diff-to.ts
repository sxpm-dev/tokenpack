// Shared `diffTo` builder used by `decode()` and `decodeStream()`.
//
// Returns a function compatible with `DirPack.diffToFn`. The function is
// invoked when a consumer calls `prevPack.diffTo(nextPack)`. It delegates
// to the source-decoded algorithm's `algo.diff(prev, next).token()` so the
// diff token is packaged with the same algorithm as the inputs, then wraps
// the result bytes in the browser-friendly `EncodeResult` shape (blob,
// objectURL, dataURL, image) without re-encoding the bytes.

import type { AbstractAlgorithm } from 'tokenpack/algorithms/types'
import type { DirPack } from 'tokenpack/pack/types'

import type { EncodeResult } from './encode'

export function buildDiffToFn(algo: AbstractAlgorithm) {
  return async (a: DirPack, b: DirPack): Promise<EncodeResult> => {
    const tokenBytes = await algo.diff(a, b).token()

    return wrapTokenBytes(tokenBytes)
  }
}

async function wrapTokenBytes(bytes: Uint8Array): Promise<EncodeResult> {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'image/png' })
  const objectURL = URL.createObjectURL(blob)
  const dataURL = await blobToDataURL(blob)
  const image = new Image()

  image.src = objectURL

  return { blobs: [blob], bytes, objectURL, dataURL, image }
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
