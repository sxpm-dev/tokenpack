import type { ImageFormat as CoreImageFormat } from 'tokenpack/types'

import type { DefaultPresetName } from './default-presets'

export type ImageFormat = CoreImageFormat
export type ConfigMode = 'default' | 'manual'

export type { DefaultPresetName }

export interface SizeStats {
  inputBytes: number
  tokenBytes: number
  gzipBytes: number | null
  brotliBytes: number | null
}

export interface EncodeConfig {
  configMode: ConfigMode
  defaultPreset: DefaultPresetName
  algo: string
  /** Namespaced algorithm options (e.g. `'compressor.level': 11`, `'surface.channels': 3`). */
  algoOptions: Record<string, unknown>
  key: string
}

export const DEFAULT_ENCODE_CONFIG: EncodeConfig = {
  configMode: 'default',
  defaultPreset: 'best-compression',
  algo: 'linear',
  algoOptions: {},
  key: '',
}
