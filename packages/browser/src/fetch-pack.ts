// Range-fetch primitives for PixelRange pack tokens.
//
// A range-addressable token must use `pixel-range-none` as the outer image
// container. The PNG `tpAK` ancillary chunk then holds raw pack-format bytes:
// manifest + per-file regions at known absolute byte offsets in the artifact.
// The per-file regions may still be compressed independently (for example
// deflate-9), which keeps bytes small without destroying random access.
//
// This module turns the manifest offsets into HTTP `Range:` requests so a
// consumer can pull one file from a remote pack without downloading the whole
// image or decoding pixels.
//
//   const remote = await fetchPackManifest('/pack.png')
//   const bytes  = await fetchPackFile(remote, 'foo.js', decompressRaw)
//
// Layout the consumer relies on (PixelRangePngNone + encodePack):
//   PNG signature (8 bytes)
//   IHDR chunk (25 bytes total: 4 length + 4 type + 13 data + 4 crc)
//   tpAK chunk (4 length + 4 type + N data + 4 crc)
//     data:
//       4 bytes  TPK1 wrapper signature
//       2 bytes  algorithm id
//       1 byte   outer compression level (= 0 for range-addressable packs)
//       4 bytes  original payload length
//       4 bytes  pack-format signature (0xc0 0xde 0xae 0x54)
//       1 byte   format byte (0x02 = FORMAT_PACK)
//       4 bytes  manifest length (little-endian u32)
//       N bytes  manifest JSON
//       …        per-file compressed regions, contiguous, indexed by manifest
//
// We don't hardcode the tpAK position; we walk PNG chunks from byte 8 until
// we find it. That way any extra ancillary chunks inserted by a pipeline
// (color profile, time, etc.) don't break detection.

import './buffer-polyfill'
import './register'

import type { DecompressFn } from 'tokenpack/pack-format/decompress'
import type { PackManifest, PackManifestFile } from 'tokenpack/pack-format/manifest'

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PACK_FORMAT_SIG = [0xc0, 0xde, 0xae, 0x54]
const FORMAT_PACK_BYTE = 0x02
const TPAK_BODY_MAGIC = [0x54, 0x50, 0x4b, 0x31] // "TPK1"
const TPAK_BODY_HEADER_BYTES = 4 + 2 + 1 + 4

const HEAD_FETCH_DEFAULT_BYTES = 8192

export interface RemotePackHandle {
  url: string
  manifest: PackManifest
  fileByPath: ReadonlyMap<string, PackManifestFile>
  /** Bytes already fetched from the start of the remote PNG while reading the manifest. */
  prefetchedBytes: Uint8Array
  /** Absolute byte offset (within the PNG file) of the pack-format regions block. */
  regionsAbsOffset: number
}

export interface PixelRangePayloadHandle {
  url: string
  /** Bytes already fetched from the start of the remote PNG while reading the tpAK header. */
  prefetchedBytes: Uint8Array
  /** Absolute byte offset (within the PNG file) of the range-addressable payload bytes. */
  payloadAbsOffset: number
  /** Payload bytes available for range access, excluding the TPK1 wrapper header. */
  payloadByteLength: number
}

export interface RemotePackFileRange {
  path: string
  entry: PackManifestFile
  startAbs: number
  endAbs: number
}

export interface RemotePackCompressedFile {
  entry: PackManifestFile
  bytes: Uint8Array
}

export interface RemotePackFileStream {
  entry: PackManifestFile
  stream: ReadableStream<Uint8Array>
}

export interface RemoteRangePackEntry {
  path: string
  size: number
}

