import { registerCodec } from './registry'
import { linearCodec } from './linear/index'
import { radialCodec } from './radial/index'
import { interleavedCodec } from './interleaved/index'
import { semanticCodec } from './semantic/index'
import { bitplaneCodec } from './bitplane/index'
import { deltaCodec } from './delta/index'
import { xorCodec } from './xor/index'
import { nibbleCodec } from './nibble/index'
import { deltaChainCodec } from './delta-chain/index'
import { rleCodec } from './rle/index'
import { predictCodec } from './predict/index'
import { palettePixelCodec } from './palette-pixel/index'

registerCodec(linearCodec)
registerCodec(radialCodec)
registerCodec(interleavedCodec)
registerCodec(semanticCodec)
registerCodec(bitplaneCodec)
registerCodec(deltaCodec)
registerCodec(xorCodec)
registerCodec(nibbleCodec)
registerCodec(deltaChainCodec)
registerCodec(rleCodec)
registerCodec(predictCodec)
registerCodec(palettePixelCodec)
