/**
 * Concatenate per-phase files into single bundles for the "single" variant.
 *   eager : mod-*.js → bundle.js, style-*.css → bundle.css
 *   lazy  : mod-lazy-*.js → lazy.js, style-lazy-*.css → lazy.css
 *
 * Images stay separate (real apps don't bundle them).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ASSETS_DIR } from './paths.js'

const entries = readdirSync(ASSETS_DIR)

function bundle(
  pattern: RegExp,
  out: string,
  banner: string,
  joiner: string,
): { count: number; bytes: number } {
  const matches = entries.filter(n => pattern.test(n)).sort()

  if (matches.length === 0) return { count: 0, bytes: 0 }
  const parts = [`${banner}\n`]

  for (const name of matches) parts.push(readFileSync(join(ASSETS_DIR, name), 'utf8'))
  const text = parts.join(joiner)

  writeFileSync(join(ASSETS_DIR, out), text)

  return { count: matches.length, bytes: text.length }
}

// Eager bundles (exclude lazy via lookahead).
const eagerJs = bundle(/^mod-(?!lazy-)\d+\.js$/, 'bundle.js', '// bundle.js -- eager modules', '\n')
const eagerCss = bundle(
  /^style-(?!lazy-)\d+\.css$/,
  'bundle.css',
  '/* bundle.css -- eager stylesheets */',
  '\n',
)

console.log(`bundle.js  · ${eagerJs.count} modules · ${fmt(eagerJs.bytes)}`)
console.log(`bundle.css · ${eagerCss.count} stylesheets · ${fmt(eagerCss.bytes)}`)

// Lazy bundles. mod-lazy-three.js is included so single-lazy is truly one
// file containing both Three.js and the synthetic plugin modules.
const lazyJs = bundle(
  /^(mod-lazy-\d+\.js|mod-lazy-three\.js)$/,
  'lazy.js',
  '// lazy.js -- lazy modules incl. three.js scene',
  '\n',
)
const lazyCss = bundle(
  /^style-lazy-\d+\.css$/,
  'lazy.css',
  '/* lazy.css -- lazy stylesheets */',
  '\n',
)

console.log(`lazy.js    · ${lazyJs.count} modules · ${fmt(lazyJs.bytes)}`)
console.log(`lazy.css   · ${lazyCss.count} stylesheets · ${fmt(lazyCss.bytes)}`)

function fmt(n: number): string {
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
