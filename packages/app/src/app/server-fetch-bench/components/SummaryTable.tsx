'use client'

import { Table } from '@heroui/react'
import { CheckCircleIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import { AlgoBadges } from '@/components/AlgoBadges'
import { classify } from '@/lib/algo-catalog'

import { buildScenarioConfig } from '../constants'
import type { BenchRow, SummaryRow, SummarySortKey } from '../types'
import { avg, fmtBytes, fmtMs, getRows } from '../utils'
import { ColHeader } from './ColHeader'

interface SummaryTableProps {
  data: BenchRow[]
  condition: string
  source: string
}

const ARCHIVE_NAMES = new Set(['zip', 'tar.gz', 'brotli-11', 'brotli-6'])

/** Strip the `-c<n>` suffix to recover the algo name registered in the
 *  catalog. Used to look up classification for badge rendering. */
function algoNameFromScenario(scenario: string): string {
  return scenario.replace(/-c\d+$/, '')
}

export function SummaryTable({ data, condition, source }: SummaryTableProps) {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'total', direction: 'ascending' })

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

  return (
    <Table className="overflow-x-auto">
      <Table.Content
        aria-label="Benchmark summary"
        className="text-xs font-mono w-full"
        sortDescriptor={sort}
        onSortChange={setSort}
      >
        <Table.Header>
          <Table.Column key="scenario" allowsSorting isRowHeader id="scenario">
            <ColHeader label="Scenario" sort={sort} sortKey="scenario" />
          </Table.Column>
          <Table.Column key="ttfb" allowsSorting id="ttfb">
            <ColHeader label="TTFB" sort={sort} sortKey="ttfb" />
          </Table.Column>
          <Table.Column key="firstByte" allowsSorting id="firstByte">
            <ColHeader label="1st byte" sort={sort} sortKey="firstByte" />
          </Table.Column>
          <Table.Column key="total" allowsSorting id="total">
            <ColHeader label="Total" sort={sort} sortKey="total" />
          </Table.Column>
          <Table.Column key="decode" allowsSorting id="decode">
            <ColHeader label="Decode" sort={sort} sortKey="decode" />
          </Table.Column>
          <Table.Column key="transfer" allowsSorting id="transfer">
            <ColHeader label="Transfer" sort={sort} sortKey="transfer" />
          </Table.Column>
          <Table.Column key="throughput" allowsSorting id="throughput">
            <ColHeader label="MB/s" sort={sort} sortKey="throughput" />
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {sorted.map(r => {
            const isBest = r.total === minTotal
            const isArchive = ARCHIVE_NAMES.has(r.scenario)
            const isToken = !isArchive
            const algoName = isToken ? algoNameFromScenario(r.scenario) : ''
            const isStreaming = isToken && (r.pathTaken === 'stream' || classify(algoName).stream)
            const stddevText =
              r.totalMsStddev !== undefined && r.totalMsStddev > 0
                ? `±${r.totalMsStddev.toFixed(0)}ms`
                : ''

            const toneClass = isBest
              ? 'text-green-400'
              : isToken
                ? 'text-blue-400/80'
                : 'text-white/40'
            const streamClass = isStreaming
              ? 'border-l-2 border-purple-500/40 bg-purple-500/[0.025]'
              : ''

            return (
              <Table.Row key={r.scenario} className={`${toneClass} ${streamClass}`} id={r.scenario}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: COLORS[r.scenario] }}
                    />
                    {r.scenario}
                    {isToken && <AlgoBadges hideBatch hideEnv algoName={algoName} />}
                    {isBest && (
                      <CheckCircleIcon className="text-green-400/70" size={12} weight="fill" />
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>{fmtMs(r.ttfb)}</Table.Cell>
                <Table.Cell className="text-indigo-300/70">{fmtMs(r.firstByte)}</Table.Cell>
                <Table.Cell className="font-semibold">
                  {fmtMs(r.total)}
                  {stddevText && (
                    <span className="ml-1 text-[10px] text-white/30">{stddevText}</span>
                  )}
                </Table.Cell>
                <Table.Cell>{fmtMs(r.decode)}</Table.Cell>
                <Table.Cell>{fmtBytes(r.transfer)}</Table.Cell>
                <Table.Cell>{r.throughput.toFixed(1)}</Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Content>
    </Table>
  )
}
