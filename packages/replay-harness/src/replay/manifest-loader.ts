import { readFile } from 'node:fs/promises'
import type { PackManifest } from '../config/types.js'

export async function loadManifest(path: string): Promise<PackManifest> {
  const raw = await readFile(path, 'utf8')
  const parsed = JSON.parse(raw) as PackManifest
  if (parsed.version !== 1) {
    throw new Error(`Unsupported manifest version: ${parsed.version}`)
  }
  return parsed
}
