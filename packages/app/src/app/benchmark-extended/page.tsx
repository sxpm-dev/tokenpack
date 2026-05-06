'use client'

import { Card } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import type { ArchiveTimeEntry } from '@/app/api/benchmark/archives/route'
import type { ExtBenchRow } from '@/lib/bench-types'

import { ArchiveBaselines } from './components/ArchiveBaselines'
import { ResultsTable } from './components/ResultsTable'
import { SourceFilter } from './components/SourceFilter'
import { SOURCE_TO_ARCHIVE_NAME, SOURCES } from './constants'
import { sortRows } from './utils'

export default function BenchmarkExtendedPage() {
  const [source, setSource] = useState<string>('react-dom-dev')
  const [allRows, setAllRows] = useState<ExtBenchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchErr, setFetchErr] = useState<string | null>(null)
  const [sort, setSort] = useState<SortDescriptor>({ column: 'ratio', direction: 'ascending' })
  const [archiveRows, setArchiveRows] = useState<ArchiveTimeEntry[]>([])

  useEffect(() => {
    fetch('/api/benchmark/extended')
      .then(r => r.json())
      .then((data: ExtBenchRow[] | { error: string }) => {
        if ('error' in data) {
          setFetchErr(data.error)
          setLoading(false)

          return
        }
        setAllRows(data)
        setLoading(false)
      })
      .catch(e => {
        setFetchErr(String(e))
        setLoading(false)
      })
  }, [])

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
        <h1 className="text-lg font-semibold tracking-tight">Extended Benchmark</h1>
        <p className="mt-0.5 text-xs text-white/40">
          All algorithms × compression modes — encode · decode · ratio · streaming
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
          <p className="text-white/25 text-xs font-mono">Run: yarn tsx benchmark/run-extended.ts</p>
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
