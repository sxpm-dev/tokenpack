/**
 * Extended + network benchmark — decodes pre-generated tokens, measures timing.
 * Run: yarn tsx benchmark/run-extended.ts
 *
 * Requires: yarn tsx benchmark/generate.ts  (generates token files + encode-times.json)
 *
 * Outputs:
 *   packages/app/benchmark-results/results-extended.json  — per-codec rows
 *   packages/app/benchmark-results/results.json           — network simulation rows
 */

import 'tokenpack/algorithms/register-all'

import AdmZip from 'adm-zip'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { getAlgorithmByName } from 'tokenpack/algorithms/registry'
import { isStreamingCodec } from 'tokenpack/codecs/types'
import { decodeFromBuffer } from 'tokenpack/decoder'
import { createTokenDecodeStream } from 'tokenpack/stream-decoder'
import zlib from 'zlib'

const HERE = import.meta.dirname
const TOKENS_DIR = path.join(HERE, 'tokens')
const RESULTS_DIR = path.join(HERE, '..', 'packages', 'app', 'benchmark-results')
const ENCODE_TIMES = path.join(RESULTS_DIR, 'encode-times.json')

fs.mkdirSync(RESULTS_DIR, { recursive: true })

const BROWSER_SAFE_IDS = new Set([0, 2, 4, 5, 6, 8, 9, 10, 15])

// ── Shared helpers ────────────────────────────────────────────────────────

const now = () => performance.now()
const sleep = (ms: number) => (ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve())
const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length

const BENCH_TIMEOUT_MS = 2_000

