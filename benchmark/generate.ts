/**
 * Generates all fixture files required by all benchmarks.
 * Run: yarn tsx benchmark/generate.ts
 *
 * Outputs:
 *   benchmark/tokens/   ext-<algo>-c<ch>__<source>.<ext>     (one per registered algorithm × channels)
 *   benchmark/tokens/   zip__*, targz__*, br11__*, br6__*    (archive comparisons)
 *   packages/app/benchmark-results/encode-times.json
 *   packages/app/benchmark-results/archive-times.json
 *
 * Iterates over `algorithmCatalog.list()` — each registered algorithm IS a
 * full configuration (codec + surface + compressor + drawer). No flat
 * `compressionMode` matrix; bound recipes only.
 */

import '@tokenpack/node'

import AdmZip from 'adm-zip'
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { encode } from '@tokenpack/node'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

import { assertAllReferencedAlgosExist, encodeDecodeBenchAlgos } from './bench-algos'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(HERE, '..')
const SOURCES = path.join(HERE, 'sources')
const TOKENS = path.join(HERE, 'tokens')
const RESULTS_DIR = path.join(REPO_ROOT, 'packages', 'app', 'benchmark-results')

fs.mkdirSync(TOKENS, { recursive: true })
fs.mkdirSync(RESULTS_DIR, { recursive: true })

const LABEL_W = 38
const SIZE_W = 8

const now = () => performance.now()

const fmtBytes = (b: number) =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

function row(label: string, outSize: number, srcSize: number) {
  const ratio = ((1 - outSize / srcSize) * 100).toFixed(1)

  console.log(`  ${label.padEnd(LABEL_W)}${fmtBytes(outSize).padStart(SIZE_W)}   ${ratio}% smaller`)
}

// Trimmed corpus — `bench:all` only runs against these two sources to keep
// the matrix tractable. `react-dom-client.development` covers a "real-world
// medium JS bundle" case; `chunk-5mb` covers the "very large bundle / cache
// stress" case. Re-add other sources here if a focused investigation needs
// them (the smaller/screenshot fixtures still live under `benchmark/sources/`).
const FILE_SOURCES: { name: string; file: string }[] = [
  { name: 'react-dom-client.development', file: 'react-dom-client.development.js' },
  { name: 'chunk-5mb', file: 'chunk-5mb.js' },
]

interface ArchiveTimeEntry {
  source: string
  format: string
  encodeMs: number
  decodeMs: number
  bytes: number
  originalBytes: number
}

interface EncodeTimeEntry {
  source: string
  algorithm: string
  surface: string
  compressor: string
  channels: number
  encodeMs: number
  tokenBytes: number
  originalBytes: number
  /** Path under benchmark/, e.g. `tokens/ext-linear-c3__source.png`. */
  tokenFile: string
}

interface AlgoBinding {
  Ctor: ReturnType<typeof algorithmCatalog.list>[number]
  algorithmName: string
  surfaceId: string
  surfaceExt: string
  compressorFamily: string
}

/**
 * Build per-algo bindings from the central bench-algos list. To trim the
 * matrix or skip a specific algo, edit `ENCODE_DECODE_EXCLUDE` in
 * `benchmark/bench-algos.ts` — no code changes here.
 */
function listAlgoBindings(): AlgoBinding[] {
  return encodeDecodeBenchAlgos().map(info => {
    const Ctor = algorithmCatalog.getByName(info.name)
    const surface = new (Ctor.Surface as unknown as new () => {
      id: string
      extension: string
    })()

    return {
      Ctor,
      algorithmName: Ctor.name,
      surfaceId: surface.id,
      surfaceExt: surface.extension,
      compressorFamily: Ctor.Compressor.familyId,
    }
  })
}

async function generateArchives(
  name: string,
  src: Buffer,
  brExt: '.br' | '.tar.br',
): Promise<ArchiveTimeEntry[]> {
  const out: ArchiveTimeEntry[] = []

  function timeArchive(
    format: string,
    enc: () => Buffer,
    dec: (buf: Buffer) => void,
    filePath: string,
  ) {
    const t0 = now()
    const buf = enc()
    const encodeMs = now() - t0

    fs.writeFileSync(filePath, buf)
    const t1 = now()

    dec(buf)
    const decodeMs = now() - t1

    row(format, buf.length, src.length)
    out.push({
      source: name,
      format,
      encodeMs: Math.round(encodeMs * 10) / 10,
      decodeMs: Math.round(decodeMs * 10) / 10,
      bytes: buf.length,
      originalBytes: src.length,
    })
  }

  timeArchive(
    'zip',
    () => {
      const z = new AdmZip()

      z.addFile(path.basename(name), src)

      return z.toBuffer()
    },
    buf => {
      const z = new AdmZip(buf)

      for (const e of z.getEntries()) if (!e.isDirectory) e.getData()
    },
    path.join(TOKENS, `zip__${name}.zip`),
  )

  timeArchive(
    'tar.gz',
    () => zlib.gzipSync(src, { level: 6 }),
    buf => zlib.gunzipSync(buf),
    path.join(TOKENS, `targz__${name}.tar.gz`),
  )

  timeArchive(
    'brotli-11',
    () => zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }),
    buf => zlib.brotliDecompressSync(buf),
    path.join(TOKENS, `br11__${name}${brExt}`),
  )

  timeArchive(
    'brotli-6',
    () => zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } }),
    buf => zlib.brotliDecompressSync(buf),
    path.join(TOKENS, `br6__${name}${brExt}`),
  )

  return out
}

