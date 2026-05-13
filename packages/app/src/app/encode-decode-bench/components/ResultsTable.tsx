'use client'

import { Surface } from '@heroui/react'
import { Fragment } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import { AlgoBadges } from '@/components/AlgoBadges'
import type { ExtBenchRow } from '@/lib/bench-types'

import { fmtBytes, fmtMs } from '../utils'

interface ResultsTableProps {
  rows: ExtBenchRow[]
  sort: SortDescriptor
  onSortChange: (sort: SortDescriptor) => void
  bestSpeed: number | null
}

export function ResultsTable({ rows, sort, onSortChange, bestSpeed }: ResultsTableProps) {
  const sections = groupRows(rows)

  return (
    <Surface className="rounded-2xl p-3.5 overflow-x-auto">
      <table className="w-full min-w-[980px] text-xs">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
            <SortableHeader label="Kind" sort={sort} sortKey="kind" onSortChange={onSortChange} />
            <SortableHeader
              align="left"
              label="Format / Algo"
              sort={sort}
              sortKey="codecName"
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="Surface"
              sort={sort}
              sortKey="surfaceId"
              onSortChange={onSortChange}
            />
            <SortableHeader
              label="Codec"
              sort={sort}
              sortKey="compressorId"
              onSortChange={onSortChange}
            />
            <th className="px-2 py-2 text-left font-normal">Path</th>
            <SortableHeader
              numeric
              label="Encode"
              sort={sort}
              sortKey="encodeMs"
              onSortChange={onSortChange}
            />
            <SortableHeader
              numeric
              label="Speed"
              sort={sort}
              sortKey="speedMs"
              onSortChange={onSortChange}
            />
            <SortableHeader
              numeric
              label="Fetch"
              sort={sort}
              sortKey="fetchMs"
              onSortChange={onSortChange}
            />
            <SortableHeader
              numeric
              label="Decode tail"
              sort={sort}
              sortKey="decodeTailMs"
              onSortChange={onSortChange}
            />
            <SortableHeader
              numeric
              label="Size"
              sort={sort}
              sortKey="tokenBytes"
              onSortChange={onSortChange}
            />
            <SortableHeader
              numeric
              label="Ratio"
              sort={sort}
              sortKey="ratio"
              onSortChange={onSortChange}
            />
          </tr>
        </thead>
        <tbody>
          {sections.map(section => (
            <Fragment key={section.title}>
              <tr className="border-b border-white/5">
                <td
                  className="px-2 pb-1 pt-4 text-[10px] uppercase tracking-widest text-white/30"
                  colSpan={11}
                >
                  {section.title}
                </td>
              </tr>
              {section.rows.map((row, i) => {
                const speedMs = row.speedMs ?? row.roundTripMs
                const isBest = !row.error && speedMs > 0 && speedMs === bestSpeed
                const streamingClass =
                  row.pathTaken === 'stream'
                    ? 'border-l-2 border-purple-500/40 bg-purple-500/[0.025]'
                    : ''

                return (
                  <tr
                    key={`${section.title}-${row.codecName}-${row.source}-${row.condition ?? 'codec'}-${row.channels ?? i}-${i}`}
                    className={`border-b border-white/5 ${row.error ? 'opacity-60' : ''} ${streamingClass}`}
                  >
                    <td className="px-2 py-3 text-white/45">{row.kind ?? 'token'}</td>
                    <td className="px-2 py-3">
                      <AlgoName isBest={isBest} row={row} />
                    </td>
                    <td className="px-2 py-3 text-white/50">{row.surfaceId ?? '-'}</td>
                    <td className="px-2 py-3 text-white/50">
                      {row.compressorId ?? row.outerCompression}
                    </td>
                    <td className="px-2 py-3">
                      <PathBadge pathTaken={row.pathTaken} />
                    </td>
                    {row.error ? (
                      <ErrorCells error={row.error} />
                    ) : (
                      <>
                        <NumberCell>{fmtMs(row.encodeMs)}</NumberCell>
                        <NumberCell strong className={isBest ? 'text-green-400' : 'text-white/85'}>
                          {fmtMs(speedMs)}
                        </NumberCell>
                        <NumberCell>{fmtMs(row.fetchMs ?? 0)}</NumberCell>
                        <NumberCell>{fmtMs(row.decodeTailMs ?? row.decodeMs)}</NumberCell>
                        <NumberCell>{fmtBytes(row.tokenBytes)}</NumberCell>
                        <NumberCell>{Math.round(row.ratio * 100)}%</NumberCell>
                      </>
                    )}
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

function groupRows(rows: ExtBenchRow[]): Array<{ title: string; rows: ExtBenchRow[] }> {
  const groups = [
    {
      title: 'TokenPack batch',
      rows: rows.filter(row => (row.kind ?? 'token') !== 'archive' && row.pathTaken !== 'stream'),
    },
    {
      title: 'TokenPack stream',
      rows: rows.filter(row => (row.kind ?? 'token') !== 'archive' && row.pathTaken === 'stream'),
    },
    {
      title: 'Traditional archives',
      rows: rows.filter(row => row.kind === 'archive'),
    },
  ]

  return groups.filter(group => group.rows.length > 0)
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  numeric,
}: {
  label: string
  sortKey: keyof ExtBenchRow
  sort: SortDescriptor
  onSortChange: (sort: SortDescriptor) => void
  align?: 'left' | 'right'
  numeric?: boolean
}) {
  const active = sort.column === sortKey
  const nextDirection = active && sort.direction === 'ascending' ? 'descending' : 'ascending'

  return (
    <th className={`px-2 py-2 font-normal ${numeric ? 'text-right' : 'text-left'}`}>
      <button
        className={`inline-flex items-center gap-1 ${numeric ? 'justify-end' : 'justify-start'} ${
          active ? 'text-white/60' : 'text-white/40 hover:text-white/65'
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

function AlgoName({ row, isBest }: { row: ExtBenchRow; isBest: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={row.error ? 'text-white/55' : 'text-white/85'}>{row.codecName}</span>
      {row.kind !== 'archive' && row.channels && (
        <span className="text-[10px] text-white/30">c{row.channels}</span>
      )}
      {row.kind !== 'archive' && <AlgoBadges hideBatch hideEnv algoName={row.codecName} />}
      {isBest && (
        <span className="rounded bg-green-500/15 px-1 py-0.5 text-[9px] uppercase tracking-widest text-green-300">
          best
        </span>
      )}
    </span>
  )
}

function ErrorCells({ error }: { error: string }) {
  const isTimeout = error.startsWith('timeout after')

  return (
    <td className="px-2 py-3 text-left" colSpan={6}>
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] ${
          isTimeout
            ? 'border border-amber-400/30 text-amber-300/85'
            : 'border border-red-400/30 text-red-300/85'
        }`}
        title={error}
      >
        {isTimeout ? 'slow' : 'error'}
      </span>
    </td>
  )
}

function NumberCell({
  children,
  strong,
  className = 'text-white/70',
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

function PathBadge({ pathTaken }: { pathTaken?: 'stream' | 'batch' }) {
  return pathTaken === 'stream' ? (
    <span className="inline-flex rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-purple-300">
      stream
    </span>
  ) : (
    <span className="inline-flex rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/45">
      batch
    </span>
  )
}
