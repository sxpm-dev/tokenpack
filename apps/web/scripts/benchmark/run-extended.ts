/* eslint-disable no-console */
/**
 * Extended benchmark — decode each pre-generated token, measure timing.
 * Run: yarn workspace tokenpack-web benchmark:run:extended
 *
 * Requires: yarn workspace tokenpack-web benchmark:generate
 *
 * Outputs:
 *   apps/web/benchmark-results/results-extended.json  — per-algorithm rows
 *
 * The network simulation lives in `scripts/benchmark/run.ts`; this script focuses on
 * pure encode/decode timing per registered algorithm.
 *
 * Variance reduction (see `scripts/benchmark/measure.ts`):
 *   - 2 warmup runs per scenario, 10 timed samples
 *   - median + p95 + stddev reported on each row (not just mean)
 *   - opt-in GC between samples via NODE_OPTIONS=--expose-gc
 */

import { decode } from '@tokenpack/node'
import assert from 'node:assert/strict'

import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import fs from 'fs'
import path from 'path'

import { assertAllReferencedAlgosExist } from './bench-algos'
import { APP_BENCHMARK_RESULTS_DIR, NODE_BENCH_FIXTURE_DIR, listContentBenchInputs } from './fixture-corpus'
import { formatStats, measure, type Stats } from './measure'

const RESULTS_DIR = APP_BENCHMARK_RESULTS_DIR
const ENCODE_TIMES = path.join(RESULTS_DIR, 'encode-times.json')

fs.mkdirSync(RESULTS_DIR, { recursive: true })

const BENCH_TIMEOUT_MS = 60_000

interface Args {
  algos?: Set<string>
}

function parseArgs(argv: string[]): Args {
  let algos: Set<string> | undefined

  for (const arg of argv) {
    if (arg.startsWith('--algos=')) {
      algos = new Set(arg.slice('--algos='.length).split(',').filter(Boolean))
    } else {
      throw new Error(`unknown arg: ${arg}`)
    }
  }

  return { algos }
}

const fmtBytes = (b: number) =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

async function withTimeout<T>(ms: number, operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    })])
  } finally {
    clearTimeout(timer)
  }
}

const SOURCE_LABELS: Record<string, string> = {
  'client-spec-map': 'client-spec-map',
  'react-dom-client.development': 'react-dom-dev',
  'react-dom-client-production': 'react-dom-dev',
  'chunk-5mb': 'chunk-5mb',
}

interface EncodeTimeEntry {
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  algorithm: string
  surface: string
  compressor: string
  channels: number
  encodeMs: number
  tokenBytes: number
  originalBytes: number
  tokenFile: string
}

export interface ExtBenchRow {
  codecId: number
  codecName: string
  outerCompression: string
  channels: number
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  encodeMs: number
  decodeMs: number
  roundTripMs: number
  tokenBytes: number
  originalBytes: number
  ratio: number
  throughputMBps: number
  isStreaming: boolean
  isBrowserSafe: boolean
  error?: string
  surfaceId?: string
  compressorId?: string
  drawerName?: string
  optionsSummary?: string
  encodeStats?: Stats
  decodeStats?: Stats
  pathTaken?: 'stream' | 'batch'
}

async function decodeRaw(buf: Buffer, ext: string): Promise<Buffer> {
  const Ctor = await algorithmCatalog.detectFromBuffer(buf, ext)
  const algo = new Ctor({})

  return algo.decode(buf, { ext })
}

function buildBaseRow(entry: EncodeTimeEntry, error?: string): ExtBenchRow {
  let codecId = -1
  let isStreaming = false
  let isBrowserSafe = false
  let surfaceId: string | undefined
  let compressorId: string | undefined
  let drawerName: string | undefined
  let optionsSummary: string | undefined

  try {
    const Ctor = algorithmCatalog.getByName(entry.algorithm)

    codecId = Ctor.id
    isStreaming = Ctor.capabilities.streamable
    isBrowserSafe = Ctor.capabilities.environments.includes('browser')
    const instance = new Ctor({})

    surfaceId = (instance as unknown as { surface?: { id?: string } }).surface?.id ?? entry.surface
    compressorId =
      (instance as unknown as { compressor?: { id?: string } }).compressor?.id ?? entry.compressor
    drawerName = (instance as unknown as { drawer?: object }).drawer?.constructor?.name
    optionsSummary = formatOptions(
      (instance as unknown as { defaults?: Record<string, unknown> }).defaults,
    )
  } catch {
    surfaceId = entry.surface
    compressorId = entry.compressor
  }

  return {
    codecId,
    codecName: entry.algorithm,
    outerCompression: entry.compressor,
    channels: entry.channels,
    source: SOURCE_LABELS[entry.source] ?? entry.source,
    sourceId: entry.sourceId,
    chunkCount: entry.chunkCount,
    chunkIndex: entry.chunkIndex,
    encodeMs: Math.round(entry.encodeMs * 10) / 10,
    decodeMs: 0,
    roundTripMs: Math.round(entry.encodeMs * 10) / 10,
    tokenBytes: entry.tokenBytes,
    originalBytes: entry.originalBytes,
    ratio:
      entry.tokenBytes > 0
        ? Math.round((entry.tokenBytes / entry.originalBytes) * 10000) / 10000
        : 0,
    throughputMBps: 0,
    isStreaming,
    isBrowserSafe,
    error,
    surfaceId,
    compressorId,
    drawerName,
    optionsSummary,
  }
}

