import { FlaskIcon } from '@phosphor-icons/react/dist/ssr'

import { SCENARIOS } from '@/scenarios/registry'

import { ScenarioCard } from './components/ScenarioCard'

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

      {SCENARIOS.length === 0 ? (
        <p className="text-sm text-white/40">
          No scenarios registered yet. Add one to <code>src/scenarios/registry.ts</code> and run
          <code className="ml-1">yarn generate:fixtures</code>.
        </p>
      ) : (
        <div className="space-y-3">
          {SCENARIOS.map(s => (
            <ScenarioCard key={s.id} description={s.description} id={s.id} name={s.name} />
          ))}
        </div>
      )}

      <p className="mt-8 text-[11px] text-white/25 leading-relaxed">
        Each scenario runs N iterations and reports median / p95 / min / max for every variant. See
        <code className="ml-1 text-white/40">IDEAS.md</code> at the repo root for the architecture +
        roadmap.
      </p>
    </main>
  )
}
