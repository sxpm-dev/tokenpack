// CART archive format — pack/unpack a list of files into a single binary blob.
//
// Phase 1 split:
//   - packBuffers / unpackBuffers / listArchive       → buffer-pure, Uint8Array-based, browser-safe.
//   - packDirs / packDir / unpackDir                  → fs-using wrappers around the buffer-pure API.
//
// The fs-using exports remain here for now to avoid breaking existing consumers
// (`packages/core/src/cli.ts`, `packages/app/src/app/api/pack/route.ts`,
// `benchmark/generate.ts`). They relocate to `@tokenpack/node` in Phase 2.

import fs from 'fs'
import path from 'path'

const MAGIC = 'CART'
const MAGIC_BYTES = new TextEncoder().encode(MAGIC)

const HEADER_LEN = 8                    // magic(4) + count(4)
const PATH_LEN_FIELD = 2                // UInt16BE
const CONTENT_LEN_FIELD = 4             // UInt32BE

export interface PackEntry {
  /** Path relative to the archive root (forward slashes) */
  path: string
  /** Raw file bytes */
  bytes: Uint8Array
}

// ─── Buffer-pure primitives ────────────────────────────────────────────────────

/** Pack a list of {path, bytes} entries into a CART-format Uint8Array. */
export function packBuffers(entries: readonly PackEntry[]): Uint8Array {
  const encoder = new TextEncoder()

  // Encode paths once and compute total size up front to allocate a single buffer.
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

/** Parse a CART archive into in-memory {path, bytes} entries. No I/O. */
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
    // subarray gives a zero-copy view over the original buffer
    const bytes = data.subarray(offset, offset + contentLen)
    offset += contentLen
    entries[i] = { path: filePath, bytes }
  }

  return entries
}

/** Read just the manifest (path + size) without copying file bytes. */
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
  return data[0] === MAGIC_BYTES[0]
    && data[1] === MAGIC_BYTES[1]
    && data[2] === MAGIC_BYTES[2]
    && data[3] === MAGIC_BYTES[3]
}

function assertCartMagic(data: Uint8Array): void {
  if (!isCartArchive(data)) {
    throw new Error('Not a CART archive — wrong magic bytes')
  }
}

// ─── fs-using wrappers (Node-only; relocate to @tokenpack/node in Phase 2) ─────

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
])

function walkDir(root: string, dir: string, ignore: Set<string>, out: PackEntry[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue
    const abs = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walkDir(root, abs, ignore, out)
    } else if (entry.isFile()) {
      // Forward-slash-normalize for portability across platforms.
      const rel = path.relative(root, abs).split(path.sep).join('/')
      out.push({ path: rel, bytes: fs.readFileSync(abs) })
    }
  }
}

export function packDirs(dirPaths: string[], extraIgnore: string[] = [], root?: string): Buffer {
  const ignore = new Set([...DEFAULT_IGNORE, ...extraIgnore])
  const resolvedRoot = root ?? process.cwd()
  const entries: PackEntry[] = []

  for (const dir of dirPaths) {
    walkDir(resolvedRoot, path.resolve(dir), ignore, entries)
  }

  // Buffer is a Uint8Array subclass — return as Buffer for Node-callsite ergonomics.
  return Buffer.from(packBuffers(entries))
}

export function packDir(dirPath: string, extraIgnore: string[] = []): Buffer {
  return packDirs([dirPath], extraIgnore)
}

export function unpackDir(data: Buffer | Uint8Array, outDir: string): string[] {
  const entries = unpackBuffers(data)
  const written: string[] = []
  const resolvedOut = path.resolve(outDir)

  for (const { path: filePath, bytes } of entries) {
    const fullPath = path.resolve(outDir, filePath)
    if (!fullPath.startsWith(resolvedOut)) {
      throw new Error(`Unsafe path in archive: ${filePath}`)
    }
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, bytes)
    written.push(filePath)
  }

  return written
}
