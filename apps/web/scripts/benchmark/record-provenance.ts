import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { APP_BENCHMARK_RESULTS_DIR, BENCH_SOURCE_CONFIGS, loadBenchSource } from './fixture-corpus'
const results = ['results.json', 'results-extended.json', 'archive-times.json']
const artifacts = results.map(file => {
  const bytes = readFileSync(path.join(APP_BENCHMARK_RESULTS_DIR, file))
  const rows = JSON.parse(bytes.toString())
  if (!rows.length || rows.some((row: { error?: string }) => row.error)) throw new Error(`Invalid results: ${file}`)
  return { file, rows: rows.length, sha256: createHash('sha256').update(bytes).digest('hex') }
})
writeFileSync(path.join(APP_BENCHMARK_RESULTS_DIR, 'provenance.json'), JSON.stringify({
  createdAt: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch,
  sources: BENCH_SOURCE_CONFIGS.map(source => { const loaded = loadBenchSource(source); return { id: source.id, file: source.file, bytes: loaded.byteLength, sha256: loaded.sha256 } }),
  artifacts,
}, null, 2) + '\n')
