import type { Metadata } from 'next'

import { BenchAppClient } from '@/components/BenchApp/BenchAppClient'
import { LandingNav } from '@/components/LandingNav/LandingNav'
import { BENCH_SIZES, getBenchFixtureStatus } from '@/lib/benchAppFiles'

export const metadata: Metadata = {
  title: 'Bench app',
  description:
    'Compare TokenPack router materialize() against multi-file, single-bundle, and native runtime delivery.',
}

export default async function BenchmarksAppPage() {
  const fixtures = Object.fromEntries(
    await Promise.all(BENCH_SIZES.map(async size => [size, await getBenchFixtureStatus(size)])),
  )

  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <main>
        <section className="border-b border-tp-border">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="mb-4 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Benchmarks / app
            </div>
            <h1 className="max-w-4xl text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] font-medium tracking-[-0.035em]">
              Materialize a running app. Compare the delivery paths.
            </h1>
            <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed text-tp-muted">
              The same synthetic app loads through five paths: TokenPack router{' '}
              <code className="font-mono text-tp-fg">materialize()</code>, many browser-native
              files, single bundles, and two production-style runtime baselines. Use the preview
              button inside the frame to trigger the lazy 3D scene.
            </p>
          </div>
        </section>

        <section className="border-b border-tp-border">
          <div className="mx-auto max-w-6xl px-6 py-10 lg:py-12">
            <BenchAppClient fixtures={fixtures} />
          </div>
        </section>
      </main>
    </div>
  )
}
