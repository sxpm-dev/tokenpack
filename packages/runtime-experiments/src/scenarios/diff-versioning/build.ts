// diff-versioning scenario — server-only fixture builder.
//
// Realistic SPA upgrade scenario: the client already has v1.0.0 cached.
// A new version v1.0.1 ships. Two delivery strategies:
//   • full reload — fetch the full next bundle.
//   • apply diff   — fetch only the diff, replay it on top of the cached base.
//
// To make the comparison meaningful across realistic conditions we generate
// a matrix of (bundle-size, change-rate) pairs:
//   sizes      = 100 KB / 500 KB / 1 MB / 2 MB / 5 MB
//   changeRate = 1% / 5% / 20% / 50% / 70% / 90% of bundle bytes changed
//
// Bundle layout: every bundle is exactly CHUNK_COUNT files (chunk-000..099).
// Each chunk is `~bundleSize / CHUNK_COUNT` bytes. To get a P% change rate
// we replace exactly P chunks in `next` (since CHUNK_COUNT == 100, each
// chunk is one percent of bundle bytes — change rate maps 1-to-1 to chunk
// count). Chunk content is deterministic so reruns produce identical
// fingerprints.

import { encode } from '@tokenpack/node'
import fs from 'fs'
import path from 'path'
import { diffPack, packBuffers, type PackEntry } from 'tokenpack'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

import type { BuildCtx, BuildFixturesFn, FixtureFile } from '../types'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REAL_JS_SOURCE_PATH = path.resolve(HERE, '../../../../../benchmark/sources/chunk-5mb.js')

let cachedRealSource: Buffer | null = null

function loadRealSource(): Buffer {
  if (cachedRealSource) return cachedRealSource
  if (!fs.existsSync(REAL_JS_SOURCE_PATH)) {
    throw new Error(`diff-versioning: real JS source not found at ${REAL_JS_SOURCE_PATH}`)
  }
  cachedRealSource = fs.readFileSync(REAL_JS_SOURCE_PATH)

  return cachedRealSource
}

/**
 * One JS chunk count per size — picks how many parallel chunks the
 * `js-chunked` strategy will fetch. Mirrors what realistic SPAs ship at
 * each total size (small SPA = few chunks, huge SPA = many).
 */
const JS_CHUNK_COUNT_BY_SIZE: Record<number, number> = {
  100: 5,
  500: 10,
  1000: 20,
  2000: 30,
  5000: 50,
}

const SIZES_KB = [100, 500, 1000, 2000, 5000] as const
const CHANGE_RATES_PCT = [1, 5, 20, 50, 70, 90] as const
const CHUNK_COUNT = 100

export const buildDiffVersioningFixtures: BuildFixturesFn = async (ctx: BuildCtx) => {
  const files: FixtureFile[] = []

  for (const sizeKB of SIZES_KB) {
    const baseEntries = makeBundle(sizeKB, /* mutateIndices */ new Set())
    const baseCart = packBuffers(baseEntries)
    const baseBuf = bufferFromBytes(baseCart)
    const basePng = await encode(baseBuf, {
      algo: 'linear-deflate',
      algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
    })

    files.push({
      path: `base.${sizeKB}kb.tokenpack-deflate.png`,
      bytes: basePng,
      meta: {
        mime: 'image/png',
        kind: 'base',
        sizeKB,
        cartBytes: baseCart.byteLength,
      },
    })

    for (const ratePct of CHANGE_RATES_PCT) {
      const mutateIndices = pickMutateIndices(ratePct, sizeKB)
      const nextEntries = makeBundle(sizeKB, mutateIndices)
      const nextCart = packBuffers(nextEntries)
      const nextBuf = bufferFromBytes(nextCart)

      const nextPng = await encode(nextBuf, {
        algo: 'linear-deflate',
        algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
      })

      const nextPngPath = `next.${sizeKB}kb.${ratePct}pct.tokenpack-deflate.png`

      files.push({
        path: nextPngPath,
        bytes: nextPng,
        meta: {
          mime: 'image/png',
          kind: 'next',
          sizeKB,
          ratePct,
          cartBytes: nextCart.byteLength,
        },
      })
      // No `Content-Encoding: gzip|br` siblings for tokens — the PNG is
      // already deflate-compressed inside the codec. Wrapping it in another
      // outer compressor saves <1% and isn't a realistic deployment.

      const diffBytes = diffPack(baseEntries, nextEntries).diff
      const diffBuf = bufferFromBytes(diffBytes)
      const diffPng = await encode(diffBuf, {
        algo: 'linear-deflate',
        algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
      })

      files.push({
        path: `diff.${sizeKB}kb.${ratePct}pct.tokenpack-deflate.png`,
        bytes: diffPng,
        meta: {
          mime: 'image/png',
          kind: 'diff',
          sizeKB,
          ratePct,
          diffBytes: diffBytes.byteLength,
        },
      })
    }

    // Per-size JS bundle fixtures (rate-independent — the JS bundle
    // represents v1.0.1's full SPA, no diff concept). Two forms × three
    // encodings each: `bundled.js + bundled.css` and `index.js + index.css
    // + N chunks`.
    addJsFixturesForSize(files, sizeKB, ctx)
  }

  return files
}

