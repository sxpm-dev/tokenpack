/**
 * Pre-generates runtime-benchmark fixtures and stores them in
 * packages/app/runtime-fixtures/. Mirrors a CDN serving pre-encoded static
 * assets — every endpoint just streams from disk; zero per-request CPU.
 *
 * Outputs:
 *   <source>.{raw,gz,br,deflate}                   ← Group A text (3 sources × 4 encodings = 12)
 *   script.{raw,gz,br,deflate}                     ← Group B HTTP variants (4)
 *   script.<scenario>.{png|webp}                   ← Group B TokenPack variants (7)
 *   manifest.json                                  ← machine-readable index
 *
 * The script body has the server's `performance.now()` baked in at GENERATION
 * time. Pre-generated mode loses request-time freshness on that field but the
 * benchmark cares about client-side fetch→exec wall time, so it's fine.
 *
 * Run: yarn benchmark:generate:runtime
 */

import { encode as tokenpackEncode } from '@tokenpack/node'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(HERE, '..')
const SOURCES = path.join(HERE, 'sources')
const OUT_DIR = path.join(REPO_ROOT, 'packages', 'app', 'runtime-fixtures')

// ── Sources (Group A: source text) ────────────────────────────────────────────

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

// ── Encodings ─────────────────────────────────────────────────────────────────

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
      zlib.brotliCompressSync(buf, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      }),
  },
  { id: 'deflate', ext: '.deflate', encode: buf => zlib.deflateSync(buf, { level: 6 }) },
]

// ── Token scenarios (Group B: script as TokenPack) ────────────────────────────

interface ScenarioConfig {
  id: string
  algo: string
  compressionMode: string
  format: 'png' | 'webp'
  channels: 1 | 2 | 3 | 4
  streaming: boolean
}

// Lineup matched to /runtime-benchmark page. Channels=4 variants were dropped —
// for text/script payloads they're 33% bigger wire bytes with no upside.
// `max-def3` mirrors `stream-def3`'s codec + compression but disables streaming,
// so the page can show the with-vs-without-streaming delta on identical inputs.
const SCENARIO_CONFIGS: ScenarioConfig[] = [
  { id: 'max-webp3',   algo: 'linear', compressionMode: 'brotli-11', format: 'webp', channels: 3, streaming: false },
  { id: 'max-png3',    algo: 'linear', compressionMode: 'brotli-11', format: 'png',  channels: 3, streaming: false },
  { id: 'max-def3',    algo: 'linear', compressionMode: 'deflate-6', format: 'png',  channels: 3, streaming: false },
  { id: 'stream-png3', algo: 'linear', compressionMode: 'brotli-6',  format: 'png',  channels: 3, streaming: true  },
  { id: 'stream-def3', algo: 'linear', compressionMode: 'deflate-6', format: 'png',  channels: 3, streaming: true  },
]

// ── Script body (matches `_script-builder.ts` so client + server agree) ───────

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

// ── Manifest output ───────────────────────────────────────────────────────────

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
  config: { compressionMode: string; format: string; channels: number; streaming: boolean }
}

interface SourceTokenFixture {
  kind: 'source-token'
  source: string
  scenario: string
  file: string
  bytes: number
  originalBytes: number
  encodeMs: number
  config: { compressionMode: string; format: string; channels: number; streaming: boolean }
}

type ManifestEntry = SourceFixture | ScriptTextFixture | ScriptTokenFixture | SourceTokenFixture

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`

  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

async function main() {
  console.log('Runtime fixture generator')
  console.log('=========================\n')

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const manifest: ManifestEntry[] = []

  // ── Group A: source text + source-token fixtures ─────────────────────────
  for (const src of SOURCE_CONFIGS) {
    const srcPath = path.join(SOURCES, src.file)

    if (!fs.existsSync(srcPath)) {
      console.log(`[${src.id}] SKIP — source not found: ${srcPath}\n`)
      continue
    }

    const raw = fs.readFileSync(srcPath)

    console.log(`[${src.id}]  ${fmtBytes(raw.length)}  (${src.file})`)

    // Text encodings (raw / gzip / br / deflate)
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

    // TokenPack encodings (max-* / stream-*) — encoded fresh into runtime-fixtures
    // so all runtime-bench fixtures live in one place. (benchmark/tokens/ keeps
    // a parallel set used by the network benchmark.)
    for (const sc of SCENARIO_CONFIGS) {
      const ext = sc.format === 'webp' ? '.webp' : '.png'
      const outFile = `${src.id}.${sc.id}${ext}`
      const outPath = path.join(OUT_DIR, outFile)
      const t0 = performance.now()
      const body = await tokenpackEncode(raw, {
        algo: sc.algo,
        compressionMode: sc.compressionMode,
        format: sc.format,
        channels: sc.channels,
        streaming: sc.streaming,
      })
      const encodeMs = performance.now() - t0

      fs.writeFileSync(outPath, body)
      const ratio = raw.length > 0 ? ((1 - body.length / raw.length) * 100).toFixed(1) : '0.0'

      console.log(
        `  ${sc.id.padEnd(13)} ${fmtBytes(body.length).padStart(8)}  ${ratio.padStart(5)}% smaller  ${encodeMs.toFixed(0)}ms`,
      )

      manifest.push({
        kind: 'source-token',
        source: src.id,
        scenario: sc.id,
        file: outFile,
        bytes: body.length,
        originalBytes: raw.length,
        encodeMs: Number(encodeMs.toFixed(2)),
        config: {
          compressionMode: sc.compressionMode,
          format: sc.format,
          channels: sc.channels,
          streaming: sc.streaming,
        },
      })
    }
    console.log('')
  }

  // ── Group B: script text + token fixtures ─────────────────────────────────
  const scriptBody = buildScript(performance.now())
  const scriptBytes = Buffer.from(scriptBody, 'utf-8')

  console.log(`[script]  ${fmtBytes(scriptBytes.length)}  (timestamp baked at generation)`)

  // Group B text variants (HTTP encodings).
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

  // Group B TokenPack variants (one fresh PNG/WebP per scenario).
  for (const sc of SCENARIO_CONFIGS) {
    const ext = sc.format === 'webp' ? '.webp' : '.png'
    const outFile = `script.${sc.id}${ext}`
    const outPath = path.join(OUT_DIR, outFile)
    const t0 = performance.now()
    const body = await tokenpackEncode(scriptBytes, {
      algo: sc.algo,
      compressionMode: sc.compressionMode,
      format: sc.format,
      channels: sc.channels,
      streaming: sc.streaming,
    })
    const encodeMs = performance.now() - t0

    fs.writeFileSync(outPath, body)
    console.log(`  ${sc.id.padEnd(13)} ${fmtBytes(body.length).padStart(8)}  ${encodeMs.toFixed(0)}ms`)

    manifest.push({
      kind: 'script-token',
      scenario: sc.id,
      file: outFile,
      bytes: body.length,
      originalBytes: scriptBytes.length,
      encodeMs: Number(encodeMs.toFixed(2)),
      config: {
        compressionMode: sc.compressionMode,
        format: sc.format,
        channels: sc.channels,
        streaming: sc.streaming,
      },
    })
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
