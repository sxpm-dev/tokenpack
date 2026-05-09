// Single unified decode for @tokenpack/node.
//
//   decode(buffer)                    → decode raw token bytes
//   decode('./token.png')             → read file, decode
//   decode('https://host/token.png')  → fetch, decode
//
// Returns a `Pack` discriminated union (FilePack | DirPack | DiffPack).

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { decompressRaw } from 'tokenpack/compressors'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { DirPack, Pack } from 'tokenpack/pack/types'

import { loadSource } from './source-loader'

export type DecodeSource = string | URL | Buffer | Uint8Array

export interface DecodeOptions {
  /** Decryption key (required if the token was encrypted). */
  key?: string
}

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  const { bytes, ext } = await loadSource(source)
  const Ctor = await algorithmCatalog.detectFromBuffer(bytes, ext)
  const algo = new Ctor({ key: options.key })
  const payload = await algo.decode(bytes, { key: options.key, ext })
  const payloadBytes = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)

  return fromBytes(payloadBytes, {
    decompress: decompressRaw,
    diffTo: async (a: DirPack, b: DirPack) => {
      // Delegate to the source-decoded algorithm so the diff token uses the
      // same packaging as the inputs (same-algo guarantee at the diff layer).
      const tokenBytes = await algo.diff(a, b).token()
      const buf = Buffer.from(tokenBytes.buffer, tokenBytes.byteOffset, tokenBytes.byteLength)

      // Match the `EncodeResult` shape that callers expect (Buffer + .bytes).
      return Object.assign(buf, { bytes: tokenBytes })
    },
  })
}
