/**
 * Classify a request URL for the asset-marker / fell-through accounting.
 *
 * The harness intercepts every request via CDP `Fetch.enable` (TP + BL-CDP) or
 * observes every response (BL). Without filtering, our markers get polluted
 * with two categories of noise:
 *
 *   1. Pack PNGs we fetch ourselves — the local/remote pack URL hits CDP
 *      because our pattern is `*`. It's our delivery infrastructure, not a
 *      page asset.
 *   2. Media (images, video, audio) — the manifest deliberately excludes
 *      these (text-only content-type filter). They're real page fetches,
 *      but they pollute the asset table with rows we can't compare against
 *      anything useful.
 */

const MEDIA_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|ico|mp4|webm|mp3|wav|ogg|m4a|m4v|mov|mkv)(\?.*)?$/i

export type UrlClass =
  /** Our own pack URL (local server or CDN). Don't count, don't record. */
  | 'pack-self'
  /** Media we never wanted to track. Count as fell-through, but no marker. */
  | 'media-noise'
  /** Normal request that wasn't in the manifest. Count + marker. */
  | 'normal'

export function classifyFellthroughUrl(
  url: string,
  packUrls: ReadonlySet<string>,
): UrlClass {
  if (packUrls.has(url)) return 'pack-self'
  if (MEDIA_EXT_RE.test(url)) return 'media-noise'
  return 'normal'
}
