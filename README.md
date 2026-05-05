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
  app/                      # tokenpack-app — existing Next.js demo (encode / decode / diff / benchmark UI)
  runtime-experiments/      # Next.js perf-scenarios + diff-versioning prototype (Phases 5–6)
  eslint-config/            # shared ESLint config
benchmark/                  # Node-side network-simulation benchmark harness
```

## Quick start

```bash
yarn install
yarn app                                # tokenpack-app dev server (port 3001)
yarn workspace tokenpack-runtime-experiments dev   # runtime-experiments (port 3002, scaffold only)
yarn benchmark:generate && yarn benchmark:run:extended
```

## Status

Phase 0 (scaffolding) complete. Phases 1–6 in progress — see [IDEAS.md](./IDEAS.md) and the implementation plan at `~/.claude/plans/so-i-want-to-misty-spring.md` for sequencing.
