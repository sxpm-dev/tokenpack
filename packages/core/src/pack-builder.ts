// Fluent builder for assembling pack contents.
//
// Env-neutral methods (`withFile`, `withBuffer`, `withDirectory`) live here.
// Node-only fs methods (`withFileSystem`, `withGlob`) live on
// `NodePackBuilder` in `@tokenpack/node` which extends this class.
//
// Builder methods collect `Intent` records synchronously; `build()` resolves
// them asynchronously. fs intents stay unresolved until a subclass handles
// them — the base `resolve()` throws on unknown kinds.

import type { PackEntry } from './archive-buffers'

/**
 * Open-shape intent record. Each intent has a `kind` and arbitrary payload
 * fields read by whichever resolver handles that kind. The base resolver
 * handles `file` and `dir`; subclasses (e.g. `NodePackBuilder`) handle their
 * own kinds and delegate the rest via `super.resolve([it], ...)`.
 */
export interface BuilderIntent {
  kind: string
}

interface FileIntent extends BuilderIntent {
  kind: 'file'
  path: string
  content: Uint8Array | string
}

interface DirIntent extends BuilderIntent {
  kind: 'dir'
  path: string
  intents: BuilderIntent[]
}

const enc = new TextEncoder()

export class PackBuilder {
  /** @internal — exposed so subclasses can append their own intent kinds. */
  protected readonly intents: BuilderIntent[] = []

  withFile(path: string, content: Uint8Array | string): this {
    const intent: FileIntent = { kind: 'file', path, content }

    this.intents.push(intent)

    return this
  }

  withBuffer(path: string, buffer: Uint8Array): this {
    return this.withFile(path, buffer)
  }

  withDirectory(path: string, fn: (sub: PackBuilder) => void): this {
    const sub = new PackBuilder()

    fn(sub)

    const intent: DirIntent = { kind: 'dir', path, intents: sub.intents }

    this.intents.push(intent)

    return this
  }

  async build(): Promise<PackEntry[]> {
    const collected: PackEntry[] = []

    await this.resolve(this.intents, '', collected)

    const seen = new Set<string>()
    const validated: PackEntry[] = []

    for (const e of collected) {
      const norm = normalize(e.path)

      assertPath(norm)

      if (seen.has(norm)) throw new Error(`duplicate path: ${norm}`)
      seen.add(norm)
      validated.push({ path: norm, bytes: e.bytes })
    }

    return validated
  }

  /** @internal — overridable so subclasses (NodePackBuilder) can handle fs intents. */
  protected async resolve(
    intents: readonly BuilderIntent[],
    prefix: string,
    out: PackEntry[],
  ): Promise<void> {
    for (const it of intents) {
      if (it.kind === 'file') {
        const fi = it as FileIntent

        out.push({
          path: join(prefix, fi.path),
          bytes: typeof fi.content === 'string' ? enc.encode(fi.content) : fi.content,
        })
      } else if (it.kind === 'dir') {
        const di = it as DirIntent

        await this.resolve(di.intents, join(prefix, di.path), out)
      } else {
        throw new Error(
          `PackBuilder: unhandled intent kind "${it.kind}". Use NodePackBuilder for fs intents.`,
        )
      }
    }
  }
}

function join(prefix: string, path: string): string {
  if (!prefix) return path

  return `${prefix}/${path}`.replace(/\/+/g, '/')
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/')
}

function assertPath(path: string): void {
  if (path.startsWith('/')) throw new Error(`path is absolute: ${path}`)
  if (path.split('/').includes('..')) throw new Error(`path has parent segment (..): ${path}`)
}
