'use client'

import { Table } from '@heroui/react'
import type { SortDescriptor } from 'react-aria-components'

import { AlgoBadges } from '@/components/AlgoBadges'
import type { ExtBenchRow } from '@/lib/bench-types'

import { fmtBytes, fmtMs } from '../utils'
import { ColHeader } from './ColHeader'

interface ResultsTableProps {
  rows: ExtBenchRow[]
  sort: SortDescriptor
  onSortChange: (sort: SortDescriptor) => void
  bestSpeed: number | null
}

export function ResultsTable({ rows, sort, onSortChange, bestSpeed }: ResultsTableProps) {
  return (
    <Table className="overflow-x-auto">
      <Table.Content
        aria-label="Encode and decode speed benchmark results"
        className="text-xs font-mono w-full"
        sortDescriptor={sort}
        onSortChange={onSortChange}
      >
        <Table.Header>
          <Table.Column key="kind" allowsSorting id="kind">
            <ColHeader label="Kind" sort={sort} sortKey="kind" />
          </Table.Column>
          <Table.Column key="codecName" allowsSorting isRowHeader id="codecName">
            <ColHeader label="Format / Algo" sort={sort} sortKey="codecName" />
          </Table.Column>
          <Table.Column key="surfaceId" allowsSorting id="surfaceId">
            <ColHeader label="Surface" sort={sort} sortKey="surfaceId" />
          </Table.Column>
          <Table.Column key="compressorId" allowsSorting id="compressorId">
            <ColHeader label="Codec" sort={sort} sortKey="compressorId" />
          </Table.Column>
          <Table.Column key="path" id="path">
            Path
          </Table.Column>
          <Table.Column key="encodeMs" allowsSorting id="encodeMs">
            <ColHeader label="Encode" sort={sort} sortKey="encodeMs" />
          </Table.Column>
          <Table.Column key="speedMs" allowsSorting id="speedMs">
            <ColHeader label="Speed" sort={sort} sortKey="speedMs" />
          </Table.Column>
          <Table.Column key="fetchMs" allowsSorting id="fetchMs">
            <ColHeader label="Fetch" sort={sort} sortKey="fetchMs" />
          </Table.Column>
          <Table.Column key="decodeTailMs" allowsSorting id="decodeTailMs">
            <ColHeader label="Decode tail" sort={sort} sortKey="decodeTailMs" />
          </Table.Column>
          <Table.Column key="tokenBytes" allowsSorting id="tokenBytes">
            <ColHeader label="Size" sort={sort} sortKey="tokenBytes" />
          </Table.Column>
          <Table.Column key="ratio" allowsSorting id="ratio">
            <ColHeader label="Ratio" sort={sort} sortKey="ratio" />
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row, i) => {
            const speedMs = row.speedMs ?? row.roundTripMs
            const isBest = !row.error && speedMs > 0 && speedMs === bestSpeed
            const streamingClass =
              row.pathTaken === 'stream'
                ? 'border-l-2 border-purple-500/50 bg-purple-500/[0.025]'
                : ''

            if (row.error) {
              const isTimeout = row.error.startsWith('timeout after')

              return (
                <Table.Row key={i} className={`opacity-60 ${streamingClass}`} id={i}>
                  <Table.Cell className="text-white/30">{row.kind ?? 'token'}</Table.Cell>
                  <Table.Cell>
                    <AlgoName row={row} />
                  </Table.Cell>
                  <Table.Cell className="text-white/30">{row.surfaceId ?? '—'}</Table.Cell>
                  <Table.Cell className="text-white/30">
                    {row.compressorId ?? row.outerCompression}
                  </Table.Cell>
                  <Table.Cell>
                    <PathBadge pathTaken={row.pathTaken} />
                  </Table.Cell>
                  <Table.Cell>
                    {isTimeout ? (
                      <span className="text-amber-400/80 text-[10px] border border-amber-400/30 rounded px-1.5 py-0.5">
                        slow
                      </span>
                    ) : (
                      <span className="text-red-400/70">err</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                  <Table.Cell>—</Table.Cell>
                </Table.Row>
              )
            }

            return (
              <Table.Row
                key={i}
                className={`${isBest ? 'text-green-400' : 'text-white/60'} ${streamingClass}`}
                id={i}
              >
                <Table.Cell className="text-white/45">{row.kind ?? 'token'}</Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1.5">
                    <AlgoName row={row} />
                    {isBest && (
                      <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded px-1">
                        fastest
                      </span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="text-white/50">{row.surfaceId ?? '—'}</Table.Cell>
                <Table.Cell className="text-white/50">
                  {row.compressorId ?? row.outerCompression}
                </Table.Cell>
                <Table.Cell>
                  <PathBadge pathTaken={row.pathTaken} />
                </Table.Cell>
                <Table.Cell>{fmtMs(row.encodeMs)}</Table.Cell>
                <Table.Cell className="font-semibold">{fmtMs(speedMs)}</Table.Cell>
                <Table.Cell>{fmtMs(row.fetchMs ?? 0)}</Table.Cell>
                <Table.Cell>{fmtMs(row.decodeTailMs ?? row.decodeMs)}</Table.Cell>
                <Table.Cell>{fmtBytes(row.tokenBytes)}</Table.Cell>
                <Table.Cell>{Math.round(row.ratio * 100)}%</Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Content>
    </Table>
  )
}

function AlgoName({ row }: { row: ExtBenchRow }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{row.codecName}</span>
      {row.kind !== 'archive' && <AlgoBadges hideBatch hideEnv algoName={row.codecName} />}
      {row.kind !== 'archive' && row.channels && (
        <span className="text-[10px] text-white/30">c{row.channels}</span>
      )}
    </span>
  )
}

function PathBadge({ pathTaken }: { pathTaken?: 'stream' | 'batch' }) {
  return pathTaken === 'stream' ? (
    <span className="inline-flex items-center rounded border border-purple-500/30 bg-purple-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-purple-300">
      stream
    </span>
  ) : (
    <span className="inline-flex items-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/45">
      batch
    </span>
  )
}
