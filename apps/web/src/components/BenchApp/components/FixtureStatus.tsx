import type { BenchFixtureStatus } from '@/lib/benchAppFiles'

import type { LoadScope } from '../benchConfig'
import { Metric } from './Metric'

interface FixtureStatusProps {
  fixture: BenchFixtureStatus
  scope: LoadScope
}

export function FixtureStatus({ fixture, scope }: FixtureStatusProps) {
  const counts = fixture.counts
  const visibleMissing = fixture.missing.slice(0, 8)
  const eagerRatio = scope === 'random' ? 0.5 : 1
  const scopedModules = counts ? Math.ceil(counts.modules * eagerRatio) : 0
  const scopedStyles = counts ? Math.ceil(counts.styles * eagerRatio) : 0
  const scopedImages = counts ? Math.ceil(counts.images * eagerRatio) : 0
  const totalJs = counts ? scopedModules + counts.lazyModules : 0
  const totalCss = counts ? scopedStyles + counts.lazyStyles : 0
  const totalImages = counts ? scopedImages + counts.lazyImages : 0
  const totalFiles = counts ? totalJs + totalCss + totalImages : 0
  const scopeLabel = scope === 'random' ? '50% random scope' : 'full app scope'

  return (
    <section className="rounded-lg border border-tp-border bg-tp-bg p-4 lg:p-5">
      {counts && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-tp-border bg-tp-border sm:grid-cols-5">
          <Metric label="Total files" note={`${scopeLabel} + lazy preview`} value={totalFiles} />
          <Metric
            label="JS modules"
            note={`${scopedModules} boot / ${counts.lazyModules} lazy`}
            value={totalJs}
          />
          <Metric
            label="CSS files"
            note={`${scopedStyles} boot / ${counts.lazyStyles} lazy`}
            value={totalCss}
          />
          <Metric
            label="Image assets"
            note={`${scopedImages} boot / ${counts.lazyImages} lazy`}
            value={totalImages}
          />
          <Metric
            label="Router chunks"
            note="Chunk images used by materialize()"
            value={counts.routerChunks}
          />
        </div>
      )}
      {fixture.missing.length > 0 && (
        <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-[11px] leading-relaxed text-red-200">
          Missing: {visibleMissing.join(', ')}
          {fixture.missing.length > visibleMissing.length
            ? `, +${fixture.missing.length - visibleMissing.length} more`
            : ''}
        </div>
      )}
    </section>
  )
}
