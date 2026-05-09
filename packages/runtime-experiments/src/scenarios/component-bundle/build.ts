// component-bundle scenario — server-only fixture builder.
//
// Four size variants tied to realistic bundle weights:
//
//   50 KB · small  ·  5 files (entry + css + 3 chunks)
//  200 KB · medium · 10 files (+ 8 chunks)
//    1 MB · large  · 20 files (+ 18 chunks)
//    5 MB · huge   · 50 files (+ 48 chunks)
//
// Two ship forms per size:
//   1. Raw assets — one fixture file per JS/CSS file, fetched in parallel.
//   2. TokenPack multi-file PNG — `PackBuilder().withFile(...)` + `encode(builder, …)`.
//
// Chunk content alternates by index for realistic mix:
//   • odd  index → `.js`   slice from a real bundled JS file
//                  (`benchmark/sources/chunk-5mb.js`, a ~4.7 MB Blockly build)
//   • even index → `.json` payload generated from `ctx.payload()` (varied
//                  items with random-but-deterministic names / ids / scores)
//
// Hand-rolled "lorem ipsum" filler would compress 50–100× more than real
// code and game gzip/brotli numbers — both real-JS and generated JSON have
// realistic byte-level entropy, which keeps the encoding comparison honest.

import { encode, NodePackBuilder } from '@tokenpack/node'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

import type { BuildCtx, BuildFixturesFn, FixtureFile } from '../types'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REAL_JS_SOURCE_PATH = path.resolve(HERE, '../../../../../benchmark/sources/chunk-5mb.js')

export interface SizeSpec {
  totalKb: number
  fileCount: number
  label: string
}

const SIZE_SPECS: readonly SizeSpec[] = [
  { totalKb: 50, fileCount: 5, label: 'small' },
  { totalKb: 200, fileCount: 10, label: 'medium' },
  { totalKb: 1024, fileCount: 20, label: 'large' },
  { totalKb: 5120, fileCount: 50, label: 'huge' },
]

const ENTRY_BYTES_NOMINAL = 2_000
const CSS_BYTES_NOMINAL = 5_000
const SUB_PACKS_PER_BUNDLE = 5

let cachedRealSource: Buffer | null = null

function loadRealSource(): Buffer {
  if (cachedRealSource) return cachedRealSource
  if (!fs.existsSync(REAL_JS_SOURCE_PATH)) {
    throw new Error(
      `component-bundle: real JS source not found at ${REAL_JS_SOURCE_PATH}. ` +
        'Expected a real bundled JS file to slice chunks from.',
    )
  }
  cachedRealSource = fs.readFileSync(REAL_JS_SOURCE_PATH)

  return cachedRealSource
}

