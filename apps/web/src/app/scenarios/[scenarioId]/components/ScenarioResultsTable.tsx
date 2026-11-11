'use client'

import { Surface } from '@heroui/react'

import type { VariantDef } from '@/scenarios/types'

import type { StatusMap } from '../runner-state'
import { VariantRow } from './VariantRow'

interface ScenarioResultsTableProps {
  variants: readonly VariantDef[]
  statuses: StatusMap
  /** Whether to render the Execute column — true when any done variant reports stages.executeMs. */
  withExecuteColumn: boolean
}

export function ScenarioResultsTable({
  variants,
  statuses,
  withExecuteColumn,
}: ScenarioResultsTableProps) {
  // Canonical fingerprint hash: the first `done` row's hash for this size group.
  // Subsequent rows compare against this.
  let canonicalHash: string | null = null

  for (const v of variants) {
    const status = statuses.get(v.id)

    if (status?.state === 'done' && status.row.fingerprint) {
      canonicalHash = status.row.fingerprint.hash
      break
    }
  }

  // Row layout: [Variant, Compat, Status] (3) + metric cells.
  // Metric cells: TTFB, Transfer, Decode, [Execute], Total, p95, Wire, Verify.
  // Without execute: 7 metric cells. With execute: 8.
  const metricColSpan = withExecuteColumn ? 8 : 7
  const fullColSpan = 3 + metricColSpan

  return (
    <Surface className="rounded-2xl p-3.5 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-tp-border text-tp-muted uppercase tracking-widest text-[10px]">
            <th className="text-left py-2 px-2 font-normal">Variant</th>
            <th className="text-left py-2 px-2 font-normal">Compat</th>
            <th className="text-left py-2 px-2 font-normal">Status</th>
            <th className="text-right py-2 px-2 font-normal">TTFB</th>
            <th className="text-right py-2 px-2 font-normal">Transfer</th>
            <th className="text-right py-2 px-2 font-normal">Decode</th>
            {withExecuteColumn && <th className="text-right py-2 px-2 font-normal">Execute</th>}
            <th className="text-right py-2 px-2 font-normal">Total</th>
            <th className="text-right py-2 px-2 font-normal">p95</th>
            <th className="text-right py-2 px-2 font-normal">Wire</th>
            <th className="text-left py-2 px-2 font-normal">Verify</th>
          </tr>
        </thead>
        <tbody>
          {variants.map(v => {
            const status = statuses.get(v.id) ?? { state: 'pending' as const }

            return (
              <VariantRow
                key={v.id}
                canonicalHash={canonicalHash}
                fullColSpan={fullColSpan}
                metricColSpan={metricColSpan}
                status={status}
                variant={v}
                withExecuteColumn={withExecuteColumn}
              />
            )
          })}
        </tbody>
      </table>
    </Surface>
  )
}
