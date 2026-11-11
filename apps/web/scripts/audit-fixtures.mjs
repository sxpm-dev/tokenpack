import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checked = new Map()
const prune = process.argv.includes('--prune')
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
function check(directory, file, bytes, hash) {
  const full = path.resolve(root, directory, file)
  assert(full.startsWith(path.resolve(root, directory) + path.sep), `Unsafe path: ${file}`)
  if (!checked.has(full)) {
    const data = fs.readFileSync(full)
    checked.set(full, { bytes: data.length, hash: createHash('sha256').update(data).digest('hex') })
  }
  const actual = checked.get(full)
  if (bytes !== undefined) assert.equal(actual.bytes, bytes, `Size mismatch: ${full}`)
  if (hash) assert.equal(actual.hash, hash, `Hash mismatch: ${full}`)
}
const sourceHash = createHash('sha256').update(fs.readFileSync(path.resolve(root, '../../benchmark/sources/client-spec-map.json'))).digest('hex')
for (const algo of ['pixel-range-none-c3', 'linear-deflate-c3']) {
  const file = `client-spec-map-root-records.${algo}.png`
  const metadata = json(`benchmark-fixtures/json-playground/${file}.meta.json`)
  assert.equal(metadata.sourceSha256, sourceHash, `Stale JSON fixture: ${file}`)
  check('benchmark-fixtures/json-playground', file, metadata.tokenBytes)
}
const runtime = json('benchmark-fixtures/runtime/manifest.json')
for (const item of runtime.fixtures) {
  check('benchmark-fixtures/runtime', item.file, item.bytes, item.sha256)
  for (const chunk of item.chunks ?? []) check('benchmark-fixtures/runtime', chunk.file, chunk.bytes, chunk.sha256)
}
const diff = json('benchmark-fixtures/apply-diff/manifest.json')
assert.deepEqual(diff.sizesKB, [...new Set(diff.cases.map(item => item.sizeKB))].sort((a,b) => a-b))
for (const item of diff.cases) {
  for (const native of item.native) check('benchmark-fixtures/apply-diff', native.file, native.bytes, native.sha256)
  for (const token of item.tokens) {
    for (const prefix of ['base', 'next', 'diff']) check('benchmark-fixtures/apply-diff', token[`${prefix}File`], token[`${prefix}Bytes`], token[`${prefix}Sha256`])
    if (token.rangePackFile) check('benchmark-fixtures/apply-diff', token.rangePackFile)
  }
}
for (const scenario of json('runtime-fixtures/manifest.json').scenarios) {
  for (const file of scenario.files) check(`runtime-fixtures/${scenario.scenarioId}`, file.path, file.bytes)
}
for (const item of json('benchmark-results/encode-times.json')) check('benchmark-fixtures/node', item.tokenFile, item.tokenBytes)
const archives = { zip: ['zip', 'zip'], gzip: ['gzip', 'gz'], deflate: ['deflate', 'deflate'], 'brotli-11': ['br11', 'br'], 'brotli-6': ['br6', 'br'] }
for (const item of json('benchmark-results/archive-times.json')) {
  const [prefix, ext] = archives[item.format]
  check('benchmark-fixtures/node', `${prefix}__${item.source}.${ext}`, item.bytes)
}
for (const size of ['small', 'medium', 'large']) {
  const directory = `public/bench-app/${size}/assets`
  const manifest = json(`${directory}/manifest.json`)
  for (const list of Object.values(manifest).filter(Array.isArray)) {
    for (const item of list) if (item.path) check(directory, item.path, item.bytes)
  }
}
// Only prune generated artifacts covered by an authoritative manifest/result list.
// Caches and public app shells are intentionally outside this allowlist.
let removed = 0
for (const directory of ['benchmark-fixtures/node', 'benchmark-fixtures/runtime', 'benchmark-fixtures/apply-diff', 'runtime-fixtures']) {
  for (const file of fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true })) {
    if (!file.isFile() || file.name === 'manifest.json') continue
    const full = path.join(file.parentPath, file.name)
    if (!checked.has(full) && prune) { fs.unlinkSync(full); removed++ }
  }
}
console.log(`Verified ${checked.size} fixture files; ${removed} obsolete generated files removed.`)
