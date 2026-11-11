'use client'

import { formatBytes, formatMs } from '@/lib/runner'

import type { JsEncoding } from '../page'

export interface ResultCell {
  sizeKB: number
  ratePct: number
  nextTokenMs: number
  nextTokenBytes: number
  diffMs: number
  diffBytes?: number
  jsBundledMsByEnc: Record<JsEncoding, number>
  jsBundledBytesByEnc: Record<JsEncoding, number>
  jsChunkedMsByEnc: Record<JsEncoding, number>
  jsChunkedBytesByEnc: Record<JsEncoding, number>
  jsChunkedFileCount: number
  ok: boolean
  error?: string
}

interface DiffVersioningResultsTableProps {
  sizes: readonly number[]
  rates: readonly number[]
  results: ReadonlyMap<string, ResultCell>
  /** Which Content-Encoding the JS strategies should display. Tokens ignore. */
  jsEncoding: JsEncoding
}

export function DiffVersioningResultsTable({
  sizes,
  rates,
  results,
  jsEncoding,
}: DiffVersioningResultsTableProps) {
  // Per-strategy cell projections. Each picks the right ms/bytes from the
  // ResultCell shape so the matrix renderer stays generic.
  const project = (
    c: ResultCell,
    strategy: 'next-token' | 'diff' | 'js-bundled' | 'js-chunked',
  ): { ms: number; bytes: number } => {
    if (strategy === 'next-token') return { ms: c.nextTokenMs, bytes: c.nextTokenBytes }
    if (strategy === 'diff') return { ms: c.diffMs, bytes: c.diffBytes ?? 0 }
    if (strategy === 'js-bundled') {
      return { ms: c.jsBundledMsByEnc[jsEncoding], bytes: c.jsBundledBytesByEnc[jsEncoding] }
    }

    return { ms: c.jsChunkedMsByEnc[jsEncoding], bytes: c.jsChunkedBytesByEnc[jsEncoding] }
  }

  return (
    <div className="space-y-5">
      {/* 4 absolute-time matrices, one per strategy. */}
      <Section
        formatCell={c => formatTime(project(c, 'next-token').ms, c.ok)}
        rates={rates}
        results={results}
        sizes={sizes}
        tintCell={c =>
          tintByValue(project(c, 'next-token').ms, results, c => project(c, 'next-token').ms)
        }
        title="Next token — total time (encoding-agnostic)"
        tooltip={c => describe(project(c, 'next-token'), c.ok, c.error)}
      />
      <Section
        formatCell={c => formatTime(project(c, 'diff').ms, c.ok)}
        rates={rates}
        results={results}
        sizes={sizes}
        tintCell={c => tintByValue(project(c, 'diff').ms, results, c => project(c, 'diff').ms)}
        title="Diff token + apply — total time (encoding-agnostic)"
        tooltip={c => describe(project(c, 'diff'), c.ok, c.error)}
      />
      <Section
        formatCell={c => formatTime(project(c, 'js-bundled').ms, c.ok)}
        rates={rates}
        results={results}
        sizes={sizes}
        tintCell={c =>
          tintByValue(project(c, 'js-bundled').ms, results, c => project(c, 'js-bundled').ms)
        }
        title={`JS single bundle (${jsEncoding}) — total time`}
        tooltip={c => describe(project(c, 'js-bundled'), c.ok, c.error)}
      />
      <Section
        formatCell={c => formatTime(project(c, 'js-chunked').ms, c.ok)}
        rates={rates}
        results={results}
        sizes={sizes}
        tintCell={c =>
          tintByValue(project(c, 'js-chunked').ms, results, c => project(c, 'js-chunked').ms)
        }
        title={`JS chunked (${jsEncoding}) — total time`}
        tooltip={c => describe(project(c, 'js-chunked'), c.ok, c.error)}
      />

      {/* Pairwise ratios — diff is always the baseline. */}
      <details>
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-tp-muted pt-3 border-t border-tp-border">
          Diff vs. other strategies (ratios) — &gt; 1.0× means diff is faster
        </summary>
        <div className="mt-3 space-y-5">
          <Section
            formatCell={c => formatRatio(project(c, 'next-token').ms, project(c, 'diff').ms)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={c =>
              tintRatio(project(c, 'next-token').ms / project(c, 'diff').ms, /* diffWins= */ true)
            }
            title="next-token ÷ diff"
            tooltip={c =>
              `next-token ${formatMs(project(c, 'next-token').ms)} · diff ${formatMs(project(c, 'diff').ms)}`
            }
          />
          <Section
            formatCell={c => formatRatio(project(c, 'js-bundled').ms, project(c, 'diff').ms)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={c =>
              tintRatio(project(c, 'js-bundled').ms / project(c, 'diff').ms, /* diffWins= */ true)
            }
            title={`js-bundled (${jsEncoding}) ÷ diff`}
            tooltip={c =>
              `js-bundled ${formatMs(project(c, 'js-bundled').ms)} · diff ${formatMs(project(c, 'diff').ms)}`
            }
          />
          <Section
            formatCell={c => formatRatio(project(c, 'js-chunked').ms, project(c, 'diff').ms)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={c =>
              tintRatio(project(c, 'js-chunked').ms / project(c, 'diff').ms, /* diffWins= */ true)
            }
            title={`js-chunked (${jsEncoding}) ÷ diff`}
            tooltip={c =>
              `js-chunked ${formatMs(project(c, 'js-chunked').ms)} · diff ${formatMs(project(c, 'diff').ms)}`
            }
          />
        </div>
      </details>

      <details>
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-tp-muted pt-3 border-t border-tp-border">
          Wire bytes per strategy
        </summary>
        <div className="mt-3 space-y-5">
          <Section
            formatCell={c => formatBytes(project(c, 'next-token').bytes)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={() => null}
            title="Next token — wire bytes"
            tooltip={c => describe(project(c, 'next-token'), c.ok, c.error)}
          />
          <Section
            formatCell={c => formatBytes(project(c, 'diff').bytes)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={() => null}
            title="Diff token — wire bytes"
            tooltip={c => describe(project(c, 'diff'), c.ok, c.error)}
          />
          <Section
            formatCell={c => formatBytes(project(c, 'js-bundled').bytes)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={() => null}
            title={`JS single bundle (${jsEncoding}) — wire bytes`}
            tooltip={c => describe(project(c, 'js-bundled'), c.ok, c.error)}
          />
          <Section
            formatCell={c => formatBytes(project(c, 'js-chunked').bytes)}
            rates={rates}
            results={results}
            sizes={sizes}
            tintCell={() => null}
            title={`JS chunked (${jsEncoding}) — wire bytes`}
            tooltip={c => describe(project(c, 'js-chunked'), c.ok, c.error)}
          />
        </div>
      </details>
    </div>
  )
}

interface SectionProps {
  title: string
  sizes: readonly number[]
  rates: readonly number[]
  results: ReadonlyMap<string, ResultCell>
  formatCell: (c: ResultCell) => string
  tooltip: (c: ResultCell) => string
  tintCell: (c: ResultCell) => string | null
}

function Section({ title, sizes, rates, results, formatCell, tooltip, tintCell }: SectionProps) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-tp-muted mb-2">{title}</div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-tp-muted uppercase tracking-widest text-[10px]">
            <th className="text-left py-1.5 px-2 font-normal">Size ↓ / Rate →</th>
            {rates.map(r => (
              <th key={r} className="text-right py-1.5 px-2 font-normal">
                {r}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map(s => (
            <tr key={s} className="border-t border-tp-border">
              <td className="py-1.5 px-2 text-tp-muted text-left">{formatSize(s)}</td>
              {rates.map(r => {
                const cell = results.get(`${s}_${r}`)
                const tint = cell?.ok ? tintCell(cell) : null
                const style = tint ? { backgroundColor: tint } : undefined

                return (
                  <td
                    key={r}
                    className={
                      'py-1.5 px-2 text-right tabular-nums rounded-sm ' +
                      (cell?.ok ? 'text-tp-fg' : 'text-tp-muted')
                    }
                    style={style}
                    title={cell ? tooltip(cell) : ''}
                  >
                    {cell ? formatCell(cell) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(0)} MB`

  return `${kb} KB`
}

function formatTime(ms: number, ok: boolean): string {
  if (!ok || !Number.isFinite(ms)) return '—'

  return formatMs(ms)
}

function formatRatio(numerator: number, denominator: number): string {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return '—'
  const ratio = numerator / denominator

  return `${ratio.toFixed(2)}×`
}

function describe(
  { ms, bytes }: { ms: number; bytes: number },
  ok: boolean,
  error?: string,
): string {
  if (!ok) return error ?? '—'

  return `${formatMs(ms)} · ${formatBytes(bytes)}`
}

/**
 * Per-matrix gradient tint: cells with the smallest values of `extractor`
 * get the strongest green; the slowest get red. Lets each matrix be read
 * standalone without cross-referencing the others.
 */
function tintByValue(
  value: number,
  results: ReadonlyMap<string, ResultCell>,
  extractor: (c: ResultCell) => number,
): string | null {
  if (!Number.isFinite(value)) return null
  let min = Infinity
  let max = -Infinity

  for (const c of results.values()) {
    if (!c.ok) continue
    const v = extractor(c)

    if (Number.isFinite(v)) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null
  // Normalize 0..1 across the matrix; 0 = fastest (green), 1 = slowest (red).
  const norm = (value - min) / (max - min)

  if (norm <= 0.15) return 'rgba(74, 222, 128, 0.32)'
  if (norm <= 0.3) return 'rgba(74, 222, 128, 0.20)'
  if (norm <= 0.5) return 'rgba(74, 222, 128, 0.10)'
  if (norm >= 0.85) return 'rgba(248, 113, 113, 0.32)'
  if (norm >= 0.7) return 'rgba(248, 113, 113, 0.20)'
  if (norm >= 0.5) return 'rgba(248, 113, 113, 0.10)'

  return null
}

function tintRatio(ratio: number, _diffWins: boolean): string | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return null
  if (ratio >= 3) return 'rgba(74, 222, 128, 0.32)'
  if (ratio >= 1.75) return 'rgba(74, 222, 128, 0.22)'
  if (ratio >= 1.25) return 'rgba(74, 222, 128, 0.14)'
  if (ratio >= 1.05) return 'rgba(74, 222, 128, 0.07)'
  if (ratio <= 1 / 3) return 'rgba(248, 113, 113, 0.32)'
  if (ratio <= 1 / 1.75) return 'rgba(248, 113, 113, 0.22)'
  if (ratio <= 1 / 1.25) return 'rgba(248, 113, 113, 0.14)'
  if (ratio <= 1 / 1.05) return 'rgba(248, 113, 113, 0.07)'

  return null
}
