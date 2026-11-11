/* eslint-disable no-console */
/**
 * Generates all fixture files required by all benchmarks.
 * Run: yarn workspace tokenpack-web benchmark:generate
 *
 * Outputs:
 *   apps/web/benchmark-fixtures/node/   ext-<algo>-c<ch>__<source>.<ext>
 *   apps/web/benchmark-fixtures/node/   zip__*, gzip__*, deflate__*, br11__*, br6__*
 *   apps/web/benchmark-results/encode-times.json
 *   apps/web/benchmark-results/archive-times.json
 *
 * Iterates over `algorithmCatalog.list()` — each registered algorithm IS a
 * full configuration (codec + surface + compressor + drawer). No flat
 * `compressionMode` matrix; bound recipes only.
 */

import '@tokenpack/node'

import { encode } from '@tokenpack/node'
import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import AdmZip from 'adm-zip'
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

import { assertAllReferencedAlgosExist, encodeDecodeBenchAlgos } from './bench-algos'
import {
  APP_BENCHMARK_RESULTS_DIR,
  BENCH_SOURCE_CONFIGS,
  listContentBenchInputs,
  NODE_BENCH_FIXTURE_DIR,
  REPO_ROOT,
  RUNTIME_CHUNK_COUNTS,
} from './fixture-corpus'
import { measureOnce } from './measure'

const TOKENS = NODE_BENCH_FIXTURE_DIR
const RESULTS_DIR = APP_BENCHMARK_RESULTS_DIR

fs.mkdirSync(TOKENS, { recursive: true })
fs.mkdirSync(RESULTS_DIR, { recursive: true })

const LABEL_W = 38
const SIZE_W = 8

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

interface Args {
  chunkCounts: number[]
  algos?: Set<string>
}

function parseArgs(argv: string[]): Args {
  let chunkCounts: number[] | null = null
  let algos: Set<string> | undefined

  for (const arg of argv) {
    if (arg === '--full-chunks') {
      chunkCounts = [...RUNTIME_CHUNK_COUNTS]
    } else if (arg.startsWith('--chunks=')) {
      chunkCounts = arg
        .slice('--chunks='.length)
        .split(',')
        .map(v => Number(v))
        .filter(v => Number.isInteger(v) && v > 0)
    } else if (arg.startsWith('--algos=')) {
      algos = new Set(arg.slice('--algos='.length).split(',').filter(Boolean))
    } else {
      throw new Error(`unknown arg: ${arg}`)
    }
  }

  return { chunkCounts: chunkCounts ?? [1], algos }
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

interface ArchiveCacheEntry extends ArchiveTimeEntry {
  fileName: string
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
  /** File name under apps/web/benchmark-fixtures/node. */
  tokenFile: string
}

interface AlgoBinding {
  Ctor: ReturnType<typeof algorithmCatalog.list>[number]
  algorithmName: string
  surfaceId: string
  surfaceExt: string
  compressorFamily: string
  channels: ReadonlyArray<1 | 2 | 3 | 4>
}

/**
 * Build per-algo bindings from the central bench-algos list. To trim the
 * matrix or skip a specific algo, edit `ENCODE_DECODE_EXCLUDE` in
 * `apps/web/scripts/benchmark/bench-algos.ts` — no code changes here.
 */
function listAlgoBindings(algos?: Set<string>): AlgoBinding[] {
  const infos = encodeDecodeBenchAlgos()

  if (algos) {
    const known = new Set(infos.map(info => info.name))
    const missing = [...algos].filter(name => !known.has(name))

    if (missing.length > 0) {
      throw new Error(
        `unknown --algos value(s): ${missing.join(', ')}. Known bench algos: ${[...known].sort().join(', ')}`,
      )
    }
  }

  return infos
    .filter(info => !algos || algos.has(info.name))
    .map(info => {
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
        channels: Ctor.capabilities.channels,
      }
    })
}

function mergeEncodeTimes(
  previous: EncodeTimeEntry[],
  next: EncodeTimeEntry[],
  algos: Set<string> | undefined,
  sourceNames: Set<string>,
): EncodeTimeEntry[] {
  if (!algos) return next

  return [
    ...previous.filter(entry => !(algos.has(entry.algorithm) && sourceNames.has(entry.source))),
    ...next,
  ]
}