export interface FetchPackFilesCompressedOptions {
  /**
   * Coalesce nearby file regions into one HTTP range request when the skipped
   * bytes between them are this small or smaller. `0` still coalesces adjacent
   * pack regions, which is the common "fetch all files" path.
   */
  maxGapBytes?: number
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

export async function fetchPixelRangePayloadHandle(
  url: string,
  initialBytes: number = HEAD_FETCH_DEFAULT_BYTES,
): Promise<PixelRangePayloadHandle> {
  const head = await fetchRange(url, 0, initialBytes - 1)

  return parsePixelRangePayloadHandleFromHead(url, head, initialBytes)
}

export async function fetchPixelRangePayloadBytes(
  handle: PixelRangePayloadHandle,
  offset: number,
  length: number,
): Promise<Uint8Array> {
  const start = handle.payloadAbsOffset + offset
  const end = start + length - 1

  return fetchRangeWithPrefetch(handle, start, end)
}

export async function fetchPixelRangePayloadStream(
  handle: PixelRangePayloadHandle,
  offset: number,
  length: number,
): Promise<ReadableStream<Uint8Array>> {
  const start = handle.payloadAbsOffset + offset
  const end = start + length - 1

  if (end < handle.prefetchedBytes.byteLength) {
    return streamFromBytes(handle.prefetchedBytes.subarray(start, end + 1))
  }

  if (start < handle.prefetchedBytes.byteLength) {
    const response = await fetchRangeResponse(handle.url, handle.prefetchedBytes.byteLength, end)

    if (!response.body) {
      throw new Error(
        `range fetch ${handle.prefetchedBytes.byteLength}-${end}: response has no body`,
      )
    }
    if (response.status === 200) {
      const full = new Uint8Array(await response.arrayBuffer())

      return streamFromBytes(full.subarray(start, end + 1))
    }

    return concatStreams(
      streamFromBytes(handle.prefetchedBytes.subarray(start)),
      response.body as ReadableStream<Uint8Array>,
    )
  }

  const response = await fetchRangeResponse(handle.url, start, end)

  if (!response.body) throw new Error(`range fetch ${start}-${end}: response has no body`)
  if (response.status === 200) {
    const full = new Uint8Array(await response.arrayBuffer())

    return streamFromBytes(full.subarray(start, end + 1))
  }

  return response.body as ReadableStream<Uint8Array>
}

async function parsePixelRangePayloadHandleFromHead(
  url: string,
  head: Uint8Array,
  initialBytes: number,
): Promise<PixelRangePayloadHandle> {
  const { tpakDataAbs, tpakDataLen } = findTpakChunkInHead(head, initialBytes)
  const payloadAbsOffset = packPayloadOffset(head, tpakDataAbs, tpakDataLen)
  const payloadByteLength = tpakDataLen - (payloadAbsOffset - tpakDataAbs)

  return {
    url,
    prefetchedBytes: head,
    payloadAbsOffset,
    payloadByteLength,
  }
}

async function parsePackManifestFromHead(
  url: string,
  head: Uint8Array,
  initialBytes: number,
): Promise<RemotePackHandle> {
  const { tpakDataAbs, tpakDataLen } = findTpakChunkInHead(head, initialBytes)

  const packDataAbs = packPayloadOffset(head, tpakDataAbs, tpakDataLen)

  // Read pack-format header from tpAK payload data.
  if (packDataAbs + 9 > head.byteLength) {
    // Initial fetch was too small for the pack-format header; extend the
    // prefix instead of refetching from byte 0.
    const targetBytes = packDataAbs + 9 + 8192

    return parsePackManifestFromHead(url, await extendHead(url, head, targetBytes), targetBytes)
  }
  for (let i = 0; i < 4; i++) {
    if (head[packDataAbs + i] !== PACK_FORMAT_SIG[i]) {
      throw new Error('tpAK data does not contain a pack-format payload (signature mismatch)')
    }
  }
  if (head[packDataAbs + 4] !== FORMAT_PACK_BYTE) {
    throw new Error(
      `tpAK data is not pack-format (got format byte 0x${head[packDataAbs + 4].toString(16)}, expected 0x02)`,
    )
  }

  const manifestLen =
    head[packDataAbs + 5] |
    (head[packDataAbs + 6] << 8) |
    (head[packDataAbs + 7] << 16) |
    (head[packDataAbs + 8] * 0x1000000)
  const manifestStart = packDataAbs + 9
  const manifestEnd = manifestStart + manifestLen
  const regionsAbsOffset = manifestEnd

  if (manifestEnd > head.byteLength) {
    // Manifest spills beyond the initial slice; extend the prefix instead of
    // refetching the already-read bytes.
    const targetBytes = manifestEnd + 1024

    return parsePackManifestFromHead(url, await extendHead(url, head, targetBytes), targetBytes)
  }
  // Sanity: tpAK declared length must contain at least the manifest.
  if (tpakDataLen < packDataAbs - tpakDataAbs + 9 + manifestLen) {
    throw new Error('tpAK chunk length smaller than declared manifest size')
  }

  const manifestJson = new TextDecoder().decode(head.subarray(manifestStart, manifestEnd))
  const manifest = JSON.parse(manifestJson) as PackManifest

  if (manifest.version !== 1) {
    throw new Error(`unsupported pack manifest version: ${manifest.version}`)
  }

  return {
    url,
    manifest,
    fileByPath: new Map(manifest.files.map(file => [file.path, file])),
    prefetchedBytes: head,
    regionsAbsOffset,
  }
}

function findTpakChunkInHead(
  head: Uint8Array,
  initialBytes: number,
): { tpakDataAbs: number; tpakDataLen: number } {
  // PNG signature check
  if (head.byteLength < 8) throw new Error('initial fetch too small for PNG signature')
  for (let i = 0; i < 8; i++) {
    if (head[i] !== PNG_SIG[i]) throw new Error('not a PNG (signature mismatch)')
  }

  // Walk PNG chunks until we find tpAK.
  let pos = 8

  while (pos + 8 <= head.byteLength) {
    const length =
      head[pos] * 0x1000000 + (head[pos + 1] << 16) + (head[pos + 2] << 8) + head[pos + 3]
    const type = String.fromCharCode(head[pos + 4], head[pos + 5], head[pos + 6], head[pos + 7])

    if (type === 'tpAK') {
      return { tpakDataAbs: pos + 8, tpakDataLen: length }
    }
    if (type === 'IEND') throw new Error('reached IEND without finding tpAK chunk')
    pos += 8 + length + 4 // length + type + data + crc
  }

  throw new Error(
    `tpAK chunk not found in initial ${initialBytes}-byte fetch (try a larger initialBytes)`,
  )
}

function packPayloadOffset(head: Uint8Array, tpakDataAbs: number, tpakDataLen: number): number {
  if (tpakDataAbs + 4 > head.byteLength) return tpakDataAbs

  let hasWrappedBody = true

  for (let i = 0; i < 4; i++) {
    if (head[tpakDataAbs + i] !== TPAK_BODY_MAGIC[i]) hasWrappedBody = false
  }

  if (!hasWrappedBody) return tpakDataAbs
  if (tpakDataLen < TPAK_BODY_HEADER_BYTES) {
    throw new Error('tpAK body is too small for TPK1 wrapper')
  }
  if (tpakDataAbs + TPAK_BODY_HEADER_BYTES > head.byteLength) {
    return tpakDataAbs + TPAK_BODY_HEADER_BYTES
  }

  const compressionLevel = head[tpakDataAbs + 6]

  if (compressionLevel !== 0) {
    throw new Error(
      'tpAK body is outer-compressed; range pack access requires pixel-range-none fixtures',
    )
  }

  return tpakDataAbs + TPAK_BODY_HEADER_BYTES
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
  const { entry, bytes: compressed } = await fetchPackFileCompressed(remote, path)

  return decompress(compressed, entry.compressor, {
    level: entry.level,
    uncompressedLength: entry.originalSize,
  })
}

export function getPackFileRange(remote: RemotePackHandle, path: string): RemotePackFileRange {
  const entry = remote.fileByPath.get(path)

  if (!entry) throw new Error(`path not found in pack manifest: ${path}`)
  const startAbs = remote.regionsAbsOffset + entry.offset

  return {
    path,
    entry,
    startAbs,
    endAbs: startAbs + entry.compressedSize - 1,
  }
}

export async function fetchPackFileCompressed(
  remote: RemotePackHandle,
  path: string,
): Promise<RemotePackCompressedFile> {
  const range = getPackFileRange(remote, path)
  const bytes = await fetchRangeWithPrefetch(remote, range.startAbs, range.endAbs)

  return { entry: range.entry, bytes }
}

/**
 * Fetch several files using the smallest containing HTTP range and slice the
 * compressed regions locally. Pack regions are contiguous, so "fetch all files"
 * should cost one range request after the manifest, not N range requests.
 */
export async function fetchPackFilesCompressed(
  remote: RemotePackHandle,
  paths: readonly string[],
  options: FetchPackFilesCompressedOptions = {},
): Promise<RemotePackCompressedFile[]> {
  if (paths.length === 0) return []
  if (paths.length === 1) return [await fetchPackFileCompressed(remote, paths[0])]

  const { groups, rangesByPath } = groupRequestedRanges(remote, paths, options)
  const bytesByPath = new Map<string, Uint8Array>()

  await Promise.all(
    groups.map(async group => {
      const startAbs = group[0].startAbs
      const endAbs = group.reduce((end, range) => Math.max(end, range.endAbs), group[0].endAbs)
      const bytes = await fetchRangeWithPrefetch(remote, startAbs, endAbs)

      for (const range of group) {
        const start = range.startAbs - startAbs
        const end = range.endAbs - startAbs + 1

        bytesByPath.set(range.path, bytes.subarray(start, end))
      }
    }),
  )

  return paths.map(path => {
    const range = rangesByPath.get(path)

    if (!range) throw new Error(`path not found in pack manifest: ${path}`)
    const bytes = bytesByPath.get(path)

    if (!bytes) throw new Error(`range bytes missing for path: ${path}`)

    return { entry: range.entry, bytes }
  })
}

export async function fetchPackFilesStream(
  remote: RemotePackHandle,
  paths: readonly string[],
  options: FetchPackFilesCompressedOptions = {},
): Promise<RemotePackFileStream[]> {
  if (paths.length === 0) return []
  if (paths.length === 1) return [await fetchPackFileStream(remote, paths[0])]

  const { groups, rangesByPath } = groupRequestedRanges(remote, paths, options)
  const streamsByPath = new Map<string, RemotePackFileStream>()

  await Promise.all(
    groups.map(async group => {
      const startAbs = group[0].startAbs
      const endAbs = group.reduce((end, range) => Math.max(end, range.endAbs), group[0].endAbs)
      const streams = await streamRangeWithPrefetch(remote, group, startAbs, endAbs)

      for (const file of streams) streamsByPath.set(file.path, file)
    }),
  )

  return paths.map(path => {
    const range = rangesByPath.get(path)
    const file = streamsByPath.get(path)

    if (!range) throw new Error(`path not found in pack manifest: ${path}`)
    if (!file) throw new Error(`range stream missing for path: ${path}`)

    return { entry: range.entry, stream: file.stream }
  })
}

export async function fetchPackFileStream(
  remote: RemotePackHandle,
  path: string,
): Promise<RemotePackFileStream> {
  const range = getPackFileRange(remote, path)
  const [file] = await streamRangeWithPrefetch(remote, [range], range.startAbs, range.endAbs)

  return {
    entry: range.entry,
    stream: file.stream,
  }
}

export function estimatePackRangeWireBytes(
  remote: RemotePackHandle,
  paths: readonly string[],
  options: FetchPackFilesCompressedOptions = {},
): number {
  const { groups } = groupRequestedRanges(remote, paths, options)
  let total = remote.prefetchedBytes.byteLength

  for (const group of groups) {
    const startAbs = group[0].startAbs
    const endAbs = group.reduce((end, range) => Math.max(end, range.endAbs), group[0].endAbs)

    if (endAbs < remote.prefetchedBytes.byteLength) continue
    total += endAbs - Math.max(startAbs, remote.prefetchedBytes.byteLength) + 1
  }

  return total
}

export async function openRangePack(url: string): Promise<RemoteRangePack> {
  return new RemoteRangePack(await fetchPackManifest(url))
}

export class RemoteRangePack {
  readonly list: string[] & (() => Promise<RemoteRangePackEntry[]>)
  readonly entries: RemoteRangePackEntry[]
  readonly stream: RemoteRangePackStreamApi

