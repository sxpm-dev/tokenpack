/**
 * Emit N synthetic CSS files into ./assets/ and append them to manifest.json.
 *
 * Each CSS file declares ~80-120 deterministic class rules — selectors
 * follow a `.bench-{kind}-{n}` convention so concatenation can't collide.
 * Content is text-heavy, brotli-compressible, similar to real design-system
 * stylesheets.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ASSETS_DIR, FIXTURE_SIZE, SIZE_PRESETS } from './paths.js'

const MANIFEST_PATH = join(ASSETS_DIR, 'manifest.json')

const COUNT = numFlag('count', SIZE_PRESETS[FIXTURE_SIZE].styles)
const TARGET_KB = numFlag('size-kb', 10)
const SEED = numFlag('seed', 0xc55c)

function numFlag(name: string, fallback: number): number {
  const flag = process.argv.find(a => a.startsWith(`--${name}=`))

  if (!flag) return fallback
  const n = Number(flag.slice(flag.indexOf('=') + 1))

  return Number.isFinite(n) ? n : fallback
}

if (!existsSync(MANIFEST_PATH)) {
  console.error('manifest.json missing; run build:modules first')
  process.exit(1)
}

interface Manifest {
  version: number
  totalBytes: number
  modules: unknown[]
  assets?: unknown[]
  styles?: Array<{ kind: 'css'; path: string; bytes: number; contentType: string }>
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest

function rngFor(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pad4(n: number): string {
  return n.toString().padStart(4, '0')
}

function cssSource(fileIndex: number, rng: () => number, targetBytes: number): string {
  const lines: string[] = [`/* css-${pad4(fileIndex)} -- synthetic stylesheet */\n`]
  let size = lines[0]!.length
  let ruleIdx = 0

  while (size < targetBytes) {
    const hue = Math.floor(rng() * 360)
    const sat = 40 + Math.floor(rng() * 30)
    const lit = 20 + Math.floor(rng() * 40)
    const radius = 1 + Math.floor(rng() * 8)
    const pad = 1 + Math.floor(rng() * 12)
    const m = 1 + Math.floor(rng() * 12)
    const rule =
      `.bench-${pad4(fileIndex)}-${ruleIdx} {\n` +
      `  color: hsl(${hue} ${sat}% ${lit}%);\n` +
      `  background: hsl(${(hue + 180) % 360} ${sat}% ${100 - lit}%);\n` +
      `  padding: ${pad}px ${pad * 2}px;\n` +
      `  margin: ${m}px;\n` +
      `  border-radius: ${radius}px;\n` +
      `  border: 1px solid hsl(${hue} ${sat}% ${Math.max(0, lit - 10)}%);\n` +
      `  font-weight: ${300 + (ruleIdx % 5) * 100};\n` +
      `}\n`

    lines.push(rule)
    size += rule.length
    ruleIdx += 1
  }

  return lines.join('')
}

const styles: Array<{ kind: 'css'; path: string; bytes: number; contentType: string }> = []
let totalStyleBytes = 0

for (let i = 1; i <= COUNT; i += 1) {
  const rng = rngFor(SEED + i)
  const src = cssSource(i, rng, TARGET_KB * 1024)
  const filename = `style-${pad4(i)}.css`

  writeFileSync(join(ASSETS_DIR, filename), src)
  styles.push({
    kind: 'css',
    path: filename,
    bytes: src.length,
    contentType: 'text/css',
  })
  totalStyleBytes += src.length
}

manifest.styles = styles
manifest.totalBytes += totalStyleBytes
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

console.log(
  `wrote ${FIXTURE_SIZE} fixture · ${COUNT} CSS files · ${(totalStyleBytes / 1024 / 1024).toFixed(2)} MB · combined total ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB`,
)
