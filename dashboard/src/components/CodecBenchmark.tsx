'use client'

import { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── Configs ───────────────────────────────────────────────────────────────

interface Config {
  id: string
  label: string
  short: string
  algo: string
  compressionMode: string
  format: 'webp' | 'png' | 'avif'
  channels: 1 | 2 | 3 | 4
  streaming?: boolean
}

const CONFIGS: Config[] = [
  { id: 'linear',               label: 'linear (raw)',                    short: 'linear',       algo: 'linear',        compressionMode: 'none',      format: 'webp', channels: 3 },
  { id: 'linear-br6',          label: 'linear + brotli-6',               short: '+br6',          algo: 'linear',        compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'linear-br11',         label: 'linear + brotli-11',              short: '+br11',         algo: 'linear',        compressionMode: 'brotli-11', format: 'webp', channels: 3 },
  { id: 'linear-def6',         label: 'linear + deflate-6',              short: '+def6',         algo: 'linear',        compressionMode: 'deflate-6', format: 'webp', channels: 3 },
  { id: 'interleaved-br6',     label: 'interleaved + brotli-6',          short: 'intlv+br6',     algo: 'interleaved',   compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'delta-br6',           label: 'delta + brotli-6',                short: 'delta+br6',     algo: 'delta',         compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'predict-br6',         label: 'predict + brotli-6',              short: 'pred+br6',      algo: 'predict',       compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'xor-br6',             label: 'xor + brotli-6',                  short: 'xor+br6',       algo: 'xor',           compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'nibble-br6',          label: 'nibble + brotli-6',               short: 'nibl+br6',      algo: 'nibble',        compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'rle',                 label: 'rle (raw)',                        short: 'rle',           algo: 'rle',           compressionMode: 'none',      format: 'webp', channels: 3 },
  { id: 'rle-br6',             label: 'rle + brotli-6',                  short: 'rle+br6',       algo: 'rle',           compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'palette',             label: 'palette-pixel (raw)',              short: 'pal-px',        algo: 'palette-pixel', compressionMode: 'none',      format: 'webp', channels: 3 },
  { id: 'semantic',            label: 'semantic (raw)',                   short: 'sem',           algo: 'semantic',      compressionMode: 'none',      format: 'webp', channels: 3 },
  { id: 'semantic-br6',       label: 'semantic + brotli-6',             short: 'sem+br6',       algo: 'semantic',      compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'radial-br6',         label: 'radial + brotli-6',               short: 'rad+br6',       algo: 'radial',        compressionMode: 'brotli-6',  format: 'webp', channels: 3 },
  { id: 'linear-br6-png',     label: 'linear + brotli-6 (png)',          short: '+br6[png]',     algo: 'linear',        compressionMode: 'brotli-6',  format: 'png',  channels: 3 },
  { id: 'linear-bpp1',        label: 'linear bpp=1 + brotli-6',         short: 'bpp1+br6',      algo: 'linear',        compressionMode: 'brotli-6',  format: 'webp', channels: 1 },
  { id: 'stream-br6-png3',    label: 'stream png/brotli-6/bpp=3',       short: 's+br6[3]',      algo: 'linear',        compressionMode: 'brotli-6',  format: 'png',  channels: 3, streaming: true },
  { id: 'stream-br6-png4',    label: 'stream png/brotli-6/bpp=4',       short: 's+br6[4]',      algo: 'linear',        compressionMode: 'brotli-6',  format: 'png',  channels: 4, streaming: true },
  { id: 'stream-def6-png3',   label: 'stream png/deflate-6/bpp=3',      short: 's+def6[3]',     algo: 'linear',        compressionMode: 'deflate-6', format: 'png',  channels: 3, streaming: true },
  { id: 'stream-def6-png4',   label: 'stream png/deflate-6/bpp=4',      short: 's+def6[4]',     algo: 'linear',        compressionMode: 'deflate-6', format: 'png',  channels: 4, streaming: true },
]

const SOURCES = [
  { id: 'react-dom-dev',  label: 'react-dom dev' },
  { id: 'react-dom-prod', label: 'react-dom prod' },
  { id: 'screenshot',     label: 'screenshot' },
]

// ── Types ─────────────────────────────────────────────────────────────────

interface BenchResult {
  configId: string
  source: string
  encodeMs: number
  decodeMs: number
  tokenBytes: number
  originalBytes: number
  error?: string
}

interface Progress {
  current: number
  total: number
  label: string
}

// ── Helpers ───────────────────────────────────────────────────────────────

const fmtMs   = (ms: number)    => `${ms.toFixed(1)}ms`
const fmtKB   = (b: number)     => `${(b / 1024).toFixed(0)}KB`
const fmtRatio = (r: BenchResult) => `${Math.round((r.tokenBytes / r.originalBytes) * 100)}%`

function minBy<T>(arr: T[], key: (v: T) => number): T | undefined {
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

function TimingChart({ results }: { results: BenchResult[] }) {
  const data = results
    .filter(r => !r.error)
    .map(r => ({
      name: CONFIGS.find(c => c.id === r.configId)?.short ?? r.configId,
      encode: r.encodeMs,
      decode: r.decodeMs,
    }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 38)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
          tickFormatter={v => fmtMs(v as number)} />
        <YAxis type="category" dataKey="name" width={80}
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
        <Tooltip content={<Tip unit="ms" />} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        <Bar dataKey="encode" name="encode" stackId="a" fill="#6366f1" maxBarSize={28} />
        <Bar dataKey="decode" name="decode" stackId="a" fill="#f59e0b" maxBarSize={28} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SizeChart({ results }: { results: BenchResult[] }) {
  const data = results
    .filter(r => !r.error)
    .map(r => ({
      name: CONFIGS.find(c => c.id === r.configId)?.short ?? r.configId,
      size: Math.round(r.tokenBytes / 1024),
    }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(400, data.length * 38)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
          tickFormatter={v => `${v}KB`} />
        <YAxis type="category" dataKey="name" width={80}
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
        <Tooltip content={<Tip unit="KB" />} />
        <Bar dataKey="size" name="token size" fill="#10b981" maxBarSize={28} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Result table ──────────────────────────────────────────────────────────

function ResultTable({ results, running }: { results: BenchResult[]; running: boolean }) {
  const done = results.filter(r => !r.error)
  const bestSize    = minBy(done, r => r.tokenBytes)
  const bestEncode  = minBy(done, r => r.encodeMs)
  const bestDecode  = minBy(done, r => r.decodeMs)
  const bestTrip    = minBy(done, r => r.encodeMs + r.decodeMs)

  // Show all configs; completed ones have data, pending ones show a loading row
  const completedIds = new Set(results.map(r => r.configId))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-white/25 border-b border-white/10">
            {['Config', 'Fmt', 'Encode', 'Decode', 'Round-trip', 'Size', 'Ratio'].map(h => (
              <th key={h} className="text-left py-2 pr-6 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CONFIGS.map(cfg => {
            const r = results.find(x => x.configId === cfg.id)
            const isPending = running && !completedIds.has(cfg.id)

            if (!r) {
              return (
                <tr key={cfg.id} className="border-b border-white/5">
                  <td className="py-2 pr-6 text-white/20">{cfg.label}</td>
                  <td className="py-2 pr-6 text-white/15">{cfg.format}</td>
                  {isPending
                    ? <td colSpan={5} className="py-2 pr-6 text-white/20 animate-pulse">waiting…</td>
                    : <td colSpan={5} className="py-2 pr-6 text-white/15">—</td>
                  }
                </tr>
              )
            }

            if (r.error) {
              return (
                <tr key={cfg.id} className="border-b border-white/5">
                  <td className="py-2 pr-6 text-white/40">{cfg.label}</td>
                  <td className="py-2 pr-6 text-white/25">{cfg.format}</td>
                  <td colSpan={5} className="py-2 pr-6 text-red-400/70 truncate max-w-xs">{r.error}</td>
                </tr>
              )
            }

            const trip = r.encodeMs + r.decodeMs
            const isBestSize   = r === bestSize
            const isBestEncode = r === bestEncode
            const isBestDecode = r === bestDecode
            const isBestTrip   = r === bestTrip

            return (
              <tr key={cfg.id} className={`border-b border-white/5 ${isBestSize ? 'text-green-400' : 'text-white/60'}`}>
                <td className="py-2 pr-6 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {cfg.label}
                    {isBestSize && <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded px-1">smallest</span>}
                  </div>
                </td>
                <td className="py-2 pr-6 text-white/30">{cfg.format}</td>
                <td className={`py-2 pr-6 ${isBestEncode ? 'text-blue-400' : ''}`}>
                  {fmtMs(r.encodeMs)}
                  {isBestEncode && <span className="text-[9px] text-blue-400/50 ml-1">↑</span>}
                </td>
                <td className={`py-2 pr-6 ${isBestDecode ? 'text-teal-400' : ''}`}>
                  {fmtMs(r.decodeMs)}
                  {isBestDecode && <span className="text-[9px] text-teal-400/50 ml-1">↑</span>}
                </td>
                <td className={`py-2 pr-6 font-semibold ${isBestTrip ? 'text-amber-400' : ''}`}>
                  {fmtMs(trip)}
                  {isBestTrip && <span className="text-[9px] text-amber-400/50 ml-1">↑</span>}
                </td>
                <td className="py-2 pr-6">{fmtKB(r.tokenBytes)}</td>
                <td className="py-2 pr-6">{fmtRatio(r)}</td>
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
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [results, setResults] = useState<BenchResult[]>([])

  const run = useCallback(async () => {
    setRunning(true)
    setResults([])

    for (let i = 0; i < CONFIGS.length; i++) {
      const cfg = CONFIGS[i]
      setProgress({ current: i + 1, total: CONFIGS.length, label: cfg.label })

      try {
        const res = await fetch('/api/benchmark/perf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: selectedSource,
            algo: cfg.algo,
            compressionMode: cfg.compressionMode,
            format: cfg.format,
            channels: cfg.channels,
            streaming: cfg.streaming,
          }),
        })
        const data = await res.json()
        setResults(prev => [...prev, { configId: cfg.id, source: selectedSource, ...data }])
      } catch (e) {
        setResults(prev => [...prev, {
          configId: cfg.id, source: selectedSource,
          encodeMs: 0, decodeMs: 0, tokenBytes: 0, originalBytes: 0,
          error: String(e),
        }])
      }
    }

    setRunning(false)
    setProgress(null)
  }, [selectedSource])

  const completedResults = results.filter(r => !r.error)
  const hasResults = results.length > 0

  return (
    <div className="space-y-6">

      {/* Controls */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center gap-8 flex-wrap">
        <div className="space-y-2">
          <div className="text-[10px] text-white/30 uppercase tracking-widest">Source</div>
          <div className="flex gap-1.5">
            {SOURCES.map(s => (
              <FilterBtn key={s.id} active={selectedSource === s.id} onClick={() => setSelectedSource(s.id)}>
                {s.label}
              </FilterBtn>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {running && progress && (
            <div className="text-xs text-white/40 font-mono">
              <span className="text-white/70">{progress.current}</span>/{progress.total}
              <span className="text-white/30 ml-2 max-w-[180px] truncate inline-block align-middle">
                {progress.label}
              </span>
            </div>
          )}
          <button
            onClick={run}
            disabled={running}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              running
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white text-black hover:bg-white/90 active:scale-95'
            }`}
          >
            {running ? 'Running…' : 'Run Benchmark'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
        <SectionTitle>
          {hasResults
            ? `Results — ${SOURCES.find(s => s.id === results[0]?.source)?.label ?? ''} · ${results.length}/${CONFIGS.length} done`
            : 'Results'}
        </SectionTitle>
        <ResultTable results={results} running={running} />
      </div>

      {/* Charts */}
      {completedResults.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <SectionTitle>Encode + Decode time (stacked)</SectionTitle>
            <TimingChart results={completedResults} />
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <SectionTitle>Token size</SectionTitle>
            <SizeChart results={completedResults} />
          </div>
        </div>
      )}

    </div>
  )
}
