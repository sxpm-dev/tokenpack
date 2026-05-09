# App Package — Benchmark Cleanup & Variation Reduction

**Date:** 2026-05-09
**Scope:** `packages/app` (3 bench pages) + `benchmark/` (3 runners) + `packages/node|browser` (pixel-range matrix)
**Goal:** Make the encode/decode, server-fetch, and browser-fetch benchmarks correct, low-variance, and consistently presented — so we can use them to pick the best algorithm.

This spec is bench- and test-scoped. It does not touch `packages/core` runtime code. The benchmarks exist to inform a single decision: which algorithm wins. In practice ~one algorithm ships, so we are optimizing for *measurement quality and decision support*, not for permanent infrastructure.

---

## Background

Three pages benchmark algorithms today:

- **Encode / Decode Bench** — `packages/app/src/app/encode-decode-bench/` — codec micro-bench across the full corpus. Driven by `benchmark/run-extended.ts` → `results-extended.json`.
- **Server Fetch Bench** — `packages/app/src/app/server-fetch-bench/` — token vs zip vs tar.gz vs brotli over throttled HTTP. Driven by `benchmark/run.ts` → `results.json`.
- **Browser Fetch Bench** — `packages/app/src/app/browser-fetch-bench/` — live in-browser fetch+decode against `/api/runtime-benchmark/*`.

Observed problems:

1. **Classification is re-derived ad hoc** — `bench-algos.ts`, `variants.ts:74-94`, and per-row builders each compute "is this stream / browser-safe / brotli" differently. Causes drift.
2. **Encode/Decode page** shows codec names like `pixel-range-png-brotli` while the Surface column says `png` and Compressor says `brotli-11` — three places repeating the same fact.
3. **Encode/Decode page** renders near-duplicate rows whose only difference is `Ch` (3 vs 4).
4. **Encode/Decode page** mixes 7ms algos with 30s algos, so the table is dominated by uninteresting rows.
5. **Server Fetch Bench** runs over 7 sources; only `react-dom-client.development` and `chunk-5mb` matter for the decision.
6. **Server Fetch Bench** has only one `pixel-range` variant (`pixel-range-png-brotli`), versus 8 for `linear`. Pixel-range is the focus model and needs a full surface×compressor matrix.
7. **Server Fetch Bench** doesn't enforce node-only — works today by accident, breaks the moment a browser-only algo lands.
8. **Browser Fetch Bench** registers brotli-based algos and then skips them at runtime as `Partial-compat`, leaving rows that exist only to show "skipped". Same for HTTP `br` encoding.
9. **Browser Fetch Bench** fails on `-c4` variants of `linear-deflate`, `linear-stream-deflate`, `linear-none`, `linear-upng-deflate` with *"no algorithm matched the provided artifact buffer"*.
10. **Both fetch benches** dispatch stream-vs-batch but expose no explicit `pathTaken` on results, so we can't audit dispatch correctness post-hoc.
11. **Variance** in measurements is high — only 3 samples, no warm-up, no GC control, single-number reporting (mean), no percentiles.

---

## Goals

- Every bench reads classification (`node|browser`, `stream|batch`, compressor family) from one derivation, not three.
- `pixel-range` model appears in **all 3 benches** across **all 4 quadrants** (`node|browser` × `stream|batch`).
- Encode/Decode page shows only fast algorithms (encode AND decode median < 400 ms), with non-redundant naming and no near-duplicate rows.
- Server Fetch Bench measures only `react-dom-client.development` + `chunk-5mb`, only node-safe algos, and exercises the full pixel-range matrix.
- Browser Fetch Bench excludes brotli-based algos and HTTP `br` encoding entirely, and `-c4` variants decode successfully.
- Bench runners produce stable measurements: warm-up, ≥10 samples, median + p95 + stddev, GC between samples.
- Streaming rows are visually highlighted in every bench table.

## Non-goals

- No changes to `packages/core` runtime code.
- No new permanent classification framework. The helpers introduced live in `benchmark/` and `packages/app/`.
- No replacement of the underlying algorithm system. Pixel-range matrix uses the same `extends PixelRangeAlgorithm` pattern already in use.
- No new bench pages. We are improving the three that exist.

