#!/usr/bin/env node
// verify-browser-build.mjs
//
// Bundles @tokenpack/browser for a browser target via esbuild and asserts
// that no `node:` builtins appear in the bundled output. Catches accidental
// Node-only imports leaking into the browser-safe path.

import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

console.log('→ Bundling @tokenpack/browser for browser target…')

const result = await build({
  entryPoints: [resolve(root, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  outfile: resolve(root, 'dist/verify-browser.mjs'),
  external: [
    'react', 'react-dom', 'react-dom/client',
    // pngjs / sharp are Node-only and only reached via lazy `await import()`
    // inside surface methods that browser callers don't use (browser uses
    // createImageBitmap + canvas instead). Externalizing matches what real
    // browser bundlers do — they treat these as runtime-resolved.
    'pngjs', 'sharp', 'detect-libc',
  ],
  write: false,
  metafile: true,
  logLevel: 'silent',
}).catch(err => ({ errors: err.errors ?? [{ text: err.message }], warnings: [] }))

const errors = result.errors ?? []
const outputFiles = result.outputFiles ?? []

if (errors.length > 0) {
  // Group by missing module name.
  const byModule = new Map()
  for (const e of errors) {
    const m = /Could not resolve "([^"]+)"/.exec(e.text)
    const key = m ? m[1] : '__other__'
    const list = byModule.get(key) ?? []
    list.push(e.text)
    byModule.set(key, list)
  }

  console.log('')
  console.log('✗ Browser-safety check: not yet clean.')
  console.log(`  ${errors.length} unresolved imports across ${byModule.size} modules:`)
  console.log('')
  const sorted = [...byModule.entries()].sort((a, b) => b[1].length - a[1].length)
  for (const [mod, occ] of sorted) console.log(`  • ${mod}  (${occ.length}x)`)

  console.log('')
  console.log('  Tracked in IDEAS.md § Phase 1 leftovers (PNG → upng-js port,')
  console.log('  stream-decoder Web Streams rewrite, sharp removal from image-surface).')
  console.log('  This script will pass once those land.')
  process.exit(1)
}

mkdirSync(resolve(root, 'dist'), { recursive: true })
for (const f of outputFiles) writeFileSync(f.path, f.contents)
const code = outputFiles[0]?.contents
const sizeKB = code ? code.length / 1024 : 0

console.log('')
console.log('✓ Browser-safety check: clean.')
console.log(`  bundle size: ${sizeKB.toFixed(1)} KB raw (un-minified, no react/react-dom)`)
