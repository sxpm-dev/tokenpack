/**
 * Single source of truth for which algorithms each bench runs.
 *
 * Mental model: take ALL registered algos from the catalog, then filter.
 * Each bench has:
 *   - an immutable eligibility predicate (e.g. browser-safe only, node-only)
 *   - a mutable EXCLUDE array — edit to skip a specific algo without code changes
 *
 * Imported by:
 *   - benchmark/generate.ts          → encodeDecodeBenchAlgos()
 *   - benchmark/run-extended.ts      → encodeDecodeBenchAlgos()
 *   - benchmark/generate-runtime.ts  → browserFetchBenchAlgos()
 *   - benchmark/run.ts               → serverFetchBenchAlgos()
 *   - packages/app/src/app/browser-fetch-bench/* → browserFetchBenchAlgos()
 */

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { type AlgorithmInfo, listAlgorithmInfos } from 'tokenpack/algorithms/catalog-info'

// ── Classification predicates ──────────────────────────────────────────────
// Read straight from `Ctor.capabilities` and the bound Compressor — no other
// place in the bench tree should re-derive these.
//
// Two axes drive every bench filter and the runner's stream-vs-batch dispatch:
//   - environments: 'node' | 'browser' (where it can run end-to-end)
//   - streamable: true means the runner must use the streaming decode path

export const isNode = (a: AlgorithmInfo): boolean => a.environments.includes('node')
export const isBrowser = (a: AlgorithmInfo): boolean => a.environments.includes('browser')
export const isStream = (a: AlgorithmInfo): boolean =>
  algorithmCatalog.getByName(a.name).capabilities.streamable
export const usesBrotli = (a: AlgorithmInfo): boolean =>
  (algorithmCatalog.getByName(a.name).Compressor as { familyId: string }).familyId === 'brotli'

// ── Encode/Decode bench (codec micro-bench) ─────────────────────────────────
// Tests every registered algorithm's encode + decode performance against a
// fixed source corpus. By default includes everything in the catalog.
export const ENCODE_DECODE_EXCLUDE: readonly string[] = []

export function encodeDecodeBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos().filter(a => !ENCODE_DECODE_EXCLUDE.includes(a.name))
}

// ── Browser fetch bench (live in-browser fetch+decode) ──────────────────────
// Eligibility: browser environment + non-brotli compressor. Brotli requires
// `DecompressionStream('br')` which has spotty support and was producing
// noise-only "Partial-compat" rows in the bench grid.
export const BROWSER_FETCH_EXCLUDE: readonly string[] = []

export function browserFetchBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos()
    .filter(isBrowser)
    .filter(a => !usesBrotli(a))
    .filter(a => !BROWSER_FETCH_EXCLUDE.includes(a.name))
}

// ── Server fetch bench (token-vs-archive scenarios) ─────────────────────────
// Pre-recorded transport-comparison; uses the catalog as the variant pool.
// Node-only: this bench runs on Node and decodes via @tokenpack/node, so a
// browser-only algo cannot be measured here.
export const SERVER_FETCH_EXCLUDE: readonly string[] = []

export function serverFetchBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos()
    .filter(isNode)
    .filter(a => !SERVER_FETCH_EXCLUDE.includes(a.name))
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