---

## Design

### Phase 1 — Foundation

#### 1.1 Lean classification

Two file edits + one component, no new core module.

**`benchmark/bench-algos.ts`** — replace inline filters with named predicates:

```ts
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { type AlgorithmInfo, listAlgorithmInfos } from 'tokenpack/algorithms/catalog-info'

const isNode    = (a: AlgorithmInfo) => a.environments.includes('node')
const isBrowser = (a: AlgorithmInfo) => a.environments.includes('browser')
const isStream  = (a: AlgorithmInfo) => algorithmCatalog.getByName(a.name).capabilities.streamable
const usesBrotli = (a: AlgorithmInfo) =>
  (algorithmCatalog.getByName(a.name).Compressor as { familyId: string }).familyId === 'brotli'

export function serverFetchBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos()
    .filter(isNode)
    .filter(a => !SERVER_FETCH_EXCLUDE.includes(a.name))
}

export function browserFetchBenchAlgos(): AlgorithmInfo[] {
  return listAlgorithmInfos()
    .filter(isBrowser)
    .filter(a => !usesBrotli(a))
    .filter(a => !BROWSER_FETCH_EXCLUDE.includes(a.name))
}
```

`encodeDecodeBenchAlgos()` keeps its current "everything" semantics; the <400 ms filter applies later in the API/UI layer.

**`packages/app/src/lib/algo-catalog.ts`** — add a derived classification map populated once at module load:

```ts
export interface AlgoClassification {
  envs: ReadonlyArray<'node' | 'browser'>
  stream: boolean
  compressorFamily: string
}

export const CLASSIFICATION: Record<string, AlgoClassification> = (() => {
  const out: Record<string, AlgoClassification> = {}
  for (const Ctor of algorithmCatalog.list()) {
    out[Ctor.name] = {
      envs: [...Ctor.capabilities.environments],
      stream: Ctor.capabilities.streamable,
      compressorFamily: (Ctor.Compressor as { familyId: string }).familyId,
    }
  }
  return out
})()
```

**`packages/app/src/components/AlgoBadges/AlgoBadges.tsx`** *(new component, follows 1-file-1-component memory)*:

```tsx
interface AlgoBadgesProps {
  algoName: string
}

export function AlgoBadges({ algoName }: AlgoBadgesProps) {
  const c = CLASSIFICATION[algoName]
  if (!c) return null
  return (
    <span className="inline-flex gap-1">
      {c.envs.includes('node')    && <Chip>NODE</Chip>}
      {c.envs.includes('browser') && <Chip>BROWSER</Chip>}
      {c.stream ? <Chip variant="stream">STREAM</Chip> : <Chip>BATCH</Chip>}
    </span>
  )
}
```

Used by all three bench tables next to the algorithm name.

#### 1.2 Measurement methodology

New module **`benchmark/measure.ts`**:

```ts
export interface Stats {
  samples: number[]
  mean: number
  median: number
  p95: number
  stddev: number
  min: number
  max: number
}

export interface MeasureOptions {
  warmup?: number      // default 2
  samples?: number     // default 10
  gc?: boolean         // default true; calls globalThis.gc?.()
}

export async function measure(
  fn: () => Promise<void> | void,
  options: MeasureOptions = {},
): Promise<Stats>
```

Behavior:
- Run `warmup` iterations and discard.
- For each of `samples` iterations: call `globalThis.gc?.()` (no-op if `--expose-gc` absent), `await new Promise(r => setImmediate(r))` to settle the loop, time the call with `performance.now()`.
- Compute mean / median / p95 / stddev / min / max.

`benchmark/run.ts` and `benchmark/run-extended.ts` switch from ad-hoc loops to `measure()`.

**Result row schema change (additive, backwards-compatible):**

`ExtBenchRow` (`packages/app/src/lib/bench-types.ts`) and `BenchRow` (`packages/app/src/app/server-fetch-bench/types.ts`) gain:

```ts
encodeStats?: Stats     // full statistics
decodeStats?: Stats
pathTaken?: 'stream' | 'batch'
```

