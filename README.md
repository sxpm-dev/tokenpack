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