function addJsFixturesForSize(files: FixtureFile[], sizeKB: number, ctx: BuildCtx): void {
  const fileMap = generateJsFiles(sizeKB, ctx)
  const bundledMap = generateJsBundledFiles(sizeKB, ctx)

  for (const [name, bytes] of [...fileMap, ...bundledMap]) {
    const baseName = `js.${sizeKB}kb-${name}`
    const mime = mimeFor(name)

    files.push({
      path: baseName,
      bytes,
      meta: { mime, kind: 'js', sizeKB, source: name, encoding: 'identity' },
    })
    files.push({
      path: `${baseName}.gz`,
      bytes: zlib.gzipSync(bytes, { level: 6 }),
      meta: { mime, kind: 'js', sizeKB, source: name, encoding: 'gzip-6' },
    })
    files.push({
      path: `${baseName}.br`,
      bytes: zlib.brotliCompressSync(bytes, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
      }),
      meta: { mime, kind: 'js', sizeKB, source: name, encoding: 'brotli-6' },
    })
  }
}

const JS_ENTRY_BYTES = 2_000
const JS_CSS_BYTES = 5_000

function generateJsFiles(sizeKB: number, ctx: BuildCtx): Map<string, Buffer> {
  const m = new Map<string, Buffer>()

  m.set('index.js', Buffer.from(makeEntryJs(), 'utf-8'))
  m.set('index.css', Buffer.from(makeUtilityCss(JS_CSS_BYTES), 'utf-8'))

  const fileCount = JS_CHUNK_COUNT_BY_SIZE[sizeKB] ?? 5
  const chunkCount = fileCount - 2

  if (chunkCount > 0) {
    const totalBytes = sizeKB * 1024
    const remaining = Math.max(totalBytes - JS_ENTRY_BYTES - JS_CSS_BYTES, chunkCount)
    const perChunkBytes = Math.floor(remaining / chunkCount)

    for (let i = 1; i <= chunkCount; i += 1) {
      // Same odd-js / even-json mix as component-bundle: realistic compression.
      if (i % 2 === 0) {
        m.set(`chunk-${i}.json`, generateJsonChunk(i, sizeKB, perChunkBytes, ctx))
      } else {
        m.set(`chunk-${i}.js`, sliceRealJs(i, sizeKB, perChunkBytes))
      }
    }
  }

  return m
}

function generateJsBundledFiles(sizeKB: number, ctx: BuildCtx): Map<string, Buffer> {
  const totalBytes = sizeKB * 1024
  const cssBytes = Math.max(JS_CSS_BYTES, Math.floor(totalBytes * 0.1))
  const jsBudget = Math.max(totalBytes - cssBytes, 4_000)

  const m = new Map<string, Buffer>()

  m.set('bundled.js', Buffer.from(makeBundledJs(jsBudget, sizeKB, ctx), 'utf-8'))
  m.set('bundled.css', Buffer.from(makeUtilityCss(cssBytes), 'utf-8'))

  return m
}

function mimeFor(name: string): string {
  if (name.endsWith('.js')) return 'application/javascript'
  if (name.endsWith('.css')) return 'text/css'
  if (name.endsWith('.json')) return 'application/json'

  return 'application/octet-stream'
}

function sliceRealJs(chunkIndex: number, sizeKb: number, targetBytes: number): Buffer {
  const source = loadRealSource()
  const span = source.byteLength - targetBytes

  if (span <= 0) {
    const repeats = Math.ceil(targetBytes / source.byteLength) + 1
    const big = Buffer.concat(Array(repeats).fill(source))
    const offset = ((chunkIndex * 1009 + sizeKb * 31) | 0) % (big.byteLength - targetBytes)

    return big.subarray(offset, offset + targetBytes)
  }
  const offset = ((chunkIndex * 1009 + sizeKb * 31) | 0) % span

  return source.subarray(offset, offset + targetBytes)
}

