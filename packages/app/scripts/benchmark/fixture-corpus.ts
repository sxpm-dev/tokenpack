import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

export const APP_ROOT = path.resolve(HERE, '..', '..')
export const REPO_ROOT = path.resolve(APP_ROOT, '..', '..')
export const BENCHMARK_SOURCE_DIR = path.join(REPO_ROOT, 'benchmark', 'sources')
export const APP_BENCHMARK_FIXTURE_DIR = path.join(APP_ROOT, 'benchmark-fixtures')
export const NODE_BENCH_FIXTURE_DIR = path.join(APP_BENCHMARK_FIXTURE_DIR, 'node')
export const APP_RUNTIME_FIXTURE_DIR = path.join(APP_BENCHMARK_FIXTURE_DIR, 'runtime')
export const APP_RUNTIME_CACHE_DIR = path.join(APP_BENCHMARK_FIXTURE_DIR, '.runtime-cache')
export const APP_BENCHMARK_RESULTS_DIR = path.join(APP_ROOT, 'benchmark-results')

export const RUNTIME_CHUNK_COUNTS = [1, 2, 5, 15, 20] as const
export const NODE_BENCH_CHUNK_COUNTS = [1] as const

export type BenchSourceKind = 'json' | 'text'

export interface BenchSourceConfig {
  id: string
  file: string
  kind: BenchSourceKind
}

export interface LoadedBenchSource extends BenchSourceConfig {
  bytes: Buffer
  text: string
  byteLength: number
  textLength: number
  sha256: string
}

export interface ContentBenchInput {
  id: string
  sourceId: string
  sourceFile: string
  sourceKind: BenchSourceKind
  chunkCount: number
  chunkIndex: number
  bytes: Buffer
  sha256: string
}

export interface ContentExpectation {
  source: string
  kind: BenchSourceKind
  chunkCount: number
  expectedTextLength?: number
  expectedJsonKeys?: number
  expectedSha256: string
}

export interface ScriptExpectation {
  source: string
  chunkCount: number
  caseId: string
  expectedChunkCount: number
  expectedPayloadLength: number
  expectedPayloadSha256: string
}

export const BENCH_SOURCE_CONFIGS: readonly BenchSourceConfig[] = [
  { id: 'client-spec-map', file: 'client-spec-map.json', kind: 'json' },
  { id: 'react-dom-client-development', file: 'react-dom-client.development.js', kind: 'text' },
  { id: 'chunk-5mb', file: 'chunk-5mb.js', kind: 'text' },
]

export const RUNTIME_BENCH_SOURCE_CONFIGS: readonly BenchSourceConfig[] = [
  ...BENCH_SOURCE_CONFIGS,
  { id: 'client-spec-map-text', file: 'client-spec-map.json', kind: 'text' },
]

export function selectedBenchSources(sourceIds: Set<string> | null): BenchSourceConfig[] {
  return BENCH_SOURCE_CONFIGS.filter(source => !sourceIds || sourceIds.has(source.id))
}

export function selectedRuntimeBenchSources(sourceIds: Set<string> | null): BenchSourceConfig[] {
  return RUNTIME_BENCH_SOURCE_CONFIGS.filter(source => {
    if (!sourceIds) return true
    if (sourceIds.has(source.id)) return true

    return source.file === 'client-spec-map.json' && sourceIds.has('client-spec-map')
  })
}

export function loadBenchSource(source: BenchSourceConfig): LoadedBenchSource {
  const bytes = fs.readFileSync(path.join(BENCHMARK_SOURCE_DIR, source.file))
  const text = bytes.toString('utf-8')

  return {
    ...source,
    bytes,
    text,
    byteLength: bytes.byteLength,
    textLength: text.length,
    sha256: sha256(bytes),
  }
}

export function splitContentChunks(source: LoadedBenchSource, chunkCount: number): Buffer[] {
  if (source.kind === 'json') return splitJsonObject(source.text, chunkCount)

  return splitText(source.text, chunkCount).map(text => Buffer.from(text, 'utf-8'))
}

export function listContentBenchInputs(
  sources: readonly BenchSourceConfig[] = BENCH_SOURCE_CONFIGS,
  chunkCounts: readonly number[] = NODE_BENCH_CHUNK_COUNTS,
): ContentBenchInput[] {
  const inputs: ContentBenchInput[] = []

  for (const sourceConfig of sources) {
    const source = loadBenchSource(sourceConfig)

    for (const chunkCount of chunkCounts) {
      const chunks = splitContentChunks(source, chunkCount)

      chunks.forEach((bytes, chunkIndex) => {
        inputs.push({
          id: `${source.id}__chunks-${chunkCount}__chunk-${padChunk(chunkIndex)}`,
          sourceId: source.id,
          sourceFile: source.file,
          sourceKind: source.kind,
          chunkCount,
          chunkIndex,
          bytes,
          sha256: sha256(bytes),
        })
      })
    }
  }

  return inputs
}

