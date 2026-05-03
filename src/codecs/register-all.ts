import { registerCodec } from './registry.js'
import { linearCodec } from './linear.js'

registerCodec(linearCodec)
