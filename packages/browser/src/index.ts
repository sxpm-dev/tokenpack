// @tokenpack/browser — public API.

import './buffer-polyfill'
import './register'

// ── Public functions ──────────────────────────────────────────────────────
export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { decodeStream, type DecodeStreamSource } from './decode-stream'
export { diff, type FileDiff, type Hunk } from './diff'
export { encode, type EncodeBrowserOptions, type EncodeResult } from './encode'
export {
  openRangePack,
  RemoteRangePack,
  type RemoteRangePackEntry,
  RemoteRangePackStreamApi,
} from './fetch-pack'
export {
  decodeRouter,
  type DecodeRouterOptions,
  type MaterializedFile,
  type MaterializeOptions,
  pack,
  type RouterFileEntry,
  type RouterLoadStrategy,
  RouterToken,
  type RouterTokenManifest,
} from './router-token'
export { applyDiff, Token, TokenStream } from './token'

// ── Builder ───────────────────────────────────────────────────────────────
export {
  PackBuilder,
  ROUTER_MANIFEST_PATH,
  ROUTER_TOKEN_FILE,
  ROUTER_TOKEN_ID,
  type RouterBuildOptions,
  type RouterChunkPlan,
  type RouterSourceFile,
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