  constructor(readonly remote: RemotePackHandle) {
    this.entries = remote.manifest.files.map(file => ({
      path: file.path,
      size: file.originalSize,
    }))
    this.list = Object.assign(
      async () => this.entries,
      this.entries.map(entry => entry.path),
    )
    this.stream = new RemoteRangePackStreamApi(this)
  }

  async text(): Promise<string>
  async text(path: string): Promise<string>
  async text(paths: string[]): Promise<Map<string, string>>
  async text(pathOrPaths?: string | string[]): Promise<string | Map<string, string>> {
    return this.stream.text(pathOrPaths as never)
  }

  async blob(): Promise<Blob>
  async blob(path: string): Promise<Blob>
  async blob(paths: string[]): Promise<Map<string, Blob>>
  async blob(pathOrPaths?: string | string[]): Promise<Blob | Map<string, Blob>> {
    return this.stream.blob(pathOrPaths as never)
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    const files = await fetchPackFilesStream(
      this.remote,
      this.remote.manifest.files.map(file => file.path),
    )
    const bytes = await Promise.all(files.map(file => readStreamBytes(file.stream)))

    return files.map((file, index) => ({ path: file.entry.path, bytes: bytes[index]! }))
  }
}

export class RemoteRangePackStreamApi {
  constructor(private readonly pack: RemoteRangePack) {}

