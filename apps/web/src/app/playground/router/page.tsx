import Link from 'next/link'

import { RouterPlanner } from '@/components/Playground/RouterPlanner'

export default function RouterPlaygroundPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
          <span className="inline-flex items-center gap-2 rounded-full border border-tp-border bg-tp-elev px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-tp-accent" />
            Interactive · visualization
          </span>
          <span>§ Playground / router</span>
        </div>
        <h1 className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-medium tracking-[-0.03em]">
          One manifest.{' '}
          <span className="italic-display text-tp-muted">Many chunks. HTTP Range.</span>
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-tp-muted">
          Adjust the file bundle below. The planner applies the same constants the real router
          encoder uses — 1 MB target chunks, 32 KB tiny-file clustering, 512 KB split threshold —
          and shows you the resulting chunk layout. Click any file to see the byte-range request a
          browser would issue to fetch it.
        </p>
        <nav className="flex gap-2 text-[13px]">
          <Link
            className="rounded-full border border-tp-border bg-tp-elev px-3 py-1.5 text-tp-fg hover:border-tp-fg/40"
            href="/playground"
          >
            ← Single token
          </Link>
          <Link
            className="rounded-full bg-tp-accent px-3 py-1.5 font-medium text-tp-accent-fg"
            href="/playground/router"
          >
            Router token
          </Link>
          <Link
            className="ml-1 rounded-full border border-tp-border bg-tp-elev px-3 py-1.5 text-tp-muted hover:text-tp-fg"
            href="/router-tokens"
          >
            Deep dive →
          </Link>
        </nav>
      </header>

      <RouterPlanner />
    </main>
  )
}
