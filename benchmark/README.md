# Benchmark Sources

This directory only stores committed input sources used by the app-owned benchmark system.

Scripts, generated fixtures, and benchmark results live in `apps/web`:

- scripts: `apps/web/scripts/benchmark`
- runtime fixture generator: `apps/web/scripts/generate-runtime-fixtures.ts`
- generated fixtures: `apps/web/benchmark-fixtures`
- generated/committed results: `apps/web/benchmark-results`

Run the full benchmark pipeline from the repo root:

```sh
yarn benchmark
```
