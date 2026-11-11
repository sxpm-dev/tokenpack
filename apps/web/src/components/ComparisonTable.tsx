'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { AggregatedResult } from '@/lib/measure'
import { formatBytes, formatMs } from '@/lib/measure'

interface ComparisonTableProps {
  results: AggregatedResult[]
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  if (!results.length) {
    return (
      <div className="text-tp-muted text-sm py-6 text-center">
        No results yet — click &quot;Run benchmark&quot;
      </div>
    )
  }

  const bestMedian = Math.min(...results.map(r => r.median))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-tp-border text-tp-muted uppercase tracking-widest">
            <th className="text-left py-2 px-3 font-normal">Variant</th>
            <th className="text-right py-2 px-3 font-normal">Median</th>
            <th className="text-right py-2 px-3 font-normal">p95</th>
            <th className="text-right py-2 px-3 font-normal">Min</th>
            <th className="text-right py-2 px-3 font-normal">Max</th>
            <th className="text-right py-2 px-3 font-normal">Bytes</th>
            <th className="text-left py-2 px-3 font-normal w-24">Spark</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => {
            const isBest = r.median === bestMedian
            const sparkData = r.perRun.map((ms, i) => ({ i, ms }))

            return (
              <tr key={r.label} className="border-b border-tp-border">
                <td className="py-2 px-3">
                  <span className={isBest ? 'text-green-400 font-medium' : 'text-tp-fg'}>
                    {r.label}
                    {isBest && (
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-green-500/15 text-green-300 rounded">
                        best
                      </span>
                    )}
                  </span>
                </td>
                <td
                  className={`py-2 px-3 text-right tabular-nums ${isBest ? 'text-green-400' : 'text-tp-fg'}`}
                >
                  {formatMs(r.median)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-tp-muted">
                  {formatMs(r.p95)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-tp-muted">
                  {formatMs(r.min)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-tp-muted">
                  {formatMs(r.max)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-tp-muted">
                  {formatBytes(r.bytes)}
                </td>
                <td className="py-1 px-3" style={{ minWidth: 96 }}>
                  <div className="h-6 w-24">
                    <ResponsiveContainer height="100%" width="100%">
                      <LineChart data={sparkData}>
                        <Line
                          dataKey="ms"
                          dot={false}
                          isAnimationActive={false}
                          stroke={isBest ? '#4ade80' : '#9ca3af'}
                          strokeWidth={1.5}
                          type="monotone"
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#0a0a0a',
                            border: '1px solid #222',
                            fontSize: 11,
                            padding: '4px 6px',
                          }}
                          formatter={(v: unknown) => [
                            typeof v === 'number' ? formatMs(v) : String(v),
                            'ms',
                          ]}
                          itemStyle={{ color: '#fff' }}
                          labelFormatter={i => `Run ${(i as number) + 1}`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
