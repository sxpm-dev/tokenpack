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
export {
  encode,
  type EncodedTokenArtifact,
  type EncodeInput,
  type EncodeNodeOptions,
  type EncodeResult,
} from './encode'
export {
  decodeRouter,
  type DecodeRouterOptions,
  type RouterFileEntry,
  RouterToken,
} from './router-token'
export { applyDiff, Token } from './token'

// ── Builder ───────────────────────────────────────────────────────────────
export {
  PackBuilder,
  ROUTER_MANIFEST_PATH,
  ROUTER_TOKEN_FILE,
  ROUTER_TOKEN_ID,
  type RouterBuildOptions,
  type RouterChunkPlan,
  type RouterSourceFile,
  type RouterTokenManifest,
  type RouterTokenPack,
  TokenPack,
} from 'tokenpack'

// ── Pack types ────────────────────────────────────────────────────────────
export type {
  DiffEntry,
  DiffOpKind,
  DiffPack,
  DirPack,
  FilePack,
  Pack,
  PackEntryInfo,
  RouterPack,
} from 'tokenpack/pack/types'
