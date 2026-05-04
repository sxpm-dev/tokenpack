/**
 * Generates all fixture files required by all benchmarks.
 * Run: yarn tsx benchmark/generate.ts
 *
 * Outputs:
 *   test-tokens/tokens/   max__*.webp, stream-png__*.png  (network benchmark)
 *   test-tokens/tokens/   ext-<codec>-<compression>-c<ch>__<source>.png  (extended benchmark)
 *   test-tokens/archives/ zip__*, targz__*, br11__*, br6__*
 *   test-tokens/encode-times.json  (encode timings for run-extended.ts)
 */

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import AdmZip from 'adm-zip'
import '../src/codecs/register-all'
import { encodeToBuffer } from '../src/encoder'
import { packDirs } from '../src/archive'
import { listCodecs } from '../src/codecs/registry'

const ROOT       = path.join(import.meta.dirname, '..')
const SOURCES    = path.join(ROOT, 'test-tokens/sources')
const TOKENS     = path.join(ROOT, 'test-tokens/tokens')
const ARCHIVES   = path.join(ROOT, 'test-tokens/archives')

fs.mkdirSync(TOKENS,   { recursive: true })
fs.mkdirSync(ARCHIVES, { recursive: true })

const LABEL_W = 38
const SIZE_W  = 8

