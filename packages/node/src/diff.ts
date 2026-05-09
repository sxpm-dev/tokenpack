// Node diff() — thin proxy that loads sources, then delegates to core's
// `computeTextDiff` and `renderHeatmap` primitives.

import fs from 'node:fs'

import {
  computeTextDiff,
  type DiffStats,
  type FileDiff,
  type Hunk,
  renderHeatmap,
} from 'tokenpack/diff'

import type { DecodeSource } from './decode'
import { decode } from './decode'

export type { DiffStats, FileDiff, Hunk }

export interface DiffResult {
  text(): Promise<FileDiff[]>
  token(outPath?: string): Promise<{ stats: DiffStats; bytes: Buffer }>
}

export function diff(sourceA: DecodeSource, sourceB: DecodeSource): DiffResult {
  return {
    async text() {
      const [a, b] = await Promise.all([decode(sourceA), decode(sourceB)])

      return computeTextDiff(a, b)
    },
    async token(outPath?: string) {
      const [aBytes, bBytes] = await Promise.all([loadRaw(sourceA), loadRaw(sourceB)])
      const result = await renderHeatmap(aBytes, bBytes)

      if (outPath) fs.writeFileSync(outPath, result.bytes)

      return result
    },
  }
}

async function loadRaw(source: DecodeSource): Promise<Buffer> {
  if (Buffer.isBuffer(source)) return source
  if (source instanceof Uint8Array) {
    return Buffer.from(source.buffer, source.byteOffset, source.byteLength)
  }
  if (source instanceof URL || (typeof source === 'string' && /^(?:https?|file):\/\//.test(source))) {
    const url = typeof source === 'string' ? new URL(source) : source

    if (url.protocol === 'file:') return fs.readFileSync(url)
    const response = await fetch(url.toString())

    if (!response.ok) throw new Error(`fetch ${url.toString()}: ${response.status}`)

    return Buffer.from(await response.arrayBuffer())
  }

  return fs.readFileSync(source as string)
}
