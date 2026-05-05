# @tokenpack/node

Node.js adapters for TokenPack — `fs`, `sharp`, and the `tokenpack` CLI on top of [`@tokenpack/core`](../core).

> **Status:** Phase 0 scaffold. Currently re-exports the legacy `tokenpack` package. The real split lands in Phase 2.

## Planned surface

```ts
// fs adapters
import { encodeFile, decodeFile, decodeToBuffer } from '@tokenpack/node'

// archive helpers (directory walk → CART-format buffer pack)
import { packDirs, unpackDir, listArchive } from '@tokenpack/node/archive'

// sharp-backed surfaces
import { avifSurface, webpSurface } from '@tokenpack/node/surfaces'
```

## CLI

```bash
tokenpack encode README.md token.png
tokenpack decode token.png out.md
tokenpack diff a.png b.png diff.png
```

See [IDEAS.md](../../IDEAS.md) for the full architecture and roadmap.
