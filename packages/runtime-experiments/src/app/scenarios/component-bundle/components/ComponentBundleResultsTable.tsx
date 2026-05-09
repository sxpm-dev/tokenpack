'use client'

import { Surface } from '@heroui/react'
import { useMemo } from 'react'

import { formatBytes, formatMs } from '@/lib/runner'
import type { VariantDef } from '@/scenarios/types'

import type { RunResult } from './ComponentBundleClient'

interface ComponentBundleResultsTableProps {
  variants: readonly VariantDef[]
  results: ReadonlyMap<string, RunResult>
  bestId: string | null
  worstId: string | null
}

/**
 * Stage columns (TTFB / Transfer / Decode / Execute) are intentionally
 * absent. The runners only report a single `totalMs` per iteration — finer
 * staging would require Resource Timing API instrumentation per fetch and
 * isn't differentiating for this scenario. The Execute stage in particular
 * is at `performance.now()` resolution (≈100 µs) so 30 KB of DOM work
 * rounds to 0; not useful information.
 */
export function ComponentBundleResultsTable({
  variants,
  results,
  bestId,
  worstId,
}: ComponentBundleResultsTableProps) {
  const worstMs = useMemo(() => {
    let max = -Infinity

    for (const v of variants) {
      const ms = results.get(v.id)?.row?.totalMs.median

      if (typeof ms === 'number' && Number.isFinite(ms) && ms > max) max = ms
    }

    return Number.isFinite(max) ? max : null
  }, [variants, results])

  return (
    <Surface className="rounded-2xl p-3.5 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px]">
            <th className="text-left py-2 px-2 font-normal w-[180px]">Strategy</th>
            <th className="text-left py-2 px-2 font-normal w-[120px]">Algo</th>
            <th className="text-left py-2 px-2 font-normal w-[170px]">Files</th>
            <th className="text-left py-2 px-2 font-normal w-[80px]">Status</th>
            <th className="text-right py-2 px-2 font-normal">Total</th>
            <th className="text-right py-2 px-2 font-normal">vs worst</th>
            <th className="text-right py-2 px-2 font-normal">P95</th>
            <th className="text-right py-2 px-2 font-normal">Wire</th>
          </tr>
        </thead>
        <tbody>
          {variants.map(v => {
            const r = results.get(v.id)
            const tag = v.id === bestId ? 'best' : v.id === worstId ? 'worst' : null

            return <Row key={v.id} result={r} tag={tag} variant={v} worstMs={worstMs} />
          })}
        </tbody>
      </table>
    </Surface>
  )
}

interface RowProps {
  variant: VariantDef
  result: RunResult | undefined
  tag: 'best' | 'worst' | null
  worstMs: number | null
}

function Row({ variant, result, tag, worstMs }: RowProps) {
  const row = result?.row
  const error = result?.error
  const status = error ? 'error' : row ? 'done' : 'pending'
  const parsed = parseVariant(variant)

  // Improvement vs the worst row in this size group: 0% on the worst,
  // climbing toward ~99% as totalMs approaches zero.
  let improvementPct: number | null = null

  if (
    row &&
    worstMs !== null &&
    Number.isFinite(row.totalMs.median) &&
    Number.isFinite(worstMs) &&
    worstMs > 0
  ) {
    improvementPct = ((worstMs - row.totalMs.median) / worstMs) * 100
  }

  return (
    <tr className="border-b border-white/5">
      <td className="py-2 px-2 align-top">
        <div className="flex items-start gap-2 flex-wrap">
          {tag && <Badge tag={tag} />}
          <span className="text-white/85">{parsed.strategy}</span>
        </div>
      </td>
      <td className="py-2 px-2 align-top text-white/70">{parsed.algo}</td>
      <td className="py-2 px-2 align-top text-white/70">{parsed.files}</td>
      <td className="py-2 px-2 align-top">
        {status === 'done' && <span className="text-success">✓ done</span>}
        {status === 'error' && (
          <span className="text-red-400" title={error}>
            ✗ error
          </span>
        )}
        {status === 'pending' && <span className="text-white/30">—</span>}
      </td>
      <td className="py-2 px-2 align-top text-right tabular-nums font-semibold">
        {row ? formatMs(row.totalMs.median) : '—'}
      </td>
      <td
        className={
          'py-2 px-2 align-top text-right tabular-nums ' + improvementClass(improvementPct)
        }
      >
        {improvementPct === null ? '—' : formatImprovement(improvementPct)}
      </td>
      <td className="py-2 px-2 align-top text-right tabular-nums text-white/55">
        {row ? formatMs(row.totalMs.p95) : '—'}
      </td>
      <td className="py-2 px-2 align-top text-right tabular-nums text-white/55">
        {row ? formatBytes(row.wireBytes) : '—'}
      </td>
    </tr>
  )
}

