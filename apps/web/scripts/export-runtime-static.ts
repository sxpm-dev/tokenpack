import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliDecompressSync } from 'node:zlib'
import { GET } from '../src/app/api/runtime-benchmark/manifest/route'
const output = process.argv[2]
if (!output) throw new Error('Expected output directory')
const root = path.resolve('benchmark-fixtures/runtime')
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'))
const mappings: Record<string, string> = {}
await mkdir(output, { recursive: true })
for (const f of manifest.fixtures) {
  const key = `${f.tab}:${f.source}__chunks-${f.chunkCount}:${f.kind}:${f.chunkIndex ?? 0}:${f.algo ?? ''}:${f.channels ?? ''}`
  let file = f.file
  if (f.kind === 'native') {
    if (f.encoding !== 'brotli') continue
    file += f.tab === 'script' ? '.js' : '.txt'
    await mkdir(path.dirname(path.join(output, file)), { recursive: true })
    await writeFile(path.join(output, file), brotliDecompressSync(await readFile(path.join(root, f.file))))
  } else {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true })
    await cp(path.join(root, file), path.join(output, file))
    for (const chunk of f.chunks ?? []) await cp(path.join(root, chunk.file), path.join(output, chunk.file))
  }
  mappings[key] = file
}
const response = await GET()
const view = await response.json()
if (!view.runtimeFixtures?.available) throw new Error('Runtime fixtures missing')
await writeFile(path.join(output, 'manifest.json'), JSON.stringify({ ...view, staticFiles: mappings }))
