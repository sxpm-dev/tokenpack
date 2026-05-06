import { bitplaneCodec } from './bitplane'
import { bitshuffleCodec } from './bitshuffle'
import { deltaCodec } from './delta'
import { deltaChainCodec } from './delta-chain'
import { interleavedCodec } from './interleaved'
import { linearCodec } from './linear'
import { predictCodec } from './predict'
import { rleCodec } from './rle'
import type { AbstractCodec } from './types'
import { xorCodec } from './xor'

export { BitplaneCodec, bitplaneCodec } from './bitplane'
export { BitshuffleCodec, bitshuffleCodec } from './bitshuffle'
export { DeltaCodec, deltaCodec } from './delta'
export { DeltaChainCodec, deltaChainCodec } from './delta-chain'
export { InterleavedCodec, interleavedCodec } from './interleaved'
export { LinearCodec, linearCodec } from './linear'
export { PredictCodec, predictCodec } from './predict'
export { RleCodec, rleCodec } from './rle'
export {
  AbstractCodec,
  type Codec,
  type CodecMetadata,
  type Friendliness,
  isStreamingCodec,
  type PixelBuffer,
  type StreamCodecState,
  type StreamingCodec,
} from './types'
export { XorCodec, xorCodec } from './xor'

// Env-neutral codecs registered into the algorithm catalog at module-load time.
// Node-only codecs (e.g. `zstdpix`, which depends on Node 22 zstd or the
// optional `@mongodb-js/zstd` native module) are registered by `@tokenpack/node`.
export const CODECS: readonly AbstractCodec[] = [
  linearCodec,
  interleavedCodec,
  bitplaneCodec,
  deltaCodec,
  xorCodec,
  deltaChainCodec,
  rleCodec,
  predictCodec,
  bitshuffleCodec,
]