Existing `encodeMs` / `decodeMs` are kept and now mean *median*. UI in this phase still renders `encodeMs`; later UI sweep adds `±stddev` rendering when `encodeStats` is present.

`package.json` bench scripts add `--expose-gc` to whatever node invocation is already in place. The spec does not prescribe the script name or invocation form — preserve the existing pattern, just inject the flag.

`benchmark/README.md` documents the warmup/samples/GC requirements and how to override.

### Phase 2 — Pixel-range matrix

Mirror the linear matrix so pixel-range covers all four quadrants:

| Algo name (new/existing) | Surface | Compressor | Envs | Path |
|---|---|---|---|---|
| `pixel-range` *(rename of existing `pixel-range-png-brotli`)* | png | brotli-11 | node + browser | batch |
| `pixel-range-deflate` *(new)* | png | deflate | node + browser | batch |
| `pixel-range-none` *(new)* | png | none | node + browser | batch |
| `pixel-range-stream` *(new)* | png-stream | brotli | node | stream |
| `pixel-range-stream-deflate` *(new)* | png-stream | deflate | node + browser | stream |

Resulting quadrant coverage for pixel-range:

- **node × batch**: `pixel-range`, `pixel-range-deflate`, `pixel-range-none`
- **node × stream**: `pixel-range-stream`, `pixel-range-stream-deflate`
- **browser × batch**: `pixel-range-deflate`, `pixel-range-none`
- **browser × stream**: `pixel-range-stream-deflate`

