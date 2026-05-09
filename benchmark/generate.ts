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
import fs from 'fs'
import path from 'path'
import { encode } from '@tokenpack/node'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { packDirs } from 'tokenpack/archive'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

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

const FILE_SOURCES: { name: string; file: string }[] = [
  { name: 'react-dom-client.development', file: 'react-dom-client.development.js' },
  { name: 'react-dom-client.production', file: 'react-dom-client.production.js' },
  { name: 'chunk-5mb', file: 'chunk-5mb.js' },
  { name: 'screenshot', file: 'screenshot.jpg' },
  { name: 'client-spec-map', file: 'client-spec-map.json' },
  { name: 'client-spec-map.min', file: 'client-spec-map.min.json' },
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

function listAlgoBindings(): AlgoBinding[] {
  const all = algorithmCatalog.list().map(Ctor => {
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

  // Trim the matrix to the `linear-*` family for now (linear, linear-deflate,
  // linear-stream, linear-stream-deflate, linear-none, linear-webp, linear-avif).
  // Cuts brotli-11 work by ~2× and skips slow sharp-backed WebP/AVIF for
  // non-linear codecs. Re-enable by returning `all` instead.
  return all.filter(b => b.algorithmName === 'linear' || b.algorithmName.startsWith('linear-'))
  // return all  // ← uncomment to bench every registered algorithm
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

async function main() {
  console.log('Tokenpack Benchmark Fixture Generator')
  console.log('=====================================\n')

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

  const fsDirs = [
    path.join(REPO_ROOT, 'packages/app/src'),
    path.join(REPO_ROOT, 'packages/core/src'),
  ].filter(d => fs.existsSync(d))

  if (fsDirs.length) {
    const name = 'fs-app-core'
    const cart = packDirs(fsDirs, [], REPO_ROOT)

    allSources.push({ name, buf: cart })
    console.log(`\n[${name}]  ${fmtBytes(cart.length)} (packed: packages/{app,core}/src)`)
    allArchiveTimes.push(...(await generateArchives(name, cart, '.tar.br')))
  } else {
    console.log('\n[fs-app-core] SKIP — no app/core src dirs found')
  }

  // ── Algorithm matrix: every registered Ctor × {3, 4} channels ────────────
  const bindings = listAlgoBindings()
  const channelOptions = [3, 4] as const
  const total = bindings.length * channelOptions.length * allSources.length
  let done = 0
  const encodeTimes: EncodeTimeEntry[] = []

  console.log(
    `\n\n═══ Token matrix: ${bindings.length} algorithms × ${channelOptions.length} channels × ${allSources.length} sources = ${total} files ═══\n`,
  )

  for (const { name: sourceName, buf: src } of allSources) {
    console.log(`── ${sourceName} (${fmtBytes(src.length)}) ──`)

    for (const binding of bindings) {
      for (const channels of channelOptions) {
        done++
        const label = `[${done}/${total}] ${binding.algorithmName} c${channels}`

        process.stdout.write(`  ${label.padEnd(46)}`)

        const tokenFile = `ext-${binding.algorithmName}-c${channels}__${sourceName}${binding.surfaceExt}`
        const tokenPath = path.join(TOKENS, tokenFile)

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

          encodeTimes.push({
            source: sourceName,
            algorithm: binding.algorithmName,
            surface: binding.surfaceId,
            compressor: binding.compressorFamily,
            channels,
            encodeMs: Math.round(encodeMs * 10) / 10,
            tokenBytes,
            originalBytes: src.length,
            tokenFile: path.posix.join('tokens', tokenFile),
          })
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
          console.log(`ERROR: ${msg}`)
        }
      }
    }
    console.log()
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
