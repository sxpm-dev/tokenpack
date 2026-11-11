export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split('')
          .map(c => `${c}${c}`)
          .join('')
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

export function mimeForFormat(format: 'png' | 'webp' | 'avif'): string {
  if (format === 'webp') return 'image/webp'
  if (format === 'avif') return 'image/avif'

  return 'image/png'
}
