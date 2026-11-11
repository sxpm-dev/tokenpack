/**
 * Encode every mod-*.js, style-*.css, and img-*-*.png in ./assets/ into a
 * TokenPack router bundle: router.png + chunk-*.png siblings under
 * ./assets/router/.
 *
 * At runtime the bootloader calls `router.materialize()` (token-native) —
 * .js files turn into <script> elements, .css into <style>, .png into bytes
 * for createImageBitmap.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { encode as encodeToken, ROUTER_TOKEN_FILE, TokenPack } from '@tokenpack/node'

import { ASSETS_DIR } from './paths.js'

const ROUTER_DIR = join(ASSETS_DIR, 'router')

const entries = readdirSync(ASSETS_DIR)
const sourceNames = entries
  .filter(
    n =>
      /^mod-(?:\d+|lazy-(?:\d+|three))\.js$/.test(n) ||
      /^style-(?:\d+|lazy-\d+)\.css$/.test(n) ||
      /^img-(?:small|medium|large|lazy-(?:small|medium))-.+\.png$/.test(n),
  )
  .sort()

if (sourceNames.length === 0) {
  console.error('no source files in assets/; run build:modules + build:css + build:images first')
  process.exit(1)
}

const files = sourceNames.map(name => {
  const bytes = readFileSync(join(ASSETS_DIR, name))

  return {
    url: `https://bench-app.local/${name}`,
    path: name,
    bytes,
    status: 200,
    headers: { 'content-type': contentTypeFor(name) },
  }
})

const totalRaw = files.reduce((s, f) => s + f.bytes.byteLength, 0)

rmSync(ROUTER_DIR, { recursive: true, force: true })
mkdirSync(ROUTER_DIR, { recursive: true })

const artifacts = await encodeToken(
  new TokenPack().router({
    files,
    variant: {
      id: 'bench-app-router',
      algo: 'pixel-range-none',
      channels: 3,
      loadMode: 'router-materialize',
      packCompressor: 'deflate-9',
    },
  }),
  {
    algo: 'pixel-range-none',
    compressor: 'deflate-9',
    algoOptions: { surface: { channels: 3 } },
  },
)

let totalRouterBytes = 0
let chunkCount = 0

for (const artifact of artifacts) {
  const buf = Buffer.from(await artifact.blob.arrayBuffer())

  writeFileSync(join(ROUTER_DIR, artifact.filename), buf)
  totalRouterBytes += buf.byteLength
  if (artifact.filename !== ROUTER_TOKEN_FILE) chunkCount += 1
}

const eagerCount = files.filter(f => !/lazy/.test(f.path)).length
const lazyCount = files.length - eagerCount
const jsCount = files.filter(f => f.path.endsWith('.js')).length
const cssCount = files.filter(f => f.path.endsWith('.css')).length
const pngCount = files.filter(f => f.path.endsWith('.png')).length

console.log(
  `wrote router · ${files.length} files (${eagerCount} eager, ${lazyCount} lazy · ${jsCount} js, ${cssCount} css, ${pngCount} png) · ${chunkCount} chunks · raw ${fmt(totalRaw)} → token ${fmt(totalRouterBytes)}`,
)
console.log(`out: ${ROUTER_DIR}`)

function contentTypeFor(name: string): string {
  if (name.endsWith('.js')) return 'application/javascript'
  if (name.endsWith('.css')) return 'text/css'
  if (name.endsWith('.png')) return 'image/png'

  return 'application/octet-stream'
}

function fmt(n: number): string {
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