(The brotli variants of pixel-range get filtered out of Browser Fetch by `!usesBrotli` — that's intended.)

**Files:**
- `packages/node/src/algorithms/pixel-range-deflate.ts` *(new)*
- `packages/node/src/algorithms/pixel-range-none.ts` *(new)*
- `packages/node/src/algorithms/pixel-range-stream.ts` *(new)*
- `packages/node/src/algorithms/pixel-range-stream-deflate.ts` *(new)*
- `packages/node/src/algorithms/index.ts` — register new ids; rename `pixel-range-png-brotli` → `pixel-range`.
- `packages/browser/src/algorithms/index.ts` — register browser-friendly variants (`-deflate`, `-none`, `-stream-deflate`).
- `packages/node/tests/algorithms/pixel-range-*.test.ts` — round-trip test per new variant.

**Backward-compatibility for results files:** the existing `results-extended.json` references `pixel-range-png-brotli`. Keep a legacy alias map in `benchmark/run-extended.ts` (or in `bench-types.ts` UI helpers) so old rows still display under the new name. Re-running the bench overwrites the file with the new naming. Drop the alias after Phase 4.

**Pattern for the new variants:** copy `packages/node/src/algorithms/pixel-range-png-brotli.ts:81` (`PixelRangePngBrotli extends PixelRangeAlgorithm`) and swap the surface/compressor components per the existing linear variants for reference.

### Phase 3 — Bug fix: `-c4` decode failure

Browser Fetch shows *"no algorithm matched the provided artifact buffer"* on `linear-deflate-c4`, `linear-stream-deflate-c4`, `linear-none-c4`, `linear-upng-deflate-c4`. c3 variants of the same algos work.

**Reproduction (user runs):**
1. `curl -v http://localhost:3000/api/runtime-benchmark/token?algo=linear-deflate&ch=4 -o /tmp/c4.bin` and inspect first 16 bytes (`xxd /tmp/c4.bin | head -2`).
2. Compare with c3 buffer: `curl -v ".../token?algo=linear-deflate&ch=3" -o /tmp/c3.bin`.
3. If both look like valid PNGs but only c3 decodes, the bug is in `algorithmCatalog.detectFromBuffer(buf, ext)` — the detection signature doesn't differentiate the c4 buffer.
4. If c4 buffer is empty or HTML error, the bug is in the API route generator.

**Likely cause:** the detection key for non-brotli outer compressors doesn't include channel count, and the c4 token's encoding differs in a way that makes `detectFromBuffer` reject it. Confirm via repro before patching. Fix is scoped to detection logic in `algorithmCatalog`.

This phase does not block Phase 4; it can ship in a parallel PR.

### Phase 4 — Bench cleanup, page by page

#### 4.1 Encode / Decode Bench

**Filter to fast algos (#2)** — `packages/app/src/app/api/benchmark/extended/route.ts`:

```ts
const FAST_THRESHOLD_MS = 400
const fastRows = rows.filter(r =>
  (r.encodeStats?.median ?? r.encodeMs) < FAST_THRESHOLD_MS &&
  (r.decodeStats?.median ?? r.decodeMs) < FAST_THRESHOLD_MS,
)
```

Page (`encode-decode-bench/page.tsx`) renders the filtered set by default with a small *"X algos hidden — encode or decode > 400 ms · show all"* toggle below the title. State stays client-side.

**Strip naming (#3)** — `benchmark/run-extended.ts` row builder writes:

- `algoName: info.name` (e.g. `pixel-range`, not `pixel-range-png-brotli`)
- `surface: <surface family>` (already separate)
- `compressor: <compressor id>` (already separate)

Rename `codecName` → `algoName` in `ExtBenchRow`. `ResultsTable` "Algo" column reads `row.algoName`.

**Group rows by Ch (#4)** — `ResultsTable` groups by `(algoName, surface, compressor, drawer, options)`. Each group renders a parent row showing the group identity once, plus child rows for each `Ch` showing only the differing metrics (Encode / Decode / RT / Size / Ratio / MB/s). Single-row groups render unchanged.

#### 4.2 Server Fetch Bench

**Restrict sources (#5)** — `benchmark/generate.ts` filters its source list to:

```ts
const SOURCES = ['react-dom-client.development', 'chunk-5mb']
```

Cascades through `encode-times.json` → `run.ts` → `results.json`. `server-fetch-bench/constants.ts` `SOURCES` array updated to match.

**Pixel-range coverage (#6)** — covered by Phase 2.

**Node-only enforcement (#7)** — `serverFetchBenchAlgos()` adds `.filter(isNode)` (Phase 1.1).

**Methodology (#8)** — covered by Phase 1.2.

#### 4.3 Browser Fetch Bench

**Drop brotli variants (#9)** — `packages/app/src/app/browser-fetch-bench/variants.ts` `listBindings()` adds `.filter(b => b.compressorFamily !== 'brotli')`. The `tokenCompat()` brotli branch (line 77) becomes unreachable — keep it as a defensive guard.

**Drop HTTP `br` encoding (#10)** — `variants.ts:32` `ENCODINGS = ['raw', 'gzip', 'deflate']`. `ENCODING_COMPAT['br']` deleted.

**`-c4` decode failure (#11)** — Phase 3.

### Phase 5 — UI sweep

**Stream-vs-batch correctness (#12):**
- Each runner logs `"[stream] linear-stream"` / `"[batch] linear"` once per algo at startup.
- Result rows carry `pathTaken: 'stream' | 'batch'` (from Phase 1.2).
- A test asserts: for every row, `pathTaken === 'stream'` iff `CLASSIFICATION[algoName].stream`.

**Streaming row badge + highlight (#13):**
- `<AlgoBadges>` renders the `STREAM` chip (Phase 1.1).
- Table rows apply `data-streaming={isStreaming ? '' : undefined}` and a CSS rule:
  ```css
  tr[data-streaming] { border-left: 2px solid theme(colors.purple.500); background: theme(colors.purple.500/5); }
  ```
- Applied identically to all three bench tables.

**Consistency sweep (#16):**
- Same row height, padding tokens, monospace number column treatment across `ResultsTable` (encode/decode), `SummaryTable` (server fetch), browser-fetch table.
- Same badge placement (immediately after algo name).
- Where Phase 1.2 stats are available, render `12.4 ± 0.8` (median ± stddev).

---

## File-touch summary

**New:**
- `benchmark/measure.ts`
- `packages/app/src/components/AlgoBadges/AlgoBadges.tsx`
- `packages/node/src/algorithms/pixel-range-deflate.ts`
- `packages/node/src/algorithms/pixel-range-none.ts`
- `packages/node/src/algorithms/pixel-range-stream.ts`
- `packages/node/src/algorithms/pixel-range-stream-deflate.ts`
- `packages/node/tests/algorithms/pixel-range-deflate.test.ts`
- `packages/node/tests/algorithms/pixel-range-none.test.ts`
- `packages/node/tests/algorithms/pixel-range-stream.test.ts`
- `packages/node/tests/algorithms/pixel-range-stream-deflate.test.ts`
- `benchmark/dispatch-correctness.test.ts` *(new)* — asserts `pathTaken === 'stream' iff CLASSIFICATION[name].stream` on every row of `results.json` and `results-extended.json`.

**Edited:**
- `benchmark/bench-algos.ts` — explicit predicates, node filter on server fetch.
- `benchmark/generate.ts` — restrict SOURCES.
- `benchmark/run.ts`, `benchmark/run-extended.ts` — `measure()` helper, dispatch logging, `pathTaken`.
- `benchmark/README.md` — methodology docs.
- `package.json` — `--expose-gc` on bench scripts.
- `packages/node/src/algorithms/index.ts` — register 4 new pixel-range variants, rename existing.
- `packages/browser/src/algorithms/index.ts` — register 3 browser-friendly pixel-range variants.
- `packages/app/src/lib/algo-catalog.ts` — `CLASSIFICATION` map.
- `packages/app/src/lib/bench-types.ts` — add `encodeStats`/`decodeStats`/`pathTaken`, rename `codecName` → `algoName`.
- `packages/app/src/app/api/benchmark/extended/route.ts` — 400 ms filter (default).
- `packages/app/src/app/encode-decode-bench/page.tsx` — show-all toggle.
- `packages/app/src/app/encode-decode-bench/components/ResultsTable.tsx` — Ch grouping, AlgoBadges, stream highlight.
- `packages/app/src/app/server-fetch-bench/constants.ts` — restricted SOURCES.
- `packages/app/src/app/server-fetch-bench/types.ts` — `pathTaken`.
- `packages/app/src/app/server-fetch-bench/components/SummaryTable.tsx` — AlgoBadges, stream highlight.
- `packages/app/src/app/browser-fetch-bench/variants.ts` — drop brotli + `br`.
- Browser fetch bench table component — AlgoBadges, stream highlight.

---

## Verification (user-run)

After each phase, the user runs the verification commands and pastes results back. The author of this spec does NOT run builds, tests, or benchmarks themselves.

**Phase 1:**
- `yarn tsc --noEmit -p packages/app` — type-check passes.
- `yarn test packages/node` — existing tests still pass.

**Phase 2:**
- `yarn test packages/node/tests/algorithms/pixel-range*` — all 5 round-trip tests pass.
- `yarn tsx benchmark/generate.ts && yarn tsx benchmark/run-extended.ts` — `results-extended.json` shows the 5 pixel-range entries across both `react-dom-dev` and `chunk-5mb`.

**Phase 3:**
- Browser Fetch page — no red rows, no "no algorithm matched" errors.

**Phase 4:**
- Encode/Decode page shows ≤10 rows by default, "X hidden" toggle works.
- Server Fetch page shows only `react-dom dev` and `chunk 5MB JS` source filters.
- Browser Fetch page shows zero "Partial-compat" rows.

**Phase 5:**
- All three bench tables show identical badge styling and stream-row highlight.
- `pathTaken` field present on every result row.
- Variation across consecutive runs of `benchmark:run` is visibly lower (compare stddev).

---

## Open risks

- **Pixel-range stream variant correctness** — `PixelRangeAlgorithm` may have invariants that don't compose cleanly with the streaming PNG surface. If round-trip tests fail, the `-stream` and `-stream-deflate` variants may need surface-side adjustments. Caught in Phase 2 verification.
- **`-c4` root cause unclear** — Phase 3 fix is investigation-first. If the root cause is in core detection logic, scope expands; revisit before patching.
- **Existing `results-extended.json` invalidation** — once the rename ships, old rows display under legacy names via the alias. Make sure to rerun the generators before the alias is dropped.
