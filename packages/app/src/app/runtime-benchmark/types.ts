export type Encoding = 'raw' | 'gzip' | 'br' | 'deflate'

export type Group = 'text' | 'script'

export type Mode = 'static' | 'live'

export type Throttle = 'local' | 'fast-cdn' | 'average' | 'slow'

export interface Variant {
  /** Group identifier for the table grouping. */
  group: Group
  /** Stable id (used as row key + CSV column). */
  id: string
  /** Display label. */
  label: string
  /** True for TokenPack variants. */
  isToken: boolean
  /**
   * True for token variants encoded with `streaming: true` (small IDAT chunks,
   * deflateLevel=0). The runner pipes such variants through the streaming
   * decoder (`decodeStream(response.body)`) so decompression overlaps with
   * download. Non-streamable token variants use `decode(await response.blob())`.
   * Always false for HTTP variants — those are auto-decompressed by the
   * browser via Content-Encoding.
   */
  isStreamable?: boolean
  /** URL builder — caller appends the cache-busting nonce + live/throttle params. */
  url: (params: { source: string }) => string
  /** Browser-decode tier (matches the legend on /benchmark). */
  compat: 'full' | 'partial'
  compatNote: string
}

export interface Sample {
  ttfbMs: number
  /** Time from fetch start to all bytes arrived. */
  transferMs: number
  /** Time from bytes-arrived to JS string ready. 0 for HTTP variants. */
  decodeMs: number
  /** Time spent inside the script execution. Group=='script' only. */
  executeMs: number | null
  /** Total wall time, fetch start → ready (or executed). */
  totalMs: number
  /** Encoded wire bytes. */
  wireBytes: number
}

export interface DecodeFingerprint {
  /** Short SHA-256 hex of the decoded payload (first 8 bytes). */
  hash: string
  /** Full payload byte length. */
  bytes: number
  /** Truncated head — utf-8 if mostly printable, else hex. ~60 chars max. */
  head: string
}

export interface AggregatedRow {
  variantId: string
  iterations: number
  median: Sample
  p95: Sample
  min: Sample
  max: Sample
  perRunTotal: number[]
  /**
   * Fingerprint of the decoded payload from the FIRST iteration. Computed
   * AFTER all timing samples are recorded so it cannot affect any metric.
   */
  fingerprint: DecodeFingerprint | null
}
