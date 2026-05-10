export type Group = 'text' | 'script'

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
   * Script tab only. `script-tag` loads native HTTP JavaScript through
   * `<script src>` instead of fetch + TextDecoder + Function().
   */
  loadMode?: 'fetch' | 'script-tag' | 'range-pack-fetch' | 'range-pack-stream'
  /**
   * True for token variants whose algorithm declares `capabilities.streamable`.
   * The runner pipes such variants through `decodeStream(response.body)`.
   * Non-streamable token variants use regular fetch + `decode(await response.arrayBuffer())`.
   * Always false for HTTP variants — those are auto-decompressed by the browser
   * via Content-Encoding.
   */
  isStreamable?: boolean
  /** URL builder — caller appends the cache-busting nonce + throttle params. */
  url: (params: { source: string }) => string
  /** Browser-decode tier (matches the legend on /server-fetch-bench). */
  compat: 'full' | 'partial'
  compatNote: string
}

export interface Sample {
  ttfbMs: number
  /** Time from fetch start to final response bytes materialized. */
  transferMs: number
  /**
   * JS-side content materialization. HTTP rows include text/json parsing here;
   * TokenPack rows include TokenPack decode plus text/json parsing. Browser-native
   * Content-Encoding decode remains inside transferMs.
   */
  decodeMs: number
  /** Time spent inside the script execution. Group=='script' only. */
  executeMs: number | null
  /** Total wall time, fetch start -> content bytes ready (or script executed). */
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
