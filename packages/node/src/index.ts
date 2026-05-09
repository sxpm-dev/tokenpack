// @tokenpack/node — public API.
//
// Five top-level functions + types. Anything else (codec/surface/compressor
// classes, low-level encoder/decoder helpers) is internal — import from
// `tokenpack/<subpath>` if you need it.

import { webcrypto } from 'node:crypto'

if (!(globalThis as { crypto?: unknown }).crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}

// Side-effect: registers Node-only compressors, surfaces, and concrete
// algorithm classes with core's append-only registries.
import './register'

// ── Public functions ──────────────────────────────────────────────────────
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { createTokenDecodeStream as decodeStream } from 'tokenpack/stream-decoder'
export { diff, type DiffResult, type DiffStats, type FileDiff, type Hunk } from './diff'
export { encode, type EncodeInput, type EncodeNodeOptions, type EncodeResult } from './encode'

// ── Builder ───────────────────────────────────────────────────────────────
export { type FsOptions, type GlobOptions, NodePackBuilder } from './node-pack-builder'
export { PackBuilder } from 'tokenpack'

// ── Pack types ────────────────────────────────────────────────────────────
export type {
  DiffEntry,
  DiffOpKind,
  DiffPack,
  DirPack,
  FilePack,
  Pack,
  PackEntryInfo,
} from 'tokenpack/pack/types'

// ── Convenience ───────────────────────────────────────────────────────────
// `extract` writes a Pack's contents to a directory. Kept top-level since
// it's used by the CLI and other consumers.
export { extract } from './extract'
