import Link from 'next/link'

const USE_CASES = [
  {
    n: '01',
    href: '/use-cases/ai-skills',
    tag: 'Skill bundles',
    title: 'Ship Claude Code · MCP · Cursor skills as one Image Token.',
    body: 'Folders are awkward to distribute. A router token is one URL. The agent runtime fetches the entry MD on install and lazy-pulls fixtures, vendor PDFs, evals as the user actually uses them. `npx tokenpack install <url>` replaces `git clone`.',
    metrics: [
      { k: 'install', v: '1 fetch' },
      { k: 'updates', v: 'diff tokens' },
      { k: 'audit', v: 'content hash' },
    ],
  },
  {
    n: '02',
    href: '/use-cases/codebase-context',
    tag: 'Agent context',
    title: 'Send a whole codebase. Pay only for the files the agent reads.',
    body: '"Here\'s my app as app.png — find the bug in src/auth/session.ts." The host fetches the manifest and one chunk range. ~5 KB on the wire instead of 5 MB. The manifest is your file tree; range-fetch is your lazy load. No vector DB required for filename retrieval.',
    metrics: [
      { k: 'manifest', v: '~12 KB' },
      { k: 'per file', v: 'one range' },
      { k: 'auth', v: 'cookies / signed URLs' },
    ],
  },
  {
    n: '03',
    href: '/use-cases/eval-suites',
    tag: 'Reproducibility',
    title: 'Eval suites that pin a hash, not a git SHA.',
    body: 'Inputs + expected outputs + fixtures + rubrics — one content-addressed Image Token. Host on a CDN, S3, R2, Hugging Face, or a GitHub release. Eval runners fetch only the shard they need. No "remember to regenerate fixtures" drift.',
    metrics: [
      { k: 'host', v: 'any static' },
      { k: 'shard', v: 'one range/case' },
      { k: 'versioning', v: 'sha256' },
    ],
  },
  {
    n: '04',
    href: '/use-cases/agent-handoff',
    tag: 'Multi-agent',
    title: 'Agent-to-agent handoff as one self-describing blob.',
    body: 'Orchestrator → worker → reviewer. The handoff token declares outputs/, screenshots/, traces/. Each downstream agent reads only the keys it cares about. No shared S3 bucket. No IAM gymnastics. The artifact travels through any pipe that carries an image.',
    metrics: [
      { k: 'auth', v: 'none required' },
      { k: 'shape', v: 'manifest-defined' },
      { k: 'cost', v: 'pay-per-key' },
    ],
  },
]

const CODE_PATTERN = /`([^`]+)`/g

function inlineCode(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let cursor = 0
  let key = 0

  for (const match of text.matchAll(CODE_PATTERN)) {
    const start = match.index ?? 0

    if (start > cursor) out.push(text.slice(cursor, start))
    out.push(
      <code
        key={`c-${key++}`}
        className="rounded border border-tp-border bg-tp-elev px-1 py-px font-mono text-[0.85em]"
      >
        {match[1]}
      </code>,
    )
    cursor = start + match[0].length
  }
  if (cursor < text.length) out.push(text.slice(cursor))

  return out
}

export function UseCases() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-12 max-w-2xl">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § Where it earns its keep
          </div>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            Four wins. <span className="italic-display text-tp-muted">Each one real.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-tp-muted">
            We deliberately don&apos;t list theoretical use cases. These are scenarios where the
            format genuinely beats the alternative — and where the alternative is something people
            actually use today.
          </p>
        </header>

        <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-2">
          {USE_CASES.map(uc => (
            <Link
              key={uc.n}
              className="group relative flex flex-col gap-5 bg-tp-bg p-8 transition-colors hover:bg-tp-elev"
              href={uc.href}
            >
              <header className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] text-tp-soft">{uc.n}</span>
                <span className="rounded-full border border-tp-border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-tp-muted uppercase">
                  {uc.tag}
                </span>
              </header>
              <h3 className="text-[20px] leading-[1.15] font-medium tracking-[-0.015em]">
                {uc.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-tp-muted">{inlineCode(uc.body)}</p>
              <dl className="mt-1 grid grid-cols-3 gap-3 border-t border-tp-border pt-4 text-[12px]">
                {uc.metrics.map(m => (
                  <div key={m.k}>
                    <dt className="font-mono text-[10px] tracking-[0.08em] text-tp-soft uppercase">
                      {m.k}
                    </dt>
                    <dd className="mt-0.5 text-tp-fg">{m.v}</dd>
                  </div>
                ))}
              </dl>
              <span className="absolute right-6 bottom-6 text-[12px] text-tp-muted transition-all group-hover:translate-x-1 group-hover:text-tp-fg">
                Read the deep-dive →
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-tp-muted">
          See{' '}
          <Link className="text-tp-fg underline decoration-tp-accent" href="/use-cases">
            all eleven scenarios →
          </Link>
        </p>
      </div>
    </section>
  )
}
