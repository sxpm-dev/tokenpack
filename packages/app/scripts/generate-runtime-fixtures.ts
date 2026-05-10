import '@tokenpack/browser'
import '@tokenpack/node'

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

import { browserAlgorithmCatalog } from '@tokenpack/browser/algorithms/catalog'
import { encode as tokenpackEncode, PackBuilder } from '@tokenpack/node'
import { nodeAlgorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { listAlgorithmInfos } from 'tokenpack/algorithms/catalog-info'

import {
  APP_RUNTIME_CACHE_DIR,
  APP_RUNTIME_FIXTURE_DIR,
  type BenchSourceKind,
  type ContentExpectation,
  contentExpectation,
  loadBenchSource,
  REPO_ROOT,
  RUNTIME_CHUNK_COUNTS,
  type ScriptExpectation,
  scriptExpectation,
  selectedRuntimeBenchSources,
  sha256,
  splitContentChunks,
  splitScriptChunks,
} from './benchmark/fixture-corpus'

type Encoding = 'raw' | 'deflate' | 'brotli'
type TokenGroup = 'fetch' | 'stream'

const ENCODINGS: readonly Encoding[] = ['raw', 'deflate', 'brotli']

interface NativeFixture {
  kind: 'native'
  tab: 'content' | 'script'
  source: string
  sourceKind: BenchSourceKind
  chunkCount: number
  chunkIndex: number
  encoding: Encoding
  file: string
  bytes: number
  originalBytes: number
  sha256: string
}

interface TokenFixture {
  kind: 'token'
  tab: 'content' | 'script'
  source: string
  sourceKind: BenchSourceKind
  chunkCount: number
  chunkIndex: number
  group: TokenGroup
  algo: string
  channels: number
  surface: string
  compressor: string
  streamable: boolean
  file: string
  bytes: number
  originalBytes: number
  sha256: string
}

interface RangePackFixture {
  kind: 'range-pack'
  tab: 'content'
  source: string
  sourceKind: BenchSourceKind
  chunkCount: number
  algo: 'pixel-range-none'
  compressor: 'none'
  regionCompressor: 'deflate-9'
  file: string
  bytes: number
  originalBytes: number
  sha256: string
  files: Array<{
    path: string
    originalBytes: number
    sha256: string
  }>
}

interface RuntimeFixtureManifest {
  generatedAt: string
  sources: Array<{
    id: string
    file: string
    kind: BenchSourceKind
    bytes: number
    sha256: string
  }>
  chunkCounts: number[]
  encodings: Encoding[]
  algorithms: Array<{
    name: string
    group: TokenGroup
    channels: ReadonlyArray<1 | 2 | 3 | 4>
    surface: string
    extension: string
    compressor: string
    streamable: boolean
  }>
  expectations: {
    content: ContentExpectation[]
    script: ScriptExpectation[]
  }
  fixtures: Array<NativeFixture | TokenFixture | RangePackFixture>
}

interface AlgoBinding {
  name: string
  group: TokenGroup
  channels: ReadonlyArray<1 | 2 | 3 | 4>
  surface: string
  extension: string
  compressor: string
  streamable: boolean
}

interface Args {
  nativeOnly: boolean
  sources: Set<string> | null
  chunkCounts: number[]
}

function parseArgs(argv: string[]): Args {
  let nativeOnly = false
  let sources: Set<string> | null = null
  let chunkCounts: number[] = [...RUNTIME_CHUNK_COUNTS]

  for (const arg of argv) {
    if (arg === '--native-only') {
      nativeOnly = true
    } else if (arg.startsWith('--sources=')) {
      sources = new Set(arg.slice('--sources='.length).split(',').filter(Boolean))
    } else if (arg.startsWith('--chunks=')) {
      chunkCounts = arg
        .slice('--chunks='.length)
        .split(',')
        .map(v => Number(v))
        .filter(v => Number.isInteger(v) && v > 0)
    } else {
      throw new Error(`unknown arg: ${arg}`)
    }
  }

  return { nativeOnly, sources, chunkCounts }
}

function runtimeAlgorithms(): AlgoBinding[] {
  const browserNames = new Set(browserAlgorithmCatalog.list().map(Ctor => Ctor.name))

  return listAlgorithmInfos(nodeAlgorithmCatalog)
    .filter(info => browserNames.has(info.name))
    .filter(info => info.environments.includes('browser'))
    .map(info => {
      const Ctor = nodeAlgorithmCatalog.getByName(info.name)
      const surface = new (Ctor.Surface as unknown as new () => {
        id: string
        extension: string
      })()
      const compressor = Ctor.Compressor as unknown as { familyId: string }
      const streamable = Ctor.capabilities.streamable

      return {
        name: Ctor.name,
        group: streamable ? 'stream' : 'fetch',
        channels: Ctor.capabilities.channels,
        surface: surface.id,
        extension: surface.extension,
        compressor: compressor.familyId,
        streamable,
      }
    })
}

function encodeNative(bytes: Buffer, encoding: Encoding): Buffer {
  switch (encoding) {
    case 'raw':
      return bytes
    case 'deflate':
      return zlib.deflateSync(bytes, { level: 6 })
    case 'brotli':
      return zlib.brotliCompressSync(bytes, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      })
  }
}

