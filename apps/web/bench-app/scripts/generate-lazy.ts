/**
 * Emit the lazy bucket — what the user clicks "Open 3D preview" to load:
 *   - 80 mod-lazy-NNNN.js   synthetic plugin modules (~12KB each, ~1MB)
 *   - 30 style-lazy-NNNN.css                          (~10KB each, ~300KB)
 *   - 70 small + 20 medium img-lazy-*.png             (~4.7MB)
 *   - mod-lazy-three.js     esbuild bundle of src/lazy/scene.ts (real
 *                          Three.js, ~600KB minified)
 *
 * All files share the `*-lazy-*` naming convention so encode-router and
 * bundle-single can include them; the bootloader's lazy path filters by
 * the manifest's lazyModules / lazyStyles / lazyAssets sections.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'

import { build } from 'esbuild'

import { ASSETS_DIR, FIXTURE_SIZE, SIZE_PRESETS, SRC_DIR } from './paths.js'

const MANIFEST_PATH = join(ASSETS_DIR, 'manifest.json')

const MODULE_COUNT = numFlag('count', SIZE_PRESETS[FIXTURE_SIZE].lazy.modules)
const MODULE_KB = numFlag('size-kb', 12)
const CSS_COUNT = numFlag('css-count', SIZE_PRESETS[FIXTURE_SIZE].lazy.styles)
const CSS_KB = numFlag('css-kb', 10)
const SMALL_IMG = numFlag('small', SIZE_PRESETS[FIXTURE_SIZE].lazy.smallImages)
const SMALL_PX = numFlag('small-px', 70)
const MEDIUM_IMG = numFlag('medium', SIZE_PRESETS[FIXTURE_SIZE].lazy.mediumImages)
const MEDIUM_PX = numFlag('medium-px', 250)
const SEED = numFlag('seed', 0xdead)

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

interface ManifestEntry {
  id?: number
  path: string
  bytes: number
  contentType?: string
}

interface Manifest {
  version: number
  totalBytes: number
  modules: ManifestEntry[]
  styles?: ManifestEntry[]
  assets?: Array<ManifestEntry & { kind: string; bucket?: string; width?: number; height?: number }>
  lazyModules?: ManifestEntry[]
  lazyStyles?: ManifestEntry[]
  lazyAssets?: Array<
    ManifestEntry & { kind: string; bucket?: string; width?: number; height?: number }
  >
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest

// ── deterministic PRNG ────────────────────────────────────────────────────

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

// ── lazy synthetic modules ────────────────────────────────────────────────

const WORDS = [
  'plugin',
  'feature',
  'lazy',
  'route',
  'modal',
  'preview',
  'shader',
  'mesh',
  'geometry',
  'material',
  'texture',
  'scene',
  'camera',
  'light',
  'view',
  'render',
  'animation',
  'frame',
  'matrix',
  'vector',
  'quaternion',
  'transform',
  'projection',
  'pipeline',
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

function lazyModuleSource(id: number, rng: () => number, paddingBytes: number): string {
  const pad = lorem(rng, paddingBytes)
  const hue = Math.floor(rng() * 360)

  return `// mod-lazy-${pad4(id)} -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[${id}] = {
    id: ${id},
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-${pad4(id)}';
      el.className = 'bench-module bench-module-lazy';
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

const lazyModules: ManifestEntry[] = []
let lazyModuleBytes = 0

for (let i = 1; i <= MODULE_COUNT; i += 1) {
  const rng = rngFor(SEED + i)
  const src = lazyModuleSource(i, rng, Math.max(0, MODULE_KB * 1024 - 380))
  const filename = `mod-lazy-${pad4(i)}.js`

  writeFileSync(join(ASSETS_DIR, filename), src)
  lazyModules.push({
    id: i,
    path: filename,
    bytes: src.length,
    contentType: 'application/javascript',
  })
  lazyModuleBytes += src.length
}

// ── lazy CSS ──────────────────────────────────────────────────────────────

function cssSource(idx: number, rng: () => number, byteTarget: number): string {
  const lines: string[] = [`/* style-lazy-${pad4(idx)} */\n`]
  let size = lines[0]!.length
  let r = 0

  while (size < byteTarget) {
    const hue = Math.floor(rng() * 360)
    const rule =
      `.lazy-${pad4(idx)}-${r} {\n` +
      `  color: hsl(${hue} 60% 40%);\n` +
      `  background: hsl(${(hue + 90) % 360} 50% 25%);\n` +
      `  padding: ${1 + Math.floor(rng() * 8)}px;\n` +
      `  border-radius: ${1 + Math.floor(rng() * 6)}px;\n` +
      `}\n`

    lines.push(rule)
    size += rule.length
    r += 1
  }

  return lines.join('')
}

const lazyStyles: ManifestEntry[] = []
let lazyStyleBytes = 0

for (let i = 1; i <= CSS_COUNT; i += 1) {
  const rng = rngFor(SEED * 7 + i)
  const src = cssSource(i, rng, CSS_KB * 1024)
  const filename = `style-lazy-${pad4(i)}.css`

  writeFileSync(join(ASSETS_DIR, filename), src)
  lazyStyles.push({
    id: i,
    path: filename,
    bytes: src.length,
    contentType: 'text/css',
  })
  lazyStyleBytes += src.length
}

// ── lazy PNGs ─────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)

  for (let n = 0; n < 256; n += 1) {
    let c = n

    for (let k = 0; k < 8; k += 1) c = (c & 1) === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }

  return t
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff

  for (let i = 0; i < buf.length; i += 1) {
    const byte = buf[i] ?? 0

    c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8)
  }

  return (c ^ 0xffffffff) >>> 0
}

function chunkBytes(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)

  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)

  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)

  return Buffer.concat([length, typeBuf, data, crcBuf])
}

function generatePngBytes(width: number, height: number, seed: number): Buffer {
  const magic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)

  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rowLen = 1 + width * 3
  const raw = Buffer.alloc(height * rowLen)
  let s = seed >>> 0

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLen

    raw[rowStart] = 0
    for (let i = 1; i < rowLen; i += 1) {
      s = (s + 0x6d2b79f5) >>> 0
      let t = Math.imul(s ^ (s >>> 15), s | 1)

      t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0
      raw[rowStart + i] = (t ^ (t >>> 14)) & 0xff
    }
  }

  const idat = deflateSync(raw, { level: 6 })

  return Buffer.concat([
    magic,
    chunkBytes('IHDR', ihdr),
    chunkBytes('IDAT', idat),
    chunkBytes('IEND', Buffer.alloc(0)),
  ])
}

const lazyAssets: Array<
  ManifestEntry & { kind: string; bucket: string; width: number; height: number }
> = []
let lazyImgBytes = 0
let seedCursor = SEED * 11

for (const bucket of [
  { kind: 'small', count: SMALL_IMG, px: SMALL_PX },
  { kind: 'medium', count: MEDIUM_IMG, px: MEDIUM_PX },
]) {
  for (let i = 0; i < bucket.count; i += 1) {
    const filename = `img-lazy-${bucket.kind}-${pad4(lazyAssets.length + 1)}.png`
    const png = generatePngBytes(bucket.px, bucket.px, seedCursor++)

    writeFileSync(join(ASSETS_DIR, filename), png)
    lazyAssets.push({
      kind: 'image',
      bucket: bucket.kind,
      path: filename,
      bytes: png.byteLength,
      width: bucket.px,
      height: bucket.px,
      contentType: 'image/png',
    })
    lazyImgBytes += png.byteLength
  }
}

// ── Three.js bundle ───────────────────────────────────────────────────────

const threeOut = join(ASSETS_DIR, 'mod-lazy-three.js')

await build({
  entryPoints: [join(SRC_DIR, 'lazy', 'scene.ts')],
  outfile: threeOut,
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
})

const threeBytes = statSync(threeOut).size

lazyModules.push({
  id: lazyModules.length + 1,
  path: 'mod-lazy-three.js',
  bytes: threeBytes,
  contentType: 'application/javascript',
})

// ── persist ───────────────────────────────────────────────────────────────

manifest.lazyModules = lazyModules
manifest.lazyStyles = lazyStyles
manifest.lazyAssets = lazyAssets
const lazyTotal = lazyModuleBytes + lazyStyleBytes + lazyImgBytes + threeBytes

manifest.totalBytes += lazyTotal
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

console.log(
  `wrote ${FIXTURE_SIZE} fixture lazy bucket · ${lazyModules.length} js (incl three ${fmt(threeBytes)}) + ${lazyStyles.length} css + ${lazyAssets.length} png · total ${fmt(lazyTotal)}`,
)
console.log(`  modules : ${fmt(lazyModuleBytes + threeBytes)}`)
console.log(`  styles  : ${fmt(lazyStyleBytes)}`)
console.log(`  images  : ${fmt(lazyImgBytes)}`)
console.log(`grand total in manifest: ${fmt(manifest.totalBytes)}`)

function fmt(n: number): string {
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
