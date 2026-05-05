'use client'

import { Table } from '@heroui/react'
import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import type { SortDescriptor } from 'react-aria-components'
import type { ExtBenchRow } from '@/lib/bench-types'
import { FAMILY_DOT } from '../constants'
import { fmtBytes, fmtMs, getFamily } from '../utils'
import { ColHeader } from './ColHeader'

interface ResultsTableProps {
  rows: ExtBenchRow[]
  sort: SortDescriptor
  onSortChange: (sort: SortDescriptor) => void
  bestRatio: number | null
}

export function ResultsTable({ rows, sort, onSortChange, bestRatio }: ResultsTableProps) {
  return (
    <Table className="overflow-x-auto">
      <Table.Content
        aria-label="Extended benchmark results"
        sortDescriptor={sort}
        onSortChange={onSortChange}
        className="text-xs font-mono w-full"
      >
        <Table.Header>
          <Table.Column id="codecName"        key="codecName"        allowsSorting isRowHeader><ColHeader label="Algorithm"   sortKey="codecName"        sort={sort} /></Table.Column>
          <Table.Column id="outerCompression" key="outerCompression" allowsSorting>            <ColHeader label="Compression" sortKey="outerCompression" sort={sort} /></Table.Column>
          <Table.Column id="channels"         key="channels"         allowsSorting>            <ColHeader label="Ch"          sortKey="channels"         sort={sort} /></Table.Column>
          <Table.Column id="encodeMs"         key="encodeMs"         allowsSorting>            <ColHeader label="Encode ms"   sortKey="encodeMs"         sort={sort} /></Table.Column>
          <Table.Column id="decodeMs"         key="decodeMs"         allowsSorting>            <ColHeader label="Decode ms"   sortKey="decodeMs"         sort={sort} /></Table.Column>
          <Table.Column id="roundTrip"        key="roundTrip"        allowsSorting>            <ColHeader label="Round-trip"  sortKey="roundTrip"        sort={sort} /></Table.Column>
          <Table.Column id="tokenBytes"       key="tokenBytes"       allowsSorting>            <ColHeader label="Size"        sortKey="tokenBytes"       sort={sort} /></Table.Column>
          <Table.Column id="ratio"            key="ratio"            allowsSorting>            <ColHeader label="Ratio"       sortKey="ratio"            sort={sort} /></Table.Column>
          <Table.Column id="throughputMBps"   key="throughputMBps"   allowsSorting>            <ColHeader label="MB/s"        sortKey="throughputMBps"   sort={sort} /></Table.Column>
          <Table.Column id="isStreaming"      key="isStreaming">Stream</Table.Column>
          <Table.Column id="isBrowserSafe"    key="isBrowserSafe">Browser</Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row, i) => {
            const dot = FAMILY_DOT[getFamily(row.codecId)]
            const isBest = !row.error && row.ratio > 0 && row.ratio === bestRatio

            if (row.error) {
              const isTimeout = row.error.startsWith('timeout after')
              return (
                <Table.Row id={i} key={i} className="opacity-60">
                  <Table.Cell>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      {row.codecName}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-white/30">{row.outerCompression}</Table.Cell>
                  <Table.Cell className="text-white/30">{row.channels}</Table.Cell>
                  <Table.Cell>
                    {isTimeout
                      ? <span className="text-amber-400/80 text-[10px] border border-amber-400/30 rounded px-1.5 py-0.5">⏱ slow</span>
                      : <span className="text-red-400/70">err</span>
                    }
                  </Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                </Table.Row>
              )
            }

            return (
              <Table.Row id={i} key={i} className={isBest ? 'text-green-400' : 'text-white/60'}>
                <Table.Cell>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    {row.codecName}
                    {isBest && (
                      <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded px-1">
                        best
                      </span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="text-white/50">{row.outerCompression}</Table.Cell>
                <Table.Cell className="text-white/40">{row.channels}</Table.Cell>
                <Table.Cell>{fmtMs(row.encodeMs)}</Table.Cell>
                <Table.Cell>{fmtMs(row.decodeMs)}</Table.Cell>
                <Table.Cell className="font-semibold">{fmtMs(row.roundTripMs)}</Table.Cell>
                <Table.Cell>{fmtBytes(row.tokenBytes)}</Table.Cell>
                <Table.Cell>{Math.round(row.ratio * 100)}%</Table.Cell>
                <Table.Cell>{row.throughputMBps.toFixed(1)}</Table.Cell>
                <Table.Cell>
                  {row.isStreaming
                    ? <CheckCircleIcon size={14} weight="fill" className="text-green-400" />
                    : <XCircleIcon size={14} className="text-white/20" />}
                </Table.Cell>
                <Table.Cell>
                  {row.isBrowserSafe
                    ? <CheckCircleIcon size={14} weight="fill" className="text-green-400" />
                    : <XCircleIcon size={14} className="text-white/20" />}
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Content>
    </Table>
  )
}
