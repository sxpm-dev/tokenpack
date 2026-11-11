import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const manifests = [
  'public/bench-app/small/assets/manifest.json',
  'public/bench-app/medium/assets/manifest.json',
  'public/bench-app/large/assets/manifest.json',
  'benchmark-fixtures/runtime/manifest.json',
  'benchmark-fixtures/apply-diff/manifest.json',
  'runtime-fixtures/manifest.json',
  'benchmark-fixtures/json-playground/client-spec-map-root-records.pixel-range-none-c3.png.meta.json',
]

export function fixtureFingerprint() {
  const hash = createHash('sha256')

  for (const file of manifests) {
    const full = path.join(process.cwd(), file)

    hash.update(file)
    if (existsSync(full)) hash.update(readFileSync(full))
  }

  return hash.digest('hex')
}
