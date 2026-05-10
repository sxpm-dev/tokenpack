/* eslint-disable no-console */
/**
 * Tokenpack benchmark
 * Run: yarn workspace tokenpack-app benchmark:run
 *
 * Tests: token (per algorithm × channels) vs zip vs tar.gz vs deflate vs raw brotli.
 * Metrics: TTFB, fetch time, decode time, total, throughput.
 * Network: throttled local HTTP server simulating 4 conditions.
 *
 * Data-driven: reads `packages/app/benchmark-results/encode-times.json` (and
 * archive-times.json) to discover available token/archive fixtures. The
 * generator (scripts/benchmark/generate.ts) populates that JSON.
 */

import '@tokenpack/node'

import { decode, decodeStream, type Pack } from '@tokenpack/node'
import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import AdmZip from 'adm-zip'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { Bench } from 'tinybench'
import zlib from 'zlib'

import { assertAllReferencedAlgosExist } from './bench-algos'
import { APP_BENCHMARK_RESULTS_DIR, NODE_BENCH_FIXTURE_DIR } from './fixture-corpus'

const RESULTS_DIR = APP_BENCHMARK_RESULTS_DIR

fs.mkdirSync(RESULTS_DIR, { recursive: true })

// Sample budget for each (scenario × condition). Higher than the previous 3
// to drop variance — combined with WARMUP_RUNS this means each datapoint
// reflects the median of 10 timed runs after JIT/page-cache settles.
const RUNS = 10
const WARMUP_RUNS = 2
const COL = 14

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

// ── Network conditions ────────────────────────────────────────────────────

const CONDITIONS = [
  { name: 'local', latencyMs: 0, bandwidthBps: Infinity },
  { name: 'fast-cdn', latencyMs: 10, bandwidthBps: 100 * 1024 * 1024 },
  { name: 'average', latencyMs: 50, bandwidthBps: 10 * 1024 * 1024 },
  { name: 'slow', latencyMs: 100, bandwidthBps: 2 * 1024 * 1024 },
]

// ── Fixture discovery (data-driven from encode-times.json) ────────────────

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

interface ArchiveTimeEntry {
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  format: string
  encodeMs: number
  decodeMs: number
  bytes: number
  originalBytes: number
}

function loadEncodeTimes(): EncodeTimeEntry[] {
  const p = path.join(RESULTS_DIR, 'encode-times.json')

  if (!fs.existsSync(p)) {
    throw new Error(`missing ${p} — run \`yarn benchmark\` first`)
  }

  return JSON.parse(fs.readFileSync(p, 'utf8')) as EncodeTimeEntry[]
}

function loadArchiveTimes(): ArchiveTimeEntry[] {
  const p = path.join(RESULTS_DIR, 'archive-times.json')

  if (!fs.existsSync(p)) return []

  return JSON.parse(fs.readFileSync(p, 'utf8')) as ArchiveTimeEntry[]
}

// ── HTTP server with throttling ───────────────────────────────────────────

function startServer(condition: (typeof CONDITIONS)[0]): Promise<http.Server> {
  const { latencyMs, bandwidthBps } = condition
  const CHUNK = 256 * 1024

  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      const filePath = decodeURIComponent(req.url!.slice(1))

      if (!fs.existsSync(filePath)) {
        res.writeHead(404)
        res.end()

        return
      }
      await sleep(latencyMs)
      const stat = fs.statSync(filePath)

      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'application/octet-stream',
      })
      const stream = fs.createReadStream(filePath, { highWaterMark: CHUNK })

      for await (const chunk of stream) {
        res.write(chunk)
        if (isFinite(bandwidthBps)) await sleep((chunk.length / bandwidthBps) * 1000)
      }
      res.end()
    })

    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

interface FetchResult {
  buffer: Buffer
  ttfb: number
  fetchMs: number
}

function fetchBuffer(url: string): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const t0 = now()
    let ttfb = 0
    const chunks: Buffer[] = []

    http
      .get(url, res => {
        res.on('data', (c: Buffer) => {
          if (!ttfb) ttfb = now() - t0
          chunks.push(c)
        })
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), ttfb, fetchMs: now() - t0 }))
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

// ── Decode strategies ─────────────────────────────────────────────────────

interface RunResult {
  ttfb: number
  fetchMs: number
  decodeMs: number
  totalMs: number
  firstByteMs: number
  transferBytes: number
  decodedBytes: number
}

