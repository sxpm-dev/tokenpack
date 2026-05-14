// Single unified decode for @tokenpack/node.
//
//   decode(buffer)                    → decode raw token bytes
//   decode('./token.png')             → read file, decode
//   decode('https://host/token.png')  → fetch, decode
//
// Returns a `Pack` discriminated union (FilePack | DirPack | DiffPack).

import type { Pack } from 'tokenpack/pack/types'

import { maybeRouterToken } from './router-token'
import { Token } from './token'

export type DecodeSource = string | URL | Buffer | Uint8Array

export interface DecodeOptions {
  /** Decryption key (required if the token was encrypted). */
  key?: string
  /** Required when decoding a router entry from a non-path/non-URL source. */
  baseUrl?: string | URL
  /** Called when a streaming decoder emits its first decoded payload chunk. */
  onFirstDecodedChunk?: (chunk: Uint8Array) => void
}

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  return maybeRouterToken(await new Token(source, options).pack(), source, options)
}
