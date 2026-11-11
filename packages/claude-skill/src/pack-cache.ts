// Pack cache: virtual mount of decoded TokenPack contents at ~/.tokenpack/cache/<id>/
//
// Cache layout:
//   ~/.tokenpack/cache/<id>/
//     manifest.json    [{ path, size, type, sha256 }]
//     blobs/<sha256>   raw bytes (content-addressed; dedup across packs)
//     meta.json        { source, openedAt, lastDiffId, keyRequired }

import { decode, encode } from '@tokenpack/node'
import { createHash, randomUUID } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { packBuffers } from 'tokenpack/archive'
import { applyDiff, readDiffMeta } from 'tokenpack/diff-pack'

const CACHE_ROOT = path.join(os.homedir(), '.tokenpack', 'cache')

export interface ManifestEntry {
  path: string
  size: number
  type: 'text' | 'binary'
  sha256: string
}

export interface PackMeta {
  source: string
  openedAt: string
  lastDiffId?: string
  keyRequired: boolean
}

export interface OpenResult {
  id: string
  source: string
  fileCount: number
  totalBytes: number
  topLevel: string[]
}

const TEXT_EXT = new Set([
  '.txt',
  '.md',
  '.json',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.mjs',
  '.cjs',
  '.html',
  '.css',
  '.scss',
  '.yml',
  '.yaml',
  '.toml',
  '.xml',
  '.svg',
  '.py',
  '.rs',
  '.go',
  '.rb',
  '.php',
  '.java',
  '.kt',
  '.swift',
  '.c',
  '.h',
  '.cpp',
  '.hpp',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.csv',
  '.tsv',
  '.log',
])

function detectType(filePath: string, bytes: Uint8Array): 'text' | 'binary' {
  const ext = path.extname(filePath).toLowerCase()

  if (TEXT_EXT.has(ext)) return 'text'
  const head = bytes.subarray(0, Math.min(bytes.length, 8192))

  for (let i = 0; i < head.length; i++) {
    if (head[i] === 0) return 'binary'
  }

  return 'text'
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export function cacheDir(id: string): string {
  return path.join(CACHE_ROOT, id)
}

export function exists(id: string): boolean {
  return fs.existsSync(path.join(cacheDir(id), 'manifest.json'))
}

export function readManifest(id: string): ManifestEntry[] {
  const p = path.join(cacheDir(id), 'manifest.json')

  if (!fs.existsSync(p))
    throw new Error(`pack ${id} not open. Run \`tokenpack-skill open <png>\` first.`)

  return JSON.parse(fs.readFileSync(p, 'utf-8')) as ManifestEntry[]
}

export function readMeta(id: string): PackMeta {
  const p = path.join(cacheDir(id), 'meta.json')

  if (!fs.existsSync(p)) throw new Error(`pack ${id} meta missing`)

  return JSON.parse(fs.readFileSync(p, 'utf-8')) as PackMeta
}

export function readBlob(id: string, sha: string): Uint8Array {
  const p = path.join(cacheDir(id), 'blobs', sha)

  if (!fs.existsSync(p)) throw new Error(`blob ${sha} missing in pack ${id}`)

  return new Uint8Array(fs.readFileSync(p))
}

export function close(id: string): void {
  const dir = cacheDir(id)

  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
}

export async function open(pngPath: string, key?: string): Promise<OpenResult> {
  const absPath = path.resolve(pngPath)

  if (!fs.existsSync(absPath)) throw new Error(`file not found: ${absPath}`)
  const ext = path.extname(absPath)

  let pack: Awaited<ReturnType<typeof decode>>

  try {
    pack = await decode(absPath, key ? { key } : {})
  } catch (e: unknown) {
    if (e instanceof Error && /encrypted/i.test(e.message)) {
      throw new Error('pack is encrypted — pass --key <password>')
    }
    throw e
  }

  const id = randomUUID()
  const dir = cacheDir(id)

  fs.mkdirSync(path.join(dir, 'blobs'), { recursive: true })

  let manifest: ManifestEntry[]
  let totalBytes: number
  let topLevel: Set<string>

  if (pack.isPack()) {
    manifest = []
    totalBytes = 0
    topLevel = new Set<string>()
    for (const info of pack.entries) {
      const entryBytes = await pack.extract(info.path)
      const sha = sha256(entryBytes)
      const blobPath = path.join(dir, 'blobs', sha)

      if (!fs.existsSync(blobPath)) fs.writeFileSync(blobPath, entryBytes)
      manifest.push({
        path: info.path,
        size: entryBytes.length,
        type: detectType(info.path, entryBytes),
        sha256: sha,
      })
      totalBytes += entryBytes.length
      topLevel.add(info.path.split('/')[0])
    }
  } else if (pack.isDiff()) {
    throw new Error('open: token is a diff, not a pack — use `apply-diff` instead')
  } else {
    // FilePack — single entry.
    const payload = await pack.content()
    const sha = sha256(payload)

    fs.writeFileSync(path.join(dir, 'blobs', sha), payload)
    const fileName = pack.list[0] || path.basename(absPath, ext) || 'payload'

    manifest = [
      {
        path: fileName,
        size: payload.length,
        type: detectType(fileName, payload),
        sha256: sha,
      },
    ]
    totalBytes = payload.length
    topLevel = new Set([manifest[0].path])
  }

  const meta: PackMeta = {
    source: absPath,
    openedAt: new Date().toISOString(),
    keyRequired: !!key,
  }

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2))

  return {
    id,
    source: absPath,
    fileCount: manifest.length,
    totalBytes,
    topLevel: [...topLevel].sort(),
  }
}

