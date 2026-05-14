import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// IMPORTANT: import @tokenpack/node FIRST so its side-effect registration
// (PNG surface, brotli/deflate compressors) runs before `tokenpack`'s
// preset-algorithm registration tries to look up the png surface.
// `TokenPack` is re-exported from @tokenpack/node for this reason.
import {
  encode as encodeToken,
  type EncodedTokenArtifact,
  type EncodeResult as EncodedToken,
  PackBuilder,
  ROUTER_TOKEN_FILE,
  ROUTER_TOKEN_ID,
  TokenPack,
} from '@tokenpack/node'

import {
  DEFAULT_REPLAY_TOKEN_VARIANTS,
  isRouterReplayTokenVariant,
  LEGACY_DEFAULT_REPLAY_TOKEN_VARIANT,
  type ReplayTokenVariant,
  variantsWithTokenRouter,
} from '../config/token-variants.js'
import type { CapturedAsset, PackManifest } from '../config/types.js'
import { fmtBytes, fmtRatio } from '../format.js'
import { logger } from '../log/logger.js'
import { buildManifest } from './manifest.js'
import { isStaticJsonAssetUrl } from './static-json-asset.js'

export interface EncodedPack {
  packId: string
  packPath: string
  byteSize: number
  assetCount: number
}

export interface EncodeResult {
  packs: EncodedPack[]
  manifestPath: string
  statsPath: string
  statsMarkdownPath: string
  manifest: PackManifest
}

export interface EncodeOptions {
  /**
   * Minimum total raw bytes per group for it to be packed. Groups below
   * this stay out of the manifest entirely, so at replay-time the page
   * fetches those assets normally from origin. Default: 500 KB.
   */
  minGroupSizeBytes?: number
  variant?: ReplayTokenVariant
  forcePackId?: string
  forcePackCount?: number
  allowPackSplit?: boolean
  tokenRouter?: boolean
}

async function artifactBuffer(artifact: EncodedTokenArtifact): Promise<Buffer> {
  return Buffer.from(await artifact.blob.arrayBuffer())
}

const DEFAULT_MIN_GROUP_SIZE_BYTES = 500 * 1024

interface SkippedGroup {
  packId: string
  assetCount: number
  rawBytes: number
  /** URLs of the assets in this group that fell out of packing. */
  urls: string[]
}

function buildStatsMarkdown(stats: PackStats): string {
  const t = stats.totals
  const r = stats.ratios

  const lines: string[] = []

  lines.push('# Replay-harness stats', '')
  lines.push(`**Packs:** ${stats.packCount}  |  **Assets:** ${stats.assetCount}`, '')

  lines.push('## Totals', '')
  lines.push('| Metric | Bytes | Note |')
  lines.push('|---|---:|---|')
  lines.push(`| Raw (decompressed) | ${fmtBytes(t.rawBytes)} | what JS engines see |`)
  lines.push(
    `| Wire (per-asset gzip/brotli) | ${fmtBytes(t.wireBytes)} | what the network actually transferred |`,
  )
  lines.push(`| TokenPack | ${fmtBytes(t.packBytes)} | sum of all PNG packs |`)
  lines.push(
    `| Wire-known assets | ${t.wireKnownCount} / ${stats.assetCount} | (rest fulfilled via SW/cache) |`,
  )
  lines.push('')

  lines.push('## Ratios', '')
  lines.push('| | Value |')
  lines.push('|---|---:|')
  lines.push(`| **packToWire** | **${fmtRatio(r.packToWire)}** |`)
  lines.push(`| packToRaw | ${fmtRatio(r.packToRaw)} |`)
  lines.push(`| wireToRaw | ${fmtRatio(r.wireToRaw)} |`)
  lines.push('')

  if (stats.skipped.groupCount > 0) {
    lines.push(
      `## Skipped groups (below ${fmtBytes(stats.skipped.minGroupSizeBytes)} threshold)`,
      '',
    )
    lines.push(
      `Total: ${stats.skipped.groupCount} groups, ${stats.skipped.assetCount} assets, ${fmtBytes(stats.skipped.rawBytes)} raw — these fall through to origin at replay time.`,
      '',
    )
    lines.push('| pack | assets | raw |')
    lines.push('|---|---:|---:|')
    for (const g of stats.skipped.groups) {
      lines.push(`| \`${g.packId}\` | ${g.assetCount} | ${fmtBytes(g.rawBytes)} |`)
    }
    lines.push('')
  }

  const sortedPacks = [...stats.perPack].sort((a, b) => b.packBytes - a.packBytes)

  lines.push(`## Per-pack breakdown (sorted by pack size, ${sortedPacks.length} total)`, '')
  lines.push('| pack | assets | raw | wire | pack | pack/wire |')
  lines.push('|---|---:|---:|---:|---:|---:|')
  for (const p of sortedPacks) {
    lines.push(
      `| \`${p.packId}\` | ${p.assetCount} | ${fmtBytes(p.rawBytes)} | ${fmtBytes(p.wireBytes)} | ${fmtBytes(p.packBytes)} | ${fmtRatio(p.packToWire)} |`,
    )
  }

  return lines.join('\n') + '\n'
}

