import '@tokenpack/node'

/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

import {
  encode as tokenpackEncode,
  type EncodedTokenArtifact,
  PackBuilder,
  TokenPack,
} from '@tokenpack/node'
import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'

import { browserFetchBenchAlgos } from './benchmark/bench-algos'
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

const ENCODINGS: readonly Encoding[] = ['brotli']
const ROUTER_FILE_COMPRESSOR = 'deflate-9'
const LABEL_W = 42

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`

  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

function fmtMs(ms: number): string {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(1)}s`
}

function nowMs(): number {
  return Date.now()
}

function progress(label: string, detail = ''): number {
  const text = detail ? `${label.padEnd(LABEL_W)} ${detail}` : label

  console.log(text)

  return nowMs()
}

function progressDone(start: number, detail = 'done'): void {
  console.log(`  ${detail} in ${fmtMs(nowMs() - start)}`)
}

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
  tab: 'content' | 'script'
  source: string
  sourceKind: BenchSourceKind
  chunkCount: number
  algo: 'pixel-range-none'
  compressor: 'none'
  regionCompressor: string
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

interface RouterFixture {
  kind: 'router'
  tab: 'content' | 'script'
  source: string
  sourceKind: BenchSourceKind
  chunkCount: number
  algo: 'pixel-range-none'
  compressor: 'none'
  regionCompressor: string
  file: string
  bytes: number
  originalBytes: number
  sha256: string
  files: Array<{
    path: string
    originalBytes: number
    sha256: string
  }>
  chunks: Array<{
    id: string
    href: string
    file: string
    bytes: number
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
  fixtures: Array<NativeFixture | TokenFixture | RangePackFixture | RouterFixture>
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

interface RuntimeLogicalFile {
  path: string
  bytes: Buffer
}

interface RuntimeAssetCase {
  id: string
  sourceFile: string
  sourceKind: BenchSourceKind
  sourceBytes: number
  sourceSha256: string
  chunkCount: number
  contentFiles: RuntimeLogicalFile[]
  scriptFiles: RuntimeLogicalFile[]
}

function listFocusedBrowserTokenAlgos(): AlgoBinding[] {
  return browserFetchBenchAlgos()
    .filter(info => info.name === 'linear-upng-deflate')
    .map(info => {
      const Ctor = algorithmCatalog.getByName(info.name)
      const surface = new (Ctor.Surface as unknown as new () => {
        id: string
        extension: string
      })()
      const streamable = Ctor.capabilities.streamable

      return {
        name: info.name,
        group: streamable ? 'stream' : 'fetch',
        channels: Ctor.capabilities.channels,
        surface: surface.id,
        extension: surface.extension,
        compressor: Ctor.Compressor.familyId,
        streamable,
      }
    })
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

async function artifactBuffer(artifact: EncodedTokenArtifact): Promise<Buffer> {
  return Buffer.from(await artifact.blob.arrayBuffer())
}

function findArtifact(
  artifacts: readonly EncodedTokenArtifact[],
  filename: string,
): EncodedTokenArtifact {
  const artifact = artifacts.find(item => item.filename === filename)

  if (!artifact) throw new Error(`missing encoded artifact: ${filename}`)

  return artifact
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

function logicalFilesDigest(files: readonly RuntimeLogicalFile[]): string {
  return sha256(
    Buffer.from(files.map(file => `${file.path}:${sha256(file.bytes)}`).join('\n'), 'utf-8'),
  ).slice(0, 16)
}

function runtimeRangePackCachePath(
  files: readonly RuntimeLogicalFile[],
  source: string,
  chunkCount: number,
  implementationMtime: number,
): string {
  const chunksDigest = logicalFilesDigest(files)
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

function runtimeRouterCacheDir(
  files: readonly RuntimeLogicalFile[],
  source: string,
  chunkCount: number,
  tab: 'content' | 'script',
  implementationMtime: number,
): string {
  const chunksDigest = logicalFilesDigest(files)
  const key = [
    `v${implementationMtime}`,
    tab,
    source,
    `chunks-${chunkCount}`,
    chunksDigest,
    'router',
    'pixel-range-none',
    ROUTER_FILE_COMPRESSOR,
  ].join('__')

  return path.join(APP_RUNTIME_CACHE_DIR, 'router', key)
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
  files: readonly RuntimeLogicalFile[],
  source: string,
  chunkCount: number,
  implementationMtime: number,
): Promise<{ token: Buffer; reused: boolean }> {
  const cachePath = runtimeRangePackCachePath(files, source, chunkCount, implementationMtime)

  if (fs.existsSync(cachePath)) {
    return { token: fs.readFileSync(cachePath), reused: true }
  }

  const builder = new PackBuilder()

  files.forEach(file => {
    builder.withFile(file.path, file.bytes)
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

async function encodeRuntimeRouter(
  files: readonly RuntimeLogicalFile[],
  source: string,
  tab: 'content' | 'script',
  chunkCount: number,
  implementationMtime: number,
): Promise<{
  router: Buffer
  chunks: Array<{ id: string; href: string; bytes: Buffer }>
  reused: boolean
}> {
  const cacheDir = runtimeRouterCacheDir(files, source, chunkCount, tab, implementationMtime)
  const manifestPath = path.join(cacheDir, 'manifest.json')

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      chunks: Array<{ id: string; href: string; file: string }>
    }

    return {
      router: fs.readFileSync(path.join(cacheDir, 'router.png')),
      chunks: manifest.chunks.map(chunk => ({
        id: chunk.id,
        href: chunk.href,
        bytes: fs.readFileSync(path.join(cacheDir, chunk.file)),
      })),
      reused: true,
    }
  }

  const pack = new TokenPack()

  files.forEach(file => {
    pack.withFile(file.path, file.bytes)
  })

  const artifacts = await tokenpackEncode(
    pack.router({
      variant: {
        id: 'router-pixel-range-none',
        algo: 'pixel-range-none',
        channels: 3,
        loadMode: 'router',
        packCompressor: ROUTER_FILE_COMPRESSOR,
      },
      fileCompressor: ROUTER_FILE_COMPRESSOR,
    }),
    {
      algo: 'pixel-range-none',
      compressor: 'deflate-9',
      algoOptions: { surface: { channels: 3 } },
    },
  )

  fs.mkdirSync(cacheDir, { recursive: true })
  for (const artifact of artifacts) {
    fs.writeFileSync(path.join(cacheDir, artifact.filename), await artifactBuffer(artifact))
  }
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      chunks: artifacts
        .filter(artifact => artifact.filename !== 'router.png')
        .map(artifact => ({
          id: artifact.filename.replace(/\.png$/, ''),
          href: artifact.filename,
          file: artifact.filename,
        })),
    }),
  )

  const router = await artifactBuffer(findArtifact(artifacts, 'router.png'))
  const chunkArtifacts = artifacts
    .filter(artifact => artifact.filename !== 'router.png')
    .map(artifact => ({
      id: artifact.filename.replace(/\.png$/, ''),
      href: artifact.filename,
    }))

  return {
    router,
    chunks: await Promise.all(
      chunkArtifacts.map(async chunk => ({
        id: chunk.id,
        href: chunk.href,
        bytes: await artifactBuffer(findArtifact(artifacts, chunk.href)),
      })),
    ),
    reused: false,
  }
}

function chunkLogicalFilePath(tab: 'content' | 'script', chunkIndex: number): string {
  const ext = tab === 'script' ? 'js' : 'txt'

  return `chunk-${padChunk(chunkIndex)}.${ext}`
}

function logicalFilesFor(
  tab: 'content' | 'script',
  chunks: readonly Buffer[],
): RuntimeLogicalFile[] {
  return chunks.map((bytes, chunkIndex) => ({
    path: chunkLogicalFilePath(tab, chunkIndex),
    bytes,
  }))
}

function totalLogicalBytes(files: readonly RuntimeLogicalFile[]): number {
  return files.reduce((sum, file) => sum + file.bytes.byteLength, 0)
}

function runtimeFileManifest(files: readonly RuntimeLogicalFile[]) {
  return files.map(file => ({
    path: file.path,
    originalBytes: file.bytes.byteLength,
    sha256: sha256(file.bytes),
  }))
}

function selectedRealisticRuntimeCases(sourceIds: Set<string> | null): RuntimeAssetCase[] {
  const cases = [
    largeJsAssetCase(),
    lessCompressibleLargeJsAssetCase(),
    appBundleAssetCase(),
    manySmallAssetsCase(),
  ]

  return cases.filter(item => !sourceIds || sourceIds.has(item.id))
}

function largeJsAssetCase(): RuntimeAssetCase {
  const source = loadBenchSource({ id: 'large-js', file: 'chunk-5mb.js', kind: 'text' })
  const text = [
    '/* tokenpack runtime fixture: single large application asset */\n',
    source.text,
    '\n/* repeated production-like body, section 2 */\n',
    source.text,
    '\n/* repeated production-like body, section 3 */\n',
    source.text,
  ].join('')
  const bytes = Buffer.from(text, 'utf-8')
  const loaded = {
    ...source,
    id: 'large-js',
    text,
    bytes,
    byteLength: bytes.byteLength,
    textLength: text.length,
    sha256: sha256(bytes),
  }
  const scriptFiles = splitScriptChunks(loaded, 1).map((script, index) => ({
    path: index === 0 ? 'assets/app-large.js' : `assets/app-large-${index}.js`,
    bytes: script,
  }))

  return {
    id: 'large-js',
    sourceFile: source.file,
    sourceKind: 'text',
    sourceBytes: bytes.byteLength,
    sourceSha256: sha256(bytes),
    chunkCount: 1,
    contentFiles: [{ path: 'assets/app-large.js', bytes }],
    scriptFiles,
  }
}

function lessCompressibleLargeJsAssetCase(): RuntimeAssetCase {
  const id = 'less-compressible-large-js'
  const payload = deterministicBase64Payload(15 * 1024 * 1024)
  const bytes = makeSingleChunkBenchmarkScript(id, payload)

  return {
    id,
    sourceFile: 'generated deterministic high-entropy JS',
    sourceKind: 'text',
    sourceBytes: bytes.byteLength,
    sourceSha256: sha256(bytes),
    chunkCount: 1,
    contentFiles: [{ path: 'assets/app-high-entropy.js', bytes }],
    scriptFiles: [{ path: 'assets/app-high-entropy.js', bytes }],
  }
}

function appBundleAssetCase(): RuntimeAssetCase {
  const clientSpec = loadBenchSource({
    id: 'client-spec-map-text',
    file: 'client-spec-map.json',
    kind: 'text',
  })
  const reactDev = loadBenchSource({
    id: 'react-dom-client-development',
    file: 'react-dom-client.development.js',
    kind: 'text',
  })
  const appChunk = loadBenchSource({ id: 'chunk-5mb', file: 'chunk-5mb.js', kind: 'text' })
  const contentFiles: RuntimeLogicalFile[] = [
    { path: 'assets/runtime.js', bytes: Buffer.from(makeRuntimeBootstrap('app-bundle'), 'utf-8') },
    { path: 'assets/vendor/react-dom-client.development.js', bytes: reactDev.bytes },
    { path: 'assets/app/editor-workbench.js', bytes: appChunk.bytes },
    { path: 'assets/app/editor.css', bytes: makeCssAsset('app-bundle', 160) },
    { path: 'assets/app/client-spec-map.json', bytes: clientSpec.bytes },
  ]
  const sourceText = contentFiles.map(file => file.bytes.toString('utf-8')).join('\n')
  const sourceBytes = Buffer.from(sourceText, 'utf-8')
  const loaded = {
    ...clientSpec,
    id: 'app-bundle',
    file: 'mixed runtime sources',
    text: sourceText,
    bytes: sourceBytes,
    byteLength: sourceBytes.byteLength,
    textLength: sourceText.length,
    sha256: sha256(sourceBytes),
  }
  const scriptPaths = [
    'assets/runtime.js',
    'assets/vendor.js',
    'assets/app.js',
    'assets/editor.js',
    'assets/bootstrap.js',
  ]
  const scriptFiles = splitScriptChunks(loaded, scriptPaths.length).map((bytes, index) => ({
    path: scriptPaths[index]!,
    bytes,
  }))

  return {
    id: 'app-bundle',
    sourceFile: loaded.file,
    sourceKind: 'text',
    sourceBytes: sourceBytes.byteLength,
    sourceSha256: sha256(sourceBytes),
    chunkCount: contentFiles.length,
    contentFiles,
    scriptFiles,
  }
}

function manySmallAssetsCase(): RuntimeAssetCase {
  const clientSpec = loadBenchSource({
    id: 'client-spec-map-text',
    file: 'client-spec-map.json',
    kind: 'text',
  })
  const reactProd = loadBenchSource({
    id: 'react-dom-client-production',
    file: 'react-dom-client.production.js',
    kind: 'text',
  })
  const jsonSlices = splitTextEvenly(clientSpec.text, 12)
  const jsSlices = splitTextEvenly(reactProd.text, 12)
  const cssFiles = Array.from({ length: 6 }, (_, index) => ({
    path: `assets/styles/theme-${padChunk(index)}.css`,
    bytes: makeCssAsset(`many-small-assets-${index}`, 16 + index),
  }))
  const contentFiles: RuntimeLogicalFile[] = [
    ...jsSlices.map((text, index) => ({
      path: `assets/chunks/module-${padChunk(index)}.js`,
      bytes: Buffer.from(text, 'utf-8'),
    })),
    ...jsonSlices.map((text, index) => ({
      path: `assets/data/spec-slice-${padChunk(index)}.json`,
      bytes: Buffer.from(text, 'utf-8'),
    })),
    ...cssFiles,
  ]
  const sourceText = contentFiles.map(file => file.bytes.toString('utf-8')).join('\n')
  const sourceBytes = Buffer.from(sourceText, 'utf-8')
  const loaded = {
    ...clientSpec,
    id: 'many-small-assets',
    file: 'generated small JS/CSS/JSON assets',
    text: sourceText,
    bytes: sourceBytes,
    byteLength: sourceBytes.byteLength,
    textLength: sourceText.length,
    sha256: sha256(sourceBytes),
  }
  const scriptPaths = Array.from(
    { length: contentFiles.length },
    (_, index) => `assets/chunks/runtime-part-${padChunk(index)}.js`,
  )
  const scriptFiles = splitScriptChunks(loaded, scriptPaths.length).map((bytes, index) => ({
    path: scriptPaths[index]!,
    bytes,
  }))

  return {
    id: 'many-small-assets',
    sourceFile: loaded.file,
    sourceKind: 'text',
    sourceBytes: sourceBytes.byteLength,
    sourceSha256: sha256(sourceBytes),
    chunkCount: contentFiles.length,
    contentFiles,
    scriptFiles,
  }
}

function makeRuntimeBootstrap(name: string): string {
  return `;globalThis.__tokenpackRuntimeBenchBootstrap=${JSON.stringify(name)};\n`
}

function makeSingleChunkBenchmarkScript(caseId: string, payload: string): Buffer {
  const expectedPayloadSha256 = sha256(Buffer.from(payload, 'utf-8'))
  const script = `;(() => {
  const payload = ${JSON.stringify(payload)};
  const registry = (globalThis.__tokenpackRuntimeBench ||= { scriptChunks: {} });
  const state = (registry.scriptChunks[${JSON.stringify(caseId)}] ||= {
    source: ${JSON.stringify(caseId)},
    chunkCount: 1,
    loaded: [],
    totalPayloadLength: 0,
    expectedPayloadLength: payload.length,
    expectedPayloadSha256: ${JSON.stringify(expectedPayloadSha256)}
  });
  state.loaded[0] = true;
  state.totalPayloadLength += payload.length;
  globalThis.__tokenpackRuntimeBenchHighEntropyLength = payload.length;
  const callbacks = globalThis.__benchmarkResult;
  const callback = callbacks && callbacks[${JSON.stringify(caseId)}];
  if (typeof callback === 'function') {
    callback({
      caseId: ${JSON.stringify(caseId)},
      source: ${JSON.stringify(caseId)},
      chunkCount: 1,
      chunkIndex: 0,
      payloadLength: payload.length,
      loadedCount: state.loaded.filter(Boolean).length,
      totalPayloadLength: state.totalPayloadLength,
      expectedPayloadLength: state.expectedPayloadLength,
      expectedPayloadSha256: state.expectedPayloadSha256
    });
  }
})();`

  return Buffer.from(script, 'utf-8')
}

function deterministicBase64Payload(targetChars: number): string {
  const byteCount = Math.ceil((targetChars / 4) * 3)
  const bytes = Buffer.allocUnsafe(byteCount)
  let state = 0x9e3779b9

  for (let index = 0; index < bytes.length; index += 1) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    bytes[index] = state & 0xff
  }

  return bytes.toString('base64').slice(0, targetChars)
}

function makeCssAsset(name: string, rules: number): Buffer {
  const lines = Array.from({ length: rules }, (_, index) => {
    const n = String(index).padStart(3, '0')

    return `.tp-${name.replace(/[^a-z0-9-]/gi, '-')}-${n}{color:#${((index * 9301 + 49297) % 0xffffff).toString(16).padStart(6, '0')};margin:${index % 7}px;padding:${index % 5}px}`
  })

  return Buffer.from(lines.join('\n'), 'utf-8')
}

function splitTextEvenly(text: string, count: number): string[] {
  const out: string[] = []
  const size = Math.ceil(text.length / count)

  for (let index = 0; index < count; index += 1) {
    out.push(text.slice(index * size, Math.min(text.length, (index + 1) * size)))
  }

  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sources = selectedRuntimeBenchSources(args.sources)
  const realisticCases = selectedRealisticRuntimeCases(args.sources)
  // Browser Fetch Bench keeps the regular token matrix intentionally tiny.
  // UPNG+deflate is the focused codec comparator for router decode/materialize
  // experiments because it is browser-decodable without Brotli support.
  const algorithms = args.nativeOnly ? [] : listFocusedBrowserTokenAlgos()
  const totalStart = progress('Runtime fixture generator', '')
  const implementationMtime = computeImplementationMtime()
  let nativeCacheHits = 0
  let nativeEncoded = 0
  let fixtureReused = 0
  let fixtureWritten = 0
  let tokenCacheHits = 0
  let tokenEncoded = 0
  let rangePackCacheHits = 0
  let rangePackEncoded = 0
  let routerCacheHits = 0
  let routerEncoded = 0
  const manifest: RuntimeFixtureManifest = {
    generatedAt: new Date().toISOString(),
    sources: [],
    chunkCounts: args.chunkCounts,
    encodings: [...ENCODINGS],
    algorithms,
    expectations: { content: [], script: [] },
    fixtures: [],
  }

  if (sources.length === 0 && realisticCases.length === 0) {
    throw new Error('no sources selected')
  }

  console.log(`Sources: ${sources.length + realisticCases.length}`)
  console.log(`Chunk counts: ${args.chunkCounts.join(', ')}`)
  console.log(`Algorithms: ${algorithms.length}${args.nativeOnly ? ' (native only)' : ''}`)
  console.log(`Output: ${APP_RUNTIME_FIXTURE_DIR}`)
  console.log()

  fs.mkdirSync(APP_RUNTIME_FIXTURE_DIR, { recursive: true })
  fs.mkdirSync(APP_RUNTIME_CACHE_DIR, { recursive: true })

  const emitAssetCase = async (assetCase: RuntimeAssetCase, caseIndex: number, total: number) => {
    console.log(
      `── asset case ${caseIndex}/${total}: ${assetCase.id} (${fmtBytes(assetCase.sourceBytes)}, ${assetCase.chunkCount} logical file${assetCase.chunkCount === 1 ? '' : 's'}) ──`,
    )
    manifest.sources.push({
      id: assetCase.id,
      file: assetCase.sourceFile,
      kind: assetCase.sourceKind,
      bytes: assetCase.sourceBytes,
      sha256: assetCase.sourceSha256,
    })

    if (!args.nativeOnly) {
      for (const tab of ['content', 'script'] as const) {
        const files = tab === 'content' ? assetCase.contentFiles : assetCase.scriptFiles
        const rangeStart = progress(
          `    ${tab} range-pack`,
          `${files.length} files, ${fmtBytes(totalLogicalBytes(files))}`,
        )
        const { token, reused } = await encodeRuntimeRangePack(
          files,
          assetCase.id,
          assetCase.chunkCount,
          implementationMtime,
        )
        const file = `${tab}/${assetCase.id}/chunks-${assetCase.chunkCount}/range-pack/pixel-range-none.png`
        const written = writeFixture(file, token)

        if (reused) rangePackCacheHits++
        else rangePackEncoded++
        if (written.reused) fixtureReused++
        else fixtureWritten++
        progressDone(
          rangeStart,
          `${reused ? 'cache hit' : 'encoded'}, ${fmtBytes(written.bytes)} fixture`,
        )
        manifest.fixtures.push({
          kind: 'range-pack',
          tab,
          source: assetCase.id,
          sourceKind: assetCase.sourceKind,
          chunkCount: assetCase.chunkCount,
          algo: 'pixel-range-none',
          compressor: 'none',
          regionCompressor: 'deflate-9',
          file,
          bytes: written.bytes,
          originalBytes: totalLogicalBytes(files),
          sha256: written.sha256,
          files: runtimeFileManifest(files),
        })

        const routerStart = progress(
          `    ${tab} router`,
          `${files.length} routed files, segment threshold ${fmtBytes(1024 * 1024)}`,
        )
        const routerBundle = await encodeRuntimeRouter(
          files,
          assetCase.id,
          tab,
          assetCase.chunkCount,
          implementationMtime,
        )
        const routerBase = `${tab}/${assetCase.id}/chunks-${assetCase.chunkCount}/router`
        const routerFile = `${routerBase}/router.png`
        const writtenRouter = writeFixture(routerFile, routerBundle.router)
        const writtenChunks = routerBundle.chunks.map(chunk => ({
          ...chunk,
          file: `${routerBase}/${chunk.href}`,
          written: writeFixture(`${routerBase}/${chunk.href}`, chunk.bytes),
        }))

        if (routerBundle.reused) routerCacheHits++
        else routerEncoded++
        const routerArtifacts = [writtenRouter, ...writtenChunks.map(chunk => chunk.written)]

        fixtureReused += routerArtifacts.filter(artifact => artifact.reused).length
        fixtureWritten += routerArtifacts.filter(artifact => !artifact.reused).length
        progressDone(
          routerStart,
          `${routerBundle.reused ? 'cache hit' : 'encoded'}, ${writtenChunks.length} chunk token(s), ${fmtBytes(writtenRouter.bytes)} router`,
        )
        manifest.fixtures.push({
          kind: 'router',
          tab,
          source: assetCase.id,
          sourceKind: assetCase.sourceKind,
          chunkCount: assetCase.chunkCount,
          algo: 'pixel-range-none',
          compressor: 'none',
          regionCompressor: ROUTER_FILE_COMPRESSOR,
          file: routerFile,
          bytes: writtenRouter.bytes,
          originalBytes: totalLogicalBytes(files),
          sha256: writtenRouter.sha256,
          files: runtimeFileManifest(files),
          chunks: writtenChunks.map(chunk => ({
            id: chunk.id,
            href: chunk.href,
            file: chunk.file,
            bytes: chunk.written.bytes,
            sha256: chunk.written.sha256,
          })),
        })
      }
    }

    for (const tab of ['content', 'script'] as const) {
      const files = tab === 'content' ? assetCase.contentFiles : assetCase.scriptFiles

      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const logicalFile = files[fileIndex]
        const nativeStart = progress(
          `    ${tab} native ${fileIndex + 1}/${files.length}`,
          `${logicalFile.path}, ${fmtBytes(logicalFile.bytes.byteLength)} source`,
        )

        for (const encoding of ENCODINGS) {
          const { body, reused } = encodeRuntimeNative(logicalFile.bytes, encoding)
          const file = `${tab}/${assetCase.id}/chunks-${assetCase.chunkCount}/native/${encoding}/chunk-${padChunk(fileIndex)}${nativeExt(encoding)}`
          const written = writeFixture(file, body)

          if (reused) nativeCacheHits++
          else nativeEncoded++
          if (written.reused) fixtureReused++
          else fixtureWritten++
          manifest.fixtures.push({
            kind: 'native',
            tab,
            source: assetCase.id,
            sourceKind: assetCase.sourceKind,
            chunkCount: assetCase.chunkCount,
            chunkIndex: fileIndex,
            encoding,
            file,
            bytes: written.bytes,
            originalBytes: logicalFile.bytes.byteLength,
            sha256: written.sha256,
          })
        }
        progressDone(nativeStart, `${ENCODINGS.length} encoding(s)`)

        if (algorithms.length > 0) {
          const tokenStart = progress(
            `    ${tab} tokens ${fileIndex + 1}/${files.length}`,
            `${algorithms.length} algorithm(s), ${fmtBytes(logicalFile.bytes.byteLength)} source`,
          )
          let tokenVariants = 0

          for (const algo of algorithms) {
            for (const channels of algo.channels) {
              const { token, reused } = await encodeRuntimeToken(
                logicalFile.bytes,
                algo,
                channels,
                implementationMtime,
              )
              const file = `${tab}/${assetCase.id}/chunks-${assetCase.chunkCount}/token/${algo.group}/${algo.name}-c${channels}/chunk-${padChunk(fileIndex)}${algo.extension}`
              const written = writeFixture(file, token)

              if (reused) tokenCacheHits++
              else tokenEncoded++
              if (written.reused) fixtureReused++
              else fixtureWritten++
              manifest.fixtures.push({
                kind: 'token',
                tab,
                source: assetCase.id,
                sourceKind: assetCase.sourceKind,
                chunkCount: assetCase.chunkCount,
                chunkIndex: fileIndex,
                group: algo.group,
                algo: algo.name,
                channels,
                surface: algo.surface,
                compressor: algo.compressor,
                streamable: algo.streamable,
                file,
                bytes: written.bytes,
                originalBytes: logicalFile.bytes.byteLength,
                sha256: written.sha256,
              })
              tokenVariants += 1
            }
          }
          progressDone(tokenStart, `${tokenVariants} token variant(s)`)
        }
      }
    }

    console.log()
  }

  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex += 1) {
    const sourceConfig = sources[sourceIndex]
    const source = loadBenchSource(sourceConfig)

    console.log(
      `── source ${sourceIndex + 1}/${sources.length}: ${source.id} (${fmtBytes(source.byteLength)}, ${source.kind}) ──`,
    )
    manifest.sources.push({
      id: source.id,
      file: source.file,
      kind: source.kind,
      bytes: source.byteLength,
      sha256: source.sha256,
    })

    for (let chunkCountIndex = 0; chunkCountIndex < args.chunkCounts.length; chunkCountIndex += 1) {
      const chunkCount = args.chunkCounts[chunkCountIndex]
      const contentChunks = splitContentChunks(source, chunkCount)
      const scriptChunks = splitScriptChunks(source, chunkCount)
      const contentFiles = logicalFilesFor('content', contentChunks)
      const scriptFiles = logicalFilesFor('script', scriptChunks)
      const chunkDetail = [
        `content=${contentChunks.map(chunk => fmtBytes(chunk.byteLength)).join('+')}`,
        `script=${scriptChunks.map(chunk => fmtBytes(chunk.byteLength)).join('+')}`,
      ].join(' · ')

      console.log(
        `  chunks ${chunkCountIndex + 1}/${args.chunkCounts.length}: ${chunkCount} (${chunkDetail})`,
      )

      manifest.expectations.content.push(contentExpectation(source, chunkCount))
      manifest.expectations.script.push(scriptExpectation(source, chunkCount))

      if (!args.nativeOnly) {
        for (const tab of ['content', 'script'] as const) {
          const files = tab === 'content' ? contentFiles : scriptFiles
          const rangeStart = progress(
            `    ${tab} range-pack`,
            `${files.length} files, ${fmtBytes(totalLogicalBytes(files))}`,
          )
          const { token, reused } = await encodeRuntimeRangePack(
            files,
            source.id,
            chunkCount,
            implementationMtime,
          )
          const file = `${tab}/${source.id}/chunks-${chunkCount}/range-pack/pixel-range-none.png`
          const written = writeFixture(file, token)

          if (reused) rangePackCacheHits++
          else rangePackEncoded++
          if (written.reused) fixtureReused++
          else fixtureWritten++
          progressDone(
            rangeStart,
            `${reused ? 'cache hit' : 'encoded'}, ${fmtBytes(written.bytes)} fixture`,
          )
          manifest.fixtures.push({
            kind: 'range-pack',
            tab,
            source: source.id,
            sourceKind: source.kind,
            chunkCount,
            algo: 'pixel-range-none',
            compressor: 'none',
            regionCompressor: 'deflate-9',
            file,
            bytes: written.bytes,
            originalBytes: totalLogicalBytes(files),
            sha256: written.sha256,
            files: runtimeFileManifest(files),
          })

          const routerStart = progress(
            `    ${tab} router`,
            `${files.length} routed files, segment threshold ${fmtBytes(1024 * 1024)}`,
          )
          const routerBundle = await encodeRuntimeRouter(
            files,
            source.id,
            tab,
            chunkCount,
            implementationMtime,
          )
          const routerBase = `${tab}/${source.id}/chunks-${chunkCount}/router`
          const routerFile = `${routerBase}/router.png`
          const writtenRouter = writeFixture(routerFile, routerBundle.router)
          const writtenChunks = routerBundle.chunks.map(chunk => ({
            ...chunk,
            file: `${routerBase}/${chunk.href}`,
            written: writeFixture(`${routerBase}/${chunk.href}`, chunk.bytes),
          }))

          if (routerBundle.reused) routerCacheHits++
          else routerEncoded++
          const routerArtifacts = [writtenRouter, ...writtenChunks.map(chunk => chunk.written)]

          fixtureReused += routerArtifacts.filter(artifact => artifact.reused).length
          fixtureWritten += routerArtifacts.filter(artifact => !artifact.reused).length
          progressDone(
            routerStart,
            `${routerBundle.reused ? 'cache hit' : 'encoded'}, ${writtenChunks.length} chunk token(s), ${fmtBytes(writtenRouter.bytes)} router`,
          )
          manifest.fixtures.push({
            kind: 'router',
            tab,
            source: source.id,
            sourceKind: source.kind,
            chunkCount,
            algo: 'pixel-range-none',
            compressor: 'none',
            regionCompressor: ROUTER_FILE_COMPRESSOR,
            file: routerFile,
            bytes: writtenRouter.bytes,
            originalBytes: totalLogicalBytes(files),
            sha256: writtenRouter.sha256,
            files: runtimeFileManifest(files),
            chunks: writtenChunks.map(chunk => ({
              id: chunk.id,
              href: chunk.href,
              file: chunk.file,
              bytes: chunk.written.bytes,
              sha256: chunk.written.sha256,
            })),
          })
        }
      }

      for (const tab of ['content', 'script'] as const) {
        const chunks = tab === 'content' ? contentChunks : scriptChunks

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          const chunk = chunks[chunkIndex]
          const nativeStart = progress(
            `    ${tab} native ${chunkIndex + 1}/${chunks.length}`,
            `${fmtBytes(chunk.byteLength)} source`,
          )

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
          progressDone(nativeStart, `${ENCODINGS.length} encoding(s)`)

          if (algorithms.length > 0) {
            const tokenStart = progress(
              `    ${tab} tokens ${chunkIndex + 1}/${chunks.length}`,
              `${algorithms.length} algorithm(s), ${fmtBytes(chunk.byteLength)} source`,
            )
            let tokenVariants = 0

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
                tokenVariants += 1
              }
            }
            progressDone(tokenStart, `${tokenVariants} token variant(s)`)
          }
        }
      }
    }

    console.log()
  }

  for (let caseIndex = 0; caseIndex < realisticCases.length; caseIndex += 1) {
    await emitAssetCase(realisticCases[caseIndex]!, caseIndex + 1, realisticCases.length)
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
    console.log(`Router cache: ${routerCacheHits} reused, ${routerEncoded} encoded`)
  }
  console.log(`Total time: ${fmtMs(nowMs() - totalStart)}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
