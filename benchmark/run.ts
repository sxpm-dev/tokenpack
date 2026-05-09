/**
 * Tokenpack benchmark
 * Run: yarn tsx benchmark/run.ts
 *
 * Tests: token (per algorithm × channels) vs zip vs tar.gz vs raw brotli.
 * Metrics: TTFB, fetch time, decode time, total, throughput.
 * Network: throttled local HTTP server simulating 4 conditions.
 *
 * Data-driven: reads `packages/app/benchmark-results/encode-times.json` (and
 * archive-times.json) to discover available token/archive fixtures. The
 * generator (benchmark/generate.ts) populates that JSON.
 */

import '@tokenpack/node'

import { decodeStream as createTokenDecodeStream } from '@tokenpack/node'
import AdmZip from 'adm-zip'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

import { assertAllReferencedAlgosExist } from './bench-algos'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(HERE, '..')
const RESULTS_DIR = path.join(REPO_ROOT, 'packages', 'app', 'benchmark-results')

fs.mkdirSync(RESULTS_DIR, { recursive: true })

// Sample budget for each (scenario × condition). Higher than the previous 3
// to drop variance — combined with WARMUP_RUNS this means each datapoint
// reflects the median of 10 timed runs after JIT/page-cache settles.
const RUNS = 10
const WARMUP_RUNS = 2
const COL = 14

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
  format: string
  encodeMs: number
  decodeMs: number
  bytes: number
  originalBytes: number
}

