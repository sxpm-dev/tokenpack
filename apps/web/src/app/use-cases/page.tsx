import Link from 'next/link'

const TIER_1 = [
  {
    href: '/use-cases/ai-skills',
    index: '01',
    tag: 'Skill bundles',
    title: 'Ship Claude Code · MCP · Cursor skills as one Image Token.',
    body: 'Folders are awkward to install. A router token is one URL. `claude install foo.png` replaces `git clone && cp -r`.',
  },
  {
    href: '/use-cases/codebase-context',
    index: '02',
    tag: 'Agent context',
    title: 'Send a codebase. Pay only for the files the agent reads.',
    body: '"Here\'s my app as app.png — find the bug." Host fetches manifest + one chunk range. ~5 KB on the wire instead of 5 MB.',
  },
  {
    href: '/use-cases/eval-suites',
    index: '03',
    tag: 'Reproducibility',
    title: 'Eval suites that pin a hash, not a git SHA.',
    body: 'Inputs + expected + fixtures + rubrics — one content-addressed Image Token. Runners fetch only the shard they need.',
  },
  {
    href: '/use-cases/agent-handoff',
    index: '04',
    tag: 'Multi-agent',
    title: 'Agent-to-agent handoff as one self-describing blob.',
    body: 'Manifest declares outputs/, screenshots/, traces/. Each downstream agent reads only the keys it cares about.',
  },
]

const TIER_2 = [
  {
    href: '/use-cases/agent-orchestration',
    index: '05',
    tag: 'Orchestration',
    title: 'Scatter-gather over tokens, not a shared bucket.',
    body: 'Orchestrator encodes input as a router token; workers range-fetch their slice; outputs aggregate into a final hashed token. No IAM, no shared filesystem, no JSON serialization tax.',
  },
  {
    href: '/use-cases/vibe-artifacts',
    index: '06',
    tag: 'Live artifacts',
    title: 'Vibe-coded apps as pasteable PNGs.',
    body: 'LLM-generated HTML / JS / CSS becomes one router token. Recipient calls `materialize()`; the prototype runs in their DOM. No deploy, no build server, no account.',
  },
  {
    href: '/use-cases/dynamic-components',
    index: '07',
    tag: 'Components',
    title: 'Ship UI components with their entire universe.',
    body: 'JS + CSS + assets + types + contracts + validation as one router token. Host fetches only the slots it actually mounts. No npm publish, no bundler config, no asset CDN.',
  },
  {
    href: '/use-cases/json-partial',
    index: '08',
    tag: 'Big JSON',
    title: 'Pack big JSON. Fetch only the paths you need.',
    body: 'A 50 MB analytics dump becomes a router token where every key is a fetchable path. `router.json("users/42")` pulls a few KB, not the whole file. No API to write, no schema to serve, no whole-file download.',
  },
  {
    href: '/use-cases/conversation-export',
    index: '09',
    tag: 'Session export',
    title: 'Conversation export with attachments, as one Image Token.',
    body: 'Transcript + screenshots + tool outputs + traces in one re-hydratable artifact. Paste it anywhere; replay on any device.',
  },
  {
    href: '/use-cases/lightweight-rag',
    index: '10',
    tag: 'RAG',
    title: 'Filename retrieval without a vector DB.',
    body: 'For docs sites, tool references, code-as-context — the manifest IS the index. Skip embeddings; skip the storage tier.',
  },
  {
    href: '/use-cases/mobile-agents',
    index: '11',
    tag: 'On-device',
    title: 'Mobile and edge agents that update by the kilobyte.',
    body: 'Each capability is a router token. First install pulls a manifest. Updates ship as diff tokens, not new bundles.',
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

interface TierCardProps {
  case_: (typeof TIER_1)[number]
}

function TierCard({ case_ }: TierCardProps) {
  return (
    <Link
      className="group relative flex flex-col gap-5 bg-tp-bg p-7 transition-colors hover:bg-tp-elev"
      href={case_.href}
    >
      <header className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-tp-soft">{case_.index}</span>
        <span className="rounded-full border border-tp-border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-tp-muted uppercase">
          {case_.tag}
        </span>
      </header>
      <h2 className="text-[18px] leading-[1.2] font-medium tracking-[-0.015em]">{case_.title}</h2>
      <p className="text-[13.5px] leading-relaxed text-tp-muted">{inlineCode(case_.body)}</p>
      <span className="mt-auto text-[12px] text-tp-muted transition-all group-hover:translate-x-1 group-hover:text-tp-fg">
        Read the deep-dive →
      </span>
    </Link>
  )
}

export default function UseCasesIndexPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-tp-border">
        <div className="absolute inset-0 tp-grid-fade" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-20">
          <div className="mb-6 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § Use cases
          </div>
          <h1 className="max-w-3xl text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] font-medium tracking-[-0.035em]">
            Eleven problems.{' '}
            <span className="italic-display text-tp-muted">One container format. Real fit.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-tp-muted">
            Tier-1 are near-term wins — scenarios where the format genuinely beats the alternative
            today. Tier-2 are plausible, broader wins where the ecosystem still has to come along
            (on-device runtimes, session export standards, RAG conventions).
          </p>
        </div>
      </section>

      <section className="border-b border-tp-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <header className="mb-8 flex items-baseline justify-between">
            <div>
              <div className="mb-2 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
                Tier 1 · today
              </div>
              <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] leading-tight font-medium tracking-[-0.02em]">
                <span className="italic-display text-tp-muted">Real fit, now.</span>
              </h2>
            </div>
            <span className="hidden font-mono text-[11px] text-tp-soft sm:inline">
              four scenarios · production-shaped
            </span>
          </header>
          <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-2">
            {TIER_1.map(c => (
              <TierCard key={c.href} case_={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-tp-border bg-tp-elev2">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <header className="mb-8 flex items-baseline justify-between">
            <div>
              <div className="mb-2 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
                Tier 2 · plausible
              </div>
              <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] leading-tight font-medium tracking-[-0.02em]">
                <span className="italic-display text-tp-muted">Ecosystem-dependent</span> wins.
              </h2>
            </div>
            <span className="hidden font-mono text-[11px] text-tp-soft sm:inline">
              seven scenarios · adjacent-possible
            </span>
          </header>
          <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-3">
            {TIER_2.map(c => (
              <TierCard key={c.href} case_={c} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
