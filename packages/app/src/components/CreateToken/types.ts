import type { DEFAULT_PRESETS } from 'tokenpack/algorithms/catalog-info'
import type { DRAWERS, FORMATS, GRADIENT_DIRECTIONS } from './constants'

export type DrawerChoice = (typeof DRAWERS)[number]
export type ImageFormat = (typeof FORMATS)[number]
export type GradientDirection = (typeof GRADIENT_DIRECTIONS)[number]
export type DefaultPresetName = (typeof DEFAULT_PRESETS)[number]['name']
export type InputMode = 'text' | 'file'
export type ConfigMode = 'default' | 'manual'

export interface SizeStats {
  inputBytes: number
  tokenBytes: number
  gzipBytes: number | null
  brotliBytes: number | null
}
