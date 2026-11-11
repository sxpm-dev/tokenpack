# codeart / TokenPack

Encode any payload into a streaming-decodable PNG/WebP — portable, diffable, image-shaped containers for data, repos, and AI-agent context.

> See **[IDEAS.md](./IDEAS.md)** for the product narrative, killer-feature framing, and phased roadmap.

## Monorepo

```
packages/
  core/                     # @tokenpack/core   — env-neutral encode/decode/stream/diff (browser-safe in Phase 1)
  node/                     # @tokenpack/node   — fs/sharp/CLI adapters (Phase 2)
  browser/                  # @tokenpack/browser — DX-first DOM/React/SW adapters (Phase 3)
  claude-skill/             # tokenpack-claude-skill — virtual-mount Context Pack skill (Phase 4)
  eslint-config/            # shared ESLint config
apps/web/                   # Website, playgrounds, benchmark tools (port 3003)
benchmark/                  # Shared benchmark source data
```

## Requirements

- **Node.js ≥ 18.18** (Next.js 15 requirement). `.nvmrc` is set to `20` (LTS) — run `nvm use` (or `fnm use` / `asdf install`) to switch.
- **Yarn 4.3.1** (Corepack auto-installs from `packageManager` field).

## Quick start

```bash
nvm use                                            # picks up .nvmrc → Node 20 LTS
yarn install
yarn app                                           # website and playgrounds (port 3003)
yarn workspace tokenpack-web generate:fixtures diff-versioning # diff timing matrix
yarn bench:unit                                   # Node/browser byte-processing units
```

## Status

Phase 0 (scaffolding) complete. Phases 1–6 in progress — see [IDEAS.md](./IDEAS.md) and the implementation plan at `~/.claude/plans/so-i-want-to-misty-spring.md` for sequencing.

## Library verification

Run `yarn test` for core, Node, and browser unit suites. Run `yarn bench:unit /tmp/tokenpack-units.json` for isolated timing with three warmups and 30 samples per operation. Results include raw samples, median, and p95 for 64 KiB and 1 MiB deterministic inputs. Browser chunk operations execute under Node, so these results exclude browser canvas and browser-engine performance. Node encode/decode timings use public APIs and materialize the decoded content.

The obsolete replay harness has been removed. All playgrounds and benchmarks are served by `apps/web` on port 3003.

## Playground and benchmark routes

Run `yarn web` (or `yarn app`) and open port 3003.

- `/playground` and `/playground/files` provide encode/decode, build, explore, and diff tools.
- `/server-fetch-bench` displays saved server measurements.
- `/browser-fetch-bench` runs browser fetch comparisons.
- `/apply-diff-bench` compares update strategies for one case.
- `/scenarios/diff-versioning` restores the green-to-red size/change-rate timing matrix.
- `/json-playground` compares access to indexed JSON records and previews range-fetched values.

Generate JSON fixtures with `yarn workspace tokenpack-web benchmark:json-playground`. The JSON comparison also prepares missing packs before timing. Generate the diff matrix fixtures with `yarn workspace tokenpack-web generate:fixtures diff-versioning`. Existing benchmark commands now run in `tokenpack-web`, with fixtures and results under `apps/web`.

### Recorded performance baselines

The complete 2026-11-11 run is stored in `apps/web/benchmark-results/baselines/2026-11-11T04-45-56Z/`. Read its `REPORT.md` for findings and limitations, `manifest.json` for environment and coverage, and `analysis.json` for comparisons. Individual playground responses include failures; this baseline is not an all-green release check.

With the production app running on port 3003, run `BASELINE_DIR=/absolute/path/to/new-baseline yarn workspace tokenpack-web exec node scripts/benchmark-playgrounds.mjs` to measure every playground fixture selection at local network settings. The runner uses each page's default iterations and repeats every partial-fetch target/mode five times. It writes individual JSON responses and a coverage index, and exits nonzero if verification fails. Run static benchmarks separately to avoid CPU contention. The dated baseline also includes fresh static results and isolated unit samples.

## Workflow guides and runnable examples

See [portable workflow guides](docs/guides/README.md) for configuration import/export,
artifact data, portable HTML apps, reproducible bug reports, agent checkpoints,
editable recipes, review snapshots, offline workspaces, reference catalogs and router delivery.
Each guide includes synthetic source files, a runnable example, expected results and limits.
The website presents the same guides at `/use-cases`, with downloads and browser verification.

Regenerate and verify all ten examples (Node 22, installed workspace dependencies):

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts
```

## GitHub Pages

The static site is published at https://sxpm-dev.github.io/tokenpack/ from `main`.
Run `yarn pages:build` to export it locally. See [deployment and static/local behavior](docs/github-pages.md).
