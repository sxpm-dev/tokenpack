import { Table } from '@heroui/react'
import { useMemo } from 'react'

import { buildScenarioConfig, SOURCE_LABELS } from '../constants'
import type { BenchRow } from '../types'
import { fmtBytes, fmtMs } from '../utils'

interface RawDataTableProps {
  data: BenchRow[]
  condition: string
  source: string
}

export function RawDataTable({ data, condition, source }: RawDataTableProps) {
  const { scenarios: SCENARIOS, colors: COLORS } = useMemo(
    () => buildScenarioConfig(data.map(d => d.scenario)),
    [data],
  )
  const rawData = data
    .filter(r => r.condition === condition && (source === 'avg' || r.source === source))
    .sort(
      (a, b) =>
        a.source.localeCompare(b.source) ||
        SCENARIOS.indexOf(a.scenario) - SCENARIOS.indexOf(b.scenario),
    )

  return (
    <Table className="overflow-x-auto">
      <Table.Content aria-label="Raw benchmark data" className="text-xs font-mono w-full">
        <Table.Header>
          <Table.Column key="source" isRowHeader id="source">
            Source
          </Table.Column>
          <Table.Column key="scenario" id="scenario">
            Scenario
          </Table.Column>
          <Table.Column key="ttfb" id="ttfb">
            TTFB
          </Table.Column>
          <Table.Column key="fetch" id="fetch">
            Fetch
          </Table.Column>
          <Table.Column key="firstByte" id="firstByte">
            1st byte
          </Table.Column>
          <Table.Column key="decode" id="decode">
            Decode
          </Table.Column>
          <Table.Column key="total" id="total">
            Total
          </Table.Column>
          <Table.Column key="transfer" id="transfer">
            Transfer
          </Table.Column>
          <Table.Column key="mbps" id="mbps">
            MB/s
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {rawData.map((r, i) => (
            <Table.Row
              key={i}
              id={i}
              style={{ color: COLORS[r.scenario] ?? 'rgba(255,255,255,0.4)' }}
            >
              <Table.Cell className="text-white/35">
                {SOURCE_LABELS[r.source] ?? r.source}
              </Table.Cell>
              <Table.Cell>{r.scenario}</Table.Cell>
              <Table.Cell>{fmtMs(r.ttfb)}</Table.Cell>
              <Table.Cell>{fmtMs(r.fetchMs)}</Table.Cell>
              <Table.Cell className="text-indigo-300/60">{fmtMs(r.firstByteMs)}</Table.Cell>
              <Table.Cell>{fmtMs(r.decodeMs)}</Table.Cell>
              <Table.Cell className="font-semibold">{fmtMs(r.totalMs)}</Table.Cell>
              <Table.Cell>{fmtBytes(r.transferBytes)}</Table.Cell>
              <Table.Cell>{r.throughputMBps.toFixed(1)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table>
  )
}
