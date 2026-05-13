// Decode a pack-format Uint8Array into a manifest + lazy region accessors.
//
// Returns the COMPRESSED region bytes — env code is responsible for
// decompression (so this module stays env-neutral).

import { FORMAT_PACK, readFormatByte } from './format-byte'
import { type PackManifest, readPackManifest } from './manifest'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface DecodedPack {
  manifest: PackManifest
  /** Compressed region bytes for `path`. Decompression happens in env code. */
  extractRegion(path: string): Uint8Array
  /** Byte offset where regions start (after signature + format byte + manifest). */
  readonly regionsStart: number
  /** Whole pack-format byte buffer. */
  readonly bytes: Uint8Array
}

export function decodePack(bytes: Uint8Array): DecodedPack {
  if (
    bytes.length < 9 ||
    bytes[0] !== SIG[0] ||
    bytes[1] !== SIG[1] ||
    bytes[2] !== SIG[2] ||
    bytes[3] !== SIG[3]
  ) {
    throw new Error('decodePack: missing tokenpack signature')
  }

  const fmt = readFormatByte(bytes, 4)

  if (fmt !== FORMAT_PACK) {
    throw new Error(`decodePack: expected pack format (0x02), got 0x${fmt.toString(16)}`)
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const manifestSize = view.getUint32(5, true)
  const manifestBytes = bytes.subarray(9, 9 + manifestSize)
  const manifest = readPackManifest(manifestBytes)
  const regionsStart = 9 + manifestSize
  const fileByPath = new Map(manifest.files.map(file => [file.path, file]))

  return {
    manifest,
    regionsStart,
    bytes,
    extractRegion(path) {
      const file = fileByPath.get(path)

      if (!file) throw new Error(`no entry for path: ${path}`)
      const start = regionsStart + file.offset

      return bytes.subarray(start, start + file.compressedSize)
    },
  }
}
