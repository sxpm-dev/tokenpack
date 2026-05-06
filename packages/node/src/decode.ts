// Single unified decode for @tokenpack/node.
//
//   decode(buffer)                    → decode raw token bytes
//   decode('./token.png')             → read file, decode
//   decode('https://host/token.png')  → fetch, decode
//
// Returns a DecodeResult discriminated union:
//   { type: 'file', payload: Uint8Array }
//   { type: 'dir',  entries: [{ path, payload: Uint8Array }] }

import fs from 'fs'
import path from 'path'

import { decodeFromBuffer } from 'tokenpack/decoder'
import { type DecodeResult, toDecodeResult } from 'tokenpack/decode-result'

export type DecodeSource = string | URL | Buffer | Uint8Array

export interface DecodeOptions {
  /** Decryption key (required if the token was encrypted). */
  key?: string
}

export async function decode(source: DecodeSource, options: DecodeOptions = {}): Promise<DecodeResult> {
  const { bytes, ext } = await loadSource(source)
  const payload = await decodeFromBuffer(bytes, options.key, ext)
  const payloadBytes = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)

  return toDecodeResult(payloadBytes)
}

async function loadSource(source: DecodeSource): Promise<{ bytes: Buffer; ext: string }> {
  if (Buffer.isBuffer(source)) return { bytes: source, ext: '.png' }
  if (source instanceof Uint8Array) {
    return { bytes: Buffer.from(source.buffer, source.byteOffset, source.byteLength), ext: '.png' }
  }
  if (source instanceof URL || (typeof source === 'string' && /^https?:\/\//.test(source))) {
    const url = typeof source === 'string' ? new URL(source) : source
    const response = await fetch(url.toString())

    if (!response.ok) throw new Error(`fetch ${url.toString()}: ${response.status}`)
    const ab = await response.arrayBuffer()

    return {
      bytes: Buffer.from(ab),
      ext: path.extname(url.pathname) || '.png',
    }
  }
  // string = file path
  return {
    bytes: fs.readFileSync(source),
    ext: path.extname(source) || '.png',
  }
}

/**
 * Convenience: write a `dir` DecodeResult's entries to disk under `outDir`.
 * Throws on `file` results — use `payload` directly there.
 */
export function extract(result: DecodeResult, outDir: string): string[] {
  if (result.type !== 'dir') {
    throw new Error('extract(): result is not a packed dir; use result.payload directly for file tokens')
  }
  const written: string[] = []
  const resolvedOut = path.resolve(outDir)

  for (const entry of result.entries) {
    const fullPath = path.resolve(outDir, entry.path)
    if (!fullPath.startsWith(resolvedOut)) {
      throw new Error(`Unsafe path in archive: ${entry.path}`)
    }
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, entry.payload)
    written.push(entry.path)
  }

  return written
}
