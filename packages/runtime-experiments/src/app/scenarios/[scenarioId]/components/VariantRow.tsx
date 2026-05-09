'use client'

import { Button, Tooltip } from '@heroui/react'
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { formatBytes, formatMs } from '@/lib/runner'
import type { VariantDef } from '@/scenarios/types'

import type { VariantStatus } from '../runner-state'
import { CompatChip } from './CompatChip'
import { VariantDetail } from './VariantDetail'
import { VariantStatusBadge } from './VariantStatusBadge'
import { VerifyCell } from './VerifyCell'

interface VariantRowProps {
  variant: VariantDef
  status: VariantStatus
  /** Canonical fingerprint hash for the active size — set from the first `done` variant. */
  canonicalHash: string | null
  /** Render an Execute column when any variant in the table reports it. */
  withExecuteColumn: boolean
  /** Cell-span for error/skipped/empty rows that take over the metric cells. */
  metricColSpan: number
  /** Cell-span for the inline detail panel that spans the full row. */
  fullColSpan: number
}

export function VariantRow({
  variant,
  status,
  canonicalHash,
  withExecuteColumn,
  metricColSpan,
  fullColSpan,
}: VariantRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = !!variant.detail
  const row = status.state === 'done' ? status.row : null

  return (
    <>
      <tr className="border-b border-white/5">
        <td className="py-1.5 px-2 align-top">
          <div className="flex items-center gap-1.5">
            {hasDetail ? (
              <Button
                isIconOnly
                aria-label={expanded ? 'Collapse detail' : 'Expand detail'}
                size="sm"
                variant="ghost"
                onPress={() => setExpanded(e => !e)}
              >
                {expanded ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
              </Button>
            ) : (
              <span className="w-6" />
            )}
            <span className="font-mono text-white/85 text-xs">{variant.label}</span>
          </div>
        </td>

        <td className="py-1.5 px-2 align-top">
          <CompatChip compat={variant.compat} />
        </td>

        <td className="py-1.5 px-2 align-top">
          <VariantStatusBadge status={status} />
        </td>

        {row ? (
          <>
            <td className="py-1.5 px-2 text-right tabular-nums text-white/60">
              {row.stages?.ttfbMs ? formatMs(row.stages.ttfbMs.median) : '—'}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-white/70">
              {row.stages?.transferMs ? formatMs(row.stages.transferMs.median) : '—'}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-white/60">
              {row.stages?.decodeMs ? formatMs(row.stages.decodeMs.median) : '—'}
            </td>
            {withExecuteColumn && (
              <td className="py-1.5 px-2 text-right tabular-nums text-white/60">
                {row.stages?.executeMs ? formatMs(row.stages.executeMs.median) : '—'}
              </td>
            )}
            <td className="py-1.5 px-2 text-right tabular-nums font-medium text-white/90">
              {formatMs(row.totalMs.median)}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-white/45">
              {formatMs(row.totalMs.p95)}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-white/55">
              {formatBytes(row.wireBytes)}
            </td>
            <td className="py-1.5 px-2">
              <VerifyCell canonicalHash={canonicalHash} fingerprint={row.fingerprint} />
            </td>
          </>
        ) : status.state === 'errored' ? (
          <td className="py-1.5 px-2 text-[11px] text-red-300" colSpan={metricColSpan}>
            <Tooltip>
              <Tooltip.Trigger>
                <span className="truncate block">{status.error}</span>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <pre className="whitespace-pre-wrap text-[10px]">{status.error}</pre>
              </Tooltip.Content>
            </Tooltip>
          </td>
        ) : status.state === 'skipped' ? (
          <td className="py-1.5 px-2 text-[11px] text-white/40 italic" colSpan={metricColSpan}>
            {status.reason}
          </td>
        ) : (
          <td className="py-1.5 px-2" colSpan={metricColSpan} />
        )}
      </tr>

      {expanded && (
        <tr>
          <td className="p-0" colSpan={fullColSpan}>
            <VariantDetail detail={variant.detail} />
          </td>
        </tr>
      )}
    </>
  )
}
