import type { EncodeConfig } from '@/components/EncodeForm'
import { findDefaultPreset } from '@/components/EncodeForm/default-presets'

import type { BuilderEntry } from '../types'

export interface ServerEncodeResponse {
  token: string
  gzipSize: number
  brotliSize: number
  algo: string
  mime: string
  extension: string
  fileName: string
}

/** Builds the FormData payload for /api/pack's entries mode. */
export function buildPackFormData(
  entries: ReadonlyArray<BuilderEntry>,
  config: EncodeConfig,
): FormData {
  const form = new FormData()

  form.append('mode', 'entries')

  entries.forEach((entry, i) => {
    form.append(`entry.${i}.path`, entry.path)
    if (entry.kind === 'text') {
      form.append(`entry.${i}.text`, entry.text)
    } else {
      form.append(`entry.${i}.file`, entry.file, entry.file.name)
    }
  })

  if (config.configMode === 'default') {
    const preset = findDefaultPreset(config.defaultPreset)

    form.append('algo', preset.algo)
    form.append(
      'algoOptions',
      JSON.stringify({
        'compressor.level': preset.level,
        'surface.channels': preset.channels,
      }),
    )
  } else {
    form.append('algo', config.algo)
    form.append('algoOptions', JSON.stringify(config.algoOptions))
  }

  if (config.key) form.append('key', config.key)

  return form
}

export async function serverEncodePack(
  entries: ReadonlyArray<BuilderEntry>,
  config: EncodeConfig,
): Promise<ServerEncodeResponse> {
  const form = buildPackFormData(entries, config)
  const res = await fetch('/api/pack', { method: 'POST', body: form })
  const data = (await res.json()) as ServerEncodeResponse | { error: string }

  if (!res.ok) throw new Error('error' in data ? data.error : 'server encode failed')

  return data as ServerEncodeResponse
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return bytes
}