function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
  )

  return Promise.race([promise, timeout])
}
const fmtMs = (ms: number) =>
  ms < 1 ? `${ms.toFixed(2)}ms` : ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`

const fmtBytes = (b: number) =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

// ── Source name mapping ───────────────────────────────────────────────────

// generate.ts uses the full filename without extension as source name.
// Dashboard uses short ids. Map both ways.
const SOURCE_LABELS: Record<string, string> = {
  'react-dom-client.development': 'react-dom-dev',
  'react-dom-client.production': 'react-dom-prod',
  screenshot: 'screenshot',
  'fs-app-core': 'fs-app-core',
}

// ── Section 1: Codec perf (results-extended.json) ────────────────────────

export interface ExtBenchRow {
  codecId: number
  codecName: string
  outerCompression: string
  channels: number
  source: string
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
}

interface EncodeTimeEntry {
  source: string
  codec: string
  compression: string
  channels: number
  encodeMs: number
  tokenBytes: number
  originalBytes: number
  tokenFile: string
}

async function runCodecPerf(): Promise<void> {
  if (!fs.existsSync(ENCODE_TIMES)) {
    console.error(`\nERROR: ${ENCODE_TIMES} not found.`)
    console.error('Run `yarn tsx benchmark/generate.ts` first.\n')
    process.exit(1)
  }

  const entries: EncodeTimeEntry[] = JSON.parse(fs.readFileSync(ENCODE_TIMES, 'utf-8'))
  const total = entries.length

  console.log(`\n═══ Codec perf: decoding ${total} pre-generated tokens ═══\n`)

  let done = 0
  const rows: ExtBenchRow[] = []

  // Group by source for nicer output
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
      const label = `[${done}/${total}] ${entry.codec} + ${entry.compression}`

      process.stdout.write(`  ${label.padEnd(46)}`)

      const tokenPath = path.join(HERE, entry.tokenFile)
      const algorithm = getAlgorithmByName(entry.codec)
      const codec = algorithm.codec

      let row: ExtBenchRow

      if (!entry.tokenFile || !fs.existsSync(tokenPath)) {
        row = {
          codecId: codec?.id ?? -1,
          codecName: entry.codec,
          outerCompression: entry.compression,
          channels: entry.channels,
          source: SOURCE_LABELS[sourceName] ?? sourceName,
          encodeMs: entry.encodeMs,
          decodeMs: 0,
          roundTripMs: entry.encodeMs,
          tokenBytes: entry.tokenBytes,
          originalBytes: entry.originalBytes,
          ratio:
            entry.tokenBytes > 0
              ? Math.round((entry.tokenBytes / entry.originalBytes) * 10000) / 10000
              : 0,
          throughputMBps: 0,
          isStreaming: codec ? isStreamingCodec(codec) : false,
          isBrowserSafe: codec ? BROWSER_SAFE_IDS.has(codec.id) : false,
          error: 'token file not found (encode failed during generate)',
        }
        console.log(`SKIP — token missing`)
        rows.push(row)
        continue
      }

      try {
        const tokenBuf = fs.readFileSync(tokenPath)

        const t1 = now()

        await withTimeout(BENCH_TIMEOUT_MS, decodeFromBuffer(tokenBuf, undefined, '.png'))
        const decodeMs = now() - t1

        const roundTripMs = entry.encodeMs + decodeMs
        const throughputMBps = entry.originalBytes / 1024 / 1024 / (roundTripMs / 1000)
        const ratio = entry.tokenBytes / entry.originalBytes

        row = {
          codecId: codec?.id ?? -1,
          codecName: entry.codec,
          outerCompression: entry.compression,
          channels: entry.channels,
          source: SOURCE_LABELS[sourceName] ?? sourceName,
          encodeMs: Math.round(entry.encodeMs * 10) / 10,
          decodeMs: Math.round(decodeMs * 10) / 10,
          roundTripMs: Math.round(roundTripMs * 10) / 10,
          tokenBytes: entry.tokenBytes,
          originalBytes: entry.originalBytes,
          ratio: Math.round(ratio * 10000) / 10000,
          throughputMBps: Math.round(throughputMBps * 10) / 10,
          isStreaming: codec ? isStreamingCodec(codec) : false,
          isBrowserSafe: codec ? BROWSER_SAFE_IDS.has(codec.id) : false,
        }
        console.log(
          `enc=${fmtMs(entry.encodeMs).padStart(8)}  dec=${fmtMs(decodeMs).padStart(8)}  ratio=${(ratio * 100).toFixed(1).padStart(5)}%  ${fmtBytes(entry.tokenBytes)}`,
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)

        row = {
          codecId: codec?.id ?? -1,
          codecName: entry.codec,
          outerCompression: entry.compression,
          channels: entry.channels,
          source: SOURCE_LABELS[sourceName] ?? sourceName,
          encodeMs: entry.encodeMs,
          decodeMs: 0,
          roundTripMs: entry.encodeMs,
          tokenBytes: entry.tokenBytes,
          originalBytes: entry.originalBytes,
          ratio:
            entry.tokenBytes > 0
              ? Math.round((entry.tokenBytes / entry.originalBytes) * 10000) / 10000
              : 0,
          throughputMBps: 0,
          isStreaming: codec ? isStreamingCodec(codec) : false,
          isBrowserSafe: codec ? BROWSER_SAFE_IDS.has(codec.id) : false,
          error: msg,
        }
        console.log(`ERROR: ${msg}`)
      }

      rows.push(row)
    }
    console.log()
  }

  const outPath = path.join(RESULTS_DIR, 'results-extended.json')

  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2))
  console.log(`Codec perf saved → ${outPath}  (${rows.length} rows)`)
}

// ── Section 2: Network simulation (results.json) ──────────────────────────

const NET_CONDITIONS = [
  { name: 'local', latencyMs: 0, bandwidthBps: Infinity },
  { name: 'fast-cdn', latencyMs: 10, bandwidthBps: 100 * 1024 * 1024 },
  { name: 'average', latencyMs: 50, bandwidthBps: 10 * 1024 * 1024 },
  { name: 'slow', latencyMs: 100, bandwidthBps: 2 * 1024 * 1024 },
]

const NET_SOURCES = [
  'react-dom-client.development',
  'react-dom-client.production',
  'screenshot',
  'fs-app-core',
]

const RUNS = 3

function startServer(cond: (typeof NET_CONDITIONS)[0]): Promise<http.Server> {
  const { latencyMs, bandwidthBps } = cond
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

interface NetRunResult {
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
): Promise<NetRunResult> {
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

async function runTokenStream(url: string): Promise<NetRunResult> {
  const t0 = now()
  let ttfb = 0,
    fetchMs = 0,
    firstByteMs = 0,
    transferBytes = 0
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
  const decodedBytes = chunks.reduce((s, c) => s + c.length, 0)

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

type NetScenario = { name: string; file: string; run: (url: string) => Promise<NetRunResult> }

function getNetScenarios(source: string): NetScenario[] {
  const brExt = source.startsWith('fs-') ? '.tar.br' : '.br'
  const scenarios: NetScenario[] = [
    {
      name: 'max-webp3',
      file: path.join(TOKENS_DIR, `max-webp3__${source}.webp`),
      run: u =>
        runBatchDecode(u, buf => decodeFromBuffer(buf, undefined, '.webp').then(d => d.length)),
    },
    {
      name: 'max-png3',
      file: path.join(TOKENS_DIR, `max-png3__${source}.png`),
      run: u =>
        runBatchDecode(u, buf => decodeFromBuffer(buf, undefined, '.png').then(d => d.length)),
    },
    {
      name: 'max-png4',
      file: path.join(TOKENS_DIR, `max-png4__${source}.png`),
      run: u =>
        runBatchDecode(u, buf => decodeFromBuffer(buf, undefined, '.png').then(d => d.length)),
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
    {
      name: 'zip',
      file: path.join(TOKENS_DIR, `zip__${source}.zip`),
      run: u =>
        runBatchDecode(u, buf => {
          const z = new AdmZip(buf)
          let b = 0

          for (const e of z.getEntries()) if (!e.isDirectory) b += e.getData().length

          return b
        }),
    },
    {
      name: 'tar.gz',
      file: path.join(TOKENS_DIR, `targz__${source}.tar.gz`),
      run: u => runBatchDecode(u, buf => zlib.gunzipSync(buf).length),
    },
    {
      name: 'brotli-11',
      file: path.join(TOKENS_DIR, `br11__${source}${brExt}`),
      run: u => runBatchDecode(u, buf => zlib.brotliDecompressSync(buf).length),
    },
    {
      name: 'brotli-6',
      file: path.join(TOKENS_DIR, `br6__${source}${brExt}`),
      run: u => runBatchDecode(u, buf => zlib.brotliDecompressSync(buf).length),
    },
  ]

  return scenarios.filter(s => fs.existsSync(s.file))
}

async function runNetworkSim(): Promise<void> {
  const hasTokens = NET_SOURCES.some(src => getNetScenarios(src).length > 0)

  if (!hasTokens) {
    console.log('\nSkipping network simulation — no pre-generated token files found.')
    console.log('Run `yarn tsx benchmark/generate.ts` first.\n')

    return
  }

  interface ResultRow extends NetRunResult {
    scenario: string
    source: string
    condition: string
    throughputMBps: number
  }
  const allResults: ResultRow[] = []
  const COL = 14

  console.log('\n═══ Network simulation ═══\n')

  for (const cond of NET_CONDITIONS) {
    console.log(
      `── ${cond.name}  (latency=${cond.latencyMs}ms  bw=${isFinite(cond.bandwidthBps) ? fmtBytes(cond.bandwidthBps) + '/s' : '∞'}) ──`,
    )
    const server = await startServer(cond)
    const port = (server.address() as { port: number }).port
    const base = `http://127.0.0.1:${port}`

    for (const source of NET_SOURCES) {
      const scenarios = getNetScenarios(source)

      if (!scenarios.length) continue
      console.log(`\n  [${source}]`)

      for (const scenario of scenarios) {
        const runs: NetRunResult[] = []

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
        console.log(
          `  ttfb=${fmtMs(row.ttfb).padStart(8)}  total=${fmtMs(row.totalMs).padStart(8)}  1st=${fmtMs(row.firstByteMs).padStart(8)}  decode=${fmtMs(row.decodeMs).padStart(8)}  size=${fmtBytes(row.transferBytes).padStart(7)}  ${row.throughputMBps.toFixed(1)}MB/s`,
        )
      }
    }

    await new Promise<void>(r => server.close(() => r()))
  }

  if (allResults.length) {
    const outPath = path.join(RESULTS_DIR, 'results.json')

    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2))
    console.log(`\nNetwork results saved → ${outPath}  (${allResults.length} rows)`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tokenpack Benchmark Runner')
  console.log('==========================\n')
  console.log('Requires pre-generated tokens: yarn tsx benchmark/generate.ts\n')

  await runCodecPerf()
  await runNetworkSim()

  console.log('\nDone.')
}

main().catch(console.error)
