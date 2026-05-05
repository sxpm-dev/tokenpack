import './algorithms/register-all'

import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'

import { algorithmCatalog } from './algorithms/catalog'
import { pickDrawerForPixels } from './drawers'
import type { ChunkReadResult } from './drawers/types'
import { finalizeChunks } from './finalize-chunks'
import { isCompactToken, readCompactHeader, readHeader } from './header'
import { surfaceRegistry } from './surfaces/registry'
import type { SurfacePixels } from './surfaces/types'
import type { DecodeOptions } from './types'

function resolveCodecId(pixels: Uint8Array): number {
  if (isCompactToken(pixels)) return readCompactHeader(pixels).algoId

  return readHeader(pixels).algorithmId
}

function readChunk(image: SurfacePixels): ChunkReadResult {
  const codecId = resolveCodecId(image.pixels)
  const codec = algorithmCatalog.getById(codecId).codec
  const drawer = pickDrawerForPixels(image.pixels)

  return drawer.read(image, { codec })
}

async function readChunkFromFile(filePath: string): Promise<ChunkReadResult> {
  const surface = surfaceRegistry.byExtension(path.extname(filePath))
  const image = await surface.readFile(filePath)

  return readChunk(image)
}

async function readChunkFromBuffer(buffer: Buffer, ext: string): Promise<ChunkReadResult> {
  const surface = surfaceRegistry.byExtension(ext)
  const image = await surface.readBuffer(buffer)

  return readChunk(image)
}

function discoverChunks(firstPath: string, total: number): string[] {
  if (total === 1) return [firstPath]
  const ext = path.extname(firstPath)
  const dir = path.dirname(firstPath)
  const base = path.basename(firstPath, ext)
  const stripped = base.replace(/_\d+of\d+$/, '')

  return Array.from({ length: total }, (_, i) =>
    path.join(dir, `${stripped}_${i + 1}of${total}${ext}`),
  )
}

export async function decode(inputPath: string, options: DecodeOptions): Promise<void> {
  const first = await readChunkFromFile(inputPath)
  const paths = first.chunkTotal > 1 ? discoverChunks(inputPath, first.chunkTotal) : [inputPath]

  for (const p of paths) {
    if (!fs.existsSync(p)) throw new Error(`Missing chunk: ${p}`)
  }
  const chunks =
    first.chunkTotal > 1
      ? [first, ...(await Promise.all(paths.slice(1).map(p => readChunkFromFile(p))))]
      : [first]

  fs.writeFileSync(options.out, await finalizeChunks(chunks, options.key))
}

export const decodeFile = decode

export async function decodeToBuffer(inputPath: string, key?: string): Promise<Buffer> {
  const first = await readChunkFromFile(inputPath)

  if (first.chunkTotal === 1) return await finalizeChunks([first], key)
  const paths = discoverChunks(inputPath, first.chunkTotal)
  const rest = await Promise.all(paths.slice(1).map(p => readChunkFromFile(p)))

  return await finalizeChunks([first, ...rest], key)
}

export async function decodeFromBuffer(
  imageBuffer: Buffer,
  key?: string,
  ext?: string,
): Promise<Buffer> {
  const resolvedExt = ext ?? '.png'
  const first = await readChunkFromBuffer(imageBuffer, resolvedExt)

  if (first.chunkTotal === 1) return await finalizeChunks([first], key)
  const tmpPath = path.join(tmpdir(), `tp-dec-${globalThis.crypto.randomUUID()}${resolvedExt}`)

  fs.writeFileSync(tmpPath, imageBuffer)
  try {
    const paths = discoverChunks(tmpPath, first.chunkTotal)
    const rest = await Promise.all(paths.slice(1).map(p => readChunkFromFile(p)))

    return await finalizeChunks([first, ...rest], key)
  } finally {
    try {
      fs.unlinkSync(tmpPath)
    } catch {}
  }
}