async function runBatchDecode(
  url: string,
  decodeBytes: (buf: Buffer) => number | Promise<number>,
): Promise<RunResult> {
  const { buffer, ttfb, fetchMs } = await fetchBuffer(url)
  const t = now()
  const decodedBytes = await decodeBytes(buffer)
  const decodeMs = now() - t
  const totalMs = fetchMs + decodeMs

  return {
    ttfb,
    fetchMs,
    decodeMs,
    totalMs,
    firstByteMs: totalMs,
    transferBytes: buffer.length,
    decodedBytes,
  }
}

function runTokenBatch(url: string): Promise<RunResult> {
  return runBatchDecode(url, async buf => {
    const pack = await decode(buf)

    return decodedPackBytes(pack)
  })
}

async function runTokenStream(url: string): Promise<RunResult> {
  const t0 = now()
  let ttfb = 0
  let fetchMs = 0
  let firstByteMs = 0
  let transferBytes = 0

  const pack = await new Promise<Awaited<ReturnType<typeof decodeStream>>>((resolve, reject) => {
    http
      .get(url, res => {
        async function* chunks() {
          for await (const c of res) {
            const chunk = c as Buffer

            if (!ttfb) ttfb = now() - t0
            transferBytes += chunk.length
            yield chunk
          }
          fetchMs = now() - t0
        }

        decodeStream(chunks(), {
          onFirstDecodedChunk() {
            if (!firstByteMs) firstByteMs = now() - t0
          },
        }).then(resolve, reject)
      })
      .on('error', reject)
  })

  const totalMs = now() - t0

  // Pixel-data streams report the first decoded payload chunk through the hook above.
  // Pixel-range stream variants can expose their payload as soon as the early tpAK
  // chunk is read, but the public Pack API currently returns only after decode()
  // resolves. Use TTFB instead of total so the column remains "earliest useful
  // byte reached the decoder", not "whole stream finished".
  if (!firstByteMs) firstByteMs = ttfb || totalMs
  const decodedBytes = await decodedPackBytes(pack)

  return {
    ttfb,
    fetchMs,
    decodeMs: totalMs - fetchMs,
    totalMs,
    firstByteMs,
    transferBytes,
    decodedBytes,
  }
}

async function decodedPackBytes(pack: Pack): Promise<number> {
  if (pack.isPack()) {
    const entries = await pack.extractAll()

    return entries.reduce((sum, e) => sum + e.bytes.byteLength, 0)
  }
  if (pack.isDiff()) return 0

  return (await pack.content()).byteLength
}

function runZip(url: string): Promise<RunResult> {
  return runBatchDecode(url, buf => {
    const zip = new AdmZip(buf)
    let bytes = 0

    for (const e of zip.getEntries()) if (!e.isDirectory) bytes += e.getData().length

    return bytes
  })
}

function runTarGz(url: string): Promise<RunResult> {
  return runBatchDecode(url, buf => zlib.gunzipSync(buf).length)
}

function runDeflate(url: string): Promise<RunResult> {
  return runBatchDecode(url, buf => zlib.inflateSync(buf).length)
}

function runBrotli(url: string): Promise<RunResult> {
  return runBatchDecode(url, buf => zlib.brotliDecompressSync(buf).length)
}

// ── Scenario assembly per source ──────────────────────────────────────────

interface Scenario {
  name: string
  file: string
  run: (url: string) => Promise<RunResult>
  /** Set for token scenarios — undefined for archive baselines. */
  pathTaken?: 'stream' | 'batch'
}

function isStreamableAlgorithm(name: string): boolean {
  try {
    return algorithmCatalog.getByName(name).capabilities.streamable
  } catch {
    return false
  }
}

function fmtScenarioName(e: EncodeTimeEntry): string {
  return `${e.algorithm}-c${e.channels}`
}

function supportsEntryChannel(e: EncodeTimeEntry): boolean {
  try {
    return algorithmCatalog
      .getByName(e.algorithm)
      .capabilities.channels.includes(e.channels as 1 | 2 | 3 | 4)
  } catch {
    return false
  }
}