export function splitScriptChunks(source: LoadedBenchSource, chunkCount: number): Buffer[] {
  const caseId = runtimeStrategyId(source.id, chunkCount)
  const payloadChunks = splitText(makeScriptPayload(source, chunkCount), chunkCount)
  const expectedPayloadLength = payloadChunks.reduce((sum, payload) => sum + payload.length, 0)
  const expectedPayloadSha256 = sha256(Buffer.from(payloadChunks.join(''), 'utf-8'))

  return payloadChunks.map((payload, index) => {
    const record = {
      caseId,
      source: source.id,
      sourceFile: source.file,
      chunkCount,
      chunkIndex: index,
      payload,
    }
    const script = `;(() => {
  const record = ${JSON.stringify(record)};
  const registry = (globalThis.__tokenpackRuntimeBench ||= { scriptChunks: {} });
  const state = (registry.scriptChunks[record.caseId] ||= {
    source: record.source,
    chunkCount: record.chunkCount,
    loaded: [],
    totalPayloadLength: 0,
    expectedPayloadLength: ${expectedPayloadLength},
    expectedPayloadSha256: ${JSON.stringify(expectedPayloadSha256)}
  });
  state.loaded[record.chunkIndex] = true;
  state.totalPayloadLength += record.payload.length;
  const stage = typeof document === 'undefined' ? null : document.getElementById('runtime-bench-stage');
  if (stage) stage.setAttribute('data-runtime-bench-' + record.caseId, String(state.loaded.filter(Boolean).length));
  const callbacks = globalThis.__benchmarkResult;
  const callback = callbacks && callbacks[record.caseId];
  if (typeof callback === 'function') {
    callback({
      caseId: record.caseId,
      source: record.source,
      chunkCount: record.chunkCount,
      chunkIndex: record.chunkIndex,
      payloadLength: record.payload.length,
      loadedCount: state.loaded.filter(Boolean).length,
      totalPayloadLength: state.totalPayloadLength,
      expectedPayloadLength: state.expectedPayloadLength,
      expectedPayloadSha256: state.expectedPayloadSha256
    });
  }
})();`

    return Buffer.from(script, 'utf-8')
  })
}

export function contentExpectation(
  source: LoadedBenchSource,
  chunkCount: number,
): ContentExpectation {
  if (source.kind === 'json') {
    const parsed = JSON.parse(source.text) as Record<string, unknown>

    return {
      source: source.id,
      kind: source.kind,
      chunkCount,
      expectedJsonKeys: Object.keys(parsed).length,
      expectedSha256: source.sha256,
    }
  }

  return {
    source: source.id,
    kind: source.kind,
    chunkCount,
    expectedTextLength: source.textLength,
    expectedSha256: source.sha256,
  }
}

export function scriptExpectation(
  source: LoadedBenchSource,
  chunkCount: number,
): ScriptExpectation {
  const payload = makeScriptPayload(source, chunkCount)

  return {
    source: source.id,
    chunkCount,
    caseId: runtimeStrategyId(source.id, chunkCount),
    expectedChunkCount: chunkCount,
    expectedPayloadLength: payload.length,
    expectedPayloadSha256: sha256(Buffer.from(payload, 'utf-8')),
  }
}

export function runtimeStrategyId(source: string, chunkCount: number): string {
  return `${source}__chunks-${chunkCount}`
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function splitJsonObject(text: string, chunkCount: number): Buffer[] {
  const parsed = JSON.parse(text) as Record<string, unknown>
  const entries = Object.entries(parsed)
  const chunks: Buffer[] = []

  for (let index = 0; index < chunkCount; index += 1) {
    const part = Object.fromEntries(pickEvenSlice(entries, index, chunkCount))

    chunks.push(Buffer.from(JSON.stringify(part), 'utf-8'))
  }

  return chunks
}

function splitText(text: string, chunkCount: number): string[] {
  const out: string[] = []
  const size = Math.ceil(text.length / chunkCount)

  for (let index = 0; index < chunkCount; index += 1) {
    out.push(text.slice(index * size, Math.min(text.length, (index + 1) * size)))
  }

  return out
}

function makeScriptPayload(source: LoadedBenchSource, chunkCount: number): string {
  const targetLength = source.textLength
  const prefix = JSON.stringify({
    source: source.id,
    sourceFile: source.file,
    chunkCount,
    sourceSha256: source.sha256,
    kind: 'runtime-script-payload',
  })
  const fillerLength = Math.max(0, targetLength - prefix.length)
  const fillerUnit = `${source.id}:${chunkCount}:`
  let filler = ''

  while (filler.length < fillerLength) filler += fillerUnit

  return prefix + filler.slice(0, fillerLength)
}

function pickEvenSlice<T>(items: T[], index: number, chunkCount: number): T[] {
  const size = Math.ceil(items.length / chunkCount)

  return items.slice(index * size, Math.min(items.length, (index + 1) * size))
}

function padChunk(index: number): string {
  return String(index).padStart(2, '0')
}
