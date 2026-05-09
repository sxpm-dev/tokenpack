'use client'

import { Surface } from '@heroui/react'

import { formatBytes, formatMs } from '@/lib/runner'

import type { SsrStreamingResult, SsrStreamingVariantInfo } from './SsrStreamingClient'

interface SsrStreamingResultsTableProps {
  variants: readonly SsrStreamingVariantInfo[]
  results: readonly SsrStreamingResult[]
}

export function SsrStreamingResultsTable({ variants, results }: SsrStreamingResultsTableProps) {
  const byVariant = new Map(results.map(r => [r.variantId, r]))

  return (
    <Surface className="rounded-2xl p-3.5 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px]">
            <th className="text-left py-2 px-2 font-normal">Variant</th>
            <th className="text-right py-2 px-2 font-normal">Median total</th>
            <th className="text-right py-2 px-2 font-normal">Iterations</th>
            <th className="text-right py-2 px-2 font-normal">Wire bytes</th>
          </tr>
        </thead>
        <tbody>
          {variants.map(v => {
            const r = byVariant.get(v.id)

            return (
              <tr key={v.id} className="border-b border-white/5">
                <td className="py-2 px-2 text-white/85">{v.label}</td>
                <td className="py-2 px-2 text-right tabular-nums text-white/85">
                  {r ? formatMs(r.totalMs) : <span className="text-white/30">—</span>}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-white/55">
                  {r ? r.iterations.length : <span className="text-white/30">—</span>}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-white/55">
                  {r ? formatBytes(r.wireBytes) : <span className="text-white/30">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Surface>
  )
}
