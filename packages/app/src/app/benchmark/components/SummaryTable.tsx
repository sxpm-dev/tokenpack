'use client'

import { useMemo, useState } from 'react'
import { Table } from '@heroui/react'
import { CheckCircleIcon } from '@phosphor-icons/react'
import type { SortDescriptor } from 'react-aria-components'
import { COLORS, SCENARIOS } from '../constants'
import type { BenchRow, SummaryRow, SummarySortKey } from '../types'
import { avg, fmtBytes, fmtMs, getRows } from '../utils'
import { ColHeader } from './ColHeader'

interface SummaryTableProps {
  data: BenchRow[]
  condition: string
  source: string
}

export function SummaryTable({ data, condition, source }: SummaryTableProps) {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'total', direction: 'ascending' })

  const rawRows = useMemo<SummaryRow[]>(() => SCENARIOS.map(s => {
    const r = getRows(data, condition, source).filter(d => d.scenario === s)
    if (!r.length) return null
    return {
      scenario: s,
      ttfb: avg(r, 'ttfb'),
      total: avg(r, 'totalMs'),
      firstByte: avg(r, 'firstByteMs'),
      decode: avg(r, 'decodeMs'),
      transfer: avg(r, 'transferBytes'),
      throughput: avg(r, 'throughputMBps'),
    }
  }).filter((r): r is SummaryRow => r !== null), [data, condition, source])

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
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return asc ? cmp : -cmp
    })
  }, [rawRows, sort])

  return (
    <Table className="overflow-x-auto">
      <Table.Content
        aria-label="Benchmark summary"
        sortDescriptor={sort}
        onSortChange={setSort}
        className="text-xs font-mono w-full"
      >
        <Table.Header>
          <Table.Column id="scenario"   key="scenario"   allowsSorting isRowHeader><ColHeader label="Scenario"  sortKey="scenario"   sort={sort} /></Table.Column>
          <Table.Column id="ttfb"       key="ttfb"       allowsSorting>            <ColHeader label="TTFB"      sortKey="ttfb"       sort={sort} /></Table.Column>
          <Table.Column id="firstByte"  key="firstByte"  allowsSorting>            <ColHeader label="1st byte"  sortKey="firstByte"  sort={sort} /></Table.Column>
          <Table.Column id="total"      key="total"      allowsSorting>            <ColHeader label="Total"     sortKey="total"      sort={sort} /></Table.Column>
          <Table.Column id="decode"     key="decode"     allowsSorting>            <ColHeader label="Decode"    sortKey="decode"     sort={sort} /></Table.Column>
          <Table.Column id="transfer"   key="transfer"   allowsSorting>            <ColHeader label="Transfer"  sortKey="transfer"   sort={sort} /></Table.Column>
          <Table.Column id="throughput" key="throughput" allowsSorting>            <ColHeader label="MB/s"      sortKey="throughput" sort={sort} /></Table.Column>
        </Table.Header>
        <Table.Body>
          {sorted.map(r => {
            const isBest = r.total === minTotal
            const isToken = r.scenario.startsWith('max-') || r.scenario.startsWith('stream-')
            return (
              <Table.Row
                id={r.scenario}
                key={r.scenario}
                className={isBest ? 'text-green-400' : isToken ? 'text-blue-400/80' : 'text-white/40'}
              >
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[r.scenario] }} />
                    {r.scenario}
                    {isBest && <CheckCircleIcon size={12} weight="fill" className="text-green-400/70" />}
                  </div>
                </Table.Cell>
                <Table.Cell>{fmtMs(r.ttfb)}</Table.Cell>
                <Table.Cell className="text-indigo-300/70">{fmtMs(r.firstByte)}</Table.Cell>
                <Table.Cell className="font-semibold">{fmtMs(r.total)}</Table.Cell>
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
