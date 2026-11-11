import Link from 'next/link'

import { type FileRegion, PixelToken } from '@/components/Rough/PixelToken'

const HERO_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.55, height: 0.22, role: 'file-a', label: 'app.js' },
  { x: 0.55, y: 0, width: 0.45, height: 0.22, role: 'file-b', label: 'styles.css' },
  { x: 0, y: 0.22, width: 1, height: 0.3, role: 'file-c', label: 'vendor/react.js' },
  { x: 0, y: 0.52, width: 0.5, height: 0.22, role: 'file-d', label: 'pages/*' },
  { x: 0.5, y: 0.52, width: 0.5, height: 0.22, role: 'file-e', label: 'components/*' },
  { x: 0, y: 0.74, width: 1, height: 0.26, role: 'file-f', label: 'tiny files' },
]

const USE_CASES = [
  { label: 'agent skills', href: '/use-cases/ai-skills' },
  { label: 'codebase context', href: '/use-cases/codebase-context' },
  { label: 'eval suites', href: '/use-cases/eval-suites' },
  { label: 'agent handoff', href: '/use-cases/agent-handoff' },
  { label: 'session export', href: '/use-cases/conversation-export' },
  { label: 'lightweight RAG', href: '/use-cases/lightweight-rag' },
  { label: 'mobile agents', href: '/use-cases/mobile-agents' },
]

export function HeroSummary() {
  return (
    <div className="relative rounded-lg border border-tp-border bg-tp-elev p-6">
      <header className="mb-4 flex items-center justify-between text-[10px] tracking-[0.18em] text-tp-muted uppercase">
        <span>a token, opened up</span>
        <span className="text-tp-soft">router.png · 6 files</span>
      </header>

      <p className="mb-4 text-[12.5px] leading-relaxed text-tp-muted">
        Same pixel data, six different files inside. Each thumbnail shows where one file&apos;s
        bytes sit. HTTP <code className="font-mono text-tp-fg">Range</code> fetches just that region
        — the rest never travels.
      </p>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {HERO_FILES.map((file, idx) => (
          <PixelToken
            key={idx}
            fetched={[idx]}
            files={HERO_FILES}
            seed="hero-shared"
            viewSize={140}
          />
        ))}
      </div>

      <ul className="mb-5 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-tp-border pt-3 text-[10.5px] font-mono">
        {HERO_FILES.map(file => (
          <li key={file.label} className="flex items-center gap-1.5 text-tp-fg">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: `var(--${file.role})` }}
            />
            <span className="truncate">{file.label}</span>
          </li>
        ))}
      </ul>

      <section>
        <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
          § goes where archives don&apos;t
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {USE_CASES.map(u => (
            <li key={u.href}>
              <Link
                className="inline-block rounded-full border border-tp-border bg-tp-bg px-2.5 py-0.5 text-[11px] text-tp-muted hover:border-tp-fg/40 hover:text-tp-fg"
                href={u.href}
              >
                {u.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
