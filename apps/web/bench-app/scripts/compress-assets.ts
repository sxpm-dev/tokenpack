/**
 * Pre-brotli (quality 11) and pre-gzip every text asset so the static server
 * can serve them with Content-Encoding without paying CPU per request.
 * Skips PNGs (already deflate-compressed inside the TokenPack envelope).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

import { PUBLIC_DIR } from './paths.js'

const COMPRESSIBLE = /\.(js|json|html|css|map)$/

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)

    if (st.isDirectory()) yield* walk(full)
    else yield full
  }
}

let count = 0
let rawTotal = 0
let brTotal = 0
let gzTotal = 0

for (const root of [PUBLIC_DIR]) {
  for (const full of walk(root)) {
    if (!COMPRESSIBLE.test(full)) continue
    if (full.endsWith('.br') || full.endsWith('.gz')) continue
    const raw = readFileSync(full)
    const br = brotliCompressSync(raw, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: raw.byteLength,
      },
    })
    const gz = gzipSync(raw, { level: 9 })

    writeFileSync(`${full}.br`, br)
    writeFileSync(`${full}.gz`, gz)
    count += 1
    rawTotal += raw.byteLength
    brTotal += br.byteLength
    gzTotal += gz.byteLength
  }
}

console.log(
  `compressed ${count} files · raw ${fmt(rawTotal)} → br ${fmt(brTotal)} (${pct(brTotal, rawTotal)}) · gz ${fmt(gzTotal)} (${pct(gzTotal, rawTotal)})`,
)

function fmt(n: number): string {
  return `${(n / 1024 / 1024).toFixed(2)}MB`
}
function pct(part: number, whole: number): string {
  return `${((part / whole) * 100).toFixed(1)}%`
}