function getScenarios(source: string, encodeTimes: EncodeTimeEntry[]): Scenario[] {
  const TOKENS_DIR = NODE_BENCH_FIXTURE_DIR
  const scenarios: Scenario[] = []

  for (const e of encodeTimes) {
    if (e.source !== source) continue
    if (!e.tokenFile) continue
    if (!supportsEntryChannel(e)) continue
    const fileAbs = path.join(TOKENS_DIR, e.tokenFile)

    if (!fs.existsSync(fileAbs)) continue
    const stream = isStreamableAlgorithm(e.algorithm)

    scenarios.push({
      name: fmtScenarioName(e),
      file: fileAbs,
      run: stream ? runTokenStream : runTokenBatch,
      pathTaken: stream ? 'stream' : 'batch',
    })
  }

  // Archive baselines (zip/tar.gz/deflate/brotli) — match by source name.
  const brExt = source.startsWith('fs-') ? '.tar.br' : '.br'
  const archiveCandidates: { name: string; file: string; run: Scenario['run'] }[] = [
    { name: 'zip', file: path.join(TOKENS_DIR, `zip__${source}.zip`), run: runZip },
    { name: 'tar.gz', file: path.join(TOKENS_DIR, `targz__${source}.tar.gz`), run: runTarGz },
    {
      name: 'deflate',
      file: path.join(TOKENS_DIR, `deflate__${source}.deflate`),
      run: runDeflate,
    },
    { name: 'brotli-11', file: path.join(TOKENS_DIR, `br11__${source}${brExt}`), run: runBrotli },
    { name: 'brotli-6', file: path.join(TOKENS_DIR, `br6__${source}${brExt}`), run: runBrotli },
  ]

  for (const a of archiveCandidates) if (fs.existsSync(a.file)) scenarios.push(a)

  return scenarios
}

// ── Utilities ─────────────────────────────────────────────────────────────

const now = () => performance.now()
const sleep = (ms: number) => (ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve())
const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
const median = (arr: number[]) => {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const n = sorted.length

  return n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
}
const stddev = (arr: number[]) => {
  if (arr.length === 0) return 0
  const m = avg(arr)

  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}
