// @tokenpack/node — public API.

import { webcrypto } from 'node:crypto'

if (!(globalThis as { crypto?: unknown }).crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}

// Side-effect: keeps legacy compressor/surface helpers available for pack
// region compression. The algorithm catalog is env-owned in ./algorithms/catalog.
import './register'

// ── Public functions ──────────────────────────────────────────────────────
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { decodeStream, type DecodeStreamSource } from './decode-stream'
export { diff, type FileDiff, type Hunk } from './diff'
export { encode, type EncodeInput, type EncodeNodeOptions, type EncodeResult } from './encode'
export { applyDiff, Token } from './token'

// ── Builder ───────────────────────────────────────────────────────────────
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
