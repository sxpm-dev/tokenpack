// Browser-safe public API. Node-only helpers (file I/O, sharp surfaces,
// Node-stream decoders) are accessible via subpaths and via `@tokenpack/node`.

export { AlgorithmCatalog, algorithmCatalog } from './algorithms/catalog'
export { getAlgorithmById, getAlgorithmByName, listAlgorithms } from './algorithms/registry'
// Buffer-pure CART primitives — no fs imports here, safe for browser bundles.
export {
  isCartArchive,
  listArchive,
  packBuffers,
  type PackEntry,
  unpackBuffers,
} from './archive-buffers'
export { CRYPTO_OVERHEAD, decryptData, encryptData } from './crypto'
// Pack types + builder (new unified Pack API)
export { applyDiff, type DiffMeta, diffPack, type DiffPackResult, readDiffMeta } from './diff-pack'
export { finalizeChunks } from './finalize-chunks'
export type {
  DiffEntry,
  DiffOpKind,
  DiffPack,
  DirPack,
  FilePack,
  Pack,
  PackBase,
  PackEntryInfo,
} from './pack/types'
export { type BuilderIntent, PackBuilder } from './pack-builder'
export type { DecodeOptions, HeaderData, ImageFormat } from './types'
