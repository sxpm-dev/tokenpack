import { writeFile, mkdir } from 'node:fs/promises'
// IMPORTANT: import @tokenpack/node FIRST so its side-effect registration
// (PNG surface, brotli/deflate compressors) runs before `tokenpack`'s
// preset-algorithm registration tries to look up the png surface.
// `PackBuilder` is re-exported from @tokenpack/node for this reason.
import { encode as encodeToken, PackBuilder } from '@tokenpack/node'
import type { CapturedAsset, PackManifest } from '../config/types.js'
import { buildManifest } from './manifest.js'
import { fmtBytes, fmtRatio } from '../format.js'
import { logger } from '../log/logger.js'

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
  lines.push(`| Wire (per-asset gzip/brotli) | ${fmtBytes(t.wireBytes)} | what the network actually transferred |`)
  lines.push(`| TokenPack (single deflate-6) | ${fmtBytes(t.packBytes)} | sum of all PNG packs |`)
  lines.push(`| Wire-known assets | ${t.wireKnownCount} / ${stats.assetCount} | (rest fulfilled via SW/cache) |`)
  lines.push('')

  lines.push('## Ratios', '')
  lines.push('| | Value |')
  lines.push('|---|---:|')
  lines.push(`| **packToWire** | **${fmtRatio(r.packToWire)}** |`)
  lines.push(`| packToRaw | ${fmtRatio(r.packToRaw)} |`)
  lines.push(`| wireToRaw | ${fmtRatio(r.wireToRaw)} |`)
  lines.push('')

  if (stats.skipped.groupCount > 0) {
    lines.push(`## Skipped groups (below ${fmtBytes(stats.skipped.minGroupSizeBytes)} threshold)`, '')
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
    const pp =
      perPackMap.get(entry.packId) ??
      {
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
}


/**
 * Encode one pack. If the payload exceeds single-PNG capacity the encoder
 * throws and we bisect the asset list, recursing with `__1`/`__2` suffixes —
 * keeps each output as one end-to-end stream-decodable PNG, which is what
 * the streaming-bundle hypothesis needs.
 *
 * Returns the encoded packs plus a URL→final-packId map so the caller can
 * rewrite the manifest's `assets[].packId` after splits.
 */
async function encodeWithSplit(
  packId: string,
  items: ReadonlyArray<EncodeItem>,
  outDir: string,
): Promise<{ packs: EncodedPack[]; assignments: Map<string, string> }> {
  if (items.length === 0) return { packs: [], assignments: new Map() }

  const builder = new PackBuilder()
  for (const it of items) builder.withFile(it.internalPath, it.bytes)

  const packPath = `${outDir}/${packId}.png`

  try {
    // The encoder picks ceil(sqrt(totalPixels)) for width, giving roughly-square
    // PNGs. If the pack exceeds single-PNG capacity (~5MB raw at 1280-wide cap),
    // it throws — we catch and bisect below. Each sub-pack still gets its own
    // square auto-size. `algo: 'linear-stream-deflate'` is required: `linear`
    // would bind brotli as the outer compressor, but `DecompressionStream` in
    // browsers doesn't support 'br'. The deflate-bound variant produces packs
    // the browser stream-decoder can read. `compressor: 'deflate-6'` is the
    // per-FILE pack-format compressor (a separate layer), set to deflate for
    // consistency.
    const result = await encodeToken(builder, {
      algo: 'linear-stream-deflate',
      compressor: 'deflate-6',
      out: packPath,
    })
    const assignments = new Map<string, string>()
    for (const it of items) assignments.set(it.url, packId)
    return {
      packs: [
        {
          packId,
          packPath,
          byteSize: result.bytes.byteLength,
          assetCount: items.length,
        },
      ],
      assignments,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    // Core throws one of these when a single payload exceeds single-PNG capacity:
    //   "PixelAlgorithm.encode: payload requires N chunks; multi-chunk not implemented"
    //   "...payload too large..." (older surfaces)
    const isOversize =
      msg.includes('multi-chunk not implemented') ||
      msg.includes('payload too large') ||
      /requires\s+\d+\s+chunks/.test(msg)
    if (!isOversize) throw err

    if (items.length === 1) {
      const lone = items[0]!
      logger.warn(
        { packId, url: lone.url, bytes: lone.bytes.byteLength },
        'single asset too large for one streaming PNG — dropping from pack',
      )
      return { packs: [], assignments: new Map() }
    }

    const mid = Math.ceil(items.length / 2)
    const left = items.slice(0, mid)
    const right = items.slice(mid)
    logger.info(
      { packId, total: items.length, left: left.length, right: right.length },
      'pack too large — bisecting into independent sub-packs',
    )
    const [a, b] = await Promise.all([
      encodeWithSplit(`${packId}__1`, left, outDir),
      encodeWithSplit(`${packId}__2`, right, outDir),
    ])
    const merged = new Map(a.assignments)
    for (const [url, pid] of b.assignments) merged.set(url, pid)
    return { packs: [...a.packs, ...b.packs], assignments: merged }
  }
}

export async function encode(
  assets: ReadonlyArray<CapturedAsset>,
  outDir: string,
  options: EncodeOptions = {},
): Promise<EncodeResult> {
  const minGroupSizeBytes = options.minGroupSizeBytes ?? DEFAULT_MIN_GROUP_SIZE_BYTES
  const initialManifest = buildManifest(assets)

  // Group assets by initial packId, preserving sequence order within each group.
  const byUrl = new Map(assets.map(a => [a.url, a]))
  const groupAssets = new Map<string, EncodeItem[]>()
  for (const entry of initialManifest.assets) {
    const captured = byUrl.get(entry.url)
    if (!captured) throw new Error(`Manifest entry has no captured asset: ${entry.url}`)
    const arr = groupAssets.get(entry.packId) ?? []
    arr.push({ url: entry.url, internalPath: entry.internalPath, bytes: captured.body })
    groupAssets.set(entry.packId, arr)
  }

  // Drop groups whose combined raw bytes < minGroupSizeBytes. Their assets
  // will be absent from the manifest, so at replay-time the page fetches
  // them normally (fall-through) — packing them yields no real benefit and
  // costs PNG-container overhead.
  const skippedGroups: SkippedGroup[] = []
  for (const [packId, items] of [...groupAssets]) {
    const totalRaw = items.reduce((s, it) => s + it.bytes.byteLength, 0)
    if (totalRaw < minGroupSizeBytes) {
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

  // Encode each group; oversize groups get bisected into sub-packs.
  // deflate-6, not brotli-11: ensures browser-side `DecompressionStream` can
  // decode the pack on every Chromium build (brotli `DecompressionStream` is
  // available in Chromium ≥ 124 but not in Playwright's Chrome-Headless-Shell).
  const encodedPacks: EncodedPack[] = []
  const finalAssignments = new Map<string, string>()
  for (const [packId, items] of groupAssets) {
    const { packs, assignments } = await encodeWithSplit(packId, items, outDir)
    encodedPacks.push(...packs)
    for (const [url, pid] of assignments) finalAssignments.set(url, pid)
  }
  encodedPacks.sort((a, b) => a.packId.localeCompare(b.packId))

  // Repoint manifest.assets[].packId to the final sub-pack (for assets that
  // got reassigned by bisection). Drop assets that were dropped for any
  // reason (skipped small groups, or oversized-singletons in bisection).
  const finalAssets = initialManifest.assets
    .filter(a => finalAssignments.has(a.url))
    .map(a => ({ ...a, packId: finalAssignments.get(a.url)! }))
  const manifest: PackManifest = {
    version: 1,
    packs: encodedPacks.map(p => ({ id: p.packId })),
    assets: finalAssets,
  }

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
      manifestPath,
      statsPath,
      statsMarkdownPath,
    },
    'encoded',
  )

  return { packs: encodedPacks, manifestPath, statsPath, statsMarkdownPath, manifest }
}
