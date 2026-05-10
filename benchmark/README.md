# Benchmark Sources

This directory only stores committed input sources used by the app-owned benchmark system.

Scripts, generated fixtures, and benchmark results live in `packages/app`:

- scripts: `packages/app/scripts/benchmark`
- runtime fixture generator: `packages/app/scripts/generate-runtime-fixtures.ts`
- generated fixtures: `packages/app/benchmark-fixtures`
- generated/committed results: `packages/app/benchmark-results`

Run the full benchmark pipeline from the repo root:

```sh
yarn benchmark
```
