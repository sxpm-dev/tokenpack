import type { ReactNode } from 'react'

const PILLARS = [
  {
    n: '01',
    title: 'Portable container',
    body: 'Drop a single Image Token into Claude Code, ChatGPT, a chat thread, a CDN, a Service Worker cache, or `postMessage`. The encoded payload — repo, bundle, ticket export — travels with the image.',
    tag: 'transport',
  },
  {
    n: '02',
    title: 'Streaming on the wire',
    body: 'Image decode begins during transfer. Bytes arrive → pixels decode → inner brotli inflates → your app sees the payload, often before the last byte lands. The win on transports that can’t natively decode brotli.',
    tag: 'perf',
  },
  {
    n: '03',
    title: 'Diff-versioned',
    body: 'A pack and its diff are both tokens. Ship v1 once as a full image, then push updates as small diff images. Producer and consumer run the same library, the same decode.',
    tag: 'versioning',
  },
  {
    n: '04',
    title: 'Encrypted when you want',
    body: 'Optional AES-256-GCM with a passphrase. The ciphertext is the image. Same encode/decode entry point — just pass `key`. Web Crypto in the browser, node:crypto on the server.',
    tag: 'security',
  },
  {
    n: '05',
    title: 'Random-access multi-file',
    body: 'Pack-format tokens expose many files through one Pack API, backed by one image or multiple linked router chunk tokens. Call `list()`, `text(path)`, `json(path)`, or `bytes(path)` and the runtime fetches only the ranges needed for that request.',
    tag: 'archive',
  },
  {
    n: '06',
    title: 'Router tokens for bundles',
    body: 'Manifest token + chunk tokens with HTTP Range. Lazy-load only the files an agent or browser actually needs. CDN-friendly. Static-host friendly. Mirror anywhere.',
    tag: 'scale',
  },
]

const CODE_PATTERN = /`([^`]+)`/g

function inlineCode(text: string): ReactNode[] {
  const out: ReactNode[] = []
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

export function Pillars() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Capabilities
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              Six properties.
              <br />
              <span className="italic-display text-tp-muted">One self-contained artifact.</span>
            </h2>
          </div>
          <p className="hidden max-w-sm text-[14px] text-tp-muted md:block">
            Each pillar maps to a real consumer pain point. Together they compose into distribution
            problems libraries don&apos;t usually solve.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(pillar => (
            <article
              key={pillar.n}
              className="group relative flex flex-col gap-3 bg-tp-bg p-7 transition-colors hover:bg-tp-elev"
            >
              <header className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] text-tp-soft">{pillar.n}</span>
                <span className="rounded-full border border-tp-border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-tp-muted uppercase">
                  {pillar.tag}
                </span>
              </header>
              <h3 className="text-[18px] leading-tight font-medium tracking-tight">
                {pillar.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-tp-muted">{inlineCode(pillar.body)}</p>
              <span className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-tp-accent transition-transform duration-300 group-hover:scale-x-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