interface PerAssetStat {
  url: string
  packId: string
  rawBytes: number
  wireBytes: number | null
  contentEncoding: string | null
}

interface PerPackStat {
  packId: string
  assetCount: number
  rawBytes: number
  wireBytes: number
  packBytes: number
  packToWire: number | null
}

interface PackStats {
  assetCount: number
  packCount: number
  totals: {
    rawBytes: number
    wireBytes: number
    wireKnownCount: number
    wireUnknownCount: number
    packBytes: number
  }
  ratios: {
    wireToRaw: number
    packToRaw: number
    packToWire: number | null
  }
  /** Groups dropped because their combined raw bytes < minGroupSizeBytes. */
  skipped: {
    groupCount: number
    assetCount: number
    rawBytes: number
    minGroupSizeBytes: number
    groups: SkippedGroup[]
  }
  perPack: PerPackStat[]
  assets: PerAssetStat[]
}

function buildStats(
  manifest: PackManifest,
  assets: ReadonlyArray<CapturedAsset>,
  encodedPacks: ReadonlyArray<EncodedPack>,
  skippedGroups: ReadonlyArray<SkippedGroup>,
  minGroupSizeBytes: number,
): PackStats {
  const byUrl = new Map(assets.map(a => [a.url, a]))
  const packBytesById = new Map(encodedPacks.map(p => [p.packId, p.byteSize]))

  // per-pack roll-up
  const perPackMap = new Map<string, PerPackStat>()

  for (const entry of manifest.assets) {
    const captured = byUrl.get(entry.url)

    if (!captured) continue
    const pp = perPackMap.get(entry.packId) ?? {
      packId: entry.packId,
      assetCount: 0,
      rawBytes: 0,
      wireBytes: 0,
      packBytes: packBytesById.get(entry.packId) ?? 0,
      packToWire: null,
    }

    pp.assetCount += 1
    pp.rawBytes += captured.rawBytes
    if (captured.wireBytes !== null) pp.wireBytes += captured.wireBytes
    perPackMap.set(entry.packId, pp)
  }
  const perPack = Array.from(perPackMap.values()).map(p => ({
    ...p,
    packToWire: p.wireBytes === 0 ? null : p.packBytes / p.wireBytes,
  }))

  // totals
  const totalRaw = manifest.assets.reduce((s, e) => s + (byUrl.get(e.url)?.rawBytes ?? 0), 0)
  const wireKnown = manifest.assets.filter(e => byUrl.get(e.url)?.wireBytes !== null)
  const totalWire = wireKnown.reduce((s, e) => s + (byUrl.get(e.url)?.wireBytes ?? 0), 0)
  const totalPack = encodedPacks.reduce((s, p) => s + p.byteSize, 0)

  return {
    assetCount: manifest.assets.length,
    packCount: encodedPacks.length,
    totals: {
      rawBytes: totalRaw,
      wireBytes: totalWire,
      wireKnownCount: wireKnown.length,
      wireUnknownCount: manifest.assets.length - wireKnown.length,
      packBytes: totalPack,
    },
    ratios: {
      wireToRaw: totalRaw === 0 ? 0 : totalWire / totalRaw,
      packToRaw: totalRaw === 0 ? 0 : totalPack / totalRaw,
      packToWire: totalWire === 0 ? null : totalPack / totalWire,
    },
    skipped: {
      groupCount: skippedGroups.length,
      assetCount: skippedGroups.reduce((s, g) => s + g.assetCount, 0),
      rawBytes: skippedGroups.reduce((s, g) => s + g.rawBytes, 0),
      minGroupSizeBytes,
      groups: [...skippedGroups].sort((a, b) => b.rawBytes - a.rawBytes),
    },
    perPack,
    assets: manifest.assets.map(e => {
      const c = byUrl.get(e.url)

      return {
        url: e.url,
        packId: e.packId,
        rawBytes: c?.rawBytes ?? 0,
        wireBytes: c?.wireBytes ?? null,
        contentEncoding: c?.contentEncoding ?? null,
      }
    }),
  }
}

