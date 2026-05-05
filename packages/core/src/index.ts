export { AlgorithmCatalog, algorithmCatalog } from './algorithms/catalog'
export {
  getAlgorithmById,
  getAlgorithmByName,
  listAlgorithmCatalog,
  listAlgorithms,
} from './algorithms/registry'
export { decode, decodeFile, decodeFromBuffer, decodeToBuffer } from './decoder'
export { encode, encodeFile, encodeToBuffer } from './encoder'
export { createTokenDecodeStream } from './stream-decoder'
export type { DecodeOptions, EncodeOptions, HeaderData, ImageFormat, Style } from './types'
import './algorithms/register-all'
