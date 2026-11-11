import { promises as fs } from 'node:fs'
import path from 'node:path'

import Link from 'next/link'

import { DocsTocLinks, type TocItem } from './DocsTocLinks'

const REPO_BASE = 'https://github.com/anthropics/codeart'
const CONTENT_ROOT = path.join(process.cwd(), 'content')

interface DocsTocRailProps {
  /** The mdxPath segments — `[]` for index, `['quickstart']` for quickstart, etc. */
  mdxPath: string[]
  toc: TocItem[]
  related?: { href: string; label: string }[]
}

async function resolveSourceFile(mdxPath: string[]): Promise<string | null> {
  const candidates = [
    path.join(CONTENT_ROOT, ...mdxPath) + '.mdx',
    path.join(CONTENT_ROOT, ...mdxPath, 'index.mdx'),
  ]

  for (const candidate of candidates) {
    try {
      await fs.access(candidate)

      return candidate
    } catch {
      // not this one
    }
  }

  return null
}

async function readLastUpdated(file: string | null): Promise<string | null> {
  if (!file) return null

  try {
    const stat = await fs.stat(file)

    return stat.mtime.toISOString()
  } catch {
    return null
  }
}

function relativeToContent(file: string): string {
  return path.relative(process.cwd(), file).replaceAll(path.sep, '/')
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null

  const d = new Date(iso)

  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export async function DocsTocRail({ mdxPath, toc, related }: DocsTocRailProps) {
  const sourceFile = await resolveSourceFile(mdxPath)
  const lastUpdated = await readLastUpdated(sourceFile)
  const repoRelative = sourceFile
    ? `apps/web/${relativeToContent(sourceFile)}`
    : `apps/web/content/${mdxPath.join('/') || 'index'}.mdx`
  const editUrl = `${REPO_BASE}/edit/main/${repoRelative}`

  // Filter TOC to h2 / h3 — anything deeper gets noisy in a rail.
  const tocItems = toc.filter(item => item.depth >= 2 && item.depth <= 3)

  return (
    <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 overflow-y-auto py-10 pr-6 pl-2 text-[12.5px] xl:block">
      {tocItems.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 font-mono text-[10px] tracking-[0.16em] text-tp-soft uppercase">
            On this page
          </div>
          <DocsTocLinks items={tocItems} />
        </section>
      )}

      <section className="mb-8">
        <div className="mb-3 font-mono text-[10px] tracking-[0.16em] text-tp-soft uppercase">
          Page
        </div>
        <ul className="flex flex-col gap-1.5">
          <li>
            <a
              className="inline-flex items-center gap-1.5 text-tp-muted transition-colors hover:text-tp-fg"
              href={editUrl}
              rel="noreferrer"
              target="_blank"
            >
              Edit on GitHub
              <span aria-hidden="true">↗</span>
            </a>
          </li>
          {lastUpdated && (
            <li className="text-tp-muted">
              Updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
            </li>
          )}
        </ul>
      </section>

      {related && related.length > 0 && (
        <section>
          <div className="mb-3 font-mono text-[10px] tracking-[0.16em] text-tp-soft uppercase">
            See also
          </div>
          <ul className="flex flex-col gap-1.5">
            {related.map(item => (
              <li key={item.href}>
                <Link className="text-tp-muted transition-colors hover:text-tp-fg" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