async function generateArchives(
  name: string,
  src: Buffer,
  brExt: '.br' | '.tar.br',
  metadata?: { sourceId: string; chunkCount: number; chunkIndex: number },
  archiveCache?: Record<string, ArchiveCacheEntry>,
): Promise<ArchiveTimeEntry[]> {
  const out: ArchiveTimeEntry[] = []

  async function timeArchive(
    format: string,
    enc: () => Buffer,
    dec: (buf: Buffer) => void,
    filePath: string,
  ): Promise<void> {
    const fileName = path.basename(filePath)
    const cached = archiveCache?.[format]

    if (cached && cached.originalBytes === src.length && fs.existsSync(filePath)) {
      row(`${format} (cached)`, cached.bytes, src.length)
      out.push({
        source: name,
        sourceId: cached.sourceId,
        chunkCount: cached.chunkCount,
        chunkIndex: cached.chunkIndex,
        format: cached.format,
        encodeMs: cached.encodeMs,
        decodeMs: cached.decodeMs,
        bytes: cached.bytes,
        originalBytes: cached.originalBytes,
      })

      return
    }

    const encoded = await measureOnce(enc)
    const buf = encoded.value
    const encodeMs = encoded.ms

    fs.writeFileSync(filePath, buf)

    const decoded = await measureOnce(() => dec(buf))
    const decodeMs = decoded.ms

    row(format, buf.length, src.length)
    const entry: ArchiveCacheEntry = {
      source: name,
      ...metadata,
      format,
      encodeMs: Math.round(encodeMs * 10) / 10,
      decodeMs: Math.round(decodeMs * 10) / 10,
      bytes: buf.length,
      originalBytes: src.length,
      fileName,
    }

    if (archiveCache) archiveCache[format] = entry
    out.push(entry)
  }

  await timeArchive(
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

  await timeArchive(
    'gzip',
    () => zlib.gzipSync(src, { level: 6 }),
    buf => zlib.gunzipSync(buf),
    path.join(TOKENS, `gzip__${name}.gz`),
  )

  await timeArchive(
    'deflate',
    () => zlib.deflateSync(src, { level: 6 }),
    buf => zlib.inflateSync(buf),
    path.join(TOKENS, `deflate__${name}.deflate`),
  )

  await timeArchive(
    'brotli-11',
    () => zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }),
    buf => zlib.brotliDecompressSync(buf),
    path.join(TOKENS, `br11__${name}${brExt}`),
  )

  await timeArchive(
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
// Force a full rebuild by deleting `apps/web/benchmark-fixtures/node/.cache.json`.

const CACHE_PATH = path.join(TOKENS, '.cache.json')
const SLOW_TASK_MS = 5_000 // tasks above this are reported in the post-summary

interface CacheEntry {
  algorithm: string
  surface: string
  compressor: string
  channels: number
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  encodeMs: number
  tokenBytes: number
  originalBytes: number
  tokenFile: string
}

interface CacheIndex {
  algoSourceMtime: number
  bySourceHash: Record<string, Record<string, CacheEntry>>
  archiveBySourceHash: Record<string, Record<string, ArchiveCacheEntry>>
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
    return { algoSourceMtime: currentMtime, bySourceHash: {}, archiveBySourceHash: {} }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as CacheIndex

    if (parsed.algoSourceMtime !== currentMtime) {
      console.log(
        `\n[cache] algorithm source mtime changed (${parsed.algoSourceMtime} → ${currentMtime}); invalidating all entries\n`,
      )

      return {
        algoSourceMtime: currentMtime,
        bySourceHash: {},
        archiveBySourceHash: parsed.archiveBySourceHash ?? {},
      }
    }

    parsed.archiveBySourceHash ??= {}

    return parsed
  } catch {
    return { algoSourceMtime: currentMtime, bySourceHash: {}, archiveBySourceHash: {} }
  }
}

