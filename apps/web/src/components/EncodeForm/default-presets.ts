import { ALGO_CATALOG, type AlgoMeta } from '@/lib/algo-catalog'

export type DefaultPresetName =
  | 'best-compression'
  | 'best-stream'
  | 'best-compression-browser'
  | 'best-stream-browser'

export interface DefaultPresetDef {
  name: DefaultPresetName
  label: string
  hint: string
  algo: string
  level: number
  channels: 1 | 2 | 3 | 4
}

interface PresetRule {
  name: DefaultPresetName
  label: string
  hint: string
  level: number
  match: (algo: AlgoMeta) => boolean
}

const RULES: PresetRule[] = [
  {
    name: 'best-compression',
    label: 'Best compression',
    hint: 'overall',
    level: 11,
    match: algo => algo.binding.compressor === 'brotli' && !algo.binding.streamable,
  },
  {
    name: 'best-stream',
    label: 'Best stream',
    hint: 'overall',
    level: 6,
    match: algo => algo.binding.streamable,
  },
  {
    name: 'best-compression-browser',
    label: 'Best compression',
    hint: 'browser',
    level: 9,
    match: algo =>
      algo.implementedIn.includes('browser') &&
      algo.binding.compressor === 'deflate' &&
      !algo.binding.streamable,
  },
  {
    name: 'best-stream-browser',
    label: 'Best stream',
    hint: 'browser',
    level: 1,
    match: algo =>
      algo.implementedIn.includes('browser') &&
      algo.binding.compressor === 'deflate' &&
      algo.binding.streamable,
  },
]

export function listDefaultPresets(catalog: AlgoMeta[] = ALGO_CATALOG): DefaultPresetDef[] {
  const fallback = catalog[0]

  return RULES.map(rule => {
    const algo = catalog.find(rule.match) ?? fallback

    return {
      name: rule.name,
      label: rule.label,
      hint: rule.hint,
      algo: algo?.name ?? '',
      level: rule.level,
      channels: firstChannel(algo),
    }
  }).filter(preset => preset.algo)
}

export const DEFAULT_PRESETS: ReadonlyArray<DefaultPresetDef> = listDefaultPresets()

export function findDefaultPreset(
  name: DefaultPresetName,
  catalog: AlgoMeta[] = ALGO_CATALOG,
): DefaultPresetDef {
  const presets = listDefaultPresets(catalog)

  return presets.find(p => p.name === name) ?? presets[0]
}

function firstChannel(algo: AlgoMeta | undefined): 1 | 2 | 3 | 4 {
  return algo?.requiredChannels ?? 3
}
