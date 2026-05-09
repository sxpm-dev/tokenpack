/**
 * Single source of truth for which algorithms each bench runs.
 *
 * Mental model: take ALL registered algos from the catalog, then filter.
 * Each bench has:
 *   - an immutable eligibility predicate (e.g. browser-safe only)
 *   - a mutable EXCLUDE array — edit to skip a specific algo without code changes
 *
 * Imported by:
 *   - benchmark/generate.ts          → encodeDecodeBenchAlgos()
 *   - benchmark/run-extended.ts      → encodeDecodeBenchAlgos()
 *   - benchmark/generate-runtime.ts  → browserFetchBenchAlgos()
 *   - benchmark/run.ts               → serverFetchBenchAlgos()
 *   - packages/app/src/app/browser-fetch-bench/* → browserFetchBenchAlgos()
 */

import { type AlgorithmInfo, listAlgorithmInfos } from 'tokenpack/algorithms/catalog-info'

// ── Encode/Decode bench (codec micro-bench) ─────────────────────────────────
// Tests every registered algorithm's encode + decode performance against a
// fixed source corpus. By default includes everything in the catalog.
export const ENCODE_DECODE_EXCLUDE: readonly string[] = []

export function encodeDecodeBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos().filter(a => !ENCODE_DECODE_EXCLUDE.includes(a.name))
}

// ── Browser fetch bench (live in-browser fetch+decode) ──────────────────────
// Eligibility: feFriendly === 'yes'. Algorithms that can't run in the browser
// (e.g. AVIF/WebP via sharp on Node, NodeOnly codecs) are excluded by predicate.
export const BROWSER_FETCH_EXCLUDE: readonly string[] = []

export function browserFetchBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos()
    .filter(a => a.feFriendly === 'yes')
    .filter(a => !BROWSER_FETCH_EXCLUDE.includes(a.name))
}

// ── Server fetch bench (token-vs-archive scenarios) ─────────────────────────
// Pre-recorded transport-comparison; uses the catalog as the variant pool.
export const SERVER_FETCH_EXCLUDE: readonly string[] = []

export function serverFetchBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos().filter(a => !SERVER_FETCH_EXCLUDE.includes(a.name))
}

/**
 * Validate that every name in an EXCLUDE array exists in the live catalog.
 * Catches typos (`linaer-deflate` vs `linear-deflate`) and stale entries
 * pointing at algos that have since been renamed/removed. Call at the top of
 * every benchmark script's `main()` so failures are loud and immediate.
 */
export function assertAllReferencedAlgosExist(): void {
  const known = new Set(listAlgorithmInfos().map(a => a.name))
  const all = [
    ...ENCODE_DECODE_EXCLUDE,
    ...BROWSER_FETCH_EXCLUDE,
    ...SERVER_FETCH_EXCLUDE,
  ]
  const missing = all.filter(name => !known.has(name))

  if (missing.length > 0) {
    throw new Error(
      `bench-algos: unknown algo name(s) in EXCLUDE list: ${missing.join(', ')}. ` +
        `Known algos: ${[...known].sort().join(', ')}`,
    )
  }
}