export function listIds(): string[] {
  if (!fs.existsSync(CACHE_ROOT)) return []

  return fs.readdirSync(CACHE_ROOT).filter(name => exists(name))
}

export interface ApplyDiffResult {
  added: string[]
  modified: string[]
  deleted: string[]
}

/**
 * Apply a diff PNG on top of an open pack. Decodes the diff token, applies it,
 * and rewrites the cache (manifest + blobs).
 */
export async function applyDiffToPack(
  id: string,
  diffPngPath: string,
  key?: string,
): Promise<ApplyDiffResult> {
  if (!exists(id)) throw new Error(`pack ${id} not open`)

  const dir = cacheDir(id)
  const diffPack = await decode(diffPngPath, key ? { key } : {})

  if (!diffPack.isPack()) throw new Error('apply-diff: token is not a CART archive')

  // Reconstruct the raw diff archive bytes for applyDiff input.
  const diffEntries = await Promise.all(
    diffPack.entries.map(async info => ({
      path: info.path,
      bytes: await diffPack.extract(info.path),
    })),
  )
  const diffArchive = packBuffers(diffEntries)
  const meta = readDiffMeta(diffArchive)

  if (!meta) throw new Error('apply-diff: token is a regular pack, not a re-applyable diff')

  // Reconstruct prev pack entries from the cache.
  const prevManifest = readManifest(id)
  const prevEntries = prevManifest.map(e => ({ path: e.path, bytes: readBlob(id, e.sha256) }))

  // Apply.
  const nextEntries = applyDiff(prevEntries, diffArchive)

  // Compute change summary.
  const prevByPath = new Map(prevEntries.map(e => [e.path, e.bytes]))
  const nextPaths = new Set(nextEntries.map(e => e.path))
  const added: string[] = []
  const modified: string[] = []
  const deleted: string[] = []

  for (const e of nextEntries) {
    const prev = prevByPath.get(e.path)

    if (prev === undefined) added.push(e.path)
    else if (!bytesEqual(prev, e.bytes)) modified.push(e.path)
  }
  for (const p of prevByPath.keys()) if (!nextPaths.has(p)) deleted.push(p)

  // Rewrite manifest + blobs.
  const newManifest: ManifestEntry[] = []

  for (const entry of nextEntries) {
    const entryBytes = new Uint8Array(entry.bytes)
    const sha = sha256(entryBytes)
    const blobPath = path.join(dir, 'blobs', sha)

    if (!fs.existsSync(blobPath)) fs.writeFileSync(blobPath, entryBytes)
    newManifest.push({
      path: entry.path,
      size: entry.bytes.length,
      type: detectType(entry.path, entryBytes),
      sha256: sha,
    })
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(newManifest, null, 2))

  const metaState = readMeta(id)

  metaState.lastDiffId = path.basename(diffPngPath)
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(metaState, null, 2))

  // GC unreferenced blobs.
  const referenced = new Set(newManifest.map(e => e.sha256))
  const blobsDir = path.join(dir, 'blobs')

  if (fs.existsSync(blobsDir)) {
    for (const blob of fs.readdirSync(blobsDir)) {
      if (!referenced.has(blob)) fs.unlinkSync(path.join(blobsDir, blob))
    }
  }

  return { added, modified, deleted }
}

/**
 * Produce a re-applyable diff token PNG from two existing token PNGs.
 *
 * Both inputs must be CART-format packs (typically produced by `tokenpack pack`).
 */
export async function produceDiffToken(
  prevPngPath: string,
  nextPngPath: string,
  diffOutPath: string,
  options: { algo?: string; level?: number; key?: string } = {},
): Promise<{ diffBytes: number; added: string[]; modified: string[]; deleted: string[] }> {
  const prev = await decode(prevPngPath, options.key ? { key: options.key } : {})
  const next = await decode(nextPngPath, options.key ? { key: options.key } : {})

  if (!prev.isPack()) throw new Error(`prev (${prevPngPath}) is not a packed archive`)
  if (!next.isPack()) throw new Error(`next (${nextPngPath}) is not a packed archive`)

  const prevEntries = await Promise.all(
    prev.entries.map(async info => ({ path: info.path, bytes: await prev.extract(info.path) })),
  )
  const nextEntries = await Promise.all(
    next.entries.map(async info => ({ path: info.path, bytes: await next.extract(info.path) })),
  )
  const { diffPack } = await import('tokenpack/diff-pack')
  const result = diffPack(prevEntries, nextEntries)

  // Encode the diff archive as a token PNG. Default to linear-deflate at level 6
  // for FE-friendly streaming decode.
  const algo = options.algo ?? 'linear-deflate'
  const algoOptions =
    options.level !== undefined ? { compressor: { level: options.level } } : undefined

  await encode(Buffer.from(result.diff), {
    out: diffOutPath,
    algo,
    ...(algoOptions ? { algoOptions } : {}),
    ...(options.key ? { key: options.key } : {}),
  })

  return {
    diffBytes: result.diff.length,
    added: result.added,
    modified: result.modified,
    deleted: result.deleted,
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false

  return true
}