interface EncodeItem {
  url: string
  internalPath: string
  bytes: Uint8Array
  status: number
  headers: Readonly<Record<string, string>>
  keepSmallGroup?: boolean
}

export async function encode(
  assets: ReadonlyArray<CapturedAsset>,
  outDir: string,
  options: EncodeOptions = {},
): Promise<EncodeResult> {
  const minGroupSizeBytes = options.minGroupSizeBytes ?? DEFAULT_MIN_GROUP_SIZE_BYTES
  const variant = options.variant ?? LEGACY_DEFAULT_REPLAY_TOKEN_VARIANT
  const allowPackSplit = options.allowPackSplit ?? true
  const initialManifest = buildManifest(assets, {
    forcePackId: options.forcePackId,
    forcePackCount: options.forcePackCount,
  })

  // Group assets by initial packId, preserving sequence order within each group.
  const byUrl = new Map(assets.map(a => [a.url, a]))
  const groupAssets = new Map<string, EncodeItem[]>()

  for (const entry of initialManifest.assets) {
    const captured = byUrl.get(entry.url)

    if (!captured) throw new Error(`Manifest entry has no captured asset: ${entry.url}`)
    const arr = groupAssets.get(entry.packId) ?? []

    arr.push({
      url: entry.url,
      internalPath: entry.internalPath,
      bytes: captured.body,
      status: entry.status,
      headers: entry.headers,
      keepSmallGroup: isStaticJsonAssetUrl(entry.url),
    })
    groupAssets.set(entry.packId, arr)
  }

  // Drop groups whose combined raw bytes < minGroupSizeBytes. Their assets
  // will be absent from the manifest, so at replay-time the page fetches
  // them normally (fall-through) — packing them yields no real benefit and
  // costs PNG-container overhead.
  const skippedGroups: SkippedGroup[] = []

  for (const [packId, items] of [...groupAssets]) {
    const totalRaw = items.reduce((s, it) => s + it.bytes.byteLength, 0)
    const keepSmallGroup = items.some(it => it.keepSmallGroup)

    if (totalRaw < minGroupSizeBytes && !keepSmallGroup) {
      skippedGroups.push({
        packId,
        assetCount: items.length,
        rawBytes: totalRaw,
        urls: items.map(it => it.url),
      })
      groupAssets.delete(packId)
    }
  }
  if (skippedGroups.length > 0) {
    logger.info(
      {
        skippedGroupCount: skippedGroups.length,
        skippedAssetCount: skippedGroups.reduce((s, g) => s + g.assetCount, 0),
        skippedRawBytes: skippedGroups.reduce((s, g) => s + g.rawBytes, 0),
        minGroupSizeBytes,
      },
      'skipped small groups (will fall through to origin at replay time)',
    )
  }

  await mkdir(outDir, { recursive: true })

  return isRouterReplayTokenVariant(variant)
    ? encodeRouterVariant({
        outDir,
        variant,
        initialManifest,
        groupAssets,
        assets,
        skippedGroups,
        minGroupSizeBytes,
        allowPackSplit,
      })
    : encodePackVariant({
        outDir,
        variant,
        initialManifest,
        groupAssets,
        assets,
        skippedGroups,
        minGroupSizeBytes,
      })
}

