import type { EncodeBrowserOptions } from '@tokenpack/browser'

import type { EncodeConfig } from '@/components/EncodeForm'
import { findDefaultPreset } from '@/components/EncodeForm/default-presets'

/** Resolves the algo name actually used (taking the default preset into account). */
export function resolveAlgoName(config: EncodeConfig): string {
  if (config.configMode === 'default') return findDefaultPreset(config.defaultPreset).algo

  return config.algo
}

function flatAlgoOptions(config: EncodeConfig): Record<string, unknown> {
  if (config.configMode === 'default') {
    const preset = findDefaultPreset(config.defaultPreset)

    return {
      'compressor.level': preset.level,
      'surface.channels': preset.channels,
    }
  }

  return config.algoOptions
}

/** Convert flat namespaced keys (`'compressor.level'`) to nested objects. */
function nestAlgoOptions(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(flat)) {
    const dotIdx = key.indexOf('.')

    if (dotIdx === -1) {
      out[key] = value
      continue
    }
    const ns = key.slice(0, dotIdx)
    const sub = key.slice(dotIdx + 1)

    out[ns] ??= {}
    ;(out[ns] as Record<string, unknown>)[sub] = value
  }

  return out
}

/** Builds the options object passed to `@tokenpack/browser/encode`. */
export function buildEncodeOptions(config: EncodeConfig): EncodeBrowserOptions {
  const algo = resolveAlgoName(config)
  const algoOptions = nestAlgoOptions(flatAlgoOptions(config))
  const opts: EncodeBrowserOptions = { algo, algoOptions }

  if (config.key) opts.key = config.key

  return opts
}