function loadEncodeTimes(): EncodeTimeEntry[] {
  const p = path.join(RESULTS_DIR, 'encode-times.json')

  if (!fs.existsSync(p)) {
    throw new Error(`missing ${p} — run \`yarn benchmark:generate\` first`)
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
  const CHUNK = 8 * 1024

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
  decode: (buf: Buffer) => number | Promise<number>,
): Promise<RunResult> {
  const { buffer, ttfb, fetchMs } = await fetchBuffer(url)
  const t = now()
  const decodedBytes = await decode(buffer)
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

async function decodeRaw(buf: Buffer, ext: string): Promise<Buffer> {
  const Ctor = await algorithmCatalog.detectFromBuffer(buf, ext)
  const algo = new Ctor({})

  return algo.decode(buf, { ext })
}

function runTokenBatch(url: string, ext: string): Promise<RunResult> {
  return runBatchDecode(url, buf => decodeRaw(buf, ext).then(d => d.length))
}

async function runTokenStream(url: string): Promise<RunResult> {
  const t0 = now()
  let ttfb = 0
  let fetchMs = 0
  let firstByteMs = 0
  let transferBytes = 0
  const chunks: Buffer[] = []

  await new Promise<void>((resolve, reject) => {
    const decoder = createTokenDecodeStream()

    decoder.once('data', (c: Buffer) => {
      firstByteMs = now() - t0
      chunks.push(c)
    })
    decoder.on('data', (c: Buffer) => chunks.push(c))
    decoder.on('end', resolve)
    decoder.on('error', reject)

    http
      .get(url, res => {
        res.on('data', (c: Buffer) => {
          if (!ttfb) ttfb = now() - t0
          transferBytes += c.length
          decoder.write(c)
        })
        res.on('end', () => {
          fetchMs = now() - t0
          decoder.end()
        })
        res.on('error', reject)
      })
      .on('error', reject)
  })

  const totalMs = now() - t0
  const decodedBytes = chunks.reduce((sum, c) => sum + c.length, 0)

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

function runBrotli(url: string): Promise<RunResult> {
  return runBatchDecode(url, buf => zlib.brotliDecompressSync(buf).length)
}

// ── Scenario assembly per source ──────────────────────────────────────────

interface Scenario {
  name: string
  file: string
  run: (url: string) => Promise<RunResult>
  /** Set for token scenarios — undefined for archive baselines (zip/tar.gz/brotli). */
  pathTaken?: 'stream' | 'batch'
}

function isStreamSurface(surfaceId: string): boolean {
  return surfaceId === 'png-stream'
}

function fmtScenarioName(e: EncodeTimeEntry): string {
  return `${e.algorithm}-c${e.channels}`
}

function getScenarios(source: string, encodeTimes: EncodeTimeEntry[]): Scenario[] {
  const TOKENS_DIR = path.join(HERE, 'tokens')
  const scenarios: Scenario[] = []

  for (const e of encodeTimes) {
    if (e.source !== source) continue
    if (!e.tokenFile) continue
    const fileAbs = path.join(REPO_ROOT, 'benchmark', e.tokenFile)
    const ext = path.extname(fileAbs) || '.png'

    if (!fs.existsSync(fileAbs)) continue
    const stream = isStreamSurface(e.surface)

    scenarios.push({
      name: fmtScenarioName(e),
      file: fileAbs,
      run: stream ? runTokenStream : (u => runTokenBatch(u, ext)),
      pathTaken: stream ? 'stream' : 'batch',
    })
  }

  // Archive baselines (zip/tar.gz/brotli) — match by source name.
  const brExt = source.startsWith('fs-') ? '.tar.br' : '.br'
  const archiveCandidates: { name: string; file: string; run: Scenario['run'] }[] = [
    { name: 'zip', file: path.join(TOKENS_DIR, `zip__${source}.zip`), run: runZip },
    { name: 'tar.gz', file: path.join(TOKENS_DIR, `targz__${source}.tar.gz`), run: runTarGz },
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
  condition: string
  throughputMBps: number
  /** Whether the runner used the streaming decode path. Lets the dashboard
   *  confirm dispatch was correct per algo's `streamable` capability. */
  pathTaken?: 'stream' | 'batch'
  /** Stddev of `totalMs` across timed samples — high stddev = jitter. */
  totalMsStddev?: number
}

async function main() {
  console.log('Tokenpack Benchmark')
  console.log('===================')

  assertAllReferencedAlgosExist()
  const encodeTimes = loadEncodeTimes()
  const sources = [...new Set(encodeTimes.map(e => e.source))]

  if (sources.length === 0) {
    console.log('No encode-times entries; run `yarn benchmark:generate` first.')

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

      for (const scenario of scenarios) {
        const runs: RunResult[] = []

        process.stdout.write(`    ${scenario.name.padEnd(COL)} `)
        // Warmup runs first — JIT, DNS, TCP slow-start. Discarded.
        for (let r = 0; r < WARMUP_RUNS; r++) {
          try {
            await scenario.run(`${base}/${encodeURIComponent(scenario.file)}`)
            process.stdout.write('w')
          } catch {
            process.stdout.write('x')
          }
        }
        // Optional GC between warmup and timed samples — `--expose-gc` only.
        ;(globalThis as { gc?: () => void }).gc?.()
        for (let r = 0; r < RUNS; r++) {
          try {
            runs.push(await scenario.run(`${base}/${encodeURIComponent(scenario.file)}`))
            process.stdout.write('.')
          } catch {
            process.stdout.write('x')
          }
        }
        if (!runs.length) {
          console.log(' FAILED')
          continue
        }

        // Median is more representative than mean when network jitter spikes.
        const totals = runs.map(r => r.totalMs)
        const decodes = runs.map(r => r.decodeMs)
        const transfers = runs.map(r => r.transferBytes)
        const decoded = runs.map(r => r.decodedBytes)
        const medianTotal = median(totals)
        const row: ResultRow = {
          scenario: scenario.name,
          source,
          condition: cond.name,
          ttfb: median(runs.map(r => r.ttfb)),
          fetchMs: median(runs.map(r => r.fetchMs)),
          decodeMs: median(decodes),
          totalMs: medianTotal,
          firstByteMs: median(runs.map(r => r.firstByteMs)),
          transferBytes: median(transfers),
          decodedBytes: median(decoded),
          throughputMBps: medianTotal > 0 ? median(decoded) / 1024 / 1024 / (medianTotal / 1000) : 0,
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

  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2))
  console.log(`Results saved → ${outPath}`)
}

main().catch(console.error)
