// Extract a decoded Pack to disk. Used by the CLI's `expand` and `decode`
// commands. For FilePack writes the single payload to the given path; for
// DirPack walks all entries and writes them under the target directory.

import fs from 'node:fs'
import path from 'node:path'

import type { Pack } from 'tokenpack/pack/types'

export async function extract(pack: Pack, outPath: string): Promise<string[]> {
  if (pack.isPack()) {
    fs.mkdirSync(outPath, { recursive: true })
    const written: string[] = []

    for (const filePath of pack.list) {
      const bytes = await pack.extract(filePath)
      const dest = path.join(outPath, filePath)

      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, bytes)
      written.push(dest)
    }

    return written
  }
  if (pack.isDiff()) {
    throw new Error('extract: cannot extract a DiffPack — apply it first')
  }
  // FilePack — write the single payload.
  const bytes = await pack.content()

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, bytes)

  return [outPath]
}
