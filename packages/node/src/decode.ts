// Single unified decode for @tokenpack/node.
//
//   decode(buffer)                    → decode raw token bytes
//   decode('./token.png')             → read file, decode
//   decode('https://host/token.png')  → fetch, decode
//
// Returns a `Pack` discriminated union (FilePack | DirPack | DiffPack).

import fs from 'fs'
import path from 'path'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { compressRaw, decompressRaw } from 'tokenpack/compressors'
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
  const Ctor = await algorithmCatalog.detectFromBuffer(bytes, ext)
  const algo = new Ctor({ key: options.key })
  const payload = await algo.decode(bytes, { key: options.key, ext })
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
      return encode(Buffer.from(diffBytes.buffer, diffBytes.byteOffset, diffBytes.byteLength))
    },
  })
}

function sniffExt(buf: Buffer): string {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return '.png'
  }
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    if (buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return '.webp'
  }
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    return '.avif'
  }

  return '.png'
}

async function loadSource(source: DecodeSource): Promise<{ bytes: Buffer; ext: string }> {
  if (Buffer.isBuffer(source)) return { bytes: source, ext: sniffExt(source) }
  if (source instanceof Uint8Array) {
    const buf = Buffer.from(source.buffer, source.byteOffset, source.byteLength)

    return { bytes: buf, ext: sniffExt(buf) }
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
