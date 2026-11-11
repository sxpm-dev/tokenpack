/**
 * Bundle src/entry-dynamic.ts into assets/entry-dynamic.js.
 * Inlines manifest.json contents as the build-time constant
 * `__BENCH_MANIFEST_JSON__` so the entry script doesn't need a runtime
 * fetch — matches webpack/rollup runtime chunks which embed their asset
 * manifest at build time.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { build } from 'esbuild'

import { ASSET_BASE, ASSETS_DIR, SRC_DIR } from './paths.js'

const cdnBaseArg = process.argv.find(a => a.startsWith('--cdn-base='))
const cdnBase = cdnBaseArg ? cdnBaseArg.slice(cdnBaseArg.indexOf('=') + 1) : ''
const manifestJson = readFileSync(join(ASSETS_DIR, 'manifest.json'), 'utf8')

await build({
  entryPoints: [join(SRC_DIR, 'entry-dynamic.ts')],
  outfile: join(ASSETS_DIR, 'entry-dynamic.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  minify: true,
  legalComments: 'none',
  define: {
    __BENCH_MANIFEST_JSON__: JSON.stringify(manifestJson),
    __BENCH_CDN_BASE__: JSON.stringify(cdnBase),
    __BENCH_ASSET_BASE__: JSON.stringify(ASSET_BASE),
  },
  logLevel: 'info',
})

console.log(`entry-dynamic.js built · cdnBase="${cdnBase || '(none)'}"`)
