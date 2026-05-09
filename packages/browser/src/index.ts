// @tokenpack/browser — public API.
//
// Top-level functions + types only. React components and hooks are accessible
// via `@tokenpack/browser/components` and `@tokenpack/browser/hooks`.
// Surface/compressor/algorithm classes are internal — import from
// `tokenpack/<subpath>` if you need them.

import './buffer-polyfill'
import './register'

// ── Public functions ──────────────────────────────────────────────────────
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { decodeStream, type DecodeStreamSource } from './decode-stream'
export { encode, type EncodeBrowserOptions, type EncodeResult } from './encode'
export {
  inspect,
  type InspectAlgorithm,
  type InspectHeader,
  type InspectInfo,
} from './inspect'

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
