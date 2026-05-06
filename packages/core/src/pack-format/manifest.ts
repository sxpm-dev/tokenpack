// Pack-format and diff-format manifests.
//
// Both are JSON for v1 — easy to debug, cheap to parse for typical pack sizes.
// Field naming aligns with how the existing compressor returns metadata
// (`level`, `uncompressedLength`) so per-region decompress can be called
// without extra plumbing.

export interface PackManifestFile {
  path: string
  /** Compressor mode used for this region (e.g. 'brotli-11', 'none'). */
  compressor: string
  /** Compression level returned by `compress()` — passed back to `decompress()` meta. */
  level: number
  /** Region byte length inside the regions block. */
  compressedSize: number
  /** Original (uncompressed) byte length — needed by some compressors' decompress meta. */
  originalSize: number
  /** Byte offset from the start of the regions block. */
  offset: number
}

export interface PackManifest {
  version: 1
  files: PackManifestFile[]
}

export type DiffOp = 'add' | 'modify' | 'delete' | 'rename'

export interface DiffManifestEntry {
  op: DiffOp
  path: string
  /** present for add | modify */
  compressor?: string
  level?: number
  compressedSize?: number
  originalSize?: number
  offset?: number
  /** present for rename */
  fromPath?: string
}

export interface DiffManifest {
  version: 1
  ops: DiffManifestEntry[]
}

const SUPPORTED_VERSION = 1
const enc = new TextEncoder()
const dec = new TextDecoder('utf-8')

export function writePackManifest(m: PackManifest): Uint8Array {
  return enc.encode(JSON.stringify(m))
}

export function readPackManifest(bytes: Uint8Array): PackManifest {
  const parsed = JSON.parse(dec.decode(bytes)) as PackManifest

  if (parsed.version !== SUPPORTED_VERSION) {
    throw new Error(`unsupported manifest version: ${parsed.version}`)
  }

  return parsed
}

export function writeDiffManifest(m: DiffManifest): Uint8Array {
  return enc.encode(JSON.stringify(m))
}

export function readDiffManifest(bytes: Uint8Array): DiffManifest {
  const parsed = JSON.parse(dec.decode(bytes)) as DiffManifest

  if (parsed.version !== SUPPORTED_VERSION) {
    throw new Error(`unsupported diff manifest version: ${parsed.version}`)
  }

  return parsed
}
