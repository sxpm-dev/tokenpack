'use client'

import { useEffect, useState } from 'react'
import { Button, Surface } from '@heroui/react'
import { CaretUpIcon } from '@phosphor-icons/react'
import { BenchmarkFilters } from './components/BenchmarkFilters'
import { BestComparison } from './components/BestComparison'
import { BreakdownChart } from './components/BreakdownChart'
import { RawDataTable } from './components/RawDataTable'
import { SectionTitle } from './components/SectionTitle'
import { SummaryTable } from './components/SummaryTable'
import { CONDITION_LABELS, SOURCES, SOURCE_LABELS } from './constants'
import type { BenchRow } from './types'

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [condition, setCondition] = useState('average')
  const [source, setSource] = useState('avg')
  const [rawOpen, setRawOpen] = useState(false)

  useEffect(() => {
    fetch('/api/benchmark')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(e => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="p-10">
        <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 font-mono text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-white/30 text-sm animate-pulse">Loading results…</div>
      </div>
    )
  }

  const srcLabel = source === 'avg' ? 'all sources (avg)' : SOURCE_LABELS[source] ?? source
  const condLabel = CONDITION_LABELS[condition] ?? condition
  const allSources = ['avg', ...SOURCES]

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Benchmark Results</h1>
        <p className="mt-0.5 text-xs text-white/40">
          Token vs zip vs tar.gz vs brotli · {data.length} measurements
        </p>
      </div>

      <BenchmarkFilters
        condition={condition}
        onConditionChange={setCondition}
        source={source}
        onSourceChange={setSource}
        availableSources={allSources}
      />

      <SectionTitle>{condLabel} · {srcLabel}</SectionTitle>
      <SummaryTable data={data} condition={condition} source={source} />

      <SectionTitle>Best case — {condLabel} · {srcLabel}</SectionTitle>
      <BestComparison data={data} condition={condition} source={source} />

      <SectionTitle>Fetch vs decode — {condLabel} · {srcLabel}</SectionTitle>
      <Surface className="rounded-2xl p-3.5">
        <BreakdownChart data={data} condition={condition} source={source} />
      </Surface>

      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={() => setRawOpen(o => !o)}
          aria-label={rawOpen ? 'Collapse' : 'Expand'}
        >
          <CaretUpIcon
            size={14}
            className={`transition-transform duration-150 ${rawOpen ? '' : 'rotate-180'}`}
          />
        </Button>
        <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
          Raw data — {condLabel} · {srcLabel}
        </span>
      </div>
      {rawOpen && <RawDataTable data={data} condition={condition} source={source} />}
    </div>
  )
}