export const buildComponentBundleFixtures: BuildFixturesFn = async (ctx: BuildCtx) => {
  const files: FixtureFile[] = []

  for (const spec of SIZE_SPECS) {
    const fileMap = generateFiles(spec, ctx)
    const bundledMap = generateBundledFiles(spec, ctx)

    for (const [name, bytes] of [...fileMap, ...bundledMap]) {
      const baseName = `bundle-${spec.totalKb}kb-${name}`
      const mime = mimeFor(name)

      files.push({
        path: baseName,
        bytes,
        meta: { mime, totalKb: spec.totalKb, source: name, encoding: 'identity' },
      })
      files.push({
        path: `${baseName}.gz`,
        bytes: zlib.gzipSync(bytes, { level: 6 }),
        meta: { mime, totalKb: spec.totalKb, source: name, encoding: 'gzip-6' },
      })
      files.push({
        path: `${baseName}.br`,
        bytes: zlib.brotliCompressSync(bytes, {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 },
        }),
        meta: { mime, totalKb: spec.totalKb, source: name, encoding: 'brotli-6' },
      })
    }

    // Single-token DirPack: every file in one PNG.
    const singleBuilder = new NodePackBuilder()

    for (const [name, bytes] of fileMap) {
      singleBuilder.withFile(name, new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
    }

    const singlePng = await encode(singleBuilder, {
      algo: 'linear-deflate',
      algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
      compressor: 'deflate-6',
    })

    files.push({
      path: `bundle-${spec.totalKb}kb.tokenpack-deflate.png`,
      bytes: Buffer.from(singlePng),
      meta: {
        mime: 'image/png',
        totalKb: spec.totalKb,
        encoding: 'tokenpack-multifile-deflate-6',
        fileCount: fileMap.size,
      },
    })

    // N-token sub-pack bundle: distribute files round-robin across N
    // independent DirPack PNGs. Each sub-pack is self-contained (own header
    // + streamId), so they decode in parallel without any cross-token
    // dependency. The runtime merges entries from all sub-packs by file
    // path to reconstruct the full bundle.
    const subPackCount = Math.min(SUB_PACKS_PER_BUNDLE, fileMap.size)
    const allEntries = Array.from(fileMap.entries())
    const subPacks: { name: string; bytes: Uint8Array }[][] = Array.from(
      { length: subPackCount },
      () => [],
    )

    for (let i = 0; i < allEntries.length; i += 1) {
      const [name, bytes] = allEntries[i]

      subPacks[i % subPackCount].push({
        name,
        bytes: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      })
    }

    for (let k = 0; k < subPackCount; k += 1) {
      const subBuilder = new NodePackBuilder()

      for (const e of subPacks[k]) subBuilder.withFile(e.name, e.bytes)

      const subPng = await encode(subBuilder, {
        algo: 'linear-deflate',
        algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
        compressor: 'deflate-6',
      })

      files.push({
        path: `bundle-${spec.totalKb}kb.subpack-${k + 1}of${subPackCount}.png`,
        bytes: Buffer.from(subPng),
        meta: {
          mime: 'image/png',
          totalKb: spec.totalKb,
          encoding: 'tokenpack-subpack-deflate-6',
          subPackIndex: k + 1,
          subPackTotal: subPackCount,
          subPackFiles: subPacks[k].length,
        },
      })
    }
  }

  return files
}

function generateFiles(spec: SizeSpec, ctx: BuildCtx): Map<string, Buffer> {
  const m = new Map<string, Buffer>()

  m.set('index.js', Buffer.from(makeIndexJs(), 'utf-8'))
  m.set('index.css', Buffer.from(makeIndexCss(CSS_BYTES_NOMINAL), 'utf-8'))

  const chunkCount = spec.fileCount - 2

  if (chunkCount > 0) {
    const totalBytes = spec.totalKb * 1024
    // Distribute remaining weight evenly across chunks. Per-chunk size is
    // computed from total minus the (small) entry + css overhead.
    const remaining = Math.max(totalBytes - ENTRY_BYTES_NOMINAL - CSS_BYTES_NOMINAL, chunkCount)
    const perChunkBytes = Math.floor(remaining / chunkCount)

    for (let i = 1; i <= chunkCount; i += 1) {
      // Alternate JS code slices and JSON payloads so the bundle mix mirrors
      // real apps (split JS modules + JSON config / data).
      if (i % 2 === 0) {
        m.set(`chunk-${i}.json`, generateJsonChunk(i, spec.totalKb, perChunkBytes, ctx))
      } else {
        m.set(`chunk-${i}.js`, sliceRealJs(i, spec.totalKb, perChunkBytes))
      }
    }
  }

  return m
}

/**
 * Generate a unique JSON chunk via `ctx.payload()`. Each chunk asks for a
 * payload size derived from `(totalKb, chunkIndex)` so the seed varies and
 * different chunks contain different JSON content. Sliced down to exactly
 * `targetBytes` — the trailing slice may produce invalid JSON syntax, but
 * the runner never parses chunks (only the entry is `import()`-ed).
 */
function generateJsonChunk(
  chunkIndex: number,
  totalKb: number,
  targetBytes: number,
  ctx: BuildCtx,
): Buffer {
  const targetKb = Math.max(2, Math.ceil(targetBytes / 1024))
  // Per-chunk seed kb: ensures payload size is at least targetKb+1 so the
  // generated bytes always exceed the slice we want. Adds (chunkIndex,
  // totalKb) into the kb so payload() seeds vary per chunk.
  const seedKb = targetKb + 1 + ((chunkIndex * 13 + totalKb) % 17)
  const json = ctx.payload(seedKb)

  if (json.byteLength >= targetBytes) {
    return Buffer.from(json.buffer, json.byteOffset, targetBytes)
  }
  // Defensive: if payload happened to come back smaller than target, ask
  // for a comfortably bigger one and slice again.
  const bigger = ctx.payload(targetKb * 2 + chunkIndex)

  return Buffer.from(bigger.buffer, bigger.byteOffset, Math.min(bigger.byteLength, targetBytes))
}

