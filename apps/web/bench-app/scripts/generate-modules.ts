/**
 * Emit N synthetic JS modules into ./assets/. Each module is an IIFE that
 * registers on window.__BENCH_MODULES[i] = { render(root) { ... } }.
 *
 * Why IIFE (not ESM): we want the same eval path across multi-file / single-
 * bundle / router variants, so the only difference is delivery. ESM-via-
 * Blob-URL would inject another variable (blob creation cost, module loader
 * overhead) that contaminates the measurement.
 *
 * Module content is deterministic — same seed → same bytes — so encoding
 * pipelines (brotli, TokenPack deflate) are comparable across runs.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ASSETS_DIR, FIXTURE_SIZE, SIZE_PRESETS } from './paths.js'

const MODULE_COUNT = numFlag('count', SIZE_PRESETS[FIXTURE_SIZE].modules)
const TARGET_KB = numFlag('size-kb', 12)
const SEED = numFlag('seed', 0x5a17)

function numFlag(name: string, fallback: number): number {
  const flag = process.argv.find(a => a.startsWith(`--${name}=`))

  if (!flag) return fallback
  const n = Number(flag.slice(flag.indexOf('=') + 1))

  return Number.isFinite(n) ? n : fallback
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WORDS = [
  'render',
  'state',
  'props',
  'component',
  'context',
  'reducer',
  'effect',
  'memo',
  'ref',
  'hook',
  'event',
  'handler',
  'callback',
  'dispatcher',
  'observer',
  'subscribe',
  'publish',
  'queue',
  'buffer',
  'stream',
  'pipeline',
  'transform',
  'compose',
  'pure',
  'lazy',
  'eager',
  'sync',
  'async',
  'await',
  'resolve',
  'reject',
  'pending',
  'fulfilled',
  'cache',
  'invalidate',
  'memoize',
  'debounce',
  'throttle',
  'sentinel',
  'guard',
  'gate',
  'keep',
  'drop',
  'select',
  'project',
  'filter',
  'map',
  'reduce',
  'fold',
  'scan',
  'partition',
  'group',
  'sort',
  'merge',
  'zip',
  'pair',
  'tuple',
  'option',
  'result',
  'either',
]

function lorem(rng: () => number, byteTarget: number): string {
  const parts: string[] = []
  let size = 0

  while (size < byteTarget) {
    const w = WORDS[Math.floor(rng() * WORDS.length)] ?? 'lorem'

    parts.push(w)
    size += w.length + 1
    if (parts.length % 12 === 0) parts.push('\n  // ')
  }

  return parts.join(' ')
}

function moduleSource(id: number, rng: () => number, paddingBytes: number): string {
  const pad = lorem(rng, paddingBytes)
  const hue = Math.floor(rng() * 360)

  return `// mod-${pad4(id)} -- synthetic boot module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_MODULES = g.__BENCH_MODULES || {});
  bag[${id}] = {
    id: ${id},
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'mod-${pad4(id)}';
      el.className = 'bench-module';
      el.style.setProperty('--h', '${hue}');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  ${pad}
  */
})();
`
}

function pad4(n: number): string {
  return n.toString().padStart(4, '0')
}

function ensureCleanAssetsDir() {
  rmSync(ASSETS_DIR, { recursive: true, force: true })
  mkdirSync(ASSETS_DIR, { recursive: true })
}

ensureCleanAssetsDir()

const rng = mulberry32(SEED)
const manifestModules: Array<{ id: number; path: string; bytes: number }> = []
let totalBytes = 0

for (let i = 1; i <= MODULE_COUNT; i += 1) {
  const targetBytes = Math.max(0, TARGET_KB * 1024 - 350)
  const src = moduleSource(i, rng, targetBytes)
  const filename = `mod-${pad4(i)}.js`

  writeFileSync(join(ASSETS_DIR, filename), src)
  manifestModules.push({ id: i, path: filename, bytes: src.length })
  totalBytes += src.length
}

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: MODULE_COUNT,
  totalBytes,
  modules: manifestModules,
}

writeFileSync(join(ASSETS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log(
  `wrote ${FIXTURE_SIZE} fixture · ${MODULE_COUNT} modules · ${(totalBytes / 1024 / 1024).toFixed(2)} MB · avg ${Math.round(totalBytes / MODULE_COUNT)} B/file`,
)
console.log(`out: ${ASSETS_DIR}`)
