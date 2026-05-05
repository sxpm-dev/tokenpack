---
name: tokenpack-context-pack
description: Use when the user pastes or references a TokenPack PNG (a Context Pack — message+attachments+thread, repo-as-image, etc.), or mentions "Context Pack", "TokenPack", "tokenpack", "repo-as-image", or attaches a `.png` claimed to be a TokenPack archive. The skill exposes a virtual-mount API for querying pack contents without writing files to the user's workspace.
---

# TokenPack Context Pack — Virtual Mount Skill

Inspect a TokenPack `.png` Context Pack via the unified `tokenpack` CLI. Pack contents are decoded once into `~/.tokenpack/cache/<id>/` (out of the user's workspace) and queried on demand.

## When to use

Trigger this skill when:

- The user pastes or attaches a `.png` and says it's a TokenPack / Context Pack.
- The user references a path to a `.png` and asks to read its contents.
- The user mentions "Context Pack", "TokenPack", or "repo-as-image".

## Workflow

```bash
tokenpack open <path-to.png> [--key <password>]
# → { id, source, fileCount, totalBytes, topLevel: [...] }

tokenpack ls <id> [--glob <pattern>]
# → JSON manifest: [{ path, size, type, sha256 }]

tokenpack read <id> <path> [--bin]
# → file contents (utf-8 by default; --bin emits base64)

tokenpack search <id> <query> [--regex] [--max N]
# → [{ path, line, snippet }]

tokenpack close <id>           # evict the cache entry
tokenpack packs                # list all currently-open packs
```

## Recommended sequence

1. **Open the pack.** `tokenpack open <path>` returns an `id` + a summary (file count, top-level entries). Note the id.
2. **Survey contents.** `tokenpack ls <id>` for the full manifest. Use `--glob 'src'` to filter.
3. **Read selectively.** Only fetch files needed to answer the user's question — `tokenpack read <id> <path>`.
4. **Search across files.** For "where is X mentioned?" questions: `tokenpack search <id> '<query>'`.
5. **Close when done.** `tokenpack close <id>` evicts the cache.

## Guardrails

- **Never write pack contents into the user's cwd.** Files stay in `~/.tokenpack/cache/<id>/`. If the user wants extraction, ask first.
- **Don't `read` everything up front.** Large packs can blow context. Fetch what you need.
- **Encrypted packs** report `key_required: true` from `open`. Ask the user for the key before retrying with `--key`.

## Why this exists

A TokenPack PNG can carry a complete message + attachments + thread, an entire repo, or any structured payload. The skill lets the agent treat that PNG as a queryable, sandboxed knowledge source — without polluting the user's workspace with extracted files.

See [IDEAS.md](../../IDEAS.md) for the full product narrative.
