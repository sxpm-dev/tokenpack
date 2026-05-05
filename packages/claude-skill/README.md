# tokenpack-claude-skill

A Claude Code skill that teaches the agent to inspect TokenPack `.png` Context Packs via the unified `tokenpack` CLI. Pack contents are decoded once into `~/.tokenpack/cache/<id>/` (out of the user's workspace) and queried on demand.

This package is just `SKILL.md` — there is no separate CLI. The skill calls into the regular `tokenpack` binary (provided by `@tokenpack/node` / the legacy `tokenpack` package).

## Subcommands used by the skill

```bash
tokenpack open <png>             # decode once into ~/.tokenpack/cache/<id>/
tokenpack ls <id>                # JSON manifest
tokenpack read <id> <path>       # file contents (utf-8 by default; --bin for base64)
tokenpack search <id> <query>    # text search across the pack
tokenpack close <id>             # evict the cache entry
tokenpack packs                  # list all currently-open packs
```

See [SKILL.md](./SKILL.md) for the full skill instructions.
