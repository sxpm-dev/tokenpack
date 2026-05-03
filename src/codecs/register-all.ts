import { registerCodec } from './registry.js'
import { linearCodec } from './linear.js'
import { radialCodec } from './radial.js'
import { interleavedCodec } from './interleaved.js'

registerCodec(linearCodec)
registerCodec(radialCodec)
registerCodec(interleavedCodec)
