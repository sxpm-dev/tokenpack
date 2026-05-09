/**
 * Pre-generates runtime-benchmark fixtures into packages/app/runtime-fixtures/.
 * Mirrors a CDN serving pre-encoded static assets — every endpoint just streams
 * from disk; zero per-request CPU.
 *
 * Outputs:
 *   <source>.{raw,gz,br,deflate}            HTTP encodings (group A)
 *   <source>.<algo>-c<ch>.png|webp|avif      Token variants per algorithm × channels (group A)
 *   script.{raw,gz,br,deflate}              HTTP encodings of the synthetic bench script (group B)
 *   script.<algo>-c<ch>.<ext>                Token variants of the bench script (group B)
 *   manifest.json                           Machine-readable index
 *
 * Token matrix is generated dynamically from `algorithmCatalog.list()` × the
 * algorithm's supported channel counts — every browser-decodable algorithm
 * gets covered, including the streaming-PNG variants.
 *
 * Run: yarn benchmark:generate:runtime
 */

import '@tokenpack/node'

import { encode as tokenpackEncode } from '@tokenpack/node'
import fs from 'fs'
import path from 'path'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(HERE, '..')
const SOURCES = path.join(HERE, 'sources')
const OUT_DIR = path.join(REPO_ROOT, 'packages', 'app', 'runtime-fixtures')

interface SourceConfig {
  id: string
  file: string
}

const SOURCE_CONFIGS: SourceConfig[] = [
  { id: 'react-dom-dev', file: 'react-dom-client.development.js' },
  { id: 'react-dom-prod', file: 'react-dom-client.production.js' },
  { id: 'chunk-5mb', file: 'chunk-5mb.js' },
  { id: 'screenshot', file: 'screenshot.jpg' },
  { id: 'client-spec', file: 'client-spec-map.json' },
  { id: 'client-spec-min', file: 'client-spec-map.min.json' },
]

interface EncodingConfig {
  id: 'raw' | 'gzip' | 'br' | 'deflate'
  ext: string
  encode: ((buf: Buffer) => Buffer) | null
}

const ENCODINGS: EncodingConfig[] = [
  { id: 'raw', ext: '.raw', encode: null },
  { id: 'gzip', ext: '.gz', encode: buf => zlib.gzipSync(buf, { level: 6 }) },
  {
    id: 'br',
    ext: '.br',
    encode: buf =>
      zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } }),
  },
  { id: 'deflate', ext: '.deflate', encode: buf => zlib.deflateSync(buf, { level: 6 }) },
]

interface AlgoBinding {
  algoName: string
  surfaceId: string
  surfaceExt: string
  compressorFamily: string
  channels: ReadonlyArray<1 | 2 | 3 | 4>
  streamable: boolean
}

function listAlgoBindings(): AlgoBinding[] {
  return algorithmCatalog.list().map(Ctor => {
    const surface = new (Ctor.Surface as unknown as new () => {
      id: string
      extension: string
    })()
    const compressor = Ctor.Compressor as unknown as { familyId: string }
    const caps = Ctor.capabilities

    return {
      algoName: Ctor.name,
      surfaceId: surface.id,
      surfaceExt: surface.extension,
      compressorFamily: compressor.familyId,
      channels: caps.channels,
      streamable: caps.streamable,
    }
  })
}

function buildScript(serverNow: number): string {
  return `(function(){
  const tServer = ${serverNow.toFixed(3)};
  const tExec = performance.now();
  let _x = 0;
  for (let i = 0; i < 1000; i++) _x += i;
  const result = { tServer, tExec, _x };
  globalThis.__rtbench = result;
  console.log('runtime-bench:', result);
})();`
}

interface SourceFixture {
  kind: 'source'
  source: string
  encoding: string
  file: string
  bytes: number
  originalBytes: number
  encodeMs: number
}

interface ScriptTextFixture {
  kind: 'script-text'
  encoding: string
  file: string
  bytes: number
  originalBytes: number
  encodeMs: number
}

interface ScriptTokenFixture {
  kind: 'script-token'
  scenario: string
  file: string
  bytes: number
  originalBytes: number
  encodeMs: number
  config: { algo: string; channels: number; surface: string; compressor: string }
}

interface SourceTokenFixture {
  kind: 'source-token'
  source: string
  scenario: string
  file: string
  bytes: number
  originalBytes: number
  encodeMs: number
  config: { algo: string; channels: number; surface: string; compressor: string }
}

