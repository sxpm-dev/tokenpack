import { PackBuilder } from '@tokenpack/browser'

import type { BuilderEntry } from '../types'

export async function entriesToBuilder(entries: ReadonlyArray<BuilderEntry>): Promise<PackBuilder> {
  const builder = new PackBuilder()

  for (const entry of entries) {
    if (entry.kind === 'text') {
      builder.withFile(entry.path, entry.text)
    } else {
      const buffer = new Uint8Array(await entry.file.arrayBuffer())

      builder.withBuffer(entry.path, buffer)
    }
  }

  return builder
}

export function defaultPathForFile(file: File, existingPaths: ReadonlyArray<string>): string {
  const base = file.name || 'file'
  const taken = new Set(existingPaths)

  if (!taken.has(base)) return base

  const dot = base.lastIndexOf('.')
  const stem = dot > 0 ? base.slice(0, dot) : base
  const ext = dot > 0 ? base.slice(dot) : ''

  for (let i = 2; i < 1000; i++) {
    const candidate = `${stem}-${i}${ext}`

    if (!taken.has(candidate)) return candidate
  }

  return `${stem}-${Date.now()}${ext}`
}
