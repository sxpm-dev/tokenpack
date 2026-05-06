// Single unified decode for @tokenpack/node.
//
//   decode(buffer)                    → decode raw token bytes
//   decode('./token.png')             → read file, decode
//   decode('https://host/token.png')  → fetch, decode
//
// Returns a `Pack` discriminated union (FilePack | DirPack | DiffPack).

import fs from 'fs'
import path from 'path'
import { compressRaw, decompressRaw } from 'tokenpack/compressors'
import { decodeFromBuffer } from 'tokenpack/decoder'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { DirPack, Pack } from 'tokenpack/pack/types'
import { encodeDiff } from 'tokenpack/pack-format/encode-diff'

import { encode } from './encode'

export type DecodeSource = string | URL | Buffer | Uint8Array

export interface DecodeOptions {
  /** Decryption key (required if the token was encrypted). */
  key?: string
  /** Compressor used when this Pack later produces a diff via `dirPack.diffTo`. */
  compressor?: string
}

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<Pack> {
  const { bytes, ext } = await loadSource(source)
  const payload = await decodeFromBuffer(bytes, options.key, ext)
  const payloadBytes = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)

  return fromBytes(payloadBytes, {
    decompress: decompressRaw,
    diffTo: async (a: DirPack, b: DirPack) => {
      const prevEntries = await a.extractAll()
      const nextEntries = await b.extractAll()
      const compressor = options.compressor ?? 'brotli-11'
      const diffBytes = await encodeDiff(prevEntries, nextEntries, async bytes => {
        const r = await compressRaw(bytes, compressor)

        return {
          bytes: r.bytes,
          compressor: r.compressor,
          level: r.level,
          originalSize: r.originalSize,
        }
      })

      // Wrap diff bytes through the image pipeline so the result is itself a token.
      return encode(Buffer.from(diffBytes.buffer, diffBytes.byteOffset, diffBytes.byteLength), {
        compressionMode: 'none',
      })
    },
  })
}

async function loadSource(source: DecodeSource): Promise<{ bytes: Buffer; ext: string }> {
  if (Buffer.isBuffer(source)) return { bytes: source, ext: '.png' }
  if (source instanceof Uint8Array) {
    return { bytes: Buffer.from(source.buffer, source.byteOffset, source.byteLength), ext: '.png' }
  }
  if (source instanceof URL || (typeof source === 'string' && /^(?:https?|file):\/\//.test(source))) {
    const url = typeof source === 'string' ? new URL(source) : source

    if (url.protocol === 'file:') {
      // Read directly from disk — `fetch()` can't open file:// in Node.
      const fileBytes = fs.readFileSync(url)

      return { bytes: fileBytes, ext: path.extname(url.pathname) || '.png' }
    }

    const response = await fetch(url.toString())

    if (!response.ok) throw new Error(`fetch ${url.toString()}: ${response.status}`)
    const ab = await response.arrayBuffer()

    return {
      bytes: Buffer.from(ab),
      ext: path.extname(url.pathname) || '.png',
    }
  }

  return {
    bytes: fs.readFileSync(source),
    ext: path.extname(source) || '.png',
  }
}
