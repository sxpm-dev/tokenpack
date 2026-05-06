// CART archive — re-exports the buffer-pure primitives plus fs-using wrappers.
//
// Buffer-pure surface (browser-safe) lives in `./archive-buffers.ts`. This file
// adds Node-only directory-walk + file-output helpers. Phase 2 relocates these
// to `@tokenpack/node`; for now the subpath `tokenpack/archive` keeps both.

import fs from 'fs'
import path from 'path'

import {
  isCartArchive,
  listArchive,
  type PackEntry,
  packBuffers,
  unpackBuffers,
} from './archive-buffers'

export { isCartArchive, listArchive, packBuffers, unpackBuffers, type PackEntry }

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
])

function walkDir(root: string, dir: string, ignore: Set<string>, out: PackEntry[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue
    const abs = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walkDir(root, abs, ignore, out)
    } else if (entry.isFile()) {
      const rel = path.relative(root, abs).split(path.sep).join('/')
      out.push({ path: rel, bytes: fs.readFileSync(abs) })
    }
  }
}

export function packDirs(dirPaths: string[], extraIgnore: string[] = [], root?: string): Buffer {
  const ignore = new Set([...DEFAULT_IGNORE, ...extraIgnore])
  const resolvedRoot = root ?? process.cwd()
  const entries: PackEntry[] = []

  for (const dir of dirPaths) {
    walkDir(resolvedRoot, path.resolve(dir), ignore, entries)
  }

  return Buffer.from(packBuffers(entries))
}

export function packDir(dirPath: string, extraIgnore: string[] = []): Buffer {
  return packDirs([dirPath], extraIgnore)
}

export function unpackDir(data: Buffer | Uint8Array, outDir: string): string[] {
  const entries = unpackBuffers(data)
  const written: string[] = []
  const resolvedOut = path.resolve(outDir)

  for (const { path: filePath, bytes } of entries) {
    const fullPath = path.resolve(outDir, filePath)
    if (!fullPath.startsWith(resolvedOut)) {
      throw new Error(`Unsafe path in archive: ${filePath}`)
    }
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, bytes)
    written.push(filePath)
  }

  return written
}
