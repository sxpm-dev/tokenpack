// Hand-picked default presets for the dashboard.
//
// Each preset is a concrete algorithm name + an optional level. The algorithm
// already encodes codec/surface/compressor binding in its identity; the level
// tunes the bound compressor.

export type DefaultPresetName =
  | 'best-compression'
  | 'best-stream'
  | 'best-compression-browser'
  | 'best-stream-browser'

export interface DefaultPresetDef {
  name: DefaultPresetName
  label: string
  hint: string
  /** Concrete algorithm name (registered in algorithmCatalog). */
  algo: string
  /** Compressor level to apply via algoOptions['compressor.level']. */
  level: number
  /** Surface channels (3 or 4). */
  channels: 1 | 2 | 3 | 4
}

export const DEFAULT_PRESETS: ReadonlyArray<DefaultPresetDef> = [
  {
    name: 'best-compression',
    label: 'Best compression',
    hint: 'overall',
    algo: 'linear', // LinearPngBrotli — server-encoded
    level: 11,
    channels: 3,
  },
  {
    name: 'best-stream',
    label: 'Best stream',
    hint: 'overall',
    algo: 'linear-stream-deflate', // streaming PNG with deflate
    level: 6,
    channels: 3,
  },
  {
    name: 'best-compression-browser',
    label: 'Best compression',
    hint: 'browser',
    algo: 'linear-deflate', // LinearPngDeflate — browser-encodable
    level: 9,
    channels: 3,
  },
  {
    name: 'best-stream-browser',
    label: 'Best stream',
    hint: 'browser',
    algo: 'linear-stream-deflate',
    level: 1,
    channels: 3,
  },
]

export function findDefaultPreset(name: DefaultPresetName): DefaultPresetDef {
  return DEFAULT_PRESETS.find(p => p.name === name) ?? DEFAULT_PRESETS[0]
}
