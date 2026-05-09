// Range-fetch primitives for PixelRange pack tokens.
//
// A `pixel-range-png-brotli` token (or any algorithm whose data lives in a
// PNG `tpAK` ancillary chunk) holds the pack-format bytes — manifest +
// per-file regions — at known absolute byte offsets in the artifact. This
// module turns those offsets into HTTP `Range:` requests so a consumer can
// pull a single file from a remote pack without downloading the whole image
// or decoding any pixels.
//
//   const remote = await fetchPackManifest('/pack.png')
//   const bytes  = await fetchPackFile(remote, 'foo.js', decompressRaw)
//
// Layout the consumer relies on (PixelRangePngBrotli + encodePack):
//   PNG signature (8 bytes)
//   IHDR chunk (25 bytes total: 4 length + 4 type + 13 data + 4 crc)
//   tpAK chunk (4 length + 4 type + N data + 4 crc)
//     data:
//       4 bytes  pack-format signature (0xc0 0xde 0xae 0x54)
//       1 byte   format byte (0x02 = FORMAT_PACK)
//       4 bytes  manifest length (little-endian u32)
//       N bytes  manifest JSON
//       …        per-file compressed regions, contiguous, indexed by manifest
//
// We don't hardcode the tpAK position; we walk PNG chunks from byte 8 until
// we find it. That way any extra ancillary chunks inserted by a pipeline
// (color profile, time, etc.) don't break detection.

import type { DecompressFn } from 'tokenpack/pack-format/decompress'
import type { PackManifest, PackManifestFile } from 'tokenpack/pack-format/manifest'

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PACK_FORMAT_SIG = [0xc0, 0xde, 0xae, 0x54]
const FORMAT_PACK_BYTE = 0x02

const HEAD_FETCH_DEFAULT_BYTES = 8192

export interface RemotePackHandle {
  url: string
  manifest: PackManifest
  /** Absolute byte offset (within the PNG file) of the pack-format regions block. */
  regionsAbsOffset: number
}

/**
 * Read a remote PixelRange PNG's pack manifest with a single small range
 * fetch. If the manifest exceeds the initial slice, refetches with a range
 * sized to fit it — at most one extra round-trip.
 */
export async function fetchPackManifest(
  url: string,
  initialBytes: number = HEAD_FETCH_DEFAULT_BYTES,
): Promise<RemotePackHandle> {
  const head = await fetchRange(url, 0, initialBytes - 1)

  return parsePackManifestFromHead(url, head, initialBytes)
}

async function parsePackManifestFromHead(
  url: string,
  head: Uint8Array,
  initialBytes: number,
): Promise<RemotePackHandle> {
  // PNG signature check
  if (head.byteLength < 8) throw new Error('initial fetch too small for PNG signature')
  for (let i = 0; i < 8; i++) {
    if (head[i] !== PNG_SIG[i]) throw new Error('not a PNG (signature mismatch)')
  }

  // Walk PNG chunks until we find tpAK.
  let pos = 8
  let tpakDataAbs = -1
  let tpakDataLen = -1

  while (pos + 8 <= head.byteLength) {
    const length =
      (head[pos] * 0x1000000) + (head[pos + 1] << 16) + (head[pos + 2] << 8) + head[pos + 3]
    const type = String.fromCharCode(head[pos + 4], head[pos + 5], head[pos + 6], head[pos + 7])

    if (type === 'tpAK') {
      tpakDataAbs = pos + 8
      tpakDataLen = length
      break
    }
    if (type === 'IEND') throw new Error('reached IEND without finding tpAK chunk')
    pos += 8 + length + 4 // length + type + data + crc
  }

  if (tpakDataAbs === -1) {
    throw new Error(
      `tpAK chunk not found in initial ${initialBytes}-byte fetch (try a larger initialBytes)`,
    )
  }

  // Read pack-format header from tpAK data.
  if (tpakDataAbs + 9 > head.byteLength) {
    // Initial fetch was too small for the pack-format header; refetch larger.
    return fetchPackManifest(url, tpakDataAbs + 9 + 8192)
  }
  for (let i = 0; i < 4; i++) {
    if (head[tpakDataAbs + i] !== PACK_FORMAT_SIG[i]) {
      throw new Error('tpAK data does not contain a pack-format payload (signature mismatch)')
    }
  }
  if (head[tpakDataAbs + 4] !== FORMAT_PACK_BYTE) {
    throw new Error(
      `tpAK data is not pack-format (got format byte 0x${head[tpakDataAbs + 4].toString(16)}, expected 0x02)`,
    )
  }

  const manifestLen =
    head[tpakDataAbs + 5] |
    (head[tpakDataAbs + 6] << 8) |
    (head[tpakDataAbs + 7] << 16) |
    (head[tpakDataAbs + 8] * 0x1000000)
  const manifestStart = tpakDataAbs + 9
  const manifestEnd = manifestStart + manifestLen
  const regionsAbsOffset = manifestEnd

  if (manifestEnd > head.byteLength) {
    // Manifest spills beyond the initial slice; refetch covering it.
    return fetchPackManifest(url, manifestEnd + 1024)
  }
  // Sanity: tpAK declared length must contain at least the manifest.
  if (tpakDataLen < 9 + manifestLen) {
    throw new Error('tpAK chunk length smaller than declared manifest size')
  }

  const manifestJson = new TextDecoder().decode(head.subarray(manifestStart, manifestEnd))
  const manifest = JSON.parse(manifestJson) as PackManifest

  if (manifest.version !== 1) {
    throw new Error(`unsupported pack manifest version: ${manifest.version}`)
  }

  return { url, manifest, regionsAbsOffset }
}

/**
 * Fetch a single file from a remote pack via HTTP `Range:` request.
 * `decompress` is the same callback shape consumed by `fromBytes` — the node
 * and browser packages both export `decompressRaw` that satisfies it.
 */
export async function fetchPackFile(
  remote: RemotePackHandle,
  path: string,
  decompress: DecompressFn,
): Promise<Uint8Array> {
  const entry = findEntry(remote.manifest.files, path)
  const startAbs = remote.regionsAbsOffset + entry.offset
  const endAbs = startAbs + entry.compressedSize - 1
  const compressed = await fetchRange(remote.url, startAbs, endAbs)

  return decompress(compressed, entry.compressor, {
    level: entry.level,
    uncompressedLength: entry.originalSize,
  })
}

/**
 * Issue an HTTP `Range:` request and return the response body bytes.
 * Validates a 200 (server ignored Range — possibly returned the whole body)
 * or 206 (Partial Content) status; throws otherwise. For 200, the caller
 * gets the full body and is responsible for slicing.
 */
async function fetchRange(url: string, start: number, end: number): Promise<Uint8Array> {
  const r = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } })

  if (r.status !== 206 && r.status !== 200) {
    throw new Error(`range fetch ${start}-${end}: HTTP ${r.status}`)
  }
  const buf = await r.arrayBuffer()
  // Server returned 200 (full body) — slice locally so callers see range bytes.
  if (r.status === 200) {
    const expected = end - start + 1

    if (buf.byteLength === expected) return new Uint8Array(buf)

    return new Uint8Array(buf, start, Math.min(expected, buf.byteLength - start))
  }

  return new Uint8Array(buf)
}

function findEntry(files: readonly PackManifestFile[], path: string): PackManifestFile {
  for (const f of files) if (f.path === path) return f
  throw new Error(`path not found in pack manifest: ${path}`)
}
