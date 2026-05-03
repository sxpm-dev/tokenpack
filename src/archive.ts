import fs from 'fs'
import path from 'path'

const MAGIC = 'CART'

const DEFAULT_IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  '.DS_Store', 'Thumbs.db', '.env', '.env.local',
])

function walkDir(
  root: string,
  dir: string,
  ignore: Set<string>,
  out: { filePath: string; content: Buffer }[],
): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(root, abs, ignore, out)
    } else if (entry.isFile()) {
      out.push({ filePath: path.relative(root, abs), content: fs.readFileSync(abs) })
    }
  }
}

export function packDirs(dirPaths: string[], extraIgnore: string[] = []): Buffer {
  const ignore = new Set([...DEFAULT_IGNORE, ...extraIgnore])
  const cwd = process.cwd()
  const files: { filePath: string; content: Buffer }[] = []
  for (const dir of dirPaths) {
    walkDir(cwd, path.resolve(dir), ignore, files)
  }
  return serializeFiles(files)
}

export function packDir(dirPath: string, extraIgnore: string[] = []): Buffer {
  return packDirs([dirPath], extraIgnore)
}

function serializeFiles(files: { filePath: string; content: Buffer }[]): Buffer {
  const parts: Buffer[] = []

  const header = Buffer.alloc(8)
  header.write(MAGIC, 0, 'ascii')
  header.writeUInt32BE(files.length, 4)
  parts.push(header)

  for (const { filePath, content } of files) {
    const pathBuf    = Buffer.from(filePath, 'utf8')
    const pathLen    = Buffer.alloc(2); pathLen.writeUInt16BE(pathBuf.length)
    const contentLen = Buffer.alloc(4); contentLen.writeUInt32BE(content.length)
    parts.push(pathLen, pathBuf, contentLen, content)
  }

  return Buffer.concat(parts)
}

export function unpackDir(data: Buffer, outDir: string): string[] {
  if (data.slice(0, 4).toString('ascii') !== MAGIC) {
    throw new Error('Not a CART archive — wrong magic bytes')
  }

  const fileCount = data.readUInt32BE(4)
  let offset = 8
  const written: string[] = []

  for (let i = 0; i < fileCount; i++) {
    const pathLen    = data.readUInt16BE(offset); offset += 2
    const filePath   = data.slice(offset, offset + pathLen).toString('utf8'); offset += pathLen
    const contentLen = data.readUInt32BE(offset); offset += 4
    const content    = data.slice(offset, offset + contentLen); offset += contentLen

    // Guard against path traversal
    const fullPath = path.resolve(outDir, filePath)
    if (!fullPath.startsWith(path.resolve(outDir))) {
      throw new Error(`Unsafe path in archive: ${filePath}`)
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, content)
    written.push(filePath)
  }

  return written
}

export function listArchive(data: Buffer): { filePath: string; size: number }[] {
  if (data.slice(0, 4).toString('ascii') !== MAGIC) {
    throw new Error('Not a CART archive')
  }

  const fileCount = data.readUInt32BE(4)
  let offset = 8
  const entries: { filePath: string; size: number }[] = []

  for (let i = 0; i < fileCount; i++) {
    const pathLen    = data.readUInt16BE(offset); offset += 2
    const filePath   = data.slice(offset, offset + pathLen).toString('utf8'); offset += pathLen
    const contentLen = data.readUInt32BE(offset); offset += 4
    offset += contentLen
    entries.push({ filePath, size: contentLen })
  }

  return entries
}
