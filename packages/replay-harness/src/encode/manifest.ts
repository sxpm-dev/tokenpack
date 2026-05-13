import type { CapturedAsset, ManifestAssetEntry, PackManifest } from '../config/types.js'
import { urlToPackGroup } from './url-to-pack-group.js'
import { urlToInternalPath } from './url-to-path.js'

export interface BuildManifestOptions {
  forcePackId?: string
  forcePackCount?: number
}

export function buildManifest(
  assets: ReadonlyArray<CapturedAsset>,
  options: BuildManifestOptions = {},
): PackManifest {
  const sorted = [...assets].sort((a, b) => a.seq - b.seq)
  const forcePackCount =
    options.forcePackId && options.forcePackCount && options.forcePackCount > 1
      ? Math.floor(options.forcePackCount)
      : 1

  // Dedupe by URL, keeping first-seen (preserves streaming-order semantics).
  // Real apps re-fetch the same URL many times (analytics pings, polled
  // configs); we only need the bytes once in the pack.
  const seen = new Set<string>()
  const uniqueAssets: CapturedAsset[] = []

  for (const a of sorted) {
    if (seen.has(a.url)) continue
    seen.add(a.url)
    uniqueAssets.push(a)
  }

  const forcedPackIds = new Map<string, string>()

  if (options.forcePackId && forcePackCount > 1) {
    const totalRawBytes = uniqueAssets.reduce((sum, a) => sum + a.rawBytes, 0)
    const targetChunkBytes = Math.max(1, Math.ceil(totalRawBytes / forcePackCount))
    let chunkIndex = 0
    let chunkBytes = 0

    for (let i = 0; i < uniqueAssets.length; i += 1) {
      const a = uniqueAssets[i]!
      const remainingAssets = uniqueAssets.length - i
      const remainingChunks = forcePackCount - chunkIndex

      if (
        chunkBytes > 0 &&
        chunkIndex < forcePackCount - 1 &&
        remainingAssets >= remainingChunks &&
        chunkBytes + a.rawBytes > targetChunkBytes
      ) {
        chunkIndex += 1
        chunkBytes = 0
      }

      const suffix = String(chunkIndex + 1).padStart(String(forcePackCount).length, '0')

      forcedPackIds.set(a.url, `${options.forcePackId}-${suffix}`)
      chunkBytes += a.rawBytes
    }
  }

  const entries: ManifestAssetEntry[] = []
  const packIds = new Set<string>()

  for (const a of uniqueAssets) {
    const packId = options.forcePackId ?? urlToPackGroup(a.url)
    const finalPackId = forcedPackIds.get(a.url) ?? packId

    packIds.add(finalPackId)
    entries.push({
      url: a.url,
      packId: finalPackId,
      internalPath: urlToInternalPath(a.url),
      status: a.status,
      headers: a.headers,
    })
  }

  const packs = Array.from(packIds)
    .sort()
    .map(id => ({ id }))

  return {
    version: 1,
    packs,
    assets: entries,
  }
}
