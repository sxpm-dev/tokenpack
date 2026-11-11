'use client'

import { Surface } from '@heroui/react'
import { CheckCircleIcon } from '@phosphor-icons/react'
import { Fragment, useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import { AlgoBadges } from '@/components/AlgoBadges'
import { classifyMeta } from '@/lib/algo-catalog'
import { usePlaygroundAlgorithms } from '@/lib/use-playground-algorithms'

import { buildScenarioConfig } from '../constants'
import type { BenchRow, SummaryRow, SummarySortKey } from '../types'
import { avg, fmtBytes, fmtMs, getRows } from '../utils'

interface SummaryTableProps {
  data: BenchRow[]
  condition: string
  source: string
}

const ARCHIVE_NAMES = new Set(['zip', 'gzip', 'deflate', 'brotli-11', 'brotli-6'])

function algoNameFromScenario(scenario: string): string {
  return scenario.replace(/-c\d+$/, '')
}

export function SummaryTable({ data, condition, source }: SummaryTableProps) {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'total', direction: 'ascending' })
  const catalog = usePlaygroundAlgorithms()

  const { scenarios: SCENARIOS, colors: COLORS } = useMemo(
    () => buildScenarioConfig(data.map(d => d.scenario)),
    [data],
  )

  const rawRows = useMemo<SummaryRow[]>(
    () =>
      SCENARIOS.flatMap<SummaryRow>(s => {
        const r = getRows(data, condition, source).filter(d => d.scenario === s)

        if (!r.length) return []
        const first = r[0]

        return [
          {
            scenario: s,
            ttfb: avg(r, 'ttfb'),
            total: avg(r, 'totalMs'),
            firstByte: avg(r, 'firstByteMs'),
            decode: avg(r, 'decodeMs'),
            transfer: avg(r, 'transferBytes'),
            decoded: avg(r, 'decodedBytes'),
            throughput: avg(r, 'throughputMBps'),
            pathTaken: first.pathTaken,
            totalMsStddev: first.totalMsStddev,
          },
        ]
      }),
    [SCENARIOS, data, condition, source],
  )

  const minTotal = useMemo(
    () => (rawRows.length ? Math.min(...rawRows.map(r => r.total)) : 0),
    [rawRows],
  )

  const sorted = useMemo(() => {
    const key = (sort.column ?? 'total') as SummarySortKey
    const asc = sort.direction === 'ascending'

    return [...rawRows].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))

      return asc ? cmp : -cmp
    })
  }, [rawRows, sort])
  const sections = useMemo(
    () => groupRows(sorted, row => rowMeta(row, catalog).section),
    [catalog, sorted],
  )

  return (
    <Surface className="rounded-2xl p-3.5 overflow-x-auto">
      <table className="w-full min-w-[980px] text-xs">
        <thead>
          <tr className="border-b border-tp-border text-[10px] uppercase tracking-widest text-tp-muted">
            <th className="px-2 py-2 text-left font-normal">Kind</th>
            <SortableHeader label="Variant" sort={sort} sortKey="scenario" onSortChange={setSort} />
            <SortableHeader
              numeric
              label="TTFB"
              sort={sort}
              sortKey="ttfb"
              onSortChange={setSort}
            />
            <SortableHeader
              numeric
              label="1st byte"
              sort={sort}
              sortKey="firstByte"
              onSortChange={setSort}
            />
            <SortableHeader
              numeric
              label="Total"
              sort={sort}
              sortKey="total"
              onSortChange={setSort}
            />
            <SortableHeader
              numeric
              label="Decode"
              sort={sort}
              sortKey="decode"
              onSortChange={setSort}
            />
            <SortableHeader
              numeric
              label="Transfer"
              sort={sort}
              sortKey="transfer"
              onSortChange={setSort}
            />
            <SortableHeader
              numeric
              label="MB/s"
              sort={sort}
              sortKey="throughput"
              onSortChange={setSort}
            />
          </tr>
        </thead>
        <tbody>
          {sections.map(section => (
            <Fragment key={section.title}>
              <tr className="border-b border-tp-border">
                <td
                  className="px-2 pb-1 pt-4 text-[10px] uppercase tracking-widest text-tp-muted"
                  colSpan={8}
                >
                  {section.title}
                </td>
              </tr>
              {section.rows.map(r => {
                const isBest = r.total === minTotal
                const meta = rowMeta(r, catalog)
                const stddevText =
                  r.totalMsStddev !== undefined && r.totalMsStddev > 0
                    ? `±${r.totalMsStddev.toFixed(0)}ms`
                    : ''
                const streamClass = meta.isStreaming
                  ? 'border-l-2 border-purple-500/40 bg-purple-500/[0.025]'
                  : ''

                return (
                  <tr key={r.scenario} className={`border-b border-tp-border ${streamClass}`}>
                    <td className="px-2 py-3 text-tp-muted">{meta.kind}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: COLORS[r.scenario] }}
                        />
                        <span className={meta.isToken ? 'text-tp-fg' : 'text-tp-fg'}>
                          {r.scenario}
                        </span>
                        {meta.isToken && <AlgoBadges hideBatch hideEnv algoName={meta.algoName} />}
                        {meta.isToken && <TableBadge tone="blue">TK</TableBadge>}
                        {meta.isStreaming && <TableBadge tone="purple">STREAM</TableBadge>}
                        {isBest && <TableBadge tone="green">BEST</TableBadge>}
                        {isBest && (
                          <CheckCircleIcon className="text-green-400/75" size={12} weight="fill" />
                        )}
                      </div>
                    </td>
                    <NumberCell>{fmtMs(r.ttfb)}</NumberCell>
                    <NumberCell className="text-indigo-300/75">{fmtMs(r.firstByte)}</NumberCell>
                    <NumberCell strong className={isBest ? 'text-green-400' : 'text-tp-fg'}>
                      {fmtMs(r.total)}
                      {stddevText && (
                        <span className="ml-1 text-[10px] font-normal text-tp-muted">
                          {stddevText}
                        </span>
                      )}
                    </NumberCell>
                    <NumberCell>{fmtMs(r.decode)}</NumberCell>
                    <td className="px-2 py-3 text-right tabular-nums text-tp-fg">
                      <div className="flex flex-col leading-tight">
                        <span>{fmtBytes(r.transfer)}</span>
                        <span className="text-[10px] text-tp-muted">{formatTransferRatio(r)}</span>
                      </div>
                    </td>
                    <NumberCell>{r.throughput.toFixed(1)}</NumberCell>
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Surface>
  )
}

function rowMeta(row: SummaryRow, catalog: ReturnType<typeof usePlaygroundAlgorithms>) {
  const isArchive = ARCHIVE_NAMES.has(row.scenario)
  const isToken = !isArchive
  const algoName = isToken ? algoNameFromScenario(row.scenario) : ''
  const classification = classifyMeta(catalog.find(algo => algo.name === algoName))
  const isStreaming = isToken && (row.pathTaken === 'stream' || classification.stream)

  return {
    algoName,
    isStreaming,
    isToken,
    kind: isToken ? 'token' : 'archive',
    section: isToken
      ? isStreaming
        ? 'TokenPack stream'
        : 'TokenPack batch'
      : 'Traditional archives',
  }
}

function groupRows<T>(
  rows: T[],
  sectionFor: (row: T) => string,
): Array<{ title: string; rows: T[] }> {
  const order = ['TokenPack batch', 'TokenPack stream', 'Traditional archives']

  return order
    .map(title => ({ title, rows: rows.filter(row => sectionFor(row) === title) }))
    .filter(section => section.rows.length > 0)
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  numeric,
}: {
  label: string
  sortKey: SummarySortKey
  sort: SortDescriptor
  onSortChange: (sort: SortDescriptor) => void
  numeric?: boolean
}) {
  const active = sort.column === sortKey
  const nextDirection = active && sort.direction === 'ascending' ? 'descending' : 'ascending'

  return (
    <th className={`px-2 py-2 font-normal ${numeric ? 'text-right' : 'text-left'}`}>
      <button
        className={`inline-flex items-center gap-1 ${numeric ? 'justify-end' : 'justify-start'} ${
          active ? 'text-tp-muted' : 'text-tp-muted hover:text-tp-fg'
        }`}
        type="button"
        onClick={() => onSortChange({ column: sortKey, direction: nextDirection })}
      >
        {label}
        {active && <span>{sort.direction === 'ascending' ? '^' : 'v'}</span>}
      </button>
    </th>
  )
}

function NumberCell({
  children,
  strong,
  className = 'text-tp-fg',
}: {
  children: React.ReactNode
  strong?: boolean
  className?: string
}) {
  return (
    <td className={`px-2 py-3 text-right tabular-nums ${strong ? 'font-medium' : ''} ${className}`}>
      {children}
    </td>
  )
}

function TableBadge({ children, tone }: { children: string; tone: 'blue' | 'green' | 'purple' }) {
  const toneClass = {
    blue: 'bg-blue-500/15 text-blue-300',
    green: 'bg-green-500/15 text-green-300',
    purple: 'bg-purple-500/15 text-purple-300',
  }[tone]

  return (
    <span className={`rounded px-1 py-0.5 text-[9px] uppercase tracking-widest ${toneClass}`}>
      {children}
    </span>
  )
}

function formatTransferRatio(row: SummaryRow): string {
  if (row.decoded <= 0 || row.transfer <= 0) return '-'

  const pct = Math.round((row.transfer / row.decoded) * 100)

  return `${pct}% of source`
}
