// Buffer-pure CART archive primitives. No fs deps — safe for browser bundles.
//
// fs-using helpers (`packDirs`, `packDir`, `unpackDir`) live in `./archive.ts`
// alongside these but those re-export with the file-system additions on top.

const MAGIC = 'CART'
const MAGIC_BYTES = new TextEncoder().encode(MAGIC)

const HEADER_LEN = 8
const PATH_LEN_FIELD = 2
const CONTENT_LEN_FIELD = 4

export interface PackEntry {
  /** Path relative to the archive root (forward slashes). */
  path: string
  /** Raw file bytes. */
  bytes: Uint8Array
}

/** Pack a list of {path, bytes} entries into a CART-format Uint8Array. */
export function packBuffers(entries: readonly PackEntry[]): Uint8Array {
  const encoder = new TextEncoder()
  const encoded = entries.map(e => ({ pathBytes: encoder.encode(e.path), bytes: e.bytes }))

  let totalLen = HEADER_LEN
  for (const { pathBytes, bytes } of encoded) {
    totalLen += PATH_LEN_FIELD + pathBytes.length + CONTENT_LEN_FIELD + bytes.length
  }

  const out = new Uint8Array(totalLen)
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength)

  out.set(MAGIC_BYTES, 0)
  view.setUint32(4, entries.length, false)

  let offset = HEADER_LEN
  for (const { pathBytes, bytes } of encoded) {
    view.setUint16(offset, pathBytes.length, false)
    offset += PATH_LEN_FIELD
    out.set(pathBytes, offset)
    offset += pathBytes.length
    view.setUint32(offset, bytes.length, false)
    offset += CONTENT_LEN_FIELD
    out.set(bytes, offset)
    offset += bytes.length
  }

  return out
}

/** Parse a CART archive into in-memory {path, bytes} entries. */
export function unpackBuffers(data: Uint8Array): PackEntry[] {
  assertCartMagic(data)
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const count = view.getUint32(4, false)
  const entries: PackEntry[] = new Array(count)
  let offset = HEADER_LEN
  const decoder = new TextDecoder('utf-8')

  for (let i = 0; i < count; i++) {
    const pathLen = view.getUint16(offset, false)

    offset += PATH_LEN_FIELD
    const filePath = decoder.decode(data.subarray(offset, offset + pathLen))

    offset += pathLen
    const contentLen = view.getUint32(offset, false)

    offset += CONTENT_LEN_FIELD
    const bytes = data.subarray(offset, offset + contentLen)

    offset += contentLen
    entries[i] = { path: filePath, bytes }
  }

  return entries
}

/** Read the manifest (path + size) without copying file bytes. */
export function listArchive(data: Uint8Array): { filePath: string; size: number }[] {
  assertCartMagic(data)
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const count = view.getUint32(4, false)
  const entries: { filePath: string; size: number }[] = new Array(count)
  let offset = HEADER_LEN
  const decoder = new TextDecoder('utf-8')

  for (let i = 0; i < count; i++) {
    const pathLen = view.getUint16(offset, false)

    offset += PATH_LEN_FIELD
    const filePath = decoder.decode(data.subarray(offset, offset + pathLen))

    offset += pathLen
    const contentLen = view.getUint32(offset, false)

    offset += CONTENT_LEN_FIELD
    offset += contentLen
    entries[i] = { filePath, size: contentLen }
  }

  return entries
}

/** Detect whether a buffer is a CART archive (cheap magic-byte check). */
export function isCartArchive(data: Uint8Array): boolean {
  if (data.length < 4) return false
  return (
    data[0] === MAGIC_BYTES[0]
    && data[1] === MAGIC_BYTES[1]
    && data[2] === MAGIC_BYTES[2]
    && data[3] === MAGIC_BYTES[3]
  )
}

function assertCartMagic(data: Uint8Array): void {
  if (!isCartArchive(data)) {
    throw new Error('Not a CART archive — wrong magic bytes')
  }
}