const ENCODE_TIMEOUT_MS = 60_000

async function withTimeout<T>(ms: number, p: Promise<T>): Promise<T> {
  return await Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ])
}

// ── Cache helpers ──────────────────────────────────────────────────────────
// Keyed-skip layer for the encode matrix. First run still pays full encode
// cost; subsequent runs reuse the previous fixture + timing entry whenever
// the cache key matches.
//
// Cache key components: algorithm.name, surface.id, compressor.id, channels,
// source bytes hash, and a single mtime across all algorithm sources. Any
// change to any algo's source code invalidates everything (crude but safe).
//
// Force a full rebuild by deleting `benchmark/tokens/.cache.json`.

const CACHE_PATH = path.join(TOKENS, '.cache.json')
const SLOW_TASK_MS = 5_000 // tasks above this are reported in the post-summary

interface CacheEntry {
  algorithm: string
  surface: string
  compressor: string
  channels: number
  source: string
  encodeMs: number
  tokenBytes: number
  originalBytes: number
  tokenFile: string
}

interface CacheIndex {
  algoSourceMtime: number
  bySourceHash: Record<string, Record<string, CacheEntry>>
  // bySourceHash[sourceHash][taskKey] = entry
  // taskKey = `${algorithm}|${surface}|${compressor}|c${channels}`
}

function makeCacheKey(b: AlgoBinding, channels: number): string {
  return `${b.algorithmName}|${b.surfaceId}|${b.compressorFamily}|c${channels}`
}

function hashBytes(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16)
}

function computeAlgoSourceMtime(): number {
  const ALGOS_DIR = path.join(REPO_ROOT, 'packages', 'core', 'src', 'algorithms')

  if (!fs.existsSync(ALGOS_DIR)) return 0

  let max = 0
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name)
      const stat = fs.statSync(p)

      if (stat.isDirectory()) walk(p)
      else if (stat.isFile() && p.endsWith('.ts')) {
        if (stat.mtimeMs > max) max = stat.mtimeMs
      }
    }
  }

  walk(ALGOS_DIR)

  return Math.floor(max)
}

function loadCacheIndex(currentMtime: number): CacheIndex {
  if (!fs.existsSync(CACHE_PATH)) {
    return { algoSourceMtime: currentMtime, bySourceHash: {} }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as CacheIndex

    if (parsed.algoSourceMtime !== currentMtime) {
      console.log(
        `\n[cache] algorithm source mtime changed (${parsed.algoSourceMtime} → ${currentMtime}); invalidating all entries\n`,
      )

      return { algoSourceMtime: currentMtime, bySourceHash: {} }
    }

    return parsed
  } catch {
    return { algoSourceMtime: currentMtime, bySourceHash: {} }
  }
}

function saveCacheIndex(idx: CacheIndex): void {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(idx, null, 2))
}