interface ParsedVariant {
  strategy: string
  algo: string
  files: string
}

const FILE_COUNT_BY_SIZE: Record<number, number> = {
  50: 5,
  200: 10,
  1024: 20,
  5120: 50,
}

const HTTP_ENCODING_LABEL: Record<string, string> = {
  identity: 'no encoding',
  gzip: 'gzip',
  brotli: 'brotli',
}

// All token encodes use this inner compression — see component-bundle/build.ts:
//   encode(builder, { compressor: 'deflate-6', ... })
const TOKEN_INNER_ALGO = 'deflate-6'

/**
 * Parse the variant id into structured Strategy / Algo / Files columns.
 * The id format is the source of truth — see component-bundle/index.ts.
 *
 *   raw-bundled-{enc}-{kb}kb     → strategy='raw bundled', algo=HTTP encoding
 *   raw-chunked-{enc}-{kb}kb     → strategy='raw chunked', algo=HTTP encoding
 *   tokenpack-multifile-{kb}kb   → strategy='token',       algo=inner deflate-6
 *   tokenpack-subpacks-{kb}kb    → strategy='token',       algo=inner deflate-6
 */
function parseVariant(v: VariantDef): ParsedVariant {
  const sizeMatch = v.id.match(/(\d+)kb$/)
  const sizeKb = sizeMatch ? Number(sizeMatch[1]) : 0
  const sizeText = formatSizeKb(sizeKb)
  const stripSize = (s: string) => s.replace(/-\d+kb$/, '')

  if (v.id.startsWith('raw-bundled-')) {
    const enc = stripSize(v.id.slice('raw-bundled-'.length))

    return {
      strategy: 'raw bundled',
      algo: HTTP_ENCODING_LABEL[enc] ?? enc,
      files: `2 files (${sizeText})`,
    }
  }
  if (v.id.startsWith('raw-chunked-')) {
    const enc = stripSize(v.id.slice('raw-chunked-'.length))
    const fileCount = FILE_COUNT_BY_SIZE[sizeKb] ?? 0

    return {
      strategy: 'raw chunked',
      algo: HTTP_ENCODING_LABEL[enc] ?? enc,
      files: `${fileCount} files (${sizeText})`,
    }
  }
  if (v.id.startsWith('tokenpack-multifile-')) {
    return {
      strategy: 'token',
      algo: TOKEN_INNER_ALGO,
      files: `1 token (${sizeText})`,
    }
  }
  if (v.id.startsWith('tokenpack-subpacks-')) {
    return {
      strategy: 'token',
      algo: TOKEN_INNER_ALGO,
      files: `5 tokens (${sizeText})`,
    }
  }

  return { strategy: v.label, algo: '', files: '' }
}

function formatSizeKb(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(0)} MB`

  return `${kb} KB`
}

function formatImprovement(pct: number): string {
  if (Math.abs(pct) < 0.5) return '—' // baseline (this row IS the worst)

  return `${pct >= 0 ? '↓' : '↑'} ${Math.abs(pct).toFixed(0)}%`
}

function improvementClass(pct: number | null): string {
  if (pct === null) return 'text-white/30'
  if (Math.abs(pct) < 0.5) return 'text-white/30'
  if (pct >= 70) return 'text-success font-semibold'
  if (pct >= 40) return 'text-success/85'
  if (pct >= 15) return 'text-success/65'

  return 'text-white/55'
}

function Badge({ tag }: { tag: 'best' | 'worst' }) {
  if (tag === 'best') {
    return (
      <span className="inline-block rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-success/20 text-success">
        best
      </span>
    )
  }

  return (
    <span className="inline-block rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-red-500/20 text-red-400">
      worst
    </span>
  )
}