function formatOptions(defaults?: Record<string, unknown>): string {
  if (!defaults) return '—'
  const NOTABLE = ['cellSize', 'fecMode', 'streaming', 'channels'] as const
  const parts: string[] = []

  for (const key of NOTABLE) {
    const value = defaults[key]

    if (value === undefined || value === null) continue
    if (key === 'fecMode' && value === 'none') continue
    if (key === 'cellSize' && (value === 0 || value === 1)) continue
    if (key === 'streaming' && value === false) continue
    parts.push(`${key}=${String(value)}`)
  }

  return parts.length === 0 ? '—' : parts.join(', ')
}

function mergeRows(
  previous: ExtBenchRow[],
  next: ExtBenchRow[],
  algos?: Set<string>,
): ExtBenchRow[] {
  if (!algos) return next

  return [...previous.filter(row => !algos.has(row.codecName)), ...next]
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const expectedInputs = new Map(listContentBenchInputs().map(input => [input.id, input.bytes]))

  assertAllReferencedAlgosExist()

  if (!fs.existsSync(ENCODE_TIMES)) {
    console.error(`\nERROR: ${ENCODE_TIMES} not found.`)
    console.error('Run `yarn benchmark` first.\n')
    process.exit(1)
  }

  const entries = (JSON.parse(fs.readFileSync(ENCODE_TIMES, 'utf-8')) as EncodeTimeEntry[])
    .filter(entry => !args.algos || args.algos.has(entry.algorithm))
    .filter(entry =>
      algorithmCatalog
        .getByName(entry.algorithm)
        .capabilities.channels.includes(entry.channels as 1 | 2 | 3 | 4),
    )
  const total = entries.length

  console.log(
    `\n═══ Codec perf: decoding ${total} pre-generated tokens (warmup×2 + 10 samples) ═══\n`,
  )

  let done = 0
  const rows: ExtBenchRow[] = []
  const bySource = new Map<string, EncodeTimeEntry[]>()

  for (const e of entries) {
    const list = bySource.get(e.source) ?? []

    list.push(e)
    bySource.set(e.source, list)
  }

  for (const [sourceName, sourceEntries] of bySource) {
    console.log(`── ${sourceName} ──`)

    for (const entry of sourceEntries) {
      done++
      const label = `[${done}/${total}] ${entry.algorithm} c${entry.channels}`

      process.stdout.write(`  ${label.padEnd(46)}`)

      const tokenPath = entry.tokenFile ? path.join(NODE_BENCH_FIXTURE_DIR, entry.tokenFile) : ''

      if (!entry.tokenFile || !fs.existsSync(tokenPath)) {
        rows.push(buildBaseRow(entry, 'token file not found (encode failed during generate)'))
        console.log('SKIP — token missing')
        continue
      }

      try {
        const tokenBuf = fs.readFileSync(tokenPath)
        const ext = path.extname(tokenPath) || '.png'
        const pack = await decode(tokenBuf)
        assert.ok('content' in pack)
        assert.deepEqual(Buffer.from(await pack.content()), expectedInputs.get(entry.source), 'fixture roundtrip mismatch')

        // Single-decode timing call — wrapped in `measure()` for warmup +
        // multi-sample stats. Stream-vs-batch dispatch isn't relevant here
        // (the catalog's batch decode path handles both); pathTaken is set
        // from the algo capability for the dashboard's UX.
        const decodeStats = await withTimeout(
          BENCH_TIMEOUT_MS,
          measure(() => decodeRaw(tokenBuf, ext)),
        )

        const decodeMs = decodeStats.median
        const roundTripMs = entry.encodeMs + decodeMs
        const throughputMBps = entry.originalBytes / 1024 / 1024 / (roundTripMs / 1000)
        const ratio = entry.tokenBytes / entry.originalBytes
        const base = buildBaseRow(entry)
        const pathTaken: 'stream' | 'batch' = 'batch'

        rows.push({
          ...base,
          decodeMs: Math.round(decodeMs * 10) / 10,
          roundTripMs: Math.round(roundTripMs * 10) / 10,
          ratio: Math.round(ratio * 10000) / 10000,
          throughputMBps: Math.round(throughputMBps * 10) / 10,
          decodeStats,
          pathTaken,
        })
        console.log(
          `enc=${entry.encodeMs.toFixed(0).padStart(6)}ms  dec=${formatStats(decodeStats).padEnd(28)}  ratio=${(ratio * 100).toFixed(1).padStart(5)}%  ${fmtBytes(entry.tokenBytes)}`,
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)

        rows.push(buildBaseRow(entry, msg))
        console.log(`ERROR: ${msg}`)
      }
    }
    console.log()
  }

  const outPath = path.join(RESULTS_DIR, 'results-extended.json')
  const previousRows = fs.existsSync(outPath)
    ? (JSON.parse(fs.readFileSync(outPath, 'utf-8')) as ExtBenchRow[])
    : []
  const mergedRows = mergeRows(previousRows, rows, args.algos)

  fs.writeFileSync(outPath, JSON.stringify(mergedRows, null, 2))
  console.log(
    `Codec perf saved → ${outPath}  (${mergedRows.length} rows${args.algos ? `, ${rows.length} refreshed` : ''})`,
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