  async text(): Promise<string>
  async text(path: string): Promise<string>
  async text(paths: string[]): Promise<Map<string, string>>
  async text(pathOrPaths?: string | string[]): Promise<string | Map<string, string>> {
    const result = await this.load(pathOrPaths)

    if (result instanceof Map) {
      const out = new Map<string, string>()

      for (const [path, bytes] of result) out.set(path, new TextDecoder().decode(bytes))

      return out
    }

    return new TextDecoder().decode(result)
  }

  async blob(): Promise<Blob>
  async blob(path: string): Promise<Blob>
  async blob(paths: string[]): Promise<Map<string, Blob>>
  async blob(pathOrPaths?: string | string[]): Promise<Blob | Map<string, Blob>> {
    const result = await this.load(pathOrPaths)

    if (result instanceof Map) {
      const out = new Map<string, Blob>()

      for (const [path, bytes] of result) out.set(path, new Blob([bytes as unknown as ArrayBuffer]))

      return out
    }

    return new Blob([result as unknown as ArrayBuffer])
  }

  private async load(
    pathOrPaths?: string | string[],
  ): Promise<Uint8Array | Map<string, Uint8Array>> {
    if (typeof pathOrPaths === 'string') {
      const file = await fetchPackFileStream(this.pack.remote, pathOrPaths)

      return readStreamBytes(file.stream)
    }

    if (Array.isArray(pathOrPaths)) {
      const files = await Promise.all(
        pathOrPaths.map(async path => {
          const file = await fetchPackFileStream(this.pack.remote, path)

          return [path, await readStreamBytes(file.stream)] as const
        }),
      )

      return new Map(files)
    }

    const files = await fetchPackFilesStream(
      this.pack.remote,
      this.pack.remote.manifest.files.map(file => file.path),
    )
    const bytes = await Promise.all(files.map(file => readStreamBytes(file.stream)))

    return concatBytes(bytes)
  }
}

function groupRequestedRanges(
  remote: RemotePackHandle,
  paths: readonly string[],
  options: FetchPackFilesCompressedOptions,
): { groups: RemotePackFileRange[][]; rangesByPath: Map<string, RemotePackFileRange> } {
  const maxGapBytes = options.maxGapBytes ?? 16 * 1024
  const rangesByPath = new Map<string, RemotePackFileRange>()

  for (const path of paths) rangesByPath.set(path, getPackFileRange(remote, path))

  const ranges = [...rangesByPath.values()].sort((a, b) => a.startAbs - b.startAbs)
  const groups: RemotePackFileRange[][] = []

  for (const range of ranges) {
    const current = groups[groups.length - 1]

    if (!current) {
      groups.push([range])
      continue
    }

    const previousEnd = current[current.length - 1].endAbs
    const gap = range.startAbs - previousEnd - 1

    if (gap <= maxGapBytes) current.push(range)
    else groups.push([range])
  }

  return { groups, rangesByPath }
}

async function fetchRangeWithPrefetch(
  remote: { url: string; prefetchedBytes: Uint8Array },
  start: number,
  end: number,
): Promise<Uint8Array> {
  if (end < remote.prefetchedBytes.byteLength) {
    return remote.prefetchedBytes.subarray(start, end + 1)
  }
  if (start < remote.prefetchedBytes.byteLength) {
    return concatBytes([
      remote.prefetchedBytes.subarray(start),
      await fetchRange(remote.url, remote.prefetchedBytes.byteLength, end),
    ])
  }

  return fetchRange(remote.url, start, end)
}

async function streamRangeWithPrefetch(
  remote: RemotePackHandle,
  group: readonly RemotePackFileRange[],
  startAbs: number,
  endAbs: number,
): Promise<StreamWithPath[]> {
  if (endAbs < remote.prefetchedBytes.byteLength) {
    return streamsFromRangeBody(
      streamFromBytes(remote.prefetchedBytes.subarray(startAbs, endAbs + 1)),
      group,
      startAbs,
    )
  }

  if (startAbs < remote.prefetchedBytes.byteLength) {
    const response = await fetchRangeResponse(remote.url, remote.prefetchedBytes.byteLength, endAbs)

    if (!response.body) {
      throw new Error(
        `range fetch ${remote.prefetchedBytes.byteLength}-${endAbs}: response has no body`,
      )
    }
    if (response.status === 200) return streamsFromFullBody(response, group)

    return streamsFromRangeBody(
      concatStreams(
        streamFromBytes(remote.prefetchedBytes.subarray(startAbs)),
        response.body as ReadableStream<Uint8Array>,
      ),
      group,
      startAbs,
    )
  }

  const response = await fetchRangeResponse(remote.url, startAbs, endAbs)

  if (!response.body) {
    throw new Error(`range fetch ${startAbs}-${endAbs}: response has no body`)
  }

  return response.status === 200
    ? streamsFromFullBody(response, group)
    : streamsFromRangeBody(response.body, group, startAbs)
}

interface StreamWithPath extends RemotePackFileStream {
  path: string
}

async function streamsFromFullBody(
  response: Response,
  group: readonly RemotePackFileRange[],
): Promise<StreamWithPath[]> {
  const buf = new Uint8Array(await response.arrayBuffer())

  return group.map(range => {
    const expected = range.endAbs - range.startAbs + 1
    const bytes = new Uint8Array(buf.buffer, buf.byteOffset + range.startAbs, expected)

    return {
      path: range.path,
      entry: range.entry,
      stream: decompressRangeStream(streamFromBytes(bytes), range.entry.compressor),
    }
  })
}

function streamsFromRangeBody(
  body: ReadableStream<Uint8Array>,
  group: readonly RemotePackFileRange[],
  startAbs: number,
): StreamWithPath[] {
  const ordered = [...group].sort((a, b) => a.startAbs - b.startAbs)
  const controllers = new Map<string, ReadableStreamDefaultController<Uint8Array>>()
  const streams = ordered.map(range => {
    const compressed = new ReadableStream<Uint8Array>({
      start(controller) {
        controllers.set(range.path, controller)
      },
    })

    return {
      path: range.path,
      entry: range.entry,
      stream: decompressRangeStream(compressed, range.entry.compressor),
    }
  })

  queueMicrotask(() => {
    pumpRangeBody(body, ordered, startAbs, controllers).catch(error => {
      for (const controller of controllers.values()) controller.error(error)
    })
  })

  return streams
}

async function pumpRangeBody(
  body: ReadableStream<Uint8Array>,
  group: readonly RemotePackFileRange[],
  startAbs: number,
  controllers: Map<string, ReadableStreamDefaultController<Uint8Array>>,
): Promise<void> {
  const reader = body.getReader()
  let absoluteOffset = startAbs
  let rangeIndex = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break
      if (!value) continue

      let chunkOffset = 0

      while (chunkOffset < value.byteLength && rangeIndex < group.length) {
        const range = group[rangeIndex]

        if (absoluteOffset + chunkOffset < range.startAbs) {
          const skip = Math.min(
            value.byteLength - chunkOffset,
            range.startAbs - (absoluteOffset + chunkOffset),
          )

          chunkOffset += skip
          continue
        }

        const take = Math.min(
          value.byteLength - chunkOffset,
          range.endAbs - (absoluteOffset + chunkOffset) + 1,
        )

        if (take > 0) {
          const controller = controllers.get(range.path)

          if (!controller) throw new Error(`range stream controller missing for ${range.path}`)
          controller.enqueue(value.subarray(chunkOffset, chunkOffset + take))
          chunkOffset += take
        }

        if (absoluteOffset + chunkOffset > range.endAbs) {
          controllers.get(range.path)?.close()
          rangeIndex += 1
        }
      }

      absoluteOffset += value.byteLength
    }