type ManifestEntry = SourceFixture | ScriptTextFixture | ScriptTokenFixture | SourceTokenFixture

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`

  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

const ENCODE_TIMEOUT_MS = 60_000

async function withTimeout<T>(ms: number, p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ])
}

async function main() {
  console.log('Runtime fixture generator')
  console.log('=========================\n')

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const manifest: ManifestEntry[] = []
  const bindings = listAlgoBindings()

  console.log(
    `Algorithms × channels: ${bindings.reduce((s, b) => s + b.channels.length, 0)} variants total\n`,
  )

  // ── Group A: source text + source-token fixtures ─────────────────────────
  for (const src of SOURCE_CONFIGS) {
    const srcPath = path.join(SOURCES, src.file)

    if (!fs.existsSync(srcPath)) {
      console.log(`[${src.id}] SKIP — source not found: ${srcPath}\n`)
      continue
    }

    const raw = fs.readFileSync(srcPath)

    console.log(`[${src.id}]  ${fmtBytes(raw.length)}  (${src.file})`)

    for (const enc of ENCODINGS) {
      const outFile = `${src.id}${enc.ext}`
      const outPath = path.join(OUT_DIR, outFile)
      const t0 = performance.now()
      const body = enc.encode ? enc.encode(raw) : raw
      const encodeMs = performance.now() - t0

      fs.writeFileSync(outPath, body)
      const ratio = raw.length > 0 ? ((1 - body.length / raw.length) * 100).toFixed(1) : '0.0'

      console.log(
        `  ${enc.id.padEnd(13)} ${fmtBytes(body.length).padStart(8)}  ${ratio.padStart(5)}% smaller  ${encodeMs.toFixed(0)}ms`,
      )
      manifest.push({
        kind: 'source',
        source: src.id,
        encoding: enc.id,
        file: outFile,
        bytes: body.length,
        originalBytes: raw.length,
        encodeMs: Number(encodeMs.toFixed(2)),
      })
    }

    for (const b of bindings) {
      for (const ch of b.channels) {
        const scenario = `${b.algoName}-c${ch}`
        const outFile = `${src.id}.${scenario}${b.surfaceExt}`
        const outPath = path.join(OUT_DIR, outFile)
        const t0 = performance.now()

        try {
          const body = await withTimeout(
            ENCODE_TIMEOUT_MS,
            tokenpackEncode(raw, {
              algo: b.algoName,
              algoOptions: { surface: { channels: ch } },
            }),
          )
          const encodeMs = performance.now() - t0

          fs.writeFileSync(outPath, body)
          console.log(
            `  ${scenario.padEnd(34)} ${fmtBytes(body.length).padStart(8)}  ${encodeMs.toFixed(0)}ms`,
          )
          manifest.push({
            kind: 'source-token',
            source: src.id,
            scenario,
            file: outFile,
            bytes: body.length,
            originalBytes: raw.length,
            encodeMs: Number(encodeMs.toFixed(2)),
            config: {
              algo: b.algoName,
              channels: ch,
              surface: b.surfaceId,
              compressor: b.compressorFamily,
            },
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)

          console.log(`  ${scenario.padEnd(34)} ERROR: ${msg}`)
        }
      }
    }
    console.log('')
  }

  // ── Group B: script text + script-token fixtures ──────────────────────────
  const scriptBody = buildScript(performance.now())
  const scriptBytes = Buffer.from(scriptBody, 'utf-8')

  console.log(`[script]  ${fmtBytes(scriptBytes.length)}  (timestamp baked at generation)`)

  for (const enc of ENCODINGS) {
    const outFile = `script${enc.ext}`
    const outPath = path.join(OUT_DIR, outFile)
    const t0 = performance.now()
    const body = enc.encode ? enc.encode(scriptBytes) : scriptBytes
    const encodeMs = performance.now() - t0

    fs.writeFileSync(outPath, body)
    console.log(`  ${enc.id.padEnd(10)} ${fmtBytes(body.length).padStart(8)}  ${encodeMs.toFixed(0)}ms`)
    manifest.push({
      kind: 'script-text',
      encoding: enc.id,
      file: outFile,
      bytes: body.length,
      originalBytes: scriptBytes.length,
      encodeMs: Number(encodeMs.toFixed(2)),
    })
  }

  for (const b of bindings) {
    for (const ch of b.channels) {
      const scenario = `${b.algoName}-c${ch}`
      const outFile = `script.${scenario}${b.surfaceExt}`
      const outPath = path.join(OUT_DIR, outFile)
      const t0 = performance.now()

      try {
        const body = await withTimeout(
          ENCODE_TIMEOUT_MS,
          tokenpackEncode(scriptBytes, {
            algo: b.algoName,
            algoOptions: { surface: { channels: ch } },
          }),
        )
        const encodeMs = performance.now() - t0

        fs.writeFileSync(outPath, body)
        console.log(
          `  ${scenario.padEnd(34)} ${fmtBytes(body.length).padStart(8)}  ${encodeMs.toFixed(0)}ms`,
        )
        manifest.push({
          kind: 'script-token',
          scenario,
          file: outFile,
          bytes: body.length,
          originalBytes: scriptBytes.length,
          encodeMs: Number(encodeMs.toFixed(2)),
          config: {
            algo: b.algoName,
            channels: ch,
            surface: b.surfaceId,
            compressor: b.compressorFamily,
          },
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)

        console.log(`  ${scenario.padEnd(34)} ERROR: ${msg}`)
      }
    }
  }
  console.log('')

  const manifestPath = path.join(OUT_DIR, 'manifest.json')

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`Manifest → ${manifestPath}  (${manifest.length} entries)`)
  console.log('Run `yarn app` and visit /runtime-benchmark to use them.')
}

main().catch(e => {
  console.error('generate-runtime failed:', e)
  process.exit(1)
})