function generateJsonChunk(
  chunkIndex: number,
  sizeKb: number,
  targetBytes: number,
  ctx: BuildCtx,
): Buffer {
  const targetKb = Math.max(2, Math.ceil(targetBytes / 1024))
  const seedKb = targetKb + 1 + ((chunkIndex * 13 + sizeKb) % 17)
  const json = ctx.payload(seedKb)

  if (json.byteLength >= targetBytes) {
    return Buffer.from(json.buffer, json.byteOffset, targetBytes)
  }
  const bigger = ctx.payload(targetKb * 2 + chunkIndex)

  return Buffer.from(bigger.buffer, bigger.byteOffset, Math.min(bigger.byteLength, targetBytes))
}

function makeEntryJs(): string {
  return `// diff-versioning fixture entry — generated by runtime-experiments.
// Loaded by the runner via dynamic import() of a blob: URL.
// Public API:  mount(host, opts) → ms

export function mount(host, opts = {}) {
  if (!(host instanceof HTMLElement)) throw new Error('mount() expects HTMLElement')
  const t0 = performance.now()
  const label = String(opts.label ?? 'diff-versioning')
  const root = document.createElement('section')
  root.className = 'rt-exp-spa-root'
  root.dataset.label = label
  for (let i = 0; i < 16; i += 1) {
    const card = document.createElement('div')
    card.className = 'rt-exp-spa-card'
    card.textContent = label + ' #' + i
    root.appendChild(card)
  }
  host.appendChild(root)
  return performance.now() - t0
}
`
}

function makeBundledJs(targetBytes: number, sizeKb: number, ctx: BuildCtx): string {
  const entry = makeEntryJs()
  const jsonKb = Math.min(Math.max(2, Math.ceil(targetBytes / 1024 / 5)), 50)
  const jsonBytes = ctx.payload(jsonKb)
  const jsonText = new TextDecoder().decode(jsonBytes)

  // See component-bundle/build.ts for the full reasoning on the 1.2 factor:
  // JSON.stringify of real-JS bytes expands ~10-20 %, and not budgeting for
  // that caused mid-statement truncation → invalid JS at import time.
  const nonSliceOverhead = 600 + entry.length + jsonText.length
  const sliceLiteralBudget = Math.max(targetBytes - nonSliceOverhead, 100)
  const sliceBytesBudget = Math.max(Math.floor(sliceLiteralBudget / 1.2), 100)
  const sliceText = sliceRealJs(0, sizeKb, sliceBytesBudget).toString('utf-8')
  const sliceLiteral = JSON.stringify(sliceText)

  const head =
    `// diff-versioning "single bundle" form — generated by runtime-experiments.\n` +
    `const _BUNDLE_DATA = ${sliceLiteral};\n` +
    `const _BUNDLE_JSON = ${jsonText};\n\n` +
    entry +
    `\n;(typeof globalThis !== 'undefined' ? globalThis : self).__rtExpDiffJsSize = _BUNDLE_DATA.length + JSON.stringify(_BUNDLE_JSON).length;\n`

  if (head.length >= targetBytes) return head

  return head + makeJsTailFiller(targetBytes - head.length)
}

function makeJsTailFiller(targetBytes: number): string {
  const builders: ((n: number) => string)[] = [
    n =>
      `export const _f${n} = (a, b) => (a * ${(n % 13) + 1} + b * ${(n % 7) + 1}) % ${(n % 9999) + 1};`,
    n =>
      `export const _o${n} = { id: ${n}, kind: ${JSON.stringify(`kind-${n % 17}`)}, pri: ${(n * 31) % 100}, tags: [${(n % 5) + 1},${(n % 7) + 1},${(n % 11) + 1}] };`,
    n =>
      `export const _s${n} = ${JSON.stringify(`label-${n}-${(n * 17) % 9999}-${(n * 31) % 9999}`)};`,
  ]
  let out = ''
  let i = 0

  while (out.length < targetBytes) {
    out += '\n' + builders[i % builders.length](i)
    i += 1
  }

  return out
}

