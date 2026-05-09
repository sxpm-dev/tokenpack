// Scenario contracts. Each playground (`inline-data-uri`, `sw-cache`, …) exports
// a single `ScenarioDef` consumed by:
//   1. `scripts/generate-fixtures.ts` — server-side, calls `buildFixtures(ctx)`
//      to produce files written to `runtime-fixtures/<id>/`.
//   2. The generic page template (`app/scenarios/[scenarioId]/page.tsx`) and
//      custom overrides — render `name`/`description`/`explanation` and wire
//      each `variant.run` to a fetch-and-measure loop.
//
// Server and browser share one source of truth per scenario.

export type Compat = 'full' | 'partial'

export interface FixtureFile {
  /** Relative path under `runtime-fixtures/<scenarioId>/`. */
  path: string
  /** File contents. */
  bytes: Buffer
  /** Optional metadata copied into the manifest entry — original size,
   *  compression mode, source size, etc. Free-form by design. */
  meta?: Record<string, unknown>
}

export interface BuildCtx {
  /** Deterministic JSON payload of approximately `kb` kilobytes — same `kb`
   *  always returns the same bytes. Reused across size-driven scenarios so
   *  Verify hashes can be cross-checked. */
  payload(kb: number): Uint8Array
}

export interface VariantStageBreakdown {
  ttfbMs?: number
  transferMs?: number
  decodeMs?: number
  executeMs?: number
}

export interface RunMetric {
  /** End-to-end wall time of the variant's `run()` call. */
  totalMs: number
  /** Bytes pulled from the network (or fixture size for inlined variants). */
  wireBytes: number
  /** The decoded payload bytes — used for the Verify column's fingerprint.
   *  Computed off the timing path; safe to retain only first-iteration's. */
  decodedBytes: Uint8Array
  /** Optional sub-stage breakdown, surfaced as extra columns when provided. */
  stages?: VariantStageBreakdown
}

export interface FixtureFetcher {
  /** Pull a fixture from `/api/fixtures/<scenarioId>/<file>`. The API applies
   *  the page's selected throttle to the response body. Optional `query` is
   *  merged into the URL — used by variants that need extra knobs (e.g.
   *  `?encoding=gz` to ask the server for a gzipped variant served with
   *  `Content-Encoding: gzip`). The caller decides whether to consume as
   *  Blob, ArrayBuffer, ReadableStream, or text. */
  (file: string, query?: Record<string, string>): Promise<Response>
}

export interface RunCtx {
  /** The scenario this variant belongs to — handy when a runner needs the id
   *  to address fixtures from a sibling scenario (rare). */
  scenarioId: string
  /** Active size dimension if the scenario declares `sizes`; otherwise `null`. */
  size: number | null
  fetchFixture: FixtureFetcher
}

export interface VariantDef {
  /** Stable id, used as URL param, table row key, fixture filename suffix. */
  id: string
  label: string
  /** `partial` = needs `DecompressionStream('br')` (Chromium ≥ 124, Firefox
   *  ≥ 126, Safari ≥ 18). Skipped-by-default in the table; a "Run skipped"
   *  checkbox opts back in. */
  compat: Compat
  /** Optional markdown rendered as a per-variant detail panel — explains the
   *  exact code path this row times. */
  detail?: string
  /** Browser-side measurement. Returns the variant's metric. The runner
   *  wraps this in a try/catch and converts throws into errored rows. */
  run(ctx: RunCtx): Promise<RunMetric>
}

export interface ScenarioDef {
  /** URL segment + dir name. Must be unique. */
  id: string
  name: string
  /** One-line subtitle shown under the page H1. */
  description: string
  /** Markdown body shown in a collapsible "About this scenario" block. */
  explanation: string
  /**
   * Optional KB dimension. When defined, the page renders a size selector and
   * runs the variants once per size. The matching builder must emit one
   * fixture set per declared size.
   */
  sizes?: readonly number[]
  variants: readonly VariantDef[]
}

/**
 * Server-callable fixture builder. Lives in a separate module per scenario so
 * Node-only imports (`zlib`, `@tokenpack/node`, `esbuild`) never leak into
 * client bundles via the registry. `scripts/generate-fixtures.ts` looks up
 * the builder by scenario id at run time.
 */
export type BuildFixturesFn = (ctx: BuildCtx) => Promise<FixtureFile[]>

export interface ManifestEntry {
  scenarioId: string
  files: readonly { path: string; bytes: number; meta?: Record<string, unknown> }[]
}

export interface Manifest {
  generatedAt: string
  scenarios: readonly ManifestEntry[]
}
