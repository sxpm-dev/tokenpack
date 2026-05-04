'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────

interface ExtBenchRow {
  codecId: number
  codecName: string
  family: 'legacy' | 'A' | 'B' | 'C'
  outerCompression: string
  channels: number
  source: string
  encodeMs: number
  decodeMs: number
  roundTripMs: number
  tokenBytes: number
  originalBytes: number
  ratio: number
  throughputMBps: number
  isStreaming: boolean
  isBrowserSafe: boolean
  error?: string
}

const SOURCES = [
  { id: 'react-dom-dev',  label: 'react-dom dev' },
  { id: 'react-dom-prod', label: 'react-dom prod' },
  { id: 'screenshot',     label: 'screenshot' },
]

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtMs    = (ms: number) => `${ms.toFixed(1)}ms`
const fmtKB    = (b: number)  => `${(b / 1024).toFixed(0)}KB`
const fmtRatio = (r: number)  => `${Math.round(r * 100)}%`
const shortKey = (r: ExtBenchRow) =>
  r.outerCompression === 'none' ? r.codecName : `${r.codecName}+${r.outerCompression.replace('brotli-', 'br').replace('deflate-', 'def')}`

function minByField<T>(arr: T[], key: (v: T) => number): T | undefined {
  return arr.reduce<T | undefined>((m, v) => m === undefined || key(v) < key(m) ? v : m, undefined)
}

