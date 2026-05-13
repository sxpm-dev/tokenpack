// Browser decode — public wrapper over Token's lazy implementation.

import type { Pack } from 'tokenpack/pack/types'
import type { DecompressFn } from 'tokenpack/pack-format/decompress'

import { maybeRouterToken } from './router-token'
import { Token } from './token'

export type DecodeSource = string | Blob | ArrayBuffer | Uint8Array | HTMLImageElement | ImageBitmap

export interface DecodeOptions {
  key?: string
  decompress?: DecompressFn
  /** Called when a streaming decoder emits its first decoded payload chunk. */
  onFirstDecodedChunk?: (chunk: Uint8Array) => void
}

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  return maybeRouterToken(await new Token(source, options).pack(), source, options)
}
