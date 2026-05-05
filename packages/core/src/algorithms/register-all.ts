import { CODECS } from '../codecs'
import { algorithmCatalog } from './catalog'
import { registerPresetAlgorithms } from './presets'

algorithmCatalog.registerCodecs(CODECS)
registerPresetAlgorithms()
