// NodePackBuilder — extends the env-neutral PackBuilder with fs/glob methods.
//
// Resolution happens lazily inside `build()` so the fluent chain stays
// synchronous. Glob matching uses a small in-process glob → regex translator
// — no external dependency.

import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, join, relative, sep } from 'node:path'

import { type BuilderIntent, PackBuilder } from 'tokenpack'
import type { PackEntry } from 'tokenpack/archive'

export interface FsOptions {
  cwd?: string
  /** Remap the entry's path inside the pack. For files: full target path.
   *  For directories: prefix prepended to walked relative paths. */
  as?: string
  exclude?: string[]
}

export type GlobOptions = FsOptions

interface FsIntent extends BuilderIntent {
  kind: 'fs'
  fsPath: string
  options: FsOptions
}

interface GlobIntent extends BuilderIntent {
  kind: 'glob'
  pattern: string
  options: GlobOptions
}

export class NodePackBuilder extends PackBuilder {
  withFileSystem(fsPath: string, options: FsOptions = {}): this {
    const intent: FsIntent = { kind: 'fs', fsPath, options }

    this.intents.push(intent)

    return this
  }

  withGlob(pattern: string, options: GlobOptions = {}): this {
    const intent: GlobIntent = { kind: 'glob', pattern, options }

    this.intents.push(intent)

    return this
  }

  protected async resolve(
    intents: readonly BuilderIntent[],
    prefix: string,
    out: PackEntry[],
  ): Promise<void> {
    for (const it of intents) {
      if (it.kind === 'fs') {
        const fsIt = it as FsIntent

        await resolveFs(fsIt.fsPath, fsIt.options, prefix, out)
      } else if (it.kind === 'glob') {
        const globIt = it as GlobIntent

        await resolveGlob(globIt.pattern, globIt.options, prefix, out)
      } else {
        // file / dir intents fall through to the base resolver.
        await super.resolve([it], prefix, out)
      }
    }
  }
}

async function resolveFs(
  fsPath: string,
  options: FsOptions,
  prefix: string,
  out: PackEntry[],
): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const absolute = isAbsolute(fsPath) ? fsPath : join(cwd, fsPath)
  const s = await stat(absolute)

  if (s.isFile()) {
    if (matchesAny(basename(absolute), options.exclude)) return
    const bytes = new Uint8Array(await readFile(absolute))
    const path = options.as ?? basename(absolute)

    out.push({ path: joinPosix(prefix, path), bytes })

    return
  }

  if (s.isDirectory()) {
    await walkDir(absolute, absolute, options, prefix, out)
  }
}

async function walkDir(
  rootAbs: string,
  curAbs: string,
  options: FsOptions,
  prefix: string,
  out: PackEntry[],
): Promise<void> {
  const items = await readdir(curAbs, { withFileTypes: true })

  for (const item of items) {
    const itemAbs = join(curAbs, item.name)
    const rel = relative(rootAbs, itemAbs).split(sep).join('/')

    if (matchesAny(rel, options.exclude)) continue
    if (item.isFile()) {
      const bytes = new Uint8Array(await readFile(itemAbs))
      const path = options.as ? joinPosix(options.as, rel) : rel

      out.push({ path: joinPosix(prefix, path), bytes })
    } else if (item.isDirectory()) {
      await walkDir(rootAbs, itemAbs, options, prefix, out)
    }
  }
}

async function resolveGlob(
  pattern: string,
  options: GlobOptions,
  prefix: string,
  out: PackEntry[],
): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const re = globToRegex(pattern)
  const collected: string[] = []

  await walkForGlob(cwd, '', re, collected)

  for (const rel of collected) {
    if (matchesAny(rel, options.exclude)) continue
    const bytes = new Uint8Array(await readFile(join(cwd, rel)))
    const path = options.as ? joinPosix(options.as, rel) : rel

    out.push({ path: joinPosix(prefix, path), bytes })
  }
}

async function walkForGlob(rootAbs: string, rel: string, re: RegExp, out: string[]): Promise<void> {
  const curAbs = rel ? join(rootAbs, rel) : rootAbs
  const items = await readdir(curAbs, { withFileTypes: true })

  for (const item of items) {
    const childRel = rel ? `${rel}/${item.name}` : item.name

    if (item.isFile()) {
      if (re.test(childRel)) out.push(childRel)
    } else if (item.isDirectory()) {
      await walkForGlob(rootAbs, childRel, re, out)
    }
  }
}

function matchesAny(path: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return false

  return patterns.some(p => globToRegex(p).test(path))
}

function globToRegex(glob: string): RegExp {
  // Escape regex specials, then translate glob tokens via placeholders to
  // avoid colliding with regex constructs we insert (the `?` in `(?:...)?`
  // would otherwise be rewritten by the `?` glob translator).
  // **/ → optional any-number-of-dirs (matches zero or more path components)
  // **  → .*
  // *   → [^/]*
  // ?   → [^/]
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '__GS_SLASH__')
    .replace(/\*\*/g, '__GLOBSTAR__')
    .replace(/\*/g, '__STAR__')
    .replace(/\?/g, '__QMARK__')
    .replace(/__GS_SLASH__/g, '(?:.*/)?')
    .replace(/__GLOBSTAR__/g, '.*')
    .replace(/__STAR__/g, '[^/]*')
    .replace(/__QMARK__/g, '[^/]')

  return new RegExp(`^${re}$`)
}

function isAbsolute(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
}

function joinPosix(...parts: string[]): string {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/')
}
