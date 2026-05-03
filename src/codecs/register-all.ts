import { registerCodec } from './registry.js'
import { linearCodec } from './linear.js'
import { radialCodec } from './radial.js'

registerCodec(linearCodec)
registerCodec(radialCodec)