const fmtBytes = (b: number) =>
  b < 1024 ? `${b}B`
  : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB`
  : `${(b / 1024 / 1024).toFixed(2)}MB`

function row(label: string, outSize: number, srcSize: number) {
  const ratio = ((1 - outSize / srcSize) * 100).toFixed(1)
  console.log(`  ${label.padEnd(LABEL_W)}${fmtBytes(outSize).padStart(SIZE_W)}   ${ratio}% smaller`)
}

// Suppress encoder's internal console.log during encodeToBuffer calls.
async function encodeQuiet(...args: Parameters<typeof encodeToBuffer>) {
  const orig = console.log
  console.log = () => {}
  try { return await encodeToBuffer(...args) }
  finally { console.log = orig }
}

// ── Per-file sources ──────────────────────────────────────────────────────

const FILE_SOURCES: { name: string; file: string }[] = [
  { name: 'react-dom-client.development', file: 'react-dom-client.development.js' },
  { name: 'react-dom-client.production',  file: 'react-dom-client.production.js' },
  { name: 'screenshot',                   file: 'screenshot.jpg' },
]

export interface ArchiveTimeEntry {
  source: string
  format: string
  encodeMs: number
  decodeMs: number
  bytes: number
  originalBytes: number
}

async function generateFromBuffer(name: string, src: Buffer, brExt: '.br' | '.tar.br'): Promise<ArchiveTimeEntry[]> {
  const archiveTimes: ArchiveTimeEntry[] = []
  // max — webp / brotli-11 / bpp=3
  const maxWebp3 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'brotli-11', format: 'webp', channels: 3 })
  fs.writeFileSync(path.join(TOKENS, `max-webp3__${name}.webp`), maxWebp3[0])
  row('max-webp3 (brotli-11, webp, bpp=3)', maxWebp3[0].length, src.length)

  // max — png / brotli-11 / bpp=3
  const maxPng3 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'brotli-11', format: 'png', channels: 3 })
  fs.writeFileSync(path.join(TOKENS, `max-png3__${name}.png`), maxPng3[0])
  row('max-png3  (brotli-11, png,  bpp=3)', maxPng3[0].length, src.length)

  // max — png / brotli-11 / bpp=4
  const maxPng4 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'brotli-11', format: 'png', channels: 4 })
  fs.writeFileSync(path.join(TOKENS, `max-png4__${name}.png`), maxPng4[0])
  row('max-png4  (brotli-11, png,  bpp=4)', maxPng4[0].length, src.length)

  // stream tokens — written with small IDAT chunks (streaming: true) so the
  // stream decoder processes pixels progressively as bytes arrive over the network.

  // stream — png / brotli-6 / bpp=3
  const streamPng3 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'brotli-6', format: 'png', channels: 3, streaming: true })
  fs.writeFileSync(path.join(TOKENS, `stream-png3__${name}.png`), streamPng3[0])
  row('stream-png3 (brotli-6,  png,  bpp=3)', streamPng3[0].length, src.length)

  // stream — png / brotli-6 / bpp=4
  const streamPng4 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'brotli-6', format: 'png', channels: 4, streaming: true })
  fs.writeFileSync(path.join(TOKENS, `stream-png4__${name}.png`), streamPng4[0])
  row('stream-png4 (brotli-6,  png,  bpp=4)', streamPng4[0].length, src.length)

  // stream — png / deflate-6 / bpp=3
  const streamDef3 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'deflate-6', format: 'png', channels: 3, streaming: true })
  fs.writeFileSync(path.join(TOKENS, `stream-def3__${name}.png`), streamDef3[0])
  row('stream-def3 (deflate-6, png,  bpp=3)', streamDef3[0].length, src.length)

  // stream — png / deflate-6 / bpp=4
  const streamDef4 = await encodeQuiet(src, { algo: 'linear', compressionMode: 'deflate-6', format: 'png', channels: 4, streaming: true })
  fs.writeFileSync(path.join(TOKENS, `stream-def4__${name}.png`), streamDef4[0])
  row('stream-def4 (deflate-6, png,  bpp=4)', streamDef4[0].length, src.length)

  function timeArchive(
    format: string,
    encode: () => Buffer,
    decode: (buf: Buffer) => void,
    filePath: string,
  ) {
    const t0 = now(); const buf = encode(); const encodeMs = now() - t0
    fs.writeFileSync(filePath, buf)
    const t1 = now(); decode(buf); const decodeMs = now() - t1
    row(format, buf.length, src.length)
    archiveTimes.push({
      source: name, format,
      encodeMs: Math.round(encodeMs * 10) / 10,
      decodeMs: Math.round(decodeMs * 10) / 10,
      bytes: buf.length,
      originalBytes: src.length,
    })
  }

  // zip
  timeArchive(
    'zip',
    () => { const z = new AdmZip(); z.addFile(path.basename(name), src); return z.toBuffer() },
    buf => { const z = new AdmZip(buf); for (const e of z.getEntries()) if (!e.isDirectory) e.getData() },
    path.join(ARCHIVES, `zip__${name}.zip`),
  )

  // tar.gz
  timeArchive(
    'tar.gz',
    () => zlib.gzipSync(src, { level: 6 }),
    buf => zlib.gunzipSync(buf),
    path.join(ARCHIVES, `targz__${name}.tar.gz`),
  )

  // brotli-11
  timeArchive(
    'brotli-11',
    () => zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }),
    buf => zlib.brotliDecompressSync(buf),
    path.join(ARCHIVES, `br11__${name}${brExt}`),
  )

  // brotli-6
  timeArchive(
    'brotli-6',
    () => zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } }),
    buf => zlib.brotliDecompressSync(buf),
    path.join(ARCHIVES, `br6__${name}${brExt}`),
  )

  return archiveTimes
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tokenpack Benchmark Fixture Generator')
  console.log('=====================================\n')
  console.log(`  ${'format'.padEnd(LABEL_W)}${'size'.padStart(SIZE_W)}   vs original`)
  console.log(`  ${'─'.repeat(LABEL_W + SIZE_W + 12)}`)

  // Collect all source buffers (file sources + packed dir) in one pass so the
  // extended section can iterate over all of them including fs-src-tests-docs.
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
    allArchiveTimes.push(...await generateFromBuffer(name, src, '.br'))
  }

  const fsDirs = ['src', 'tests', 'docs'].map(d => path.join(ROOT, d)).filter(d => fs.existsSync(d))
  if (fsDirs.length) {
    const name = 'fs-src-tests-docs'
    const cart = packDirs(fsDirs, [], ROOT)
    allSources.push({ name, buf: cart })
    console.log(`\n[${name}]  ${fmtBytes(cart.length)} (packed: ${fsDirs.map(d => path.basename(d)).join(' + ')})`)
    allArchiveTimes.push(...await generateFromBuffer(name, cart, '.tar.br'))
  } else {
    console.log('\n[fs-src-tests-docs] SKIP — no src/tests/docs dirs found')
  }

  // ── Extended tokens (all codecs × all compression modes) ────────────────

  const COMPRESSION_MODES = ['none', 'deflate-1', 'deflate-6', 'brotli-6'] as const
  type CompressionMode = typeof COMPRESSION_MODES[number]

  interface EncodeTimeEntry {
    source: string
    codec: string
    compression: string
    channels: number
    encodeMs: number
    tokenBytes: number
    originalBytes: number
    tokenFile: string   // relative path under test-tokens/
  }

  const now = () => performance.now()
  const encodeTimes: EncodeTimeEntry[] = []
  const codecs = listCodecs()

  const extTotal = codecs.length * COMPRESSION_MODES.length * allSources.length
  let extDone = 0

  console.log(`\n\n═══ Extended tokens: ${codecs.length} codecs × ${COMPRESSION_MODES.length} modes × ${allSources.length} sources = ${extTotal} files ═══\n`)

  for (const { name: sourceName, buf: src } of allSources) {
    console.log(`── ${sourceName} (${fmtBytes(src.length)}) ──`)

    for (const codec of codecs) {
      const channels = 3

      for (const compression of COMPRESSION_MODES) {
        extDone++
        const compress = compression !== 'none'
        const label = `[${extDone}/${extTotal}] ${codec.name} + ${compression}`
        process.stdout.write(`  ${label.padEnd(46)}`)

        const tokenFile = `ext-${codec.name}-${compression}-c${channels}__${sourceName}.png`
        const tokenPath = path.join(TOKENS, tokenFile)

        try {
          const TIMEOUT_MS = 2_000
          const t0 = now()
          const encodePromise = encodeQuiet(src, {
            algo: codec.name,
            compress,
            compressionMode: compress ? compression as CompressionMode : undefined,
            channels: channels as 1 | 2 | 3 | 4,
            format: 'png',
          })
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
          )
          const tokens = await Promise.race([encodePromise, timeoutPromise])
          const encodeMs = now() - t0
          const tokenBytes = tokens.reduce((s, b) => s + b.length, 0)

          fs.writeFileSync(tokenPath, tokens[0])

          encodeTimes.push({
            source: sourceName, codec: codec.name, compression,
            channels, encodeMs: Math.round(encodeMs * 10) / 10,
            tokenBytes, originalBytes: src.length,
            tokenFile: path.join('test-tokens', 'tokens', tokenFile),
          })

          const ratio = ((1 - tokenBytes / src.length) * 100).toFixed(1)
          console.log(`${fmtBytes(tokenBytes).padStart(8)}  ${ratio.padStart(5)}% smaller  ${encodeMs.toFixed(0)}ms`)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          encodeTimes.push({
            source: sourceName, codec: codec.name, compression,
            channels, encodeMs: 0, tokenBytes: 0,
            originalBytes: src.length, tokenFile: '',
          })
          console.log(`ERROR: ${msg}`)
        }
      }
    }
    console.log()
  }

  const encodeTimesPath = path.join(ROOT, 'test-tokens', 'encode-times.json')
  fs.writeFileSync(encodeTimesPath, JSON.stringify(encodeTimes, null, 2))
  console.log(`Encode times saved → ${encodeTimesPath}  (${encodeTimes.length} entries)`)

  const archiveTimesPath = path.join(ROOT, 'test-tokens', 'archive-times.json')
  fs.writeFileSync(archiveTimesPath, JSON.stringify(allArchiveTimes, null, 2))
  console.log(`Archive times saved → ${archiveTimesPath}  (${allArchiveTimes.length} entries)`)

  console.log('\nDone. Run `yarn tsx benchmark/run-extended.ts` to measure decode timing.')
}

main().catch(e => { console.error(e); process.exit(1) })