function mimeFor(name: string): string {
  if (name.endsWith('.js')) return 'application/javascript'
  if (name.endsWith('.css')) return 'text/css'

  return 'application/octet-stream'
}

/**
 * Build the "single bundle" form for a given size: one big JS (real-JS slice
 * embedded as a string constant + a small JSON object literal + the entry
 * mount export) and one big CSS file padded to a representative size. JSON
 * data lives inside the JS as a `const`, mirroring what production bundlers
 * do (Webpack/Vite inline JSON imports as `module.exports = {…}`).
 *
 * The resulting bundled.js is valid ESM and dynamically importable — the
 * runner's `import(blobURL)` works directly.
 */
function generateBundledFiles(spec: SizeSpec, ctx: BuildCtx): Map<string, Buffer> {
  const totalBytes = spec.totalKb * 1024
  // Reserve ~10% of the bundle for CSS, the rest for JS. Roughly mirrors
  // typical SPA bundle ratios.
  const cssBytes = Math.max(CSS_BYTES_NOMINAL, Math.floor(totalBytes * 0.1))
  const jsBudget = Math.max(totalBytes - cssBytes, 4_000)

  const m = new Map<string, Buffer>()

  m.set('bundled.js', Buffer.from(makeBundledJs(jsBudget, spec.totalKb, ctx), 'utf-8'))
  m.set('bundled.css', Buffer.from(makeIndexCss(cssBytes), 'utf-8'))

  return m
}

function makeBundledJs(targetBytes: number, totalKb: number, ctx: BuildCtx): string {
  const entry = makeIndexJs() // ~2 KB
  const jsonKb = Math.min(Math.max(2, Math.ceil(targetBytes / 1024 / 5)), 50)
  const jsonBytes = ctx.payload(jsonKb)
  const jsonText = new TextDecoder().decode(jsonBytes)

  // Account for `JSON.stringify` expansion when sizing the embedded slice.
  // Stringifying real-JS bytes adds ~10–20 % for escape chars (\\ → \\\\,
  // unprintable bytes → \uXXXX). Over-budget by ignoring that expansion was
  // the original bug — the head string ended up larger than `targetBytes`
  // and got truncated mid-statement, producing invalid JS at import time.
  const nonSliceOverhead = 600 + entry.length + jsonText.length
  const sliceLiteralBudget = Math.max(targetBytes - nonSliceOverhead, 100)
  const sliceBytesBudget = Math.max(Math.floor(sliceLiteralBudget / 1.2), 100)
  const sliceText = sliceRealJs(0, totalKb, sliceBytesBudget).toString('utf-8')
  const sliceLiteral = JSON.stringify(sliceText)

  const head =
    `// component-bundle "single bundle" form — generated by runtime-experiments.\n` +
    `// Real JS slice embedded as a string + JSON payload as object literal +\n` +
    `// entry mount() export. Mirrors a real SPA bundle: one big file, JSON\n` +
    `// imports inlined as constants.\n\n` +
    `const _BUNDLE_DATA = ${sliceLiteral};\n` +
    `const _BUNDLE_JSON = ${jsonText};\n\n` +
    entry +
    `\n// _BUNDLE_DATA / _BUNDLE_JSON are referenced once so engines don't tree-shake.\n` +
    `;(typeof globalThis !== 'undefined' ? globalThis : self).__rtExpBundleSize = _BUNDLE_DATA.length + JSON.stringify(_BUNDLE_JSON).length;\n`

  // NEVER truncate — head must always be valid JS. If we slightly overshoot
  // `targetBytes` because the slice expanded more than budgeted, accept the
  // overshoot. If we have headroom, optionally pad with tail filler.
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

  // No truncation — keeping statement boundaries intact is more important
  // than hitting `targetBytes` exactly. The last statement may overshoot
  // the target by a few dozen bytes; that's fine.
  return out
}

