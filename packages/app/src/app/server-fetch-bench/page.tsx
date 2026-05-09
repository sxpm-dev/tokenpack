'use client'

import { Button, Surface } from '@heroui/react'
import { CaretUpIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'

import { BenchmarkFilters } from './components/BenchmarkFilters'
import { BestComparison } from './components/BestComparison'
import { BreakdownChart } from './components/BreakdownChart'
import { Legend } from './components/Legend'
import { RawDataTable } from './components/RawDataTable'
import { ScenarioConfigTable } from './components/ScenarioConfigTable'
import { SectionTitle } from './components/SectionTitle'
import { SummaryTable } from './components/SummaryTable'
import { CONDITION_LABELS, SOURCE_LABELS, SOURCES } from './constants'
import type { BenchRow } from './types'

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [condition, setCondition] = useState('average')
  const [source, setSource] = useState('avg')
  const [aboutOpen, setAboutOpen] = useState(false)
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

  // All hooks before any early return — react-hooks/rules-of-hooks.
  const scenarioIds = useMemo(() => data.map(d => d.scenario), [data])

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

  const srcLabel = source === 'avg' ? 'all sources (avg)' : (SOURCE_LABELS[source] ?? source)
  const condLabel = CONDITION_LABELS[condition] ?? condition
  const allSources = ['avg', ...SOURCES]

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Server Fetch Bench</h1>
        <p className="mt-0.5 text-xs text-white/40">
          Token vs zip vs tar.gz vs brotli · {data.length} measurements
        </p>
      </div>

      <BenchmarkFilters
        availableSources={allSources}
        condition={condition}
        source={source}
        onConditionChange={setCondition}
        onSourceChange={setSource}
      />

      <SectionTitle>
        {condLabel} · {srcLabel}
      </SectionTitle>
      <SummaryTable condition={condition} data={data} source={source} />

      <SectionTitle>
        Best case — {condLabel} · {srcLabel}
      </SectionTitle>
      <BestComparison condition={condition} data={data} source={source} />

      {/* Legend + token configs collapsed by default — they're reference material,
          most readers want results first. Same caret-toggle pattern as Raw data. */}
      <CollapsibleSection
        label="Legend & token configs"
        open={aboutOpen}
        onToggle={() => setAboutOpen(o => !o)}
      />
      {aboutOpen && (
        <>
          <Legend />
          <ScenarioConfigTable scenarioIds={scenarioIds} />
        </>
      )}

      <SectionTitle>
        Fetch vs decode — {condLabel} · {srcLabel}
      </SectionTitle>
      <Surface className="rounded-2xl p-3.5">
        <BreakdownChart condition={condition} data={data} source={source} />
      </Surface>

      <CollapsibleSection
        label={`Raw data — ${condLabel} · ${srcLabel}`}
        open={rawOpen}
        onToggle={() => setRawOpen(o => !o)}
      />
      {rawOpen && <RawDataTable condition={condition} data={data} source={source} />}
    </div>
  )
}

function CollapsibleSection({
  label,
  open,
  onToggle,
}: {
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        aria-label={open ? 'Collapse' : 'Expand'}
        size="sm"
        variant="ghost"
        onPress={onToggle}
      >
        <CaretUpIcon
          className={`transition-transform duration-150 ${open ? '' : 'rotate-180'}`}
          size={14}
        />
      </Button>
      <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">{label}</span>
    </div>
  )
}