interface EncodeVariantInternalOptions {
  outDir: string
  variant: ReplayTokenVariant
  initialManifest: PackManifest
  groupAssets: Map<string, EncodeItem[]>
  assets: ReadonlyArray<CapturedAsset>
  skippedGroups: ReadonlyArray<SkippedGroup>
  minGroupSizeBytes: number
  allowPackSplit?: boolean
}

async function encodePackVariant({
  outDir,
  variant,
  initialManifest,
  groupAssets,
  assets,
  skippedGroups,
  minGroupSizeBytes,
}: EncodeVariantInternalOptions): Promise<EncodeResult> {
  const encodedPacks: EncodedPack[] = []
  const finalAssignments = new Map<string, string>()

  for (const [packId, items] of groupAssets) {
    const builder = new PackBuilder()

    for (const item of items) {
      builder.withBuffer(item.internalPath, item.bytes)
      finalAssignments.set(item.url, packId)
    }

    const token = (await encodeToken(builder, {
      algo: variant.algo,
      compressor: variant.packCompressor,
      algoOptions: { surface: { channels: variant.channels } },
    })) as EncodedToken
    const packPath = path.join(outDir, `${packId}.png`)

    await writeFile(packPath, Buffer.from(token.bytes))
    encodedPacks.push({
      packId,
      packPath,
      byteSize: token.byteLength,
      assetCount: items.length,
    })
  }

  encodedPacks.sort((a, b) => a.packId.localeCompare(b.packId))

  const finalAssets = initialManifest.assets
    .filter(a => finalAssignments.has(a.url))
    .map(a => ({ ...a, packId: finalAssignments.get(a.url)! }))
  const manifest = buildPackManifest(variant, encodedPacks, finalAssets)

  return writeEncodedResult({
    outDir,
    manifest,
    assets,
    encodedPacks,
    skippedGroups,
    minGroupSizeBytes,
  })
}

async function encodeRouterVariant({
  outDir,
  variant,
  initialManifest,
  groupAssets,
  assets,
  skippedGroups,
  minGroupSizeBytes,
  allowPackSplit,
}: EncodeVariantInternalOptions): Promise<EncodeResult> {
  if (!allowPackSplit) {
    logger.info(
      'allowPackSplit is ignored for router encode; chunking is explicit via TokenPack.router()',
    )
  }

  const routerFiles = [...groupAssets.values()].flatMap(items =>
    items.map(item => ({
      url: item.url,
      path: item.internalPath,
      bytes: item.bytes,
      status: item.status,
      headers: item.headers,
    })),
  )
  const artifacts = await encodeToken(
    new TokenPack().router({
      files: routerFiles,
      variant: {
        id: variant.id,
        algo: variant.algo,
        channels: variant.channels,
        loadMode: variant.loadMode,
        packCompressor: variant.packCompressor,
      },
    }),
    {
      algo: variant.algo,
      compressor: variant.packCompressor,
      algoOptions: { surface: { channels: variant.channels } },
    },
  )
  const artifactBytes = new Map<string, Buffer>()

  for (const artifact of artifacts) {
    const bytes = await artifactBuffer(artifact)
    const outputPath = path.join(outDir, artifact.filename)

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, bytes)
    artifactBytes.set(artifact.filename, bytes)
  }

  const encodedPacks: EncodedPack[] = [...artifactBytes]
    .filter(([filename]) => filename !== ROUTER_TOKEN_FILE)
    .map(([filename, bytes]) => ({
      packId: filename.replace(/\.png$/, ''),
      packPath: path.join(outDir, filename),
      byteSize: bytes.byteLength,
      assetCount: 0,
    }))
  const finalAssignments = new Map<string, string>()

  for (const file of routerFiles) finalAssignments.set(file.url, ROUTER_TOKEN_ID)
  encodedPacks.sort((a, b) => a.packId.localeCompare(b.packId))

  const finalAssets = initialManifest.assets
    .filter(a => finalAssignments.has(a.url))
    .map(a => ({ ...a, packId: finalAssignments.get(a.url)! }))
  const routerBytes = artifactBytes.get(ROUTER_TOKEN_FILE)

  if (!routerBytes) throw new Error(`missing encoded router artifact: ${ROUTER_TOKEN_FILE}`)

  return writeEncodedResult({
    outDir,
    manifest: {
      ...buildPackManifest(variant, encodedPacks, finalAssets),
      router: { id: ROUTER_TOKEN_ID, localPath: ROUTER_TOKEN_FILE },
    },
    assets,
    encodedPacks,
    skippedGroups,
    minGroupSizeBytes,
    logExtra: { routerBytes: routerBytes.byteLength },
  })
}

