import './algorithms/register-all'

import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'

import { algorithmCatalog } from './algorithms/catalog'
import { surfaceRegistry } from './surfaces/registry'
import type { EncodeOptions } from './types'

export async function encode(input: Buffer, options: EncodeOptions): Promise<string[]> {
  const { algo: algorithmName = 'linear', ...algorithmOptions } = options
  const algorithm = algorithmCatalog.getByName(algorithmName)

  return algorithm.encode(input, algorithmOptions)
}

export async function encodeFile(inputPath: string, options: EncodeOptions): Promise<void> {
  await encode(fs.readFileSync(inputPath), options)
}

export async function encodeToBuffer(
  input: Buffer,
  options: Omit<EncodeOptions, 'out'>,
): Promise<Buffer[]> {
  const surface = surfaceRegistry.byFormat(options.format ?? 'png', options.streaming ?? false)
  const tmpBase = path.join(tmpdir(), `tp-enc-${globalThis.crypto.randomUUID()}${surface.extension}`)
  const writtenPaths = await encode(input, { ...options, out: tmpBase })

  try {
    return writtenPaths.map(p => fs.readFileSync(p))
  } finally {
    for (const p of writtenPaths) {
      try {
        fs.unlinkSync(p)
      } catch {}
    }
  }
}