function writeFixture(
  relativePath: string,
  bytes: Buffer | Uint8Array,
): { bytes: number; sha256: string; reused: boolean } {
  const outPath = path.join(APP_RUNTIME_FIXTURE_DIR, relativePath)
  const body = Buffer.from(bytes)
  const digest = sha256(body)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath)

    if (existing.byteLength === body.byteLength && sha256(existing) === digest) {
      return { bytes: body.byteLength, sha256: digest, reused: true }
    }
  }

  fs.writeFileSync(outPath, body)

  return { bytes: body.byteLength, sha256: digest, reused: false }
}

function nativeExt(encoding: Encoding): string {
  if (encoding === 'raw') return '.raw'
  if (encoding === 'brotli') return '.br'

  return '.deflate'
}

function padChunk(index: number): string {
  return String(index).padStart(2, '0')
}

function computeImplementationMtime(): number {
  const dirs = [
    path.join(REPO_ROOT, 'packages', 'core', 'src'),
    path.join(REPO_ROOT, 'packages', 'node', 'src'),
    path.join(REPO_ROOT, 'packages', 'browser', 'src'),
  ]
  let max = 0
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return

    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name)
      const stat = fs.statSync(p)

      if (stat.isDirectory()) walk(p)
      else if (stat.isFile() && p.endsWith('.ts')) max = Math.max(max, stat.mtimeMs)
    }
  }

  dirs.forEach(walk)

  return Math.floor(max)
}

function runtimeNativeCachePath(chunk: Buffer, encoding: Encoding): string {
  return path.join(
    APP_RUNTIME_CACHE_DIR,
    'native',
    `${sha256(chunk)}__${encoding}${nativeExt(encoding)}`,
  )
}

function encodeRuntimeNative(chunk: Buffer, encoding: Encoding): { body: Buffer; reused: boolean } {
  const cachePath = runtimeNativeCachePath(chunk, encoding)

  if (fs.existsSync(cachePath)) {
    return { body: fs.readFileSync(cachePath), reused: true }
  }

  const body = encodeNative(chunk, encoding)

  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, body)

  return { body, reused: false }
}

function runtimeTokenCachePath(
  chunk: Buffer,
  algo: AlgoBinding,
  channels: number,
  implementationMtime: number,
): string {
  const key = [
    `v${implementationMtime}`,
    sha256(chunk),
    algo.name,
    `c${channels}`,
    algo.surface,
    algo.compressor,
    algo.extension.replace(/^\./, ''),
  ].join('__')

  return path.join(APP_RUNTIME_CACHE_DIR, `${key}${algo.extension}`)
}

