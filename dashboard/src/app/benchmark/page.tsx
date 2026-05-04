'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────

interface Row {
  scenario: string
  source: string
  condition: string
  ttfb: number
  fetchMs: number
  decodeMs: number
  totalMs: number
  firstByteMs: number
  transferBytes: number
  decodedBytes: number
  throughputMBps: number
}

// ── Constants ─────────────────────────────────────────────────────────────

const CONDITIONS = ['local', 'fast-cdn', 'average', 'slow']
const SOURCES = [
  'react-dom-client.development',
  'react-dom-client.production',
  'screenshot',
  'fs-src-tests-docs',
]
const SCENARIOS = ['max-webp3', 'max-png3', 'max-png4', 'stream-png3', 'stream-png4', 'stream-def3', 'stream-def4', 'zip', 'tar.gz', 'brotli-11', 'brotli-6']

const COLORS: Record<string, string> = {
  'max-webp3':    '#3b82f6',
  'max-png3':     '#60a5fa',
  'max-png4':     '#93c5fd',
  'stream-png3':  '#6366f1',
  'stream-png4':  '#a5b4fc',
  'stream-def3':  '#f472b6',
  'stream-def4':  '#f9a8d4',
  'zip':          '#f59e0b',
  'tar.gz':       '#f97316',
  'brotli-11':    '#10b981',
  'brotli-6':     '#34d399',
}

const SOURCE_LABELS: Record<string, string> = {
  'react-dom-client.development': 'react-dom dev',
  'react-dom-client.production':  'react-dom prod',
  'screenshot':                   'screenshot PNG',
  'fs-src-tests-docs':            'fs: src+tests+docs',
}

