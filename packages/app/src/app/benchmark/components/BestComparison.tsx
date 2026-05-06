'use client'

import { Surface } from '@heroui/react'

import type { BenchRow, BestEntry } from '../types'
import { avg, fmtBytes, fmtMs, getRows } from '../utils'

interface BestComparisonProps {
  data: BenchRow[]
  condition: string
  source: string
}

interface LabeledBestEntry extends BestEntry {
  label: string
  color: string
}

const PLACEHOLDER: Omit<BestEntry, 'group'> = {
  scenario: '—',
  total: 0,
  firstByte: 0,
  transfer: 0,
  decode: 0,
}

export function BestComparison({ data, condition, source }: BestComparisonProps) {
  const filtered = getRows(data, condition, source)

  function bestOf(prefix: string | string[]): BestEntry | null {
    const candidates = filtered.filter(r =>
      Array.isArray(prefix) ? prefix.includes(r.scenario) : r.scenario.startsWith(prefix),
    )

    if (!candidates.length) return null
    const byScenario = [...new Set(candidates.map(r => r.scenario))].map(s => {
      const rs = candidates.filter(r => r.scenario === s)

      return {
        scenario: s,
        total: avg(rs, 'totalMs'),
        firstByte: avg(rs, 'firstByteMs'),
        transfer: avg(rs, 'transferBytes'),
        decode: avg(rs, 'decodeMs'),
      }
    })
    const best = byScenario.reduce((a, b) => (a.total < b.total ? a : b))

    return { group: Array.isArray(prefix) ? prefix[0] : prefix, ...best }
  }

  const entries: LabeledBestEntry[] = [
    {
      label: 'Best token-max',
      color: '#60a5fa',
      ...(bestOf('max-') ?? { group: 'max-', ...PLACEHOLDER }),
    },
    {
      label: 'Best token-stream',
      color: '#6366f1',
      ...(bestOf('stream-') ?? { group: 'stream-', ...PLACEHOLDER }),
    },
    {
      label: 'Best zip',
      color: '#f59e0b',
      ...(bestOf(['zip']) ?? { group: 'zip', ...PLACEHOLDER }),
    },
    {
      label: 'Best tar.gz',
      color: '#f97316',
      ...(bestOf(['tar.gz']) ?? { group: 'tar.gz', ...PLACEHOLDER }),
    },
  ].filter(e => e.scenario !== '—')

  if (entries.length < 2) return null

  const bestTotal = Math.min(...entries.map(e => e.total))
  const bestFirstByte = Math.min(...entries.map(e => e.firstByte))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(e => {
        const pctTotal =
          e.total === bestTotal ? 0 : Math.round(((e.total - bestTotal) / bestTotal) * 100)
        const pctFirst =
          e.firstByte === bestFirstByte
            ? 0
            : Math.round(((e.firstByte - bestFirstByte) / bestFirstByte) * 100)
        const isBestTotal = e.total === bestTotal
        const isBestFirst = e.firstByte === bestFirstByte

        return (
          <Surface
            key={e.label}
            className={`rounded-xl p-3.5 space-y-2 ${isBestTotal ? ' bg-green-400/10' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
              <span className="text-[10px] text-white/40 uppercase tracking-wide">{e.label}</span>
            </div>
            <div className="text-white/70 font-mono text-xs">{e.scenario}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/30">total</span>
                <span className={isBestTotal ? 'text-green-400 font-semibold' : 'text-white/60'}>
                  {fmtMs(e.total)}
                  {pctTotal > 0 && (
                    <span className="text-red-400/70 ml-1 text-[10px]">+{pctTotal}%</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/30">1st byte</span>
                <span className={isBestFirst ? 'text-indigo-400 font-semibold' : 'text-white/50'}>
                  {fmtMs(e.firstByte)}
                  {pctFirst > 0 && (
                    <span className="text-red-400/70 ml-1 text-[10px]">+{pctFirst}%</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/30">size</span>
                <span className="text-white/40">{fmtBytes(e.transfer)}</span>
              </div>
            </div>
          </Surface>
        )
      })}
    </div>
  )
}
