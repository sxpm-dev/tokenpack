import { RangeFetchTabs } from './RangeFetchTabs'

export function RangeFetchSection() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <article className="grid gap-10">
          <header className="max-w-4xl">
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Range fetch
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              Range-fetch is your lazy load.
            </h2>

            <p className="mt-6 text-[15px] leading-relaxed text-tp-muted">
              Router tokens map paths to byte ranges inside chunk images. Calls like{' '}
              <span className="font-mono text-tp-fg">list()</span>,{' '}
              <span className="font-mono text-tp-fg">json(path)</span>, and{' '}
              <span className="font-mono text-tp-fg">text(path)</span> use HTTP Range headers to
              fetch only the requested file bytes, not the whole bundle.
            </p>
          </header>

          <RangeFetchTabs />
        </article>
      </div>
    </section>
  )
}
