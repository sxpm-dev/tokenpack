// Single unified encode for @tokenpack/node.
//
//   encode(buffer)       → encode raw bytes
//   encode('./file.txt') → read file, encode contents
//   encode('./src')      → walk directory, pack as CART, encode
//
// Returns the encoded PNG bytes. Throws if the encoder produced multiple
// chunks (rare; only triggered by very large payloads). Use the lower-level
// `tokenpack/encoder` subpath if you need multi-chunk output.

import fs from 'fs'
import path from 'path'

import { encode as legacyEncode } from 'tokenpack/encoder'
import type { EncodeOptions } from 'tokenpack/types'
import { tmpdir } from 'os'

import { packDirs } from 'tokenpack/archive'

export type EncodeInput = string | Buffer | Uint8Array

export async function encode(
  input: EncodeInput,
  options: Omit<EncodeOptions, 'algo' | 'out'> & { algo?: string; out?: string } = {},
): Promise<Buffer> {
  const bytes = await coerceToBuffer(input)

  // Use a temp out path if caller didn't pass one — we always return bytes.
  const outPath = options.out
    ?? path.join(tmpdir(), `tp-${Date.now()}-${Math.random().toString(36).slice(2)}.png`)

  const writtenPaths = await legacyEncode(bytes, { ...options, out: outPath })

  if (writtenPaths.length === 0) throw new Error('encode produced no output')
  if (writtenPaths.length > 1) {
    throw new Error(
      `encode produced ${writtenPaths.length} chunks — payload too large for single-PNG output. ` +
      `Use the lower-level \`tokenpack/encoder\` API or split your payload.`,
    )
  }

  const result = fs.readFileSync(writtenPaths[0])

  // If the output path was caller-provided, leave it; otherwise clean up the temp file.
  if (!options.out) {
    try {
      fs.unlinkSync(writtenPaths[0])
    } catch {}
  }

  return result
}

async function coerceToBuffer(input: EncodeInput): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input.buffer, input.byteOffset, input.byteLength)

  // string = filesystem path. Detect file vs directory.
  const stat = fs.statSync(input)

  if (stat.isDirectory()) {
    return packDirs([input], [], input)
  }

  return fs.readFileSync(input)
}