    while (rangeIndex < group.length) {
      controllers.get(group[rangeIndex].path)?.close()
      rangeIndex += 1
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Issue an HTTP `Range:` request and return the response body bytes.
 * Validates a 200 (server ignored Range — possibly returned the whole body)
 * or 206 (Partial Content) status; throws otherwise. For 200, the caller
 * gets the full body and is responsible for slicing.
 */
async function fetchRange(url: string, start: number, end: number): Promise<Uint8Array> {
  const r = await fetchRangeResponse(url, start, end)

  const buf = await r.arrayBuffer()

  // Server returned 200 (full body) — slice locally so callers see range bytes.
  if (r.status === 200) {
    const expected = end - start + 1

    if (buf.byteLength === expected) return new Uint8Array(buf)

    return new Uint8Array(buf, start, Math.min(expected, buf.byteLength - start))
  }

  return new Uint8Array(buf)
}

async function extendHead(url: string, head: Uint8Array, targetBytes: number): Promise<Uint8Array> {
  if (targetBytes <= head.byteLength) return head

  return concatBytes([head, await fetchRange(url, head.byteLength, targetBytes - 1)])
}

async function fetchRangeResponse(url: string, start: number, end: number): Promise<Response> {
  const r = await fetch(url, {
    cache: 'no-store',
    credentials: 'omit',
    headers: { Range: `bytes=${start}-${end}` },
    mode: 'cors',
  })

  if (r.status !== 206 && r.status !== 200) {
    throw new Error(`range fetch ${start}-${end}: HTTP ${r.status}`)
  }

  return r
}

function decompressRangeStream(
  stream: ReadableStream<Uint8Array>,
  compressor: string,
): ReadableStream<Uint8Array> {
  if (compressor === 'none') return stream

  const family = compressor.split('-')[0]

  if (family === 'deflate' || family === 'brotli') {
    const format = family === 'brotli' ? 'br' : 'deflate'

    if (typeof DecompressionStream !== 'function') {
      throw new Error(`DecompressionStream is not available for ${compressor}`)
    }

    return stream.pipeThrough(
      new DecompressionStream(format as CompressionFormat) as TransformStream<Uint8Array>,
    )
  }

  throw new Error(`streaming range decompression is not implemented for ${compressor}`)
}

function streamFromBytes(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

function concatStreams(
  first: ReadableStream<Uint8Array>,
  second: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await pumpStream(first, controller)
        await pumpStream(second, controller)
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

async function pumpStream(
  stream: ReadableStream<Uint8Array>,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> {
  const reader = stream.getReader()

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break
      if (value) controller.enqueue(value)
    }
  } finally {
    reader.releaseLock()
  }
}

function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}

async function readStreamBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break
      if (value) chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return concatBytes(chunks)
}
