// tokenpack core root: shared public types + env-neutral PackBuilder only.
// Runtime APIs live in @tokenpack/node and @tokenpack/browser.

export type {
  DiffEntry,
  DiffOpKind,
  DiffPack,
  DirPack,
  FilePack,
  Pack,
  PackBase,
  PackEntryInfo,
  RouterPack,
} from './pack/types'
export { type BuilderIntent, PackBuilder } from './pack-builder'
export {
  DEFAULT_ROUTER_MAX_SEGMENTS_PER_FILE,
  DEFAULT_ROUTER_TARGET_CHUNK_BYTES,
  planRouterBundle,
} from './router/plan'
export {
  type PlannedRouterBundle,
  type PlannedRouterChunk,
  ROUTER_MANIFEST_PATH,
  ROUTER_TOKEN_FILE,
  ROUTER_TOKEN_ID,
  type RouterBuildOptions,
  type RouterChunkManifestEntry,
  type RouterChunkPlan,
  type RouterFileManifestEntry,
  type RouterFileSegment,
  type RouterSourceFile,
  type RouterTokenManifest,
  type RouterTokenPack,
} from './router/types'
export { isRouterTokenPack, TokenPack } from './token-pack'
export type { DecodeOptions, HeaderData, ImageFormat } from './types'