async function main() {
  console.log('Tokenpack Benchmark Fixture Generator')
  console.log('=====================================\n')

  // Fail fast if any EXCLUDE entry references a stale/typo'd algo name.
  assertAllReferencedAlgosExist()

  const allSources: { name: string; buf: Buffer }[] = []
  const allArchiveTimes: ArchiveTimeEntry[] = []

  for (const { name, file } of FILE_SOURCES) {
    const srcPath = path.join(SOURCES, file)

    if (!fs.existsSync(srcPath)) {
      console.log(`\n[${name}] SKIP — not found: ${srcPath}`)
      continue
    }
    const src = fs.readFileSync(srcPath)

    allSources.push({ name, buf: src })
    console.log(`\n[${name}]  ${fmtBytes(src.length)}`)
    allArchiveTimes.push(...(await generateArchives(name, src, '.br')))
  }

  // fs-app-core source dropped from the bench matrix — Server Fetch Bench is
  // narrowed to react-dom-dev + chunk-5mb only. To re-enable a packed-source
  // scenario for a focused investigation, restore the block from git history.

  // ── Algorithm matrix: every registered Ctor × {3, 4} channels ────────────
  const bindings = listAlgoBindings()
  const channelOptions = [3, 4] as const
  const total = bindings.length * channelOptions.length * allSources.length
  let done = 0
  let reused = 0
  let encoded = 0
  const slowTasks: { label: string; ms: number }[] = []
  const encodeTimes: EncodeTimeEntry[] = []

  // Cache layer: skip per-task encode whenever the (algo, surface, compressor,
  // channels, source-bytes, algo-source-mtime) tuple matches a previous run.
  const algoSourceMtime = computeAlgoSourceMtime()
  const cache = loadCacheIndex(algoSourceMtime)

  console.log(
    `\n\n═══ Token matrix: ${bindings.length} algorithms × ${channelOptions.length} channels × ${allSources.length} sources = ${total} files ═══\n`,
  )

  for (const { name: sourceName, buf: src } of allSources) {
    const sourceHash = hashBytes(src)
    const sourceCache = cache.bySourceHash[sourceHash] ?? {}

    cache.bySourceHash[sourceHash] = sourceCache
    console.log(`── ${sourceName} (${fmtBytes(src.length)}, hash=${sourceHash}) ──`)

    for (const binding of bindings) {
      for (const channels of channelOptions) {
        done++
        const label = `[${done}/${total}] ${binding.algorithmName} c${channels}`

        process.stdout.write(`  ${label.padEnd(46)}`)

        const tokenFile = `ext-${binding.algorithmName}-c${channels}__${sourceName}${binding.surfaceExt}`
        const tokenPath = path.join(TOKENS, tokenFile)
        const taskKey = makeCacheKey(binding, channels)
        const cached = sourceCache[taskKey]

        // Cache hit: fixture file present + entry matches → reuse + skip encode.
        if (cached && fs.existsSync(tokenPath)) {
          reused++
          encodeTimes.push({
            source: sourceName,
            algorithm: cached.algorithm,
            surface: cached.surface,
            compressor: cached.compressor,
            channels: cached.channels,
            encodeMs: cached.encodeMs,
            tokenBytes: cached.tokenBytes,
            originalBytes: cached.originalBytes,
            tokenFile: cached.tokenFile,
          })
          const ratio = ((1 - cached.tokenBytes / src.length) * 100).toFixed(1)

          console.log(
            `${fmtBytes(cached.tokenBytes).padStart(8)}  ${ratio.padStart(5)}% smaller  ${cached.encodeMs.toFixed(0)}ms  (cached)`,
          )
          continue
        }

        try {
          const t0 = now()
          const result = await withTimeout(
            ENCODE_TIMEOUT_MS,
            encode(src, {
              algo: binding.algorithmName,
              algoOptions: { surface: { channels } },
              out: tokenPath,
            }),
          )
          const encodeMs = now() - t0
          const tokenBytes = result.byteLength
          const ratio = ((1 - tokenBytes / src.length) * 100).toFixed(1)
          const entry: EncodeTimeEntry = {
            source: sourceName,
            algorithm: binding.algorithmName,
            surface: binding.surfaceId,
            compressor: binding.compressorFamily,
            channels,
            encodeMs: Math.round(encodeMs * 10) / 10,
            tokenBytes,
            originalBytes: src.length,
            tokenFile: path.posix.join('tokens', tokenFile),
          }

          encodeTimes.push(entry)
          sourceCache[taskKey] = {
            algorithm: entry.algorithm,
            surface: entry.surface,
            compressor: entry.compressor,
            channels: entry.channels,
            source: sourceName,
            encodeMs: entry.encodeMs,
            tokenBytes: entry.tokenBytes,
            originalBytes: entry.originalBytes,
            tokenFile: entry.tokenFile,
          }
          encoded++
          if (encodeMs >= SLOW_TASK_MS) {
            slowTasks.push({ label: `${sourceName} · ${binding.algorithmName} c${channels}`, ms: encodeMs })
          }
          console.log(
            `${fmtBytes(tokenBytes).padStart(8)}  ${ratio.padStart(5)}% smaller  ${encodeMs.toFixed(0)}ms`,
          )
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)

          encodeTimes.push({
            source: sourceName,
            algorithm: binding.algorithmName,
            surface: binding.surfaceId,
            compressor: binding.compressorFamily,
            channels,
            encodeMs: 0,
            tokenBytes: 0,
            originalBytes: src.length,
            tokenFile: '',
          })
          // Don't cache failed encodes — we want a retry on the next run.
          delete sourceCache[taskKey]
          console.log(`ERROR: ${msg}`)
        }
      }
    }

    // Persist cache after each source so an interrupted run still preserves
    // partial progress.
    saveCacheIndex(cache)
    console.log()
  }

  console.log(
    `[cache] ${reused} reused · ${encoded} re-encoded · index → ${path.posix.join('benchmark', 'tokens', '.cache.json')}`,
  )

  if (slowTasks.length > 0) {
    console.log(`\n[slow tasks] ≥${SLOW_TASK_MS / 1000}s — top offenders this run:`)
    slowTasks
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10)
      .forEach(t => console.log(`  ${(t.ms / 1000).toFixed(1)}s  ${t.label}`))
  }

  const encodeTimesPath = path.join(RESULTS_DIR, 'encode-times.json')

  fs.writeFileSync(encodeTimesPath, JSON.stringify(encodeTimes, null, 2))
  console.log(`Encode times saved → ${encodeTimesPath}  (${encodeTimes.length} entries)`)

  const archiveTimesPath = path.join(RESULTS_DIR, 'archive-times.json')

  fs.writeFileSync(archiveTimesPath, JSON.stringify(allArchiveTimes, null, 2))
  console.log(`Archive times saved → ${archiveTimesPath}  (${allArchiveTimes.length} entries)`)

  console.log('\nDone. Run `yarn tsx benchmark/run-extended.ts` to measure decode timing.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