const settle = () => new Promise<void>(resolve => setImmediate(resolve))
const fmtMs = (ms: number) => (ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`)
const fmtBytes = (b: number) =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

interface ResultRow extends RunResult {
  scenario: string
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  condition: string
  throughputMBps: number
  /** Whether the runner used the streaming decode path. Lets the dashboard
   *  confirm dispatch was correct per algo's `streamable` capability. */
  pathTaken?: 'stream' | 'batch'
  /** Stddev of `totalMs` across timed samples — high stddev = jitter. */
  totalMsStddev?: number
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('Tokenpack Benchmark')
  console.log('===================')

  assertAllReferencedAlgosExist()
  const encodeTimes = loadEncodeTimes().filter(e => !args.algos || args.algos.has(e.algorithm))
  const sources = [...new Set(encodeTimes.map(e => e.source))]

  if (sources.length === 0) {
    console.log('No encode-times entries; run `yarn benchmark` first.')

    return
  }

  // Reference archives — only logged for awareness; included via getScenarios.
  loadArchiveTimes()

  // Dispatch audit — print the stream-vs-batch path picked for each token
  // scenario before running. Lets you eyeball that a streamable algo really
  // hits the streaming path.
  console.log('\n── dispatch ──')
  const auditScenarios = getScenarios(sources[0], encodeTimes)

  for (const s of auditScenarios) {
    if (s.pathTaken) console.log(`  [${s.pathTaken}] ${s.name}`)
  }

  const allResults: ResultRow[] = []

  for (const cond of CONDITIONS) {
    console.log(
      `\n── ${cond.name}  (latency=${cond.latencyMs}ms  bw=${isFinite(cond.bandwidthBps) ? fmtBytes(cond.bandwidthBps) + '/s' : '∞'}) ──`,
    )

    const server = await startServer(cond)
    const port = (server.address() as { port: number }).port
    const base = `http://127.0.0.1:${port}`

    for (const source of sources) {
      console.log(`\n  [${source}]`)
      const scenarios = getScenarios(source, encodeTimes)
      const sourceMeta = encodeTimes.find(e => e.source === source)

      for (const scenario of scenarios) {
        const runs: RunResult[] = []
        const url = `${base}/${encodeURIComponent(scenario.file)}`
        let collecting = false
        const bench = new Bench({
          iterations: RUNS,
          time: 0,
          warmupIterations: WARMUP_RUNS,
          warmupTime: 0,
          throws: true,
          setup: async (_task, mode) => {
            if (mode !== 'run') return
            ;(globalThis as { gc?: () => void }).gc?.()
            await settle()
          },
        })

        process.stdout.write(`    ${scenario.name.padEnd(COL)} `)

        bench.add('server-fetch', async () => {
          const result = await scenario.run(url)

          if (collecting) {
            runs.push(result)
            process.stdout.write('.')
          } else {
            process.stdout.write('w')
          }
        })
        let failure: unknown

        try {
          await bench.warmup()
          collecting = true
          await bench.run()
        } catch (e) {
          failure = e
          process.stdout.write('x')
        }

        if (!runs.length) {
          const msg = failure instanceof Error ? failure.message : String(failure ?? 'no samples')

          console.log(` FAILED — ${msg}`)
          continue
        }

        const totalSamples = bench.tasks[0]?.result?.samples ?? []

        totalSamples.forEach((totalMs, index) => {
          if (runs[index]) runs[index] = { ...runs[index], totalMs }
        })
        // Median is more representative than mean when network jitter spikes.
        const totals = runs.map(r => r.totalMs)
        const decodes = runs.map(r => r.decodeMs)
        const transfers = runs.map(r => r.transferBytes)
        const decoded = runs.map(r => r.decodedBytes)
        const medianTotal = median(totals)
        const row: ResultRow = {
          scenario: scenario.name,
          source,
          sourceId: sourceMeta?.sourceId,
          chunkCount: sourceMeta?.chunkCount,
          chunkIndex: sourceMeta?.chunkIndex,
          condition: cond.name,
          ttfb: median(runs.map(r => r.ttfb)),
          fetchMs: median(runs.map(r => r.fetchMs)),
          decodeMs: median(decodes),
          totalMs: medianTotal,
          firstByteMs: median(runs.map(r => r.firstByteMs)),
          transferBytes: median(transfers),
          decodedBytes: median(decoded),
          throughputMBps:
            medianTotal > 0 ? median(decoded) / 1024 / 1024 / (medianTotal / 1000) : 0,
          pathTaken: scenario.pathTaken,
          totalMsStddev: stddev(totals),
        }

        allResults.push(row)
        process.stdout.write(
          `  ttfb=${fmtMs(row.ttfb).padStart(8)}` +
            `  total=${fmtMs(row.totalMs).padStart(8)}` +
            `  1st=${fmtMs(row.firstByteMs).padStart(8)}` +
            `  decode=${fmtMs(row.decodeMs).padStart(8)}` +
            `  size=${fmtBytes(row.transferBytes).padStart(7)}` +
            `  ${row.throughputMBps.toFixed(1)}MB/s\n`,
        )
      }
    }

    await new Promise<void>(r => server.close(() => r()))
  }

  console.log('\n\n══ SUMMARY (avg across all sources) ══\n')
  const scenarioOrder = [
    ...new Set(allResults.filter(r => r.condition === CONDITIONS[0].name).map(r => r.scenario)),
  ]

  for (const cond of CONDITIONS) {
    console.log(`${cond.name}:`)
    console.log(
      '  ' +
        ['scenario', 'ttfb', 'total', 'decode', 'transfer', 'MB/s']
          .map(c => c.padEnd(COL))
          .join(''),
    )
    console.log('  ' + '─'.repeat(COL * 6 + 2))
    for (const sName of scenarioOrder) {
      const rows = allResults.filter(r => r.scenario === sName && r.condition === cond.name)

      if (!rows.length) continue
      console.log(
        '  ' +
          [
            sName,
            fmtMs(avg(rows.map(r => r.ttfb))),
            fmtMs(avg(rows.map(r => r.totalMs))),
            fmtMs(avg(rows.map(r => r.decodeMs))),
            fmtBytes(avg(rows.map(r => r.transferBytes))),
            avg(rows.map(r => r.throughputMBps)).toFixed(1),
          ]
            .map(v => v.padEnd(COL))
            .join(''),
      )
    }
    console.log()
  }

  const outPath = path.join(RESULTS_DIR, 'results.json')
  const previousResults = fs.existsSync(outPath)
    ? (JSON.parse(fs.readFileSync(outPath, 'utf-8')) as ResultRow[])
    : []
  const mergedResults = mergeRows(previousResults, allResults, args.algos)

  fs.writeFileSync(outPath, JSON.stringify(mergedResults, null, 2))
  console.log(
    `Results saved → ${outPath}  (${mergedResults.length} rows${args.algos ? `, ${allResults.length} refreshed` : ''})`,
  )
}

function mergeRows(previous: ResultRow[], next: ResultRow[], algos?: Set<string>): ResultRow[] {
  if (!algos) return next

  return [...previous.filter(row => !scenarioMatchesAlgos(row.scenario, algos)), ...next]
}

function scenarioMatchesAlgos(scenario: string, algos: Set<string>): boolean {
  const match = /^(.*)-c[1-4]$/.exec(scenario)

  return !!match && algos.has(match[1])
}

main().catch(console.error)
