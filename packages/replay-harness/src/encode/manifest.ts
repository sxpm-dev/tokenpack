import type { CapturedAsset, ManifestAssetEntry, PackManifest } from '../config/types.js'
import { urlToInternalPath } from './url-to-path.js'
import { urlToPackGroup } from './url-to-pack-group.js'

export function buildManifest(assets: ReadonlyArray<CapturedAsset>): PackManifest {
  const sorted = [...assets].sort((a, b) => a.seq - b.seq)

  // Dedupe by URL, keeping first-seen (preserves streaming-order semantics).
  // Real apps re-fetch the same URL many times (analytics pings, polled
  // configs); we only need the bytes once in the pack.
  const seen = new Set<string>()
  const entries: ManifestAssetEntry[] = []
  const packIds = new Set<string>()

  for (const a of sorted) {
    if (seen.has(a.url)) continue
    seen.add(a.url)
    const packId = urlToPackGroup(a.url)
    packIds.add(packId)
    entries.push({
      url: a.url,
      packId,
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
