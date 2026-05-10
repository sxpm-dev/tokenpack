// Decode + apply a diff byte stream against a previous set of entries.

import type { PackEntry } from '../archive-buffers'
import type { DecompressFn } from './decompress'
import { FORMAT_DIFF, readFormatByte } from './format-byte'
import { type DiffManifest, readDiffManifest } from './manifest'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)

export interface DecodedDiff {
  manifest: DiffManifest
  /** Returns the COMPRESSED region bytes for an add/modify path. */
  extractRegion(path: string): Uint8Array
  readonly regionsStart: number
  readonly bytes: Uint8Array
}

export function decodeDiff(bytes: Uint8Array): DecodedDiff {
  if (
    bytes.length < 9 ||
    bytes[0] !== SIG[0] ||
    bytes[1] !== SIG[1] ||
    bytes[2] !== SIG[2] ||
    bytes[3] !== SIG[3]
  ) {
    throw new Error('decodeDiff: missing tokenpack signature')
  }

  const fmt = readFormatByte(bytes, 4)

  if (fmt !== FORMAT_DIFF) {
    throw new Error(`decodeDiff: expected diff format (0x03), got 0x${fmt.toString(16)}`)
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const manifestSize = view.getUint32(5, true)
  const manifestBytes = bytes.subarray(9, 9 + manifestSize)
  const manifest = readDiffManifest(manifestBytes)
  const regionsStart = 9 + manifestSize

  return {
    manifest,
    regionsStart,
    bytes,
    extractRegion(path) {
      const op = manifest.ops.find(
        o => o.path === path && (o.op === 'add' || o.op === 'modify' || o.op === 'patch'),
      )

      if (!op || op.offset === undefined || op.compressedSize === undefined) {
        throw new Error(`decodeDiff: no add/modify region for path: ${path}`)
      }

      const start = regionsStart + op.offset

      return bytes.subarray(start, start + op.compressedSize)
    },
  }
}

/**
 * Apply a diff byte stream to `prev` entries, returning new entries.
 * Decompression is injected so this function stays env-neutral.
 */
export async function applyDiff(
  prev: readonly PackEntry[],
  diffBytes: Uint8Array,
  decompress: DecompressFn,
): Promise<PackEntry[]> {
  const decoded = decodeDiff(diffBytes)
  const map = new Map<string, Uint8Array>(prev.map(e => [e.path, e.bytes]))

  for (const op of decoded.manifest.ops) {
    if (op.op === 'delete') {
      map.delete(op.path)
    } else if (op.op === 'rename') {
      const bytes = map.get(op.fromPath!)

      if (!bytes) throw new Error(`applyDiff: rename source missing: ${op.fromPath}`)
      map.delete(op.fromPath!)
      map.set(op.path, bytes)
    } else if (op.op === 'patch') {
      const base = map.get(op.path)

      if (!base) throw new Error(`applyDiff: patch base missing: ${op.path}`)
      const region = decoded.extractRegion(op.path)
      const insert = await decompress(region, op.compressor!, {
        level: op.level!,
        uncompressedLength: op.originalSize!,
      })

      map.set(op.path, applyBytePatch(base, op.patchStart!, op.deleteSize!, insert, op.targetSize!))
    } else {
      // add | modify
      const region = decoded.extractRegion(op.path)
      const bytes = await decompress(region, op.compressor!, {
        level: op.level!,
        uncompressedLength: op.originalSize!,
      })

      map.set(op.path, bytes)
    }
  }

  return Array.from(map, ([path, bytes]) => ({ path, bytes }))
}

function applyBytePatch(
  base: Uint8Array,
  start: number,
  deleteSize: number,
  insert: Uint8Array,
  targetSize: number,
): Uint8Array {
  if (start < 0 || deleteSize < 0 || start + deleteSize > base.length) {
    throw new Error('applyDiff: invalid patch bounds')
  }

  const out = new Uint8Array(base.length - deleteSize + insert.length)

  out.set(base.subarray(0, start), 0)
  out.set(insert, start)
  out.set(base.subarray(start + deleteSize), start + insert.length)

  if (out.length !== targetSize) {
    throw new Error(`applyDiff: patch produced ${out.length} bytes, expected ${targetSize}`)
  }

  return out
}
