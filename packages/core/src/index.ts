// Browser-safe public API. Node-only helpers (file I/O, sharp surfaces,
// Node-stream decoders) are accessible via subpaths and via `@tokenpack/node`.

import './algorithms/register-all'

export { AlgorithmCatalog, algorithmCatalog } from './algorithms/catalog'
export {
  getAlgorithmById,
  getAlgorithmByName,
  listAlgorithmCatalog,
  listAlgorithms,
} from './algorithms/registry'
// Buffer-pure CART primitives — no fs imports here, safe for browser bundles.
export {
  isCartArchive,
  listArchive,
  packBuffers,
  unpackBuffers,
  type PackEntry,
} from './archive-buffers'
export { CRYPTO_OVERHEAD, decryptData, encryptData } from './crypto'
export {
  type DecodeDirEntry,
  type DecodeResult,
  toDecodeResult,
} from './decode-result'
export { applyDiff, diffPack, readDiffMeta, type DiffMeta, type DiffPackResult } from './diff-pack'
export { finalizeChunks } from './finalize-chunks'
export type { DecodeOptions, EncodeOptions, HeaderData, ImageFormat, Style } from './types'
