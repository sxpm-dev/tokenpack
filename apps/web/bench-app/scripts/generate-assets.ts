/**
 * Generate binary image assets (real PNGs with random pixel content) and
 * append them to the manifest.
 *
 * Three buckets by default:
 *   small  : 200 × 70×70   ≈ 15 KB each → ~3 MB
 *   medium : 50  × 250×250 ≈ 190 KB each → ~9.5 MB
 *   large  : 10  × 700×700 ≈ 1.5 MB each → ~15 MB
 *
 * Total: ~27 MB across 260 files. Combined with the 400 modules (~5 MB)
 * this lands near a Wix-editor-scale asset volume (~32 MB, ~660 files).
 *
 * PNGs use NO-filter rows with high-entropy random pixels so deflate inside
 * the PNG can't compress them — they stay close to raw pixel size on the
 * wire, the same as real photographic content.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'

import { ASSETS_DIR, FIXTURE_SIZE, SIZE_PRESETS } from './paths.js'

const MANIFEST_PATH = join(ASSETS_DIR, 'manifest.json')

// ── helpers (declared before top-level code that uses them) ───────────────

function numFlag(name: string, fallback: number): number {
  const flag = process.argv.find(a => a.startsWith(`--${name}=`))

  if (!flag) return fallback
  const n = Number(flag.slice(flag.indexOf('=') + 1))

  return Number.isFinite(n) ? n : fallback
}

function pad4(n: number): string {
  return n.toString().padStart(4, '0')
}

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
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  ihdr[10] = 0 // compression: deflate
  ihdr[11] = 0 // filter: adaptive
  ihdr[12] = 0 // interlace: none

  const rowLen = 1 + width * 3 // filter byte + RGB triplets
  const raw = Buffer.alloc(height * rowLen)
  let s = seed >>> 0

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLen

    raw[rowStart] = 0 // filter = None
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

// ── main ──────────────────────────────────────────────────────────────────

if (!existsSync(MANIFEST_PATH)) {
  console.error('manifest.json missing; run build:modules first')
  process.exit(1)
}

const buckets = [
  { kind: 'small', count: numFlag('small', SIZE_PRESETS[FIXTURE_SIZE].images.small), size: numFlag('small-px', 70) },
  { kind: 'medium', count: numFlag('medium', SIZE_PRESETS[FIXTURE_SIZE].images.medium), size: numFlag('medium-px', 250) },
  { kind: 'large', count: numFlag('large', SIZE_PRESETS[FIXTURE_SIZE].images.large), size: numFlag('large-px', 700) },
]

const SEED = numFlag('seed', 0xa17e)
let seedCursor = SEED

interface ManifestModule {
  id: number
  path: string
  bytes: number
}

interface ManifestAsset {
  kind: 'image'
  bucket: string
  path: string
  bytes: number
  width: number
  height: number
  contentType: string
}

interface Manifest {
  version: number
  generatedAt: string
  count: number
  totalBytes: number
  modules: ManifestModule[]
  assets?: ManifestAsset[]
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest
const assets: ManifestAsset[] = []
let totalAssetBytes = 0
let nextId = 1

for (const b of buckets) {
  for (let i = 0; i < b.count; i += 1) {
    const filename = `img-${b.kind}-${pad4(nextId++)}.png`
    const png = generatePngBytes(b.size, b.size, seedCursor++)

    writeFileSync(join(ASSETS_DIR, filename), png)
    assets.push({
      kind: 'image',
      bucket: b.kind,
      path: filename,
      bytes: png.byteLength,
      width: b.size,
      height: b.size,
      contentType: 'image/png',
    })
    totalAssetBytes += png.byteLength
  }
}

manifest.assets = assets
manifest.totalBytes += totalAssetBytes
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

console.log(
  `wrote ${FIXTURE_SIZE} fixture · ${assets.length} images · ${(totalAssetBytes / 1024 / 1024).toFixed(2)} MB · combined total ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB`,
)
for (const b of buckets) {
  const sub = assets.filter(a => a.bucket === b.kind)
  const subBytes = sub.reduce((s, a) => s + a.bytes, 0)

  console.log(
    `  ${b.kind.padEnd(6)} ${sub.length.toString().padStart(3)} × ${b.size}×${b.size} = ${(subBytes / 1024 / 1024).toFixed(2)} MB`,
  )
}
