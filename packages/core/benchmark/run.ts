/**
 * Tokenpack benchmark
 * Run: yarn tsx benchmark/run.ts
 *
 * Tests: token (max / stream) vs zip vs tar.gz vs raw brotli
 * Metrics: TTFB, fetch time, decode time, total, throughput
 * Network: throttled local HTTP server simulating 4 conditions
 */

import '../src/algorithms/register-all'

import AdmZip from 'adm-zip'
import fs from 'fs'
import http from 'http'
import path from 'path'
import zlib from 'zlib'

import { decodeFromBuffer } from '../src/decoder'
import { createTokenDecodeStream } from '../src/stream-decoder'

const ROOT = path.join(import.meta.dirname, '..', '..', '..')
const TOKENS_DIR = path.join(ROOT, 'benchmark/tokens')
const ARCHIVES_DIR = path.join(ROOT, 'benchmark/archives')
const RUNS = 3
const COL = 14 // summary table column width

// ── Network conditions ────────────────────────────────────────────────────

const CONDITIONS = [
  { name: 'local', latencyMs: 0, bandwidthBps: Infinity },
  { name: 'fast-cdn', latencyMs: 10, bandwidthBps: 100 * 1024 * 1024 },
  { name: 'average', latencyMs: 50, bandwidthBps: 10 * 1024 * 1024 },
  { name: 'slow', latencyMs: 100, bandwidthBps: 2 * 1024 * 1024 },
]

const SOURCES = [
  'react-dom-client.development',
  'react-dom-client.production',
  'screenshot',
  'fs-src-tests-docs',
]

// ── Throttled HTTP server ─────────────────────────────────────────────────

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

// ── HTTP helpers ──────────────────────────────────────────────────────────

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
  firstByteMs: number // time to first decoded byte (equals totalMs for batch; shows streaming overlap
  transferBytes: number
  decodedBytes: number
}

// Shared helper for fetch-then-decode scenarios (token-max, zip, tar.gz, brotli).
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

function runTokenMax(url: string, ext: string): Promise<RunResult> {
  return runBatchDecode(url, buf => decodeFromBuffer(buf, undefined, ext).then(d => d.length))
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

  // decodeMs = tail after last network byte — approaches 0 when decode keeps up with download.
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

// ── Scenarios per source ──────────────────────────────────────────────────

type Scenario = { name: string; file: string; run: (url: string) => Promise<RunResult> }

function getScenarios(source: string): Scenario[] {
  const brExt = source.startsWith('fs-') ? '.tar.br' : '.br'

  return [
    {
      name: 'max-webp3',
      file: path.join(TOKENS_DIR, `max-webp3__${source}.webp`),
      run: u => runTokenMax(u, '.webp'),
    },
    {
      name: 'max-png3',
      file: path.join(TOKENS_DIR, `max-png3__${source}.png`),
      run: u => runTokenMax(u, '.png'),
    },
    {
      name: 'max-png4',
      file: path.join(TOKENS_DIR, `max-png4__${source}.png`),
      run: u => runTokenMax(u, '.png'),
    },
    {
      name: 'stream-png3',
      file: path.join(TOKENS_DIR, `stream-png3__${source}.png`),
      run: runTokenStream,
    },
    {
      name: 'stream-png4',
      file: path.join(TOKENS_DIR, `stream-png4__${source}.png`),
      run: runTokenStream,
    },
    {
      name: 'stream-def3',
      file: path.join(TOKENS_DIR, `stream-def3__${source}.png`),
      run: runTokenStream,
    },
    {
      name: 'stream-def4',
      file: path.join(TOKENS_DIR, `stream-def4__${source}.png`),
      run: runTokenStream,
    },
    { name: 'zip', file: path.join(ARCHIVES_DIR, `zip__${source}.zip`), run: runZip },
    { name: 'tar.gz', file: path.join(ARCHIVES_DIR, `targz__${source}.tar.gz`), run: runTarGz },
    { name: 'brotli-11', file: path.join(ARCHIVES_DIR, `br11__${source}${brExt}`), run: runBrotli },
    { name: 'brotli-6', file: path.join(ARCHIVES_DIR, `br6__${source}${brExt}`), run: runBrotli },
  ].filter(s => fs.existsSync(s.file))
}

// ── Utilities ─────────────────────────────────────────────────────────────

const now = () => performance.now()
const sleep = (ms: number) => (ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve())
const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
const fmtMs = (ms: number) => (ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`)
const fmtBytes = (b: number) =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

// ── Main ──────────────────────────────────────────────────────────────────

interface ResultRow extends RunResult {
  scenario: string
  source: string
  condition: string
  throughputMBps: number
}

async function main() {
  console.log('Tokenpack Benchmark')
  console.log('===================')

  const allResults: ResultRow[] = []

  for (const cond of CONDITIONS) {
    console.log(
      `\n── ${cond.name}  (latency=${cond.latencyMs}ms  bw=${isFinite(cond.bandwidthBps) ? fmtBytes(cond.bandwidthBps) + '/s' : '∞'}) ──`,
    )

    const server = await startServer(cond)
    const port = (server.address() as { port: number }).port
    const base = `http://127.0.0.1:${port}`

    for (const source of SOURCES) {
      console.log(`\n  [${source}]`)

      for (const scenario of getScenarios(source)) {
        const runs: RunResult[] = []

        process.stdout.write(`    ${scenario.name.padEnd(COL)} `)

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

        const row: ResultRow = {
          scenario: scenario.name,
          source,
          condition: cond.name,
          ttfb: avg(runs.map(r => r.ttfb)),
          fetchMs: avg(runs.map(r => r.fetchMs)),
          decodeMs: avg(runs.map(r => r.decodeMs)),
          totalMs: avg(runs.map(r => r.totalMs)),
          firstByteMs: avg(runs.map(r => r.firstByteMs)),
          transferBytes: avg(runs.map(r => r.transferBytes)),
          decodedBytes: avg(runs.map(r => r.decodedBytes)),
          throughputMBps:
            avg(runs.map(r => r.decodedBytes)) /
            1024 /
            1024 /
            (avg(runs.map(r => r.totalMs)) / 1000),
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

  // ── Summary ───────────────────────────────────────────────────────────

  console.log('\n\n══ SUMMARY (avg across all sources) ══\n')

  // Derive order from first condition's results to stay in sync with getScenarios().
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

  const outPath = path.join(ROOT, 'benchmark', 'results.json')

  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2))
  console.log(`Results saved → ${outPath}`)
}

main().catch(console.error)