function runtimeRangePackCachePath(
  chunks: readonly Buffer[],
  source: string,
  chunkCount: number,
  implementationMtime: number,
): string {
  const chunksDigest = sha256(
    Buffer.from(chunks.map(chunk => sha256(chunk)).join('\n'), 'utf-8'),
  ).slice(0, 16)
  const key = [
    `v${implementationMtime}`,
    source,
    `chunks-${chunkCount}`,
    chunksDigest,
    'pixel-range-none',
    'none',
  ].join('__')

  return path.join(APP_RUNTIME_CACHE_DIR, 'range-pack', `${key}.png`)
}

async function encodeRuntimeToken(
  chunk: Buffer,
  algo: AlgoBinding,
  channels: number,
  implementationMtime: number,
): Promise<{ token: Buffer; reused: boolean }> {
  const cachePath = runtimeTokenCachePath(chunk, algo, channels, implementationMtime)

  if (fs.existsSync(cachePath)) {
    return { token: fs.readFileSync(cachePath), reused: true }
  }

  const token = Buffer.from(
    await tokenpackEncode(chunk, {
      algo: algo.name,
      algoOptions: { surface: { channels } },
    }),
  )

  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, token)

  return { token, reused: false }
}

async function encodeRuntimeRangePack(
  chunks: readonly Buffer[],
  source: string,
  chunkCount: number,
  implementationMtime: number,
): Promise<{ token: Buffer; reused: boolean }> {
  const cachePath = runtimeRangePackCachePath(chunks, source, chunkCount, implementationMtime)

  if (fs.existsSync(cachePath)) {
    return { token: fs.readFileSync(cachePath), reused: true }
  }

  const builder = new PackBuilder()

  chunks.forEach((chunk, chunkIndex) => {
    builder.withFile(`chunk-${padChunk(chunkIndex)}.bin`, chunk)
  })

  const token = Buffer.from(
    await tokenpackEncode(builder, {
      algo: 'pixel-range-none',
      compressor: 'deflate-9',
      algoOptions: { surface: { channels: 3 } },
    }),
  )

  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, token)

  return { token, reused: false }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sources = selectedRuntimeBenchSources(args.sources)
  const algorithms = args.nativeOnly ? [] : runtimeAlgorithms()
  const implementationMtime = computeImplementationMtime()
  let nativeCacheHits = 0
  let nativeEncoded = 0
  let fixtureReused = 0
  let fixtureWritten = 0
  let tokenCacheHits = 0
  let tokenEncoded = 0
  let rangePackCacheHits = 0
  let rangePackEncoded = 0
  const manifest: RuntimeFixtureManifest = {
    generatedAt: new Date().toISOString(),
    sources: [],
    chunkCounts: args.chunkCounts,
    encodings: [...ENCODINGS],
    algorithms,
    expectations: { content: [], script: [] },
    fixtures: [],
  }

  if (sources.length === 0) {
    throw new Error('no sources selected')
  }

  fs.mkdirSync(APP_RUNTIME_FIXTURE_DIR, { recursive: true })
  fs.mkdirSync(APP_RUNTIME_CACHE_DIR, { recursive: true })

  for (const sourceConfig of sources) {
    const source = loadBenchSource(sourceConfig)

    manifest.sources.push({
      id: source.id,
      file: source.file,
      kind: source.kind,
      bytes: source.byteLength,
      sha256: source.sha256,
    })

    for (const chunkCount of args.chunkCounts) {
      const contentChunks = splitContentChunks(source, chunkCount)
      const scriptChunks = splitScriptChunks(source, chunkCount)

      manifest.expectations.content.push(contentExpectation(source, chunkCount))
      manifest.expectations.script.push(scriptExpectation(source, chunkCount))

      if (!args.nativeOnly) {
        const { token, reused } = await encodeRuntimeRangePack(
          contentChunks,
          source.id,
          chunkCount,
          implementationMtime,
        )
        const file = `content/${source.id}/chunks-${chunkCount}/range-pack/pixel-range-none.png`
        const written = writeFixture(file, token)

        if (reused) rangePackCacheHits++
        else rangePackEncoded++
        if (written.reused) fixtureReused++
        else fixtureWritten++
        manifest.fixtures.push({
          kind: 'range-pack',
          tab: 'content',
          source: source.id,
          sourceKind: source.kind,
          chunkCount,
          algo: 'pixel-range-none',
          compressor: 'none',
          regionCompressor: 'deflate-9',
          file,
          bytes: written.bytes,
          originalBytes: contentChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0),
          sha256: written.sha256,
          files: contentChunks.map((chunk, chunkIndex) => ({
            path: `chunk-${padChunk(chunkIndex)}.bin`,
            originalBytes: chunk.byteLength,
            sha256: sha256(chunk),
          })),
        })
      }

      for (const tab of ['content', 'script'] as const) {
        const chunks = tab === 'content' ? contentChunks : scriptChunks

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          const chunk = chunks[chunkIndex]

          for (const encoding of ENCODINGS) {
            const { body, reused } = encodeRuntimeNative(chunk, encoding)
            const file = `${tab}/${source.id}/chunks-${chunkCount}/native/${encoding}/chunk-${padChunk(chunkIndex)}${nativeExt(encoding)}`
            const written = writeFixture(file, body)

            if (reused) nativeCacheHits++
            else nativeEncoded++
            if (written.reused) fixtureReused++
            else fixtureWritten++
            manifest.fixtures.push({
              kind: 'native',
              tab,
              source: source.id,
              sourceKind: source.kind,
              chunkCount,
              chunkIndex,
              encoding,
              file,
              bytes: written.bytes,
              originalBytes: chunk.byteLength,
              sha256: written.sha256,
            })
          }

          for (const algo of algorithms) {
            for (const channels of algo.channels) {
              const { token, reused } = await encodeRuntimeToken(
                chunk,
                algo,
                channels,
                implementationMtime,
              )
              const file = `${tab}/${source.id}/chunks-${chunkCount}/token/${algo.group}/${algo.name}-c${channels}/chunk-${padChunk(chunkIndex)}${algo.extension}`
              const written = writeFixture(file, token)

              if (reused) tokenCacheHits++
              else tokenEncoded++
              if (written.reused) fixtureReused++
              else fixtureWritten++
              manifest.fixtures.push({
                kind: 'token',
                tab,
                source: source.id,
                sourceKind: source.kind,
                chunkCount,
                chunkIndex,
                group: algo.group,
                algo: algo.name,
                channels,
                surface: algo.surface,
                compressor: algo.compressor,
                streamable: algo.streamable,
                file,
                bytes: written.bytes,
                originalBytes: chunk.byteLength,
                sha256: written.sha256,
              })
            }
          }
        }
      }
    }
  }

  fs.writeFileSync(
    path.join(APP_RUNTIME_FIXTURE_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  )
  console.log(`Runtime fixtures written to ${APP_RUNTIME_FIXTURE_DIR}`)
  console.log(`Sources: ${manifest.sources.length}`)
  console.log(`Chunk counts: ${manifest.chunkCounts.join(', ')}`)
  console.log(`Algorithms: ${manifest.algorithms.length}`)
  console.log(`Fixtures: ${manifest.fixtures.length}`)
  console.log(`Native cache: ${nativeCacheHits} reused, ${nativeEncoded} encoded`)
  console.log(`Fixture files: ${fixtureReused} unchanged, ${fixtureWritten} written`)
  if (!args.nativeOnly) {
    console.log(`Token cache: ${tokenCacheHits} reused, ${tokenEncoded} encoded`)
    console.log(`Range-pack cache: ${rangePackCacheHits} reused, ${rangePackEncoded} encoded`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