// ── Sub-components ────────────────────────────────────────────────────────

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-white text-black' : 'bg-white/8 text-white/50 hover:bg-white/12'
      }`}
    >
      {children}
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-4">{children}</h2>
}

function Tip({ active, payload, label, unit }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  unit?: 'ms' | 'KB'
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-white/60 mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-white/50">{p.name}</span>
          <span className="text-white font-mono ml-auto pl-4">
            {unit === 'ms' ? fmtMs(p.value) : `${p.value}KB`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Charts ────────────────────────────────────────────────────────────────

function TimingChart({ rows }: { rows: ExtBenchRow[] }) {
  const data = rows.filter(r => !r.error).map(r => ({
    name: shortKey(r),
    encode: r.encodeMs,
    decode: r.decodeMs,
  }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 38)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickFormatter={v => fmtMs(v as number)} />
        <YAxis type="category" dataKey="name" width={96} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'monospace' }} />
        <Tooltip content={<Tip unit="ms" />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        <Bar dataKey="encode" name="encode" stackId="a" fill="#6366f1" maxBarSize={28} />
        <Bar dataKey="decode" name="decode" stackId="a" fill="#f59e0b" maxBarSize={28} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SizeChart({ rows }: { rows: ExtBenchRow[] }) {
  const data = rows.filter(r => !r.error).map(r => ({
    name: shortKey(r),
    size: Math.round(r.tokenBytes / 1024),
  }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 38)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickFormatter={v => `${v}KB`} />
        <YAxis type="category" dataKey="name" width={96} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'monospace' }} />
        <Tooltip content={<Tip unit="KB" />} />
        <Bar dataKey="size" name="token size" fill="#10b981" maxBarSize={28} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Result table ──────────────────────────────────────────────────────────

function ResultTable({ rows }: { rows: ExtBenchRow[] }) {
  const ok = rows.filter(r => !r.error)
  const bestSize   = minByField(ok, r => r.tokenBytes)
  const bestEncode = minByField(ok, r => r.encodeMs)
  const bestDecode = minByField(ok, r => r.decodeMs)
  const bestTrip   = minByField(ok, r => r.roundTripMs)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-white/25 border-b border-white/10">
            {['Config', 'Compress', 'Encode', 'Decode', 'Round-trip', 'Size', 'Ratio'].map(h => (
              <th key={h} className="text-left py-2 pr-6 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            if (r.error) {
              const isTimeout = r.error.startsWith('timeout after')
              return (
                <tr key={i} className="border-b border-white/5 opacity-60">
                  <td className="py-2 pr-6 text-white/40">{r.codecName}</td>
                  <td className="py-2 pr-6 text-white/25">{r.outerCompression}</td>
                  <td colSpan={5} className="py-2 pr-6">
                    {isTimeout
                      ? <span className="text-amber-400/80 text-[10px] border border-amber-400/30 rounded px-1.5 py-0.5">⏱ too slow (&gt;2s)</span>
                      : <span className="text-red-400/70 truncate">{r.error}</span>
                    }
                  </td>
                </tr>
              )
            }
            const isBestSize   = r === bestSize
            const isBestEncode = r === bestEncode
            const isBestDecode = r === bestDecode
            const isBestTrip   = r === bestTrip
            return (
              <tr key={i} className={`border-b border-white/5 hover:bg-white/3 ${isBestSize ? 'text-green-400' : 'text-white/60'}`}>
                <td className="py-2 pr-6 whitespace-nowrap">
                  {r.codecName}
                  {isBestSize && <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded px-1 ml-1">smallest</span>}
                </td>
                <td className="py-2 pr-6 text-white/35">{r.outerCompression}</td>
                <td className={`py-2 pr-6 ${isBestEncode ? 'text-blue-400' : ''}`}>
                  {fmtMs(r.encodeMs)}{isBestEncode && <span className="text-[9px] text-blue-400/50 ml-1">↑</span>}
                </td>
                <td className={`py-2 pr-6 ${isBestDecode ? 'text-teal-400' : ''}`}>
                  {fmtMs(r.decodeMs)}{isBestDecode && <span className="text-[9px] text-teal-400/50 ml-1">↑</span>}
                </td>
                <td className={`py-2 pr-6 font-semibold ${isBestTrip ? 'text-amber-400' : ''}`}>
                  {fmtMs(r.roundTripMs)}{isBestTrip && <span className="text-[9px] text-amber-400/50 ml-1">↑</span>}
                </td>
                <td className="py-2 pr-6">{fmtKB(r.tokenBytes)}</td>
                <td className="py-2 pr-6">{fmtRatio(r.ratio)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function CodecBenchmark() {
  const [selectedSource, setSelectedSource] = useState('react-dom-dev')
  const [allRows, setAllRows]   = useState<ExtBenchRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/benchmark/perf')
      .then(r => r.json())
      .then((data: ExtBenchRow[] | { error: string }) => {
        if ('error' in data) { setError(data.error); setLoading(false); return }
        setAllRows(data)
        setLoading(false)
      })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  const rows = useMemo(
    () => allRows.filter(r => r.source === selectedSource),
    [allRows, selectedSource],
  )

  const availableSources = useMemo(
    () => SOURCES.filter(s => allRows.some(r => r.source === s.id)),
    [allRows],
  )

  const completedRows = rows.filter(r => !r.error)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-white/30 text-sm font-mono">
        Loading results…
      </div>
    )
  }

  if (error || allRows.length === 0) {
    return (
      <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center space-y-3">
        <p className="text-white/40 text-sm">No benchmark results found.</p>
        <p className="text-white/25 text-xs font-mono">Run: yarn tsx benchmark/run-extended.ts</p>
        {error && <p className="text-red-400/60 text-xs">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Source filter */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Source</div>
        <div className="flex gap-1.5">
          {availableSources.map(s => (
            <FilterBtn key={s.id} active={selectedSource === s.id} onClick={() => setSelectedSource(s.id)}>
              {s.label}
            </FilterBtn>
          ))}
        </div>
        <div className="ml-auto text-xs text-white/25 font-mono">{rows.length} configurations</div>
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
        <SectionTitle>Results — {availableSources.find(s => s.id === selectedSource)?.label}</SectionTitle>
        <ResultTable rows={rows} />
      </div>

      {/* Charts */}
      {completedRows.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <SectionTitle>Encode + Decode time (stacked)</SectionTitle>
            <TimingChart rows={completedRows} />
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <SectionTitle>Token size</SectionTitle>
            <SizeChart rows={completedRows} />
          </div>
        </div>
      )}

    </div>
  )
}
