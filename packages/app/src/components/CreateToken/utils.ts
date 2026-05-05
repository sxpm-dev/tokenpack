import { DEFAULT_PRESETS, SURFACE_INFOS } from 'tokenpack/algorithms/catalog-info'
import type { DefaultPresetName } from './types'

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized.split('').map(c => `${c}${c}`).join('')
      : normalized.padEnd(6, '0').slice(0, 6),
    16,
  )
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function pickFirst(keys: Set<string | number>): string | undefined {
  const [first] = [...keys]
  return first !== undefined ? String(first) : undefined
}

function findDefaultPreset(name: DefaultPresetName) {
  return DEFAULT_PRESETS.find(entry => entry.name === name) ?? DEFAULT_PRESETS[0]
}

export function getDefaultAlgorithmFormat(name: DefaultPresetName) {
  return findDefaultPreset(name).options.format
}

export function appendDefaultAlgorithm(form: FormData, name: DefaultPresetName) {
  const preset = findDefaultPreset(name)
  form.append('algo', preset.options.algo)
  form.append('compressionMode', preset.options.compressionMode)
  form.append('channels', String(preset.options.channels))
  form.append('format', preset.options.format)
  if (preset.options.streaming) form.append('streaming', 'true')
}

export function mimeForFormat(format: 'png' | 'webp' | 'avif'): string {
  const surface = SURFACE_INFOS.find(s => s.format === format && !s.streamable)
  return surface?.mimeType ?? 'image/png'
}