const CONDITION_LABELS: Record<string, string> = {
  'local':    'Local (0ms, ∞)',
  'fast-cdn': 'Fast CDN (10ms, 100MB/s)',
  'average':  'Average (50ms, 10MB/s)',
  'slow':     'Slow (100ms, 2MB/s)',
}

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtMs = (ms: number) => ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`
const fmtBytes = (b: number) =>
  b < 1024 ? `${b}B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1024 / 1024).toFixed(2)}MB`

function avg(rows: Row[], key: keyof Row): number {
  if (!rows.length) return 0
  return rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length
}

function getRows(data: Row[], condition: string, source: string) {
  return data.filter(r =>
    r.condition === condition &&
    (source === 'avg' || r.source === source)
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────

function Tip({ active, payload, label, unit }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-white/60 mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/50">{p.name}</span>
          <span className="text-white font-mono ml-auto pl-4">
            {unit === 'ms' ? fmtMs(p.value) : unit === 'bytes' ? fmtBytes(p.value) : `${p.value.toFixed(1)} MB/s`}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">{children}</h2>
}

// ── Chart: total time — grouped by source (avg) or by condition (specific) ──

function TotalTimeChart({ data, condition, source }: { data: Row[]; condition: string; source: string }) {
  // When avg: group by source, show all scenarios
  // When specific source: group by condition, show all scenarios
  const grouped = source === 'avg' ? SOURCES : CONDITIONS
  const labelKey = source === 'avg' ? SOURCE_LABELS : CONDITION_LABELS

  const chartData = grouped.map(g => {
    const entry: Record<string, string | number> = { label: labelKey[g] ?? g }
    for (const s of SCENARIOS) {
      const rows = data.filter(r =>
        r.scenario === s &&
        (source === 'avg' ? r.source === g && r.condition === condition : r.source === source && r.condition === g)
      )
      if (rows.length) entry[s] = avg(rows, 'totalMs')
    }
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickFormatter={v => fmtMs(v as number)} width={58} />
        <Tooltip content={<Tip unit="ms" />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        {SCENARIOS.map(s => <Bar key={s} dataKey={s} fill={COLORS[s]} radius={[3, 3, 0, 0]} maxBarSize={18} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Chart: fetch vs decode stacked breakdown ──────────────────────────────

function BreakdownChart({ data, condition, source }: { data: Row[]; condition: string; source: string }) {
  const chartData = SCENARIOS.map(s => {
    const rows = getRows(data, condition, source).filter(r => r.scenario === s)
    if (!rows.length) return null
    return { name: s, fetch: avg(rows, 'fetchMs'), decode: avg(rows, 'decodeMs') }
  }).filter(Boolean) as { name: string; fetch: number; decode: number }[]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickFormatter={v => fmtMs(v as number)} width={58} />
        <Tooltip content={<Tip unit="ms" />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        <Bar dataKey="fetch" fill="#6366f1" stackId="a" maxBarSize={32} />
        <Bar dataKey="decode" fill="#f59e0b" stackId="a" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Chart: transfer size ──────────────────────────────────────────────────

function SizeChart({ data, condition, source }: { data: Row[]; condition: string; source: string }) {
  const grouped = source === 'avg' ? SOURCES : CONDITIONS
  const labelKey = source === 'avg' ? SOURCE_LABELS : CONDITION_LABELS

  const chartData = grouped.map(g => {
    const entry: Record<string, string | number> = { label: labelKey[g] ?? g }
    for (const s of SCENARIOS) {
      const rows = data.filter(r =>
        r.scenario === s &&
        (source === 'avg' ? r.source === g && r.condition === condition : r.source === source && r.condition === g)
      )
      if (rows.length) entry[s] = avg(rows, 'transferBytes')
    }
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} tickFormatter={v => fmtBytes(v as number)} width={62} />
        <Tooltip content={<Tip unit="bytes" />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        {SCENARIOS.map(s => <Bar key={s} dataKey={s} fill={COLORS[s]} radius={[3, 3, 0, 0]} maxBarSize={18} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Summary table ─────────────────────────────────────────────────────────

function SummaryTable({ data, condition, source }: { data: Row[]; condition: string; source: string }) {
  const rows = SCENARIOS.map(s => {
    const r = getRows(data, condition, source).filter(d => d.scenario === s)
    if (!r.length) return null
    return {
      scenario: s,
      ttfb: avg(r, 'ttfb'),
      total: avg(r, 'totalMs'),
      firstByte: avg(r, 'firstByteMs'),
      decode: avg(r, 'decodeMs'),
      transfer: avg(r, 'transferBytes'),
      throughput: avg(r, 'throughputMBps'),
    }
  }).filter(Boolean) as { scenario: string; ttfb: number; total: number; firstByte: number; decode: number; transfer: number; throughput: number }[]

  const minTotal = Math.min(...rows.map(r => r.total))

  return (
    <table className="w-full text-xs font-mono">
      <thead>
        <tr className="text-white/25 border-b border-white/10">
          {['Scenario', 'TTFB', '1st byte', 'Total', 'Decode', 'Transfer', 'MB/s'].map(h => (
            <th key={h} className="text-left py-2 pr-6 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const isBest = r.total === minTotal
          const isToken = r.scenario.startsWith('max-') || r.scenario.startsWith('stream-')
          return (
            <tr key={r.scenario}
              className={`border-b border-white/5 ${isBest ? 'text-green-400' : isToken ? 'text-blue-400/80' : 'text-white/40'}`}>
              <td className="py-2 pr-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[r.scenario] }} />
                  {r.scenario}
                  {isBest && <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded px-1 ml-1">best</span>}
                </div>
              </td>
              <td className="py-2 pr-6">{fmtMs(r.ttfb)}</td>
              <td className="py-2 pr-6 text-indigo-300/70">{fmtMs(r.firstByte)}</td>
              <td className="py-2 pr-6 font-semibold">{fmtMs(r.total)}</td>
              <td className="py-2 pr-6">{fmtMs(r.decode)}</td>
              <td className="py-2 pr-6">{fmtBytes(r.transfer)}</td>
              <td className="py-2 pr-6">{r.throughput.toFixed(1)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Best-case comparison block ─────────────────────────────────────────────

interface BestEntry {
  group: string
  scenario: string
  total: number
  firstByte: number
  transfer: number
  decode: number
}

function BestComparison({ data, condition, source }: { data: Row[]; condition: string; source: string }) {
  const filtered = getRows(data, condition, source)

  function bestOf(prefix: string | string[]): BestEntry | null {
    const candidates = filtered.filter(r =>
      Array.isArray(prefix)
        ? prefix.includes(r.scenario)
        : r.scenario.startsWith(prefix)
    )
    if (!candidates.length) return null
    const byScenario = [...new Set(candidates.map(r => r.scenario))].map(s => {
      const rs = candidates.filter(r => r.scenario === s)
      return { scenario: s, total: avg(rs, 'totalMs'), firstByte: avg(rs, 'firstByteMs'), transfer: avg(rs, 'transferBytes'), decode: avg(rs, 'decodeMs') }
    })
    const best = byScenario.reduce((a, b) => a.total < b.total ? a : b)
    return { group: Array.isArray(prefix) ? prefix[0] : prefix, ...best }
  }

  const entries: (BestEntry & { label: string; color: string })[] = [
    { label: 'Best token-max',    color: '#60a5fa', ...(bestOf('max-')    ?? { group: 'max-',    scenario: '—', total: 0, firstByte: 0, transfer: 0, decode: 0 }) },
    { label: 'Best token-stream', color: '#6366f1', ...(bestOf('stream-') ?? { group: 'stream-', scenario: '—', total: 0, firstByte: 0, transfer: 0, decode: 0 }) },
    { label: 'Best zip',          color: '#f59e0b', ...(bestOf(['zip'])    ?? { group: 'zip',     scenario: '—', total: 0, firstByte: 0, transfer: 0, decode: 0 }) },
    { label: 'Best tar.gz',       color: '#f97316', ...(bestOf(['tar.gz']) ?? { group: 'tar.gz',  scenario: '—', total: 0, firstByte: 0, transfer: 0, decode: 0 }) },
  ].filter(e => e.scenario !== '—')

  if (entries.length < 2) return null

  const bestTotal = Math.min(...entries.map(e => e.total))
  const bestFirstByte = Math.min(...entries.map(e => e.firstByte))

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {entries.map(e => {
        const pctTotal = e.total === bestTotal ? 0 : Math.round((e.total - bestTotal) / bestTotal * 100)
        const pctFirst = e.firstByte === bestFirstByte ? 0 : Math.round((e.firstByte - bestFirstByte) / bestFirstByte * 100)
        const isBestTotal = e.total === bestTotal
        const isBestFirst = e.firstByte === bestFirstByte
        return (
          <div key={e.label} className={`rounded-xl border p-4 space-y-2 ${isBestTotal ? 'border-green-400/30 bg-green-400/5' : 'border-white/8 bg-white/2'}`}>
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
                  {pctTotal > 0 && <span className="text-red-400/70 ml-1 text-[10px]">+{pctTotal}%</span>}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/30">1st byte</span>
                <span className={isBestFirst ? 'text-indigo-400 font-semibold' : 'text-white/50'}>
                  {fmtMs(e.firstByte)}
                  {pctFirst > 0 && <span className="text-red-400/70 ml-1 text-[10px]">+{pctFirst}%</span>}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/30">size</span>
                <span className="text-white/40">{fmtBytes(e.transfer)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Filter button ─────────────────────────────────────────────────────────

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-white text-black' : 'bg-white/8 text-white/50 hover:bg-white/12'
      }`}>
      {children}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function BenchmarkPage() {
  const [data, setData] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const [condition, setCondition] = useState('average')
  const [source, setSource] = useState('avg')
  const [rawOpen, setRawOpen] = useState(false)

  useEffect(() => {
    fetch('/api/benchmark')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(e => setError(String(e)))
  }, [])

  if (error) return (
    <div className="p-10">
      <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 font-mono text-sm">
        {error}
      </div>
    </div>
  )

  if (!data.length) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-white/30 text-sm animate-pulse">Loading results…</div>
    </div>
  )

  const srcLabel = source === 'avg' ? 'all sources (avg)' : SOURCE_LABELS[source] ?? source
  const condLabel = CONDITION_LABELS[condition] ?? condition

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Benchmark Results</h1>
        <p className="text-sm text-white/40 mt-1">Token vs zip vs tar.gz vs brotli · {data.length} measurements</p>
      </div>

        {/* Filters */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex gap-8 flex-wrap">
          <div className="space-y-2">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Network condition</div>
            <div className="flex gap-1.5">
              {CONDITIONS.map(c => (
                <FilterBtn key={c} active={condition === c} onClick={() => setCondition(c)}>{c}</FilterBtn>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Source</div>
            <div className="flex gap-1.5 flex-wrap">
              <FilterBtn active={source === 'avg'} onClick={() => setSource('avg')}>Avg</FilterBtn>
              {SOURCES.map(s => (
                <FilterBtn key={s} active={source === s} onClick={() => setSource(s)}>
                  {SOURCE_LABELS[s] ?? s}
                </FilterBtn>
              ))}
            </div>
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <SectionTitle>{condLabel} · {srcLabel}</SectionTitle>
          <SummaryTable key={`${condition}-${source}`} data={data} condition={condition} source={source} />
        </div>

        {/* Best-case comparison */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <SectionTitle>Best case — {condLabel} · {srcLabel}</SectionTitle>
          <BestComparison key={`bcomp-${condition}-${source}`} data={data} condition={condition} source={source} />
        </div>

        {/* Total time + size */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <SectionTitle>
              Total time — {source === 'avg' ? 'by source' : 'by network condition'}
            </SectionTitle>
            <TotalTimeChart key={`tc-${condition}-${source}`} data={data} condition={condition} source={source} />
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <SectionTitle>
              Transfer size — {source === 'avg' ? 'by source' : 'by network condition'}
            </SectionTitle>
            <SizeChart key={`sc-${condition}-${source}`} data={data} condition={condition} source={source} />
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <SectionTitle>Fetch vs decode — {condLabel} · {srcLabel}</SectionTitle>
          <BreakdownChart key={`bc-${condition}-${source}`} data={data} condition={condition} source={source} />
        </div>

        {/* Raw table (collapsible) */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <button
            onClick={() => setRawOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors text-left"
          >
            <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
              Raw data — {condLabel} · {srcLabel}
            </span>
            <span className="text-white/30 text-xs font-mono">{rawOpen ? '▲ collapse' : '▼ expand'}</span>
          </button>
          {rawOpen && (
            <div className="px-6 pb-6 overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="text-white/25 border-b border-white/10">
                    {['Source', 'Scenario', 'TTFB', 'Fetch', '1st byte', 'Decode', 'Total', 'Transfer', 'MB/s'].map(h => (
                      <th key={h} className="text-left py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter(r => r.condition === condition && (source === 'avg' || r.source === source))
                    .sort((a, b) => a.source.localeCompare(b.source) || SCENARIOS.indexOf(a.scenario) - SCENARIOS.indexOf(b.scenario))
                    .map((r, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        style={{ color: COLORS[r.scenario] ?? 'rgba(255,255,255,0.4)' }}>
                        <td className="py-1.5 pr-4 text-white/35">{SOURCE_LABELS[r.source] ?? r.source}</td>
                        <td className="py-1.5 pr-4">{r.scenario}</td>
                        <td className="py-1.5 pr-4">{fmtMs(r.ttfb)}</td>
                        <td className="py-1.5 pr-4">{fmtMs(r.fetchMs)}</td>
                        <td className="py-1.5 pr-4 text-indigo-300/60">{fmtMs(r.firstByteMs)}</td>
                        <td className="py-1.5 pr-4">{fmtMs(r.decodeMs)}</td>
                        <td className="py-1.5 pr-4 font-semibold">{fmtMs(r.totalMs)}</td>
                        <td className="py-1.5 pr-4">{fmtBytes(r.transferBytes)}</td>
                        <td className="py-1.5 pr-4">{r.throughputMBps.toFixed(1)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

    </div>
  )
}
