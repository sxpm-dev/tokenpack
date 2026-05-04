import { registerCodec } from './registry'
import { linearCodec } from './linear/index'
import { interleavedCodec } from './interleaved/index'
import { bitplaneCodec } from './bitplane/index'
import { deltaCodec } from './delta/index'
import { xorCodec } from './xor/index'
import { deltaChainCodec } from './delta-chain/index'
import { rleCodec } from './rle/index'
import { predictCodec } from './predict/index'
import { bitshuffleCodec } from './bitshuffle/index'
import { zstdpixCodec } from './zstdpix/index'

registerCodec(linearCodec)
registerCodec(interleavedCodec)
registerCodec(bitplaneCodec)
registerCodec(deltaCodec)
registerCodec(xorCodec)
registerCodec(deltaChainCodec)
registerCodec(rleCodec)
registerCodec(predictCodec)
registerCodec(bitshuffleCodec)
registerCodec(zstdpixCodec)
