import { ArrowRightIcon, FlaskIcon } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

interface Scenario {
  href: string
  label: string
  description: string
  status: 'live' | 'wip'
}

const SCENARIOS: Scenario[] = [
  {
    href: '/scenarios/inline-data-uri',
    label: 'Inline data URI',
    description:
      'Compares inline base64 raw vs base64-brotli-decompressed-in-JS vs TokenPack PNG data URI for embedded payloads.',
    status: 'live',
  },
  {
    href: '/scenarios/sw-cache',
    label: 'Service Worker / Cache API',
    description:
      'Repeat-visit perf — Cache API storing TokenPack PNG vs brotli-encoded blob vs raw JSON.',
    status: 'live',
  },
  {
    href: '/scenarios/component-bundle',
    label: 'Component as Token',
    description:
      'React component (code + CSS + assets) packed as a single PNG, mounted via import(blob:). Compared with sync + dynamic imports.',
    status: 'live',
  },
  {
    href: '/scenarios/ssr-streaming',
    label: 'SSR streaming',
    description:
      'SSR-shipped TokenPack <img> data URI vs SSR-shipped JSON in a hidden DOM element. End-to-end "hydration → JS object".',
    status: 'live',
  },
  {
    href: '/scenarios/diff-versioning',
    label: 'Diff-versioning prototype',
    description:
      'Boot v1.0.0 baseline → apply v1.0.1 diff → apply v1.0.2 diff. Live demo with wire-bytes savings panel.',
    status: 'live',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 flex items-center gap-3">
        <FlaskIcon className="text-accent" size={32} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TokenPack Runtime Experiments</h1>
          <p className="mt-0.5 text-sm text-white/40">
            Side-by-side perf scenarios — TokenPack vs traditional browser-delivery baselines.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {SCENARIOS.map(s => (
          <Link
            key={s.href}
            className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
            href={s.href}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium text-white">{s.label}</h2>
                  {s.status === 'wip' && (
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                      WIP
                    </span>
                  )}
                  {s.status === 'live' && (
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                      live
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/45 leading-relaxed">{s.description}</p>
              </div>
              <ArrowRightIcon className="text-white/30 mt-1" size={18} />
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-[11px] text-white/25 leading-relaxed">
        Each scenario runs N iterations and reports median / p95 / min / max for every variant. CSV
        export available. See <code className="text-white/40">IDEAS.md</code> at the repo root for
        the architecture + roadmap.
      </p>
    </main>
  )
}
