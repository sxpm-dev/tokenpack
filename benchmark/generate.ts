/**
 * Generates all fixture files required by benchmark/run.ts.
 * Run: yarn benchmark:generate
 *
 * Outputs:
 *   test-tokens/tokens/   max__*.webp, stream-png__*.png
 *   test-tokens/archives/ zip__*, targz__*, br11__*, br6__*
 */

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import AdmZip from 'adm-zip'
import '../src/codecs/register-all'
import { encodeToBuffer } from '../src/encoder'
import { packDirs } from '../src/archive'

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

async function generateFromBuffer(name: string, src: Buffer, brExt: '.br' | '.tar.br') {
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

  // zip
  const zip = new AdmZip()
  zip.addFile(path.basename(name), src)
  const zipBuf = zip.toBuffer()
  fs.writeFileSync(path.join(ARCHIVES, `zip__${name}.zip`), zipBuf)
  row('zip', zipBuf.length, src.length)

  // tar.gz — gzip of raw data (benchmark measures decompression, not tar parsing)
  const gzBuf = zlib.gzipSync(src, { level: 6 })
  fs.writeFileSync(path.join(ARCHIVES, `targz__${name}.tar.gz`), gzBuf)
  row('tar.gz', gzBuf.length, src.length)

  // brotli-11
  const br11 = zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } })
  fs.writeFileSync(path.join(ARCHIVES, `br11__${name}${brExt}`), br11)
  row(`brotli-11 (${brExt})`, br11.length, src.length)

  // brotli-6
  const br6 = zlib.brotliCompressSync(src, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } })
  fs.writeFileSync(path.join(ARCHIVES, `br6__${name}${brExt}`), br6)
  row(`brotli-6  (${brExt})`, br6.length, src.length)
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tokenpack Benchmark Fixture Generator')
  console.log('=====================================\n')
  console.log(`  ${'format'.padEnd(LABEL_W)}${'size'.padStart(SIZE_W)}   vs original`)
  console.log(`  ${'─'.repeat(LABEL_W + SIZE_W + 12)}`)

  for (const { name, file } of FILE_SOURCES) {
    const srcPath = path.join(SOURCES, file)
    if (!fs.existsSync(srcPath)) {
      console.log(`\n[${name}] SKIP — not found: ${srcPath}`)
      continue
    }
    const src = fs.readFileSync(srcPath)
    console.log(`\n[${name}]  ${fmtBytes(src.length)}`)
    await generateFromBuffer(name, src, '.br')
  }

  const fsDirs = ['src', 'tests', 'docs'].map(d => path.join(ROOT, d)).filter(d => fs.existsSync(d))
  if (fsDirs.length) {
    const name = 'fs-src-tests-docs'
    const cart = packDirs(fsDirs, [], ROOT)
    console.log(`\n[${name}]  ${fmtBytes(cart.length)} (packed: ${fsDirs.map(d => path.basename(d)).join(' + ')})`)
    await generateFromBuffer(name, cart, '.tar.br')
  } else {
    console.log('\n[fs-src-tests-docs] SKIP — no src/tests/docs dirs found')
  }

  console.log('\nDone. Run `yarn benchmark:run` to measure timing.')
}

main().catch(e => { console.error(e); process.exit(1) })
