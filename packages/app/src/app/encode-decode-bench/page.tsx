'use client'

import { Button, Card } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import type { ArchiveTimeEntry } from '@/app/api/benchmark/archives/route'
import type { ExtBenchRow } from '@/lib/bench-types'

import { ArchiveBaselines } from './components/ArchiveBaselines'
import { ResultsTable } from './components/ResultsTable'
import { SourceFilter } from './components/SourceFilter'
import { SOURCE_TO_ARCHIVE_NAME, SOURCES } from './constants'
import { sortRows } from './utils'

interface ExtendedResponse {
  rows: ExtBenchRow[]
  totalRows: number
  visibleRows: number
  hiddenRows: number
  threshold: number
}

// Single state machine for the bench-results fetch: loading / data / error.
// Combining lets us update once per transition instead of cascading setState
// calls inside the effect (which the React rules-of-hooks plugin flags as a
// perf footgun).
type Fetched =
  | { state: 'loading' }
  | { state: 'ready'; rows: ExtBenchRow[]; hiddenCount: number; threshold: number }
  | { state: 'error'; error: string }

export default function BenchmarkExtendedPage() {
  const [source, setSource] = useState<string>('react-dom-dev')
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState<SortDescriptor>({ column: 'ratio', direction: 'ascending' })
  const [archiveRows, setArchiveRows] = useState<ArchiveTimeEntry[]>([])
  const [fetched, setFetched] = useState<Fetched>({ state: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch(`/api/benchmark/extended${showAll ? '?all=1' : ''}`)
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
          hiddenCount: data.hiddenRows,
          threshold: data.threshold,
        })
      })
      .catch(e => {
        if (cancelled) return
        setFetched({ state: 'error', error: String(e) })
      })

    return () => {
      cancelled = true
    }
  }, [showAll])

  const loading = fetched.state === 'loading'
  const fetchErr = fetched.state === 'error' ? fetched.error : null
  const allRows = fetched.state === 'ready' ? fetched.rows : []
  const hiddenCount = fetched.state === 'ready' ? fetched.hiddenCount : 0
  const threshold = fetched.state === 'ready' ? fetched.threshold : 400

  useEffect(() => {
    fetch('/api/benchmark/archives')
      .then(r => r.json())
      .then((data: ArchiveTimeEntry[] | { error: string }) => {
        if (!('error' in data)) setArchiveRows(data)
      })
      .catch(() => {})
  }, [])

  const rows = useMemo(() => allRows.filter(r => r.source === source), [allRows, source])

  const availableSources = useMemo(
    () => SOURCES.filter(s => allRows.some(r => r.source === s.id)),
    [allRows],
  )

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort])

  const bestRatio = useMemo(() => {
    const valid = rows.filter(r => !r.error && r.ratio > 0)

    return valid.length ? Math.min(...valid.map(r => r.ratio)) : null
  }, [rows])

  const archiveBaselines = useMemo(() => {
    const archiveName = SOURCE_TO_ARCHIVE_NAME[source]

    return archiveName ? archiveRows.filter(r => r.source === archiveName) : []
  }, [archiveRows, source])

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Encode / Decode Bench</h1>
        <p className="mt-0.5 text-xs text-white/40">
          Algorithms × compression modes — encode · decode · ratio · streaming
          {!showAll && ` · filtered to encode AND decode < ${threshold}ms`}
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
          <p className="text-white/25 text-xs font-mono">Run: yarn benchmark:run:extended</p>
          {fetchErr && <p className="text-red-400/60 text-xs">{fetchErr}</p>}
        </Card>
      )}

      {!loading && allRows.length > 0 && (
        <>
          <SourceFilter
            errorRows={rows.filter(r => r.error).length}
            source={source}
            sources={availableSources}
            totalRows={rows.length}
            onSourceChange={setSource}
          />

          {hiddenCount > 0 && !showAll && (
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/50">
              <span>
                {hiddenCount} algorithm{hiddenCount === 1 ? '' : 's'} hidden — encode or decode &gt;{' '}
                {threshold}ms
              </span>
              <Button size="sm" variant="ghost" onPress={() => setShowAll(true)}>
                Show all
              </Button>
            </div>
          )}

          {showAll && (
            <div className="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-xs text-amber-200/80">
              <span>Showing all algorithms (including slow ones).</span>
              <Button size="sm" variant="ghost" onPress={() => setShowAll(false)}>
                Hide slow
              </Button>
            </div>
          )}

          <ArchiveBaselines entries={archiveBaselines} />

          <ResultsTable
            bestRatio={bestRatio}
            rows={sortedRows}
            sort={sort}
            onSortChange={setSort}
          />
        </>
      )}
    </div>
  )
}
