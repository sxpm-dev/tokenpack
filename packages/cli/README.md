# tokenpack-cli

The `tokenpack` CLI — encode files into PNGs, decode PNGs back, pack directories, diff tokens. Uses `@tokenpack/node` under the hood.

```bash
tokenpack encode <input> -o <token.png>      # encode a file
tokenpack decode <token.png> -o <output>     # decode back
tokenpack pack <dir> -o <token.png>          # pack a directory
tokenpack expand <token.png> -o <dir>        # expand a packed token
tokenpack diff <a.png> <b.png> -o <diff.png> # visual or --text diff
tokenpack list                               # available algorithms
tokenpack presets                            # available visual presets
```

Skill-specific subcommands (`open` / `ls` / `read` / `search` / `apply-diff` / `diff-pack`) live in the [`tokenpack-claude-skill`](../claude-skill) package's own binary, since they depend on the pack-cache that's specific to the agent workflow.