function saveCacheIndex(idx: CacheIndex): void {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(idx, null, 2))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('Tokenpack Benchmark Fixture Generator')
  console.log('=====================================\n')

  // Fail fast if any EXCLUDE entry references a stale/typo'd algo name.
  assertAllReferencedAlgosExist()

  const allSources = listContentBenchInputs(BENCH_SOURCE_CONFIGS, args.chunkCounts).map(input => ({
    name: input.id,
    buf: input.bytes,
    sourceId: input.sourceId,
    chunkCount: input.chunkCount,
    chunkIndex: input.chunkIndex,
  }))
  const allArchiveTimes: ArchiveTimeEntry[] = []
  const algoSourceMtime = computeAlgoSourceMtime()
  const cache = loadCacheIndex(algoSourceMtime)

  console.log(
    `Source corpus: ${BENCH_SOURCE_CONFIGS.length} sources × chunk counts [${args.chunkCounts.join(', ')}] = ${allSources.length} content cases\n`,
  )

  for (const { name, buf, sourceId, chunkCount, chunkIndex } of allSources) {
    const sourceHash = hashBytes(buf)
    const archiveCache = cache.archiveBySourceHash[sourceHash] ?? {}

    cache.archiveBySourceHash[sourceHash] = archiveCache
    console.log(
      `\n[${name}]  ${fmtBytes(buf.length)}  (${sourceId}, chunks=${chunkCount}, index=${chunkIndex})`,
    )
    allArchiveTimes.push(
      ...(await generateArchives(
        name,
        buf,
        '.br',
        { sourceId, chunkCount, chunkIndex },
        archiveCache,
      )),
    )
    saveCacheIndex(cache)
  }

  // ── Algorithm matrix: every registered Ctor × its advertised channels ────
  const bindings = listAlgoBindings(args.algos)
  const total =
    bindings.reduce((sum, binding) => sum + binding.channels.length, 0) * allSources.length
  let done = 0
  let reused = 0
  let encoded = 0
  const slowTasks: { label: string; ms: number }[] = []
  const encodeTimes: EncodeTimeEntry[] = []

  // Cache layer: skip per-task encode whenever the (algo, surface, compressor,
  // channels, source-bytes, algo-source-mtime) tuple matches a previous run.
  console.log(
    `\n\n═══ Token matrix: ${bindings.length} algorithms × advertised channels × ${allSources.length} sources = ${total} files${args.algos ? ` (partial: ${[...args.algos].join(', ')})` : ''} ═══\n`,
  )

  for (const { name: sourceName, buf: src, sourceId, chunkCount, chunkIndex } of allSources) {
    const sourceHash = hashBytes(src)
    const sourceCache = cache.bySourceHash[sourceHash] ?? {}

    cache.bySourceHash[sourceHash] = sourceCache
    console.log(`── ${sourceName} (${fmtBytes(src.length)}, hash=${sourceHash}) ──`)

    for (const binding of bindings) {
      for (const channels of binding.channels) {
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
            sourceId: cached.sourceId,
            chunkCount: cached.chunkCount,
            chunkIndex: cached.chunkIndex,
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
          const measured = await measureOnce(() =>
            withTimeout(
              ENCODE_TIMEOUT_MS,
              encode(src, {
                algo: binding.algorithmName,
                algoOptions: { surface: { channels } },
                out: tokenPath,
              }),
            ),
          )
          const result = measured.value
          const encodeMs = measured.ms
          const tokenBytes = result.byteLength
          const ratio = ((1 - tokenBytes / src.length) * 100).toFixed(1)
          const entry: EncodeTimeEntry = {
            source: sourceName,
            sourceId,
            chunkCount,
            chunkIndex,
            algorithm: binding.algorithmName,
            surface: binding.surfaceId,
            compressor: binding.compressorFamily,
            channels,
            encodeMs: Math.round(encodeMs * 10) / 10,
            tokenBytes,
            originalBytes: src.length,
            tokenFile,
          }

          encodeTimes.push(entry)
          sourceCache[taskKey] = {
            algorithm: entry.algorithm,
            surface: entry.surface,
            compressor: entry.compressor,
            channels: entry.channels,
            source: sourceName,
            sourceId,
            chunkCount,
            chunkIndex,
            encodeMs: entry.encodeMs,
            tokenBytes: entry.tokenBytes,
            originalBytes: entry.originalBytes,
            tokenFile: entry.tokenFile,
          }
          encoded++
          if (encodeMs >= SLOW_TASK_MS) {
            slowTasks.push({
              label: `${sourceName} · ${binding.algorithmName} c${channels}`,
              ms: encodeMs,
            })
          }
          console.log(
            `${fmtBytes(tokenBytes).padStart(8)}  ${ratio.padStart(5)}% smaller  ${encodeMs.toFixed(0)}ms`,
          )
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)

          encodeTimes.push({
            source: sourceName,
            sourceId,
            chunkCount,
            chunkIndex,
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

  console.log(`[cache] ${reused} reused · ${encoded} re-encoded · index → ${CACHE_PATH}`)

  if (slowTasks.length > 0) {
    console.log(`\n[slow tasks] ≥${SLOW_TASK_MS / 1000}s — top offenders this run:`)
    slowTasks
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10)
      .forEach(t => console.log(`  ${(t.ms / 1000).toFixed(1)}s  ${t.label}`))
  }

  const encodeTimesPath = path.join(RESULTS_DIR, 'encode-times.json')
  const previousEncodeTimes = fs.existsSync(encodeTimesPath)
    ? (JSON.parse(fs.readFileSync(encodeTimesPath, 'utf-8')) as EncodeTimeEntry[])
    : []
  const mergedEncodeTimes = mergeEncodeTimes(
    previousEncodeTimes,
    encodeTimes,
    args.algos,
    new Set(allSources.map(source => source.name)),
  )

  fs.writeFileSync(encodeTimesPath, JSON.stringify(mergedEncodeTimes, null, 2))
  console.log(
    `Encode times saved → ${encodeTimesPath}  (${mergedEncodeTimes.length} entries${args.algos ? `, ${encodeTimes.length} refreshed` : ''})`,
  )

  const archiveTimesPath = path.join(RESULTS_DIR, 'archive-times.json')

  fs.writeFileSync(archiveTimesPath, JSON.stringify(allArchiveTimes, null, 2))
  console.log(`Archive times saved → ${archiveTimesPath}  (${allArchiveTimes.length} entries)`)

  console.log('\nDone. Run `yarn benchmark` to continue through node + runtime measurements.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
