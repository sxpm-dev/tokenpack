const METRIC_ROWS: Array<{ term: string; body: string }> = [
  {
    term: 'boot · mat · images',
    body: 'Median milliseconds over the selected repeats; the n= cell shows the min–max spread. A wide spread means the median is not settled — run more repeats.',
  },
  {
    term: 'reqs',
    body: 'Requests the path makes for the same app surface. Differing per scenario is the experiment itself: hundreds of per-file requests vs a manifest plus a few chunk range-fetches.',
  },
  {
    term: 'body',
    body: 'Decoded payload bytes actually shipped. Per-file paths ship raw files; bundle paths ship concatenated bundles (slightly more JS); router chunks carry text assets compressed — usually the smallest.',
  },
  {
    term: 'wire',
    body: 'Transfer bytes — headers plus compressed bodies. Warm runs report ~0 because assets come from the browser cache; that is signal, not a bug.',
  },
]

const TRUST_ROWS: Array<{ term: string; body: string }> = [
  {
    term: 'fairness check',
    body: 'Every scenario loads the same app — body should land in the same ballpark across all five cards. If it does, the runs are comparable; only the delivery shape differs.',
  },
  {
    term: 'always trust',
    body: 'reqs (exact by construction) and body (cache- and encoding-independent).',
  },
  {
    term: 'trust per batch',
    body: 'Times are comparable only within one batch — re-run all scenarios together. Numbers drift between sessions with machine load and dev-server state.',
  },
  {
    term: 'wire✻',
    body: 'The dev server makes Chrome hide compressed-body sizes for some load types (fetch-driven loaders are hit hardest; parser-loaded tags often report real sizes). Marked cells collapsed to reqs × ~0.3KB of header estimates — never compare them across scenarios; compare body instead.',
  },
  {
    term: 'publishable numbers',
    body: 'Come from the CLI: static server (true wire bytes), fresh browser context per iteration, optional throttling.',
  },
]

export function MetricsLegend() {
  return (
    <details className="group rounded-md border border-tp-border bg-tp-bg/45">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-block transition-transform group-open:rotate-90">▸</span>
        Reading the numbers — what each cell means and which ones to trust
      </summary>
      <div className="grid gap-4 border-t border-tp-border p-3">
        <LegendGroup rows={METRIC_ROWS} title="Metrics" />
        <LegendGroup rows={TRUST_ROWS} title="Trust rules" />
        <p className="text-[11px] leading-snug text-tp-soft">
          Runs on this page use your real network with no throttling. For throttled medians
          (fast-4g, slow-3g) and CDN origins, run{' '}
          <code className="rounded border border-tp-border bg-tp-bg px-1 py-px font-mono text-[10px]">
            yarn workspace tokenpack-web bench-app:bench --iters=10 --throttle=fast-4g
          </code>
          .
        </p>
      </div>
    </details>
  )
}

interface LegendGroupProps {
  title: string
  rows: Array<{ term: string; body: string }>
}

function LegendGroup({ title, rows }: LegendGroupProps) {
  return (
    <div className="grid gap-1.5">
      <div className="font-mono text-[9px] tracking-[0.14em] text-tp-soft uppercase">{title}</div>
      <dl className="grid gap-1.5">
        {rows.map(row => (
          <div
            key={row.term}
            className="grid gap-x-3 text-[11px] leading-snug sm:grid-cols-[150px_1fr]"
          >
            <dt className="font-mono text-tp-fg">{row.term}</dt>
            <dd className="text-tp-soft">{row.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
