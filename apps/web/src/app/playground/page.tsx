import Link from 'next/link'

import { EncodeDecodePanel } from '@/components/Playground/EncodeDecodePanel'

export default function PlaygroundPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
          <span className="inline-flex items-center gap-2 rounded-full border border-tp-border bg-tp-elev px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-tp-accent" />
            Live in your browser
          </span>
          <span>§ Playground / encode · decode</span>
        </div>
        <h1 className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-medium tracking-[-0.03em]">
          Type a payload.{' '}
          <span className="italic-display text-tp-muted">Get an Image Token. Decode it back.</span>
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-tp-muted">
          Everything runs in the browser via{' '}
          <code className="font-mono text-tp-fg">@tokenpack/browser</code>. The encode result is a
          real Image Token you can drag into another tab; the decode panel reads it back and shows
          the recovered bytes. No server round-trip, no data leaves your tab.
        </p>
        <nav className="flex gap-2 text-[13px]">
          <Link
            className="rounded-full bg-tp-accent px-3 py-1.5 font-medium text-tp-accent-fg"
            href="/playground"
          >
            Single token
          </Link>
          <Link
            className="rounded-full border border-tp-border bg-tp-elev px-3 py-1.5 text-tp-fg hover:border-tp-fg/40"
            href="/playground/router"
          >
            Router token →
          </Link>
        </nav>
      </header>

      <EncodeDecodePanel />
    </main>
  )
}