function buildPackManifest(
  variant: ReplayTokenVariant,
  encodedPacks: ReadonlyArray<EncodedPack>,
  assets: PackManifest['assets'],
): PackManifest {
  return {
    version: 1,
    variant: {
      id: variant.id,
      algo: variant.algo,
      channels: variant.channels,
      loadMode: variant.loadMode,
      packCompressor: variant.packCompressor,
    },
    packs: encodedPacks.map(p => ({ id: p.packId })),
    assets,
  }
}

async function writeEncodedResult({
  outDir,
  manifest,
  assets,
  encodedPacks,
  skippedGroups,
  minGroupSizeBytes,
  logExtra = {},
}: {
  outDir: string
  manifest: PackManifest
  assets: ReadonlyArray<CapturedAsset>
  encodedPacks: EncodedPack[]
  skippedGroups: ReadonlyArray<SkippedGroup>
  minGroupSizeBytes: number
  logExtra?: Record<string, unknown>
}): Promise<EncodeResult> {
  const manifestPath = `${outDir}/manifest.json`
  const statsPath = `${outDir}/stats.json`
  const statsMarkdownPath = `${outDir}/stats.md`

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  const stats = buildStats(manifest, assets, encodedPacks, skippedGroups, minGroupSizeBytes)

  await writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf8')
  await writeFile(statsMarkdownPath, buildStatsMarkdown(stats), 'utf8')

  logger.info(
    {
      packCount: encodedPacks.length,
      totalPackBytes: stats.totals.packBytes,
      totalRawBytes: stats.totals.rawBytes,
      totalWireBytes: stats.totals.wireBytes,
      packToWire: stats.ratios.packToWire,
      ...logExtra,
      manifestPath,
      statsPath,
      statsMarkdownPath,
    },
    'encoded',
  )

  return { packs: encodedPacks, manifestPath, statsPath, statsMarkdownPath, manifest }
}

export interface EncodeVariantsResult {
  variants: Array<EncodeResult & { variant: ReplayTokenVariant; fixtureDir: string }>
  indexPath: string
}

export async function encodeReplayVariants(
  assets: ReadonlyArray<CapturedAsset>,
  fixtureDir: string,
  options: Omit<EncodeOptions, 'variant'> & {
    variants?: readonly ReplayTokenVariant[]
  } = {},
): Promise<EncodeVariantsResult> {
  const variants =
    options.variants ??
    (options.tokenRouter ? variantsWithTokenRouter() : DEFAULT_REPLAY_TOKEN_VARIANTS)
  const results: EncodeVariantsResult['variants'] = []

  for (const variant of variants) {
    const variantDir = `${fixtureDir}/${variant.id}`
    const result = await encode(assets, variantDir, { ...options, variant })

    results.push({ ...result, variant, fixtureDir: variantDir })
  }

  const index = {
    version: 1,
    variants: results.map(r => ({
      ...r.variant,
      fixtureDir: r.fixtureDir,
      manifestPath: r.manifestPath,
      statsPath: r.statsPath,
      statsMarkdownPath: r.statsMarkdownPath,
      packCount: r.packs.length,
    })),
  }
  const indexPath = `${fixtureDir}/variants.json`

  await mkdir(fixtureDir, { recursive: true })
  await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8')

  const first = results[0]

  if (first) {
    await copyFile(first.manifestPath, `${fixtureDir}/manifest.json`)
    await copyFile(first.statsPath, `${fixtureDir}/stats.json`)
    await copyFile(first.statsMarkdownPath, `${fixtureDir}/stats.md`)
  }

  return { variants: results, indexPath }
}
