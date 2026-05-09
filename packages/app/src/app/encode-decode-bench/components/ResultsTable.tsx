'use client'

import { Table } from '@heroui/react'
import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import type { SortDescriptor } from 'react-aria-components'

import { AlgoBadges } from '@/components/AlgoBadges'
import type { ExtBenchRow } from '@/lib/bench-types'

import { fmtBytes, fmtMs } from '../utils'
import { ColHeader } from './ColHeader'

interface ResultsTableProps {
  rows: ExtBenchRow[]
  sort: SortDescriptor
  onSortChange: (sort: SortDescriptor) => void
  bestRatio: number | null
}

/** Identity key for visual row grouping — channels excluded so c3/c4 of the
 *  same algo are recognized as siblings. */
function groupKey(r: ExtBenchRow): string {
  return [
    r.codecName,
    r.surfaceId ?? '—',
    r.compressorId ?? r.outerCompression,
    r.drawerName ?? '—',
    r.optionsSummary ?? '—',
  ].join('|')
}

export function ResultsTable({ rows, sort, onSortChange, bestRatio }: ResultsTableProps) {
  return (
    <Table className="overflow-x-auto">
      <Table.Content
        aria-label="Extended benchmark results"
        className="text-xs font-mono w-full"
        sortDescriptor={sort}
        onSortChange={onSortChange}
      >
        <Table.Header>
          <Table.Column key="codecName" allowsSorting isRowHeader id="codecName">
            <ColHeader label="Algo" sort={sort} sortKey="codecName" />
          </Table.Column>
          <Table.Column key="surfaceId" allowsSorting id="surfaceId">
            <ColHeader label="Surface" sort={sort} sortKey="surfaceId" />
          </Table.Column>
          <Table.Column key="compressorId" allowsSorting id="compressorId">
            <ColHeader label="Compressor" sort={sort} sortKey="compressorId" />
          </Table.Column>
          <Table.Column key="drawerName" allowsSorting id="drawerName">
            <ColHeader label="Drawer" sort={sort} sortKey="drawerName" />
          </Table.Column>
          <Table.Column key="optionsSummary" id="optionsSummary">
            Options
          </Table.Column>
          <Table.Column key="channels" allowsSorting id="channels">
            <ColHeader label="Ch" sort={sort} sortKey="channels" />
          </Table.Column>
          <Table.Column key="encodeMs" allowsSorting id="encodeMs">
            <ColHeader label="Encode" sort={sort} sortKey="encodeMs" />
          </Table.Column>
          <Table.Column key="decodeMs" allowsSorting id="decodeMs">
            <ColHeader label="Decode" sort={sort} sortKey="decodeMs" />
          </Table.Column>
          <Table.Column key="roundTrip" allowsSorting id="roundTrip">
            <ColHeader label="RT" sort={sort} sortKey="roundTrip" />
          </Table.Column>
          <Table.Column key="tokenBytes" allowsSorting id="tokenBytes">
            <ColHeader label="Size" sort={sort} sortKey="tokenBytes" />
          </Table.Column>
          <Table.Column key="ratio" allowsSorting id="ratio">
            <ColHeader label="Ratio" sort={sort} sortKey="ratio" />
          </Table.Column>
          <Table.Column key="throughputMBps" allowsSorting id="throughputMBps">
            <ColHeader label="MB/s" sort={sort} sortKey="throughputMBps" />
          </Table.Column>
          <Table.Column key="path" id="path">
            Path
          </Table.Column>
          <Table.Column key="env" id="env">
            Env
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row, i) => {
            const isBest = !row.error && row.ratio > 0 && row.ratio === bestRatio
            const prev = i > 0 ? rows[i - 1] : undefined
            // Visual de-dup: if the previous row (in current sort order) shares
            // the same algo/surface/compressor/drawer/options identity, render
            // the identifying cells as muted ditto-marks. Channels still differ.
            const isContinuation = prev !== undefined && groupKey(prev) === groupKey(row)
            const streamingClass = row.isStreaming
              ? 'border-l-2 border-purple-500/50 bg-purple-500/[0.025]'
              : ''

            if (row.error) {
              const isTimeout = row.error.startsWith('timeout after')

              return (
                <Table.Row key={i} className={`opacity-60 ${streamingClass}`} id={i}>
                  <Table.Cell>
                    <div className="flex items-center gap-1.5">
                      {isContinuation ? (
                        <span className="text-white/15">↓</span>
                      ) : (
                        <>
                          {row.codecName}
                          <AlgoBadges hideBatch hideEnv algoName={row.codecName} />
                        </>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-white/30">
                    {isContinuation ? '·' : (row.surfaceId ?? '—')}
                  </Table.Cell>
                  <Table.Cell className="text-white/30">
                    {isContinuation ? '·' : (row.compressorId ?? row.outerCompression)}
                  </Table.Cell>
                  <Table.Cell className="text-white/30">
                    {isContinuation ? '·' : (row.drawerName ?? '—')}
                  </Table.Cell>
                  <Table.Cell className="text-white/30">
                    {isContinuation ? '·' : (row.optionsSummary ?? '—')}
                  </Table.Cell>
                  <Table.Cell className="text-white/30">{row.channels}</Table.Cell>
                  <Table.Cell>
                    {isTimeout ? (
                      <span className="text-amber-400/80 text-[10px] border border-amber-400/30 rounded px-1.5 py-0.5">
                        ⏱ slow
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
                <Table.Cell>
                  <div className="flex items-center gap-1.5">
                    {isContinuation ? (
                      <span className="text-white/20">↓</span>
                    ) : (
                      <>
                        <span>{row.codecName}</span>
                        <AlgoBadges hideBatch hideEnv algoName={row.codecName} />
                      </>
                    )}
                    {isBest && (
                      <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded px-1">
                        best
                      </span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className={isContinuation ? 'text-white/20' : 'text-white/50'}>
                  {isContinuation ? '·' : (row.surfaceId ?? '—')}
                </Table.Cell>
                <Table.Cell className={isContinuation ? 'text-white/20' : 'text-white/50'}>
                  {isContinuation ? '·' : (row.compressorId ?? row.outerCompression)}
                </Table.Cell>
                <Table.Cell className={isContinuation ? 'text-white/20' : 'text-white/50'}>
                  {isContinuation ? '·' : (row.drawerName ?? '—')}
                </Table.Cell>
                <Table.Cell className={isContinuation ? 'text-white/15' : 'text-white/40'}>
                  {isContinuation ? '·' : (row.optionsSummary ?? '—')}
                </Table.Cell>
                <Table.Cell className="text-white/40">{row.channels}</Table.Cell>
                <Table.Cell>{fmtMs(row.encodeMs)}</Table.Cell>
                <Table.Cell>{fmtMs(row.decodeMs)}</Table.Cell>
                <Table.Cell className="font-semibold">{fmtMs(row.roundTripMs)}</Table.Cell>
                <Table.Cell>{fmtBytes(row.tokenBytes)}</Table.Cell>
                <Table.Cell>{Math.round(row.ratio * 100)}%</Table.Cell>
                <Table.Cell>{row.throughputMBps.toFixed(1)}</Table.Cell>
                <Table.Cell>
                  <PathBadge isStreaming={row.isStreaming} pathTaken={row.pathTaken} />
                </Table.Cell>
                <Table.Cell>
                  {row.isBrowserSafe ? (
                    <CheckCircleIcon className="text-green-400" size={14} weight="fill" />
                  ) : (
                    <XCircleIcon className="text-white/20" size={14} />
                  )}
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Content>
    </Table>
  )
}

interface PathBadgeProps {
  pathTaken?: 'stream' | 'batch'
  isStreaming: boolean
}

function PathBadge({ pathTaken, isStreaming }: PathBadgeProps) {
  // Falls back to capability when the runner didn't record `pathTaken` (legacy
  // result rows). Mismatch (capability=stream but pathTaken=batch) shows red.
  const expected: 'stream' | 'batch' = isStreaming ? 'stream' : 'batch'
  const actual = pathTaken ?? expected
  const mismatch = pathTaken !== undefined && pathTaken !== expected

  if (mismatch) {
    return (
      <span
        className="inline-flex items-center rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-red-300"
        title={`expected ${expected}, ran as ${actual}`}
      >
        ! {actual}
      </span>
    )
  }

  return actual === 'stream' ? (
    <span className="inline-flex items-center rounded border border-purple-500/30 bg-purple-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-purple-300">
      stream
    </span>
  ) : (
    <span className="inline-flex items-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/45">
      batch
    </span>
  )
}
