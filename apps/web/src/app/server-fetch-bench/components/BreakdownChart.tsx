'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { buildScenarioConfig } from '../constants'
import type { BenchRow } from '../types'
import { avg, fmtMs, getRows } from '../utils'
import { Tip } from './Tip'

interface BreakdownChartProps {
  data: BenchRow[]
  condition: string
  source: string
}

export function BreakdownChart({ data, condition, source }: BreakdownChartProps) {
  const scenarios = useMemo(() => buildScenarioConfig(data.map(d => d.scenario)).scenarios, [data])
  const chartData = scenarios
    .map(s => {
      const rows = getRows(data, condition, source).filter(r => r.scenario === s)

      if (!rows.length) return null

      return { name: s, fetch: avg(rows, 'fetchMs'), decode: avg(rows, 'decodeMs') }
    })
    .filter((d): d is { name: string; fetch: number; decode: number } => d !== null)

  return (
    <ResponsiveContainer height={220} width="100%">
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
          tickFormatter={v => fmtMs(v as number)}
          width={58}
        />
        <Tooltip content={<Tip unit="ms" />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        <Bar dataKey="fetch" fill="#6366f1" maxBarSize={32} stackId="a" />
        <Bar dataKey="decode" fill="#f59e0b" maxBarSize={32} radius={[3, 3, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}
