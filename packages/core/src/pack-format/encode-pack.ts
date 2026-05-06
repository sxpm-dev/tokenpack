// Encode a list of pack entries (path + bytes) into pack-format Uint8Array.
//
// Layout:
//   [4 bytes signature 0xc0 0xde 0xae 0x54]
//   [1 byte format byte = 0x02]
//   [4 bytes u32 LE: manifest size]
//   [N bytes: manifest JSON]
//   [regions: each entry's compressed bytes laid out sequentially]
//
// Compression is per-file (independent streams) so consumers can extract a
// single file by name without decompressing the rest. The compressor is
// injected so this module stays env-neutral.

import type { PackEntry } from '../archive-buffers'
import { FORMAT_PACK, writeFormatByte } from './format-byte'
import { type PackManifest, writePackManifest } from './manifest'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface CompressedRegion {
  bytes: Uint8Array
  /** Compressor mode (e.g. 'brotli-11', 'none'). */
  compressor: string
  /** Level returned by `compress()` — passed back to `decompress()` meta. */
  level: number
  /** Original (uncompressed) length. */
  originalSize: number
}

export interface CompressFn {
  (bytes: Uint8Array): Promise<CompressedRegion>
}

export async function encodePack(
  entries: readonly PackEntry[],
  compress: CompressFn,
): Promise<Uint8Array> {
  const compressed = await Promise.all(
    entries.map(async e => ({ path: e.path, ...(await compress(e.bytes)) })),
  )

  let runningOffset = 0
  const manifest: PackManifest = {
    version: 1,
    files: compressed.map(c => {
      const file = {
        path: c.path,
        compressor: c.compressor,
        level: c.level,
        compressedSize: c.bytes.length,
        originalSize: c.originalSize,
        offset: runningOffset,
      }

      runningOffset += c.bytes.length

      return file
    }),
  }
  const manifestBytes = writePackManifest(manifest)
  const totalRegionBytes = compressed.reduce((s, c) => s + c.bytes.length, 0)
  const out = new Uint8Array(4 + 1 + 4 + manifestBytes.length + totalRegionBytes)
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength)

  out.set(SIG, 0)
  writeFormatByte(out, 4, FORMAT_PACK)
  view.setUint32(5, manifestBytes.length, true)
  out.set(manifestBytes, 9)

  let pos = 9 + manifestBytes.length

  for (const c of compressed) {
    out.set(c.bytes, pos)
    pos += c.bytes.length
  }

  return out
}
