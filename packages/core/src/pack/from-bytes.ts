// Sniff format byte and construct the right Pack subclass.
// Decompression is injected so this module stays env-neutral.

import { decodeDiff } from '../pack-format/apply-diff'
import { decodePack } from '../pack-format/decode-pack'
import type { DecompressFn } from '../pack-format/decompress'
import { readWrappedFile } from '../pack-format/encode-file'
import { FORMAT_DIFF, FORMAT_FILE, FORMAT_PACK, readFormatByte } from '../pack-format/format-byte'
import { DiffPack } from './diff-pack'
import { type DiffToFn, DirPack } from './dir-pack'
import { FilePack } from './file-pack'
import type { Pack } from './types'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface FromBytesOptions {
  decompress: DecompressFn
  /** Optional hook for `dirPack.diffTo` — env packages inject the encode pipeline. */
  diffTo?: DiffToFn
}

function hasSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === SIG[0] &&
    bytes[1] === SIG[1] &&
    bytes[2] === SIG[2] &&
    bytes[3] === SIG[3]
  )
}

export function fromBytes(bytes: Uint8Array, opts: FromBytesOptions): Pack {
  // Anonymous file token (no signature, no format byte) — treat as file format.
  // The signature is the tokenpack-specific magic; payload bytes coming out of
  // the existing decoder pipeline don't carry it unless `encode()` was called
  // with `{ name }` (which wraps the payload in a `[sig][0x01][nameLen][name]`
  // envelope) or `encode(builder)` (which produces a `[sig][0x02]…` pack).
  const sigPresent = hasSignature(bytes)
  const fmt = sigPresent ? readFormatByte(bytes, 4) : FORMAT_FILE

  if (fmt === FORMAT_FILE) {
    if (sigPresent) {
      const { name, payload } = readWrappedFile(bytes)

      return new FilePack({ name, size: payload.length }, async () => payload)
    }

    return new FilePack({ name: '', size: bytes.length }, async () => bytes)
  }

  if (fmt === FORMAT_PACK) {
    const decoded = decodePack(bytes)
    const entries = decoded.manifest.files.map(f => ({ path: f.path, size: f.originalSize }))

    return new DirPack(
      entries,
      async path => {
        const file = decoded.manifest.files.find(f => f.path === path)

        if (!file) throw new Error(`no entry for path: ${path}`)
        const region = decoded.extractRegion(path)

        return opts.decompress(region, file.compressor, {
          level: file.level,
          uncompressedLength: file.originalSize,
        })
      },
      async () =>
        Promise.all(
          decoded.manifest.files.map(async f => ({
            path: f.path,
            bytes: await opts.decompress(decoded.extractRegion(f.path), f.compressor, {
              level: f.level,
              uncompressedLength: f.originalSize,
            }),
          })),
        ),
      opts.diffTo,
    )
  }

  if (fmt === FORMAT_DIFF) {
    const decoded = decodeDiff(bytes)
    const entries = decoded.manifest.ops.map(o => ({
      path: o.path,
      op: o.op,
      size: o.op === 'patch' ? o.targetSize : o.originalSize,
      fromPath: o.fromPath,
    }))

    return new DiffPack(entries, bytes, opts.decompress)
  }

  throw new Error(`fromBytes: unknown format byte 0x${(fmt as number).toString(16)}`)
}
