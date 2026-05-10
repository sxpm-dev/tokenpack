'use client'

import { Card } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import type { ExtBenchRow } from '@/lib/bench-types'

import { MetricLegend } from './components/MetricLegend'
import { ResultsTable } from './components/ResultsTable'
import { SourceFilter } from './components/SourceFilter'
import { CONDITION_LABELS, CONDITIONS, SOURCES } from './constants'
import { sortRows } from './utils'

interface ExtendedResponse {
  rows: ExtBenchRow[]
}

// Single state machine for the bench-results fetch: loading / data / error.
// Combining lets us update once per transition instead of cascading setState
// calls inside the effect (which the React rules-of-hooks plugin flags as a
// perf footgun).
type Fetched =
  | { state: 'loading' }
  | { state: 'ready'; rows: ExtBenchRow[] }
  | { state: 'error'; error: string }

export default function BenchmarkExtendedPage() {
  const [source, setSource] = useState<string>('react-dom-client-development')
  const [condition, setCondition] = useState<string>('average')
  const [sort, setSort] = useState<SortDescriptor>({ column: 'speedMs', direction: 'ascending' })
  const [fetched, setFetched] = useState<Fetched>({ state: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch('/api/benchmark/extended')
      .then(r => r.json())
      .then((data: ExtendedResponse | { error: string }) => {
        if (cancelled) return
        if ('error' in data) {
          setFetched({ state: 'error', error: data.error })

          return
        }
        setFetched({
          state: 'ready',
          rows: data.rows,
        })
      })
      .catch(e => {
        if (cancelled) return
        setFetched({ state: 'error', error: String(e) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const loading = fetched.state === 'loading'
  const fetchErr = fetched.state === 'error' ? fetched.error : null
  const allRows = fetched.state === 'ready' ? fetched.rows : []

  const rows = useMemo(
    () => allRows.filter(r => rowSourceId(r) === source && r.condition === condition),
    [allRows, condition, source],
  )

  const availableSources = useMemo(
    () => SOURCES.filter(s => allRows.some(r => rowSourceId(r) === s.id)),
    [allRows],
  )

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort])

  const bestSpeed = useMemo(() => {
    const valid = rows.filter(r => !r.error && (r.speedMs ?? r.roundTripMs) > 0)

    return valid.length ? Math.min(...valid.map(r => r.speedMs ?? r.roundTripMs)) : null
  }, [rows])

  const conditionLabel = CONDITION_LABELS[condition] ?? condition

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Encode / Decode Bench</h1>
        <p className="mt-0.5 text-xs text-white/40">
          TokenPack vs traditional archives — encode · speed · fetch · decode tail · ratio
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40 text-white/30 text-sm font-mono">
          Loading results…
        </div>
      )}

      {!loading && (fetchErr || allRows.length === 0) && (
        <Card className="space-y-2 p-6 text-center" variant="secondary">
          <p className="text-white/40 text-sm">No benchmark results found.</p>
          <p className="text-white/25 text-xs font-mono">Run: yarn benchmark</p>
          {fetchErr && <p className="text-red-400/60 text-xs">{fetchErr}</p>}
        </Card>
      )}

      {!loading && allRows.length > 0 && (
        <>
          <SourceFilter
            condition={condition}
            conditions={CONDITIONS}
            errorRows={rows.filter(r => r.error).length}
            source={source}
            sources={availableSources}
            totalRows={rows.length}
            onConditionChange={setCondition}
            onSourceChange={setSource}
          />

          <MetricLegend />

          <div className="text-[10px] text-white/30 uppercase tracking-widest">
            Speed results — {conditionLabel}
          </div>

          <ResultsTable
            bestSpeed={bestSpeed}
            rows={sortedRows}
            sort={sort}
            onSortChange={setSort}
          />
        </>
      )}
    </div>
  )
}

function rowSourceId(row: Pick<ExtBenchRow, 'source' | 'sourceId'>): string {
  return row.sourceId ?? row.source.replace(/__chunks-\d+__chunk-\d+$/, '')
}
