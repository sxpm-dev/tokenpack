import { ALGORITHM_INFOS, IMAGE_FORMATS, PRESET_INFOS } from 'tokenpack/algorithms/catalog-info'

export const PRESETS = ['none', ...PRESET_INFOS.map(p => p.name)] as readonly string[]
export const ALGOS = ALGORITHM_INFOS.map(a => a.name)
export const DRAWERS = ['dense', 'dot'] as const
export const FORMATS = IMAGE_FORMATS
export const GRADIENT_DIRECTIONS = ['horizontal', 'vertical', 'diagonal'] as const
export const BPP_VALUES = [1, 2, 3, 4] as const