/**
 * Slice a chunk's worth of bytes from the real JS source, picking a
 * deterministic but per-(chunkIndex, totalKb)-varied offset so different
 * chunks have different bytes (and so the same chunk index across two
 * different size variants doesn't repeat content).
 *
 * The byte content is raw JS — likely not parseable when sliced at an
 * arbitrary offset. That's fine: the runner never `import()`s these chunks,
 * only the entry. They exist to be fetched (raw-bundle) or unpacked
 * (TokenPack DirPack) so wire bytes reflect a realistic bundle payload.
 */
function sliceRealJs(chunkIndex: number, totalKb: number, targetBytes: number): Buffer {
  const source = loadRealSource()
  const span = source.byteLength - targetBytes

  if (span <= 0) {
    // Target larger than source — concat with itself until big enough.
    const repeats = Math.ceil(targetBytes / source.byteLength) + 1
    const big = Buffer.concat(Array(repeats).fill(source))
    const offset = ((chunkIndex * 1009 + totalKb * 31) | 0) % (big.byteLength - targetBytes)

    return big.subarray(offset, offset + targetBytes)
  }
  // Pseudorandom but deterministic offset.
  const offset = ((chunkIndex * 1009 + totalKb * 31) | 0) % span

  return source.subarray(offset, offset + targetBytes)
}

function makeIndexJs(): string {
  return `// component-bundle fixture entry — generated by runtime-experiments.
// Loaded by the runner via dynamic import() of a blob: URL.
//
// Public API:  mount(host, opts) → ms
//
// The runner provides a fresh, empty \`host\` HTMLElement on every call —
// already attached to document.body offscreen. \`mount\` only appends; the
// runner is responsible for tearing the host down afterwards.

export function mount(host, opts = {}) {
  if (!(host instanceof HTMLElement)) throw new Error('mount() expects HTMLElement')
  const t0 = performance.now()
  const label = String(opts.label ?? 'component-bundle')
  const root = document.createElement('section')
  root.className = 'rt-exp-bundle-root'
  root.dataset.label = label
  for (let i = 0; i < 32; i += 1) {
    const card = document.createElement('div')
    card.className = 'rt-exp-bundle-card rt-exp-bundle-card-' + (i % 4)
    card.textContent = label + ' #' + i
    root.appendChild(card)
  }
  host.appendChild(root)
  return performance.now() - t0
}
`
}

/**
 * Generate utility-style CSS with rotating rule shapes — varied selectors
 * and properties so compression dictionaries can't latch onto a single
 * repeated pattern. Approximates real Tailwind-ish CSS density.
 */
function makeIndexCss(targetBytes: number): string {
  const head = `
/* component-bundle fixture stylesheet — generated by runtime-experiments. */
.rt-exp-bundle-root { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; }
.rt-exp-bundle-card { padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.85); font: 13px/1.4 ui-sans-serif, system-ui, sans-serif; }
.rt-exp-bundle-card-0 { background: rgba(96, 165, 250, 0.10); }
.rt-exp-bundle-card-1 { background: rgba(244, 114, 182, 0.10); }
.rt-exp-bundle-card-2 { background: rgba(52, 211, 153, 0.10); }
.rt-exp-bundle-card-3 { background: rgba(251, 191, 36, 0.10); }
`

  // Pool of rule shapes; each takes a number `n` and emits a rule whose
  // bytes vary with `n`. Mixing them produces realistic CSS variety.
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
    n =>
      `@media (min-width: ${640 + (n % 4) * 128}px) { .md-${n} { display: ${n % 2 ? 'flex' : 'grid'}; padding: ${n % 24}px; } }`,
    n =>
      `.hover-${n}:hover { color: hsl(${(n * 13) % 360} 60% 60%); transform: translateY(-${n % 4}px); }`,
    n =>
      `.grid-${n} { display: grid; grid-template-columns: repeat(${1 + (n % 12)}, minmax(0, 1fr)); gap: ${n % 24}px; }`,
  ]

  let out = head
  let i = 0

  while (out.length < targetBytes) {
    out += '\n' + builders[i % builders.length](i)
    i += 1
  }

  return out.slice(0, targetBytes)
}
