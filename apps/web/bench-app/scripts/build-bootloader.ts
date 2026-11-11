/**
 * Bundle src/bootloader.ts into public/bootloader.js using esbuild.
 * Inlines @tokenpack/browser. Reads --cdn-base=<url> to bake a default
 * cdnBase into the script (overridable via ?cdnBase=... URL param).
 */
import { join } from 'node:path'

import { build } from 'esbuild'

import { ASSET_BASE, FIXTURE_DIR, FIXTURE_SIZE, SRC_DIR } from './paths.js'

const cdnBaseArg = process.argv.find(a => a.startsWith('--cdn-base='))
const cdnBase = cdnBaseArg ? cdnBaseArg.slice(cdnBaseArg.indexOf('=') + 1) : ''

await build({
  entryPoints: [join(SRC_DIR, 'bootloader.ts')],
  outfile: join(FIXTURE_DIR, 'bootloader.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  minify: false,
  define: {
    __BENCH_CDN_BASE__: JSON.stringify(cdnBase),
    __BENCH_ASSET_BASE__: JSON.stringify(ASSET_BASE),
  },
  logLevel: 'info',
})

console.log(`bootloader bundled · size=${FIXTURE_SIZE} · cdnBase="${cdnBase || '(none)'}"`)