function makeUtilityCss(targetBytes: number): string {
  const head = `
/* diff-versioning fixture stylesheet — generated by runtime-experiments. */
.rt-exp-spa-root { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; }
.rt-exp-spa-card { padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.85); font: 13px/1.4 ui-sans-serif, system-ui, sans-serif; }
`

  const builders: ((n: number) => string)[] = [
    n =>
      `.flex-${n} { display: flex; align-items: ${n % 2 ? 'center' : 'start'}; gap: ${n % 16}px; }`,
    n =>
      `.text-${n} { font-size: ${(0.625 + (n % 8) * 0.0625).toFixed(3)}rem; line-height: ${1 + (n % 5) * 0.25}; letter-spacing: ${(n % 5) * 0.025}em; }`,
    n => `.bg-${n} { background-color: hsl(${(n * 7) % 360} 45% 50% / ${(n % 100) / 100}); }`,
    n =>
      `.border-${n} { border: ${n % 4}px ${n % 2 ? 'solid' : 'dashed'} rgba(0, 0, 0, ${((n % 10) / 10).toFixed(1)}); border-radius: ${n % 16}px; }`,
    n =>
      `.shadow-${n} { box-shadow: ${n % 6}px ${n % 8}px ${4 + (n % 12)}px rgba(0, 0, 0, ${((n % 10) / 20).toFixed(2)}); }`,
  ]
  let out = head
  let i = 0

  while (out.length < targetBytes) {
    out += '\n' + builders[i % builders.length](i)
    i += 1
  }

  return out.slice(0, targetBytes)
}

/**
 * Build a bundle of `CHUNK_COUNT` deterministic chunks summing to ~`sizeKB`.
 * Chunks listed in `mutateIndices` get an alternate content; all others
 * receive the canonical base content. Same `(sizeKB, mutateIndices)` always
 * yields byte-identical entries.
 */
function makeBundle(sizeKB: number, mutateIndices: ReadonlySet<number>): PackEntry[] {
  const chunkBytes = Math.round((sizeKB * 1024) / CHUNK_COUNT)
  const enc = new TextEncoder()
  const entries: PackEntry[] = []

  for (let i = 0; i < CHUNK_COUNT; i += 1) {
    const idx = String(i).padStart(3, '0')
    const isMutated = mutateIndices.has(i)
    const text = makeChunkText(i, chunkBytes, isMutated)

    entries.push({
      path: `chunks/chunk-${idx}.js`,
      bytes: enc.encode(text),
    })
  }

  // Manifest file — also deterministic. Lives outside `chunks/` so the
  // diff archive's metadata is unmistakable in case anyone inspects it.
  const manifestText = JSON.stringify({
    bundleVersion: mutateIndices.size === 0 ? 'base' : `mutated-${mutateIndices.size}`,
    chunkCount: CHUNK_COUNT,
    chunkBytes,
  })

  entries.push({ path: 'manifest.json', bytes: enc.encode(manifestText) })

  return entries
}

function makeChunkText(chunkIndex: number, targetBytes: number, mutated: boolean): string {
  const tag = mutated ? `// mutated chunk ${chunkIndex}` : `// base chunk ${chunkIndex}`
  // Deterministic, somewhat-compressible filler — vary by chunk index so two
  // chunks at the same offset have different content.
  let out = `${tag}\nexport const CHUNK_${chunkIndex} = {\n`
  let i = 0

  while (out.length < targetBytes - 4) {
    out += `  k${i}: 'v${chunkIndex}-${i}-${mutated ? 'm' : 'b'}',\n`
    i += 1
  }
  out += '}\n'

  return out.slice(0, targetBytes)
}

/**
 * Choose which chunk indices to mutate to achieve the given change rate.
 * Deterministic per `(ratePct, sizeKB)` so identical runs produce identical
 * fixtures. We spread the mutated chunks evenly across the bundle so the
 * diff isn't artificially clustered (which would compress unrealistically
 * well).
 */
function pickMutateIndices(ratePct: number, sizeKB: number): Set<number> {
  const count = Math.round((CHUNK_COUNT * ratePct) / 100)
  const out = new Set<number>()
  // Hash sizeKB into a per-size offset so different sizes don't all mutate
  // the same indices — keeps tests honest if a future bug only fires for
  // certain chunk indices.
  const seed = (ratePct * 257 + sizeKB * 31) % CHUNK_COUNT

  for (let i = 0; i < count; i += 1) {
    out.add((seed + Math.floor((i * CHUNK_COUNT) / Math.max(count, 1))) % CHUNK_COUNT)
  }

  return out
}

function bufferFromBytes(bytes: Uint8Array): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes

  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}
