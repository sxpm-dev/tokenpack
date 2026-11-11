/**
 * Build assets/entry-all.js — the "no code splitting" entry. Concatenation:
 *
 *   [all mod-*.js IIFEs (eager)]
 *   [all mod-lazy-*.js IIFEs (lazy synthetic)]
 *   [mod-lazy-three.js IIFE (Three.js + scene init)]
 *   [esbuild-bundled entry-single-runtime.js]
 *
 * Runtime has eager/lazy CSS, lazy image manifest, and CDN base baked in
 * as esbuild defines. By the time runtime runs, every module has executed
 * and registered on window.__BENCH_MODULES / __BENCH_LAZY_MODULES.
 */
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { build } from 'esbuild'

import { ASSET_BASE, ASSETS_DIR, SRC_DIR } from './paths.js'

const cdnBaseArg = process.argv.find(a => a.startsWith('--cdn-base='))
const cdnBase = cdnBaseArg ? cdnBaseArg.slice(cdnBaseArg.indexOf('=') + 1) : ''

// ── concat all module IIFEs ──────────────────────────────────────────────

const entries = readdirSync(ASSETS_DIR)
const eagerJs = entries.filter(n => /^mod-\d+\.js$/.test(n)).sort()
const lazyJs = entries.filter(n => /^mod-lazy-\d+\.js$/.test(n)).sort()
const threeJs = entries.filter(n => n === 'mod-lazy-three.js')

const modulesConcat = [
  `// === eager modules (${eagerJs.length}) ===\n`,
  ...eagerJs.map(n => readFileSync(join(ASSETS_DIR, n), 'utf8')),
  `\n// === lazy modules (${lazyJs.length}) ===\n`,
  ...lazyJs.map(n => readFileSync(join(ASSETS_DIR, n), 'utf8')),
  `\n// === three.js + scene (${threeJs.length}) ===\n`,
  ...threeJs.map(n => readFileSync(join(ASSETS_DIR, n), 'utf8')),
].join('\n')

// ── collect CSS strings ──────────────────────────────────────────────────

const eagerCssNames = entries.filter(n => /^style-\d+\.css$/.test(n)).sort()
const lazyCssNames = entries.filter(n => /^style-lazy-\d+\.css$/.test(n)).sort()

const eagerCssText = eagerCssNames.map(n => readFileSync(join(ASSETS_DIR, n), 'utf8')).join('\n')
const lazyCssText = lazyCssNames.map(n => readFileSync(join(ASSETS_DIR, n), 'utf8')).join('\n')

// ── lazy image manifest ──────────────────────────────────────────────────

interface ManifestImageEntry {
  path: string
  bytes: number
}

interface Manifest {
  lazyAssets?: ManifestImageEntry[]
}

const manifest = JSON.parse(readFileSync(join(ASSETS_DIR, 'manifest.json'), 'utf8')) as Manifest
const lazyAssetsForRuntime = (manifest.lazyAssets ?? []).map(a => ({
  path: a.path,
  bytes: a.bytes,
}))

// ── esbuild the runtime ──────────────────────────────────────────────────

const tmp = mkdtempSync(join(tmpdir(), 'bench-app-entry-'))
const runtimeOut = join(tmp, 'runtime.js')

await build({
  entryPoints: [join(SRC_DIR, 'entry-single-runtime.ts')],
  outfile: runtimeOut,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: false,
  minify: true,
  legalComments: 'none',
  define: {
    __BENCH_EAGER_CSS__: JSON.stringify(eagerCssText),
    __BENCH_LAZY_CSS__: JSON.stringify(lazyCssText),
    __BENCH_LAZY_ASSETS_JSON__: JSON.stringify(JSON.stringify(lazyAssetsForRuntime)),
    __BENCH_CDN_BASE__: JSON.stringify(cdnBase),
    __BENCH_ASSET_BASE__: JSON.stringify(ASSET_BASE),
  },
  logLevel: 'warning',
})

const runtimeText = readFileSync(runtimeOut, 'utf8')

// ── concat into entry-all.js ─────────────────────────────────────────────

const out = [
  '// entry-all.js — native-single bundle',
  `// modules: ${eagerJs.length} eager + ${lazyJs.length} lazy + ${threeJs.length} three`,
  `// css: ${eagerCssNames.length} eager (${(eagerCssText.length / 1024).toFixed(1)} KB) + ${lazyCssNames.length} lazy (${(lazyCssText.length / 1024).toFixed(1)} KB)`,
  modulesConcat,
  '\n// === runtime ===\n',
  runtimeText,
].join('\n')

const outPath = join(ASSETS_DIR, 'entry-all.js')

writeFileSync(outPath, out)

console.log(
  `entry-all.js · ${(out.length / 1024 / 1024).toFixed(2)} MB · ${eagerJs.length} eager js + ${lazyJs.length} lazy js + three · ${eagerCssNames.length} eager css + ${lazyCssNames.length} lazy css inline`,
)
