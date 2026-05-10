// @tokenpack/browser — public API.

import './buffer-polyfill'
import './register'

// ── Public functions ──────────────────────────────────────────────────────
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { decodeStream, type DecodeStreamSource } from './decode-stream'
export { diff, type FileDiff, type Hunk } from './diff'
export { encode, type EncodeBrowserOptions, type EncodeResult } from './encode'
export { applyDiff, Token, TokenStream } from './token'

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
