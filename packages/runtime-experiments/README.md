# tokenpack-runtime-experiments

A Next.js 15 app that runs **side-by-side perf scenarios** comparing TokenPack to traditional baselines (raw bytes, brotli, lazy code-split chunks). Each scenario provides live measurement, network throttle controls, and CSV export.

> **Status:** Phase 0 scaffold (one route + skeleton). Real scenarios + the diff-versioning prototype land in Phases 5–6. See [IDEAS.md](../../IDEAS.md) at the repo root.

## Run locally

```bash
yarn install
yarn workspace tokenpack-runtime-experiments dev   # http://localhost:3002
```

## Planned scenarios

| Route | What's measured |
|---|---|
| `/scenarios/vite-import` | Build-time embedded JSON via `?tokenpack` vs raw vs brotli |
| `/scenarios/component-bundle` | React component (code+CSS+fonts+images) as Token vs `React.lazy` |
| `/scenarios/sw-cache` | SW-cached PNG vs SW-cached brotli, repeat-visit boot time |
| `/scenarios/inline-data-uri` | Inline `<img>` data URI vs base64 raw vs base64-brotli |
| `/scenarios/ssr-streaming` | SSR-shipped Token (`<img>`) vs SSR-shipped JSON (`<script>`) |
| `/scenarios/diff-versioning` | v1 boot → v1.0.1 diff applied → v1.0.2 diff applied (Phase 6 working prototype) |

## Methodology

- `lib/measure.ts` — User Timing API recorder (median, p95, min, max across N=10 runs).
- `lib/network.ts` — fetch interceptor that throttles bandwidth + injects RTT.
- `components/ScenarioRunner.tsx` — standardized "run benchmark" widget.
- `components/ComparisonTable.tsx` — side-by-side metric grid.
- `lib/results-store.ts` — localStorage persistence + CSV export.
