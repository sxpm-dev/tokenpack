// Encode the existing recorded asset store as one logical TokenPack group.
//
// Usage:
//   yarn ... run encode:bundle <url-or-targetId> [--min-group-size=<KB>] [--bundle-chunks=<N>]
//
// This does not record the site again. It reads fixtures/<target>/assets and
// writes fixtures/<target>-bundle with the same asset store plus bundled packs.

import { cp, mkdir, readFile, rm } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

import { resolveTargetArg } from '../src/config/resolve-target.js'
import type { CapturedAsset } from '../src/config/types.js'
import { encodeReplayVariants } from '../src/encode/encoder.js'
import { logger } from '../src/log/logger.js'
import {
  ASSET_STORE_DIR,
  ASSET_STORE_INDEX,
  type StoredAssetIndex,
} from '../src/record/asset-store.js'

const args = process.argv.slice(2)
const positional = args.filter(a => !a.startsWith('--'))
const flags = args.filter(a => a.startsWith('--'))
const arg = positional[0] ?? 'public-demo'
const minGroupSizeFlag = flags.find(f => f.startsWith('--min-group-size='))
const minGroupSizeKb = minGroupSizeFlag
  ? Number(minGroupSizeFlag.slice('--min-group-size='.length))
  : 0

if (Number.isNaN(minGroupSizeKb) || minGroupSizeKb < 0) {
  logger.error(
    { flag: minGroupSizeFlag },
    'invalid --min-group-size (expected non-negative number in KB)',
  )
  process.exit(1)
}

const minGroupSizeBytes = minGroupSizeKb * 1024
const bundleChunksFlag =
  flags.find(f => f.startsWith('--bundle-chunks=')) ??
  flags.find(f => f.startsWith('--chunk-count='))
const bundleChunks = bundleChunksFlag
  ? Number(bundleChunksFlag.slice(bundleChunksFlag.indexOf('=') + 1))
  : 1

if (!Number.isInteger(bundleChunks) || bundleChunks < 1) {
  logger.error(
    { flag: bundleChunksFlag },
    'invalid --bundle-chunks (expected positive integer)',
  )
  process.exit(1)
}

const target = resolveTargetArg(arg)
const sourceFixtureDir = resolvePath(`fixtures/${target.id}`)
const bundleFixtureId = bundleChunks === 1 ? `${target.id}-bundle` : `${target.id}-bundle-${bundleChunks}`
const bundleFixtureDir = resolvePath(`fixtures/${bundleFixtureId}`)
const indexPath = `${sourceFixtureDir}/${ASSET_STORE_INDEX}`

const index = JSON.parse(await readFile(indexPath, 'utf8')) as StoredAssetIndex
const assets: CapturedAsset[] = []

for (const entry of index.assets) {
  const body = await readFile(`${sourceFixtureDir}/${entry.bodyPath}`)

  assets.push({
    url: entry.url,
    seq: entry.seq,
    status: entry.status,
    headers: entry.headers,
    body: new Uint8Array(body),
    rawBytes: entry.rawBytes,
    wireBytes: entry.wireBytes,
    contentEncoding: entry.contentEncoding,
  })
}

await rm(bundleFixtureDir, { recursive: true, force: true })
await mkdir(bundleFixtureDir, { recursive: true })
await cp(
  `${sourceFixtureDir}/${ASSET_STORE_DIR}`,
  `${bundleFixtureDir}/${ASSET_STORE_DIR}`,
  { recursive: true },
)

const out = await encodeReplayVariants(assets, bundleFixtureDir, {
  minGroupSizeBytes,
  forcePackId: 'all-recorded-assets',
  forcePackCount: bundleChunks,
  allowPackSplit: false,
})

logger.info(
  {
    sourceFixtureDir,
    bundleFixtureDir,
    assetCount: assets.length,
    minGroupSizeKb,
    bundleChunks,
    variantCount: out.variants.length,
    variants: out.variants.map(v => ({
      id: v.variant.id,
      packCount: v.packs.length,
      manifestPath: v.manifestPath,
    })),
  },
  'bundle encode complete',
)
