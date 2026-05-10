'use client'

import { Button, Surface } from '@heroui/react'
import { BroomIcon, DownloadSimpleIcon, PlayIcon } from '@phosphor-icons/react'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { formatBytes, formatMs, prepareBase, runVariant } from './runner'
import type { ApplyDiffCase, ApplyDiffManifest, RowResult, Throttle, Variant } from './types'

const THROTTLES: Array<{ id: Throttle; label: string }> = [
  { id: 'local', label: 'Local' },
  { id: 'fast-cdn', label: 'Fast CDN' },
  { id: 'average', label: 'Average' },
  { id: 'slow', label: 'Slow' },
]

type Status =
  | { state: 'pending' }
  | { state: 'running' }
  | { state: 'done'; row: RowResult }
  | { state: 'errored'; error: string }

type StatusMap = Map<string, Status>

export default function ApplyDiffBenchPage() {
  const [manifest, setManifest] = useState<ApplyDiffManifest | null>(null)
  const [caseId, setCaseId] = useState('')
  const [iterations, setIterations] = useState(5)
  const [throttle, setThrottle] = useState<Throttle>('local')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [statuses, setStatuses] = useState<StatusMap>(new Map())
  const [topError, setTopError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/apply-diff-benchmark/manifest', { cache: 'no-store' })
      .then(r => r.json())
      .then((m: ApplyDiffManifest) => {
        setManifest(m)
        if (m.cases[0]) setCaseId(m.cases[0].id)
      })
      .catch(e => setTopError(String(e)))
  }, [])

  const activeCase = useMemo(
    () => manifest?.cases.find(item => item.id === caseId) ?? manifest?.cases[0] ?? null,
    [manifest, caseId],
  )
  const variants = useMemo(() => (activeCase ? buildVariants(activeCase) : []), [activeCase])
  const doneRows = useMemo(
    () =>
      variants
        .map(variant => statuses.get(variant.id))
        .filter((status): status is { state: 'done'; row: RowResult } => status?.state === 'done')
        .map(status => status.row),
    [statuses, variants],
  )

  async function handleRun() {
    if (!activeCase) return
    setRunning(true)
    setTopError(null)
    setProgress('Preparing cached v1.0.0 base packs…')
    setStatuses(new Map(variants.map(variant => [variant.id, { state: 'pending' } as Status])))
    await waitForPaint()

    const baseCache = {
      packByToken: new Map(),
      entriesByToken: new Map(),
    }
    const baseErrors = new Map<string, string>()

    try {
      const tokenIds = Array.from(
        new Set(
          variants
            .filter(
              variant =>
                variant.kind === 'diff-apply' ||
                variant.kind === 'range-changed-fetch' ||
                variant.kind === 'range-changed-stream',
            )
            .map(variant => variant.token?.id)
            .filter((value): value is string => Boolean(value)),
        ),
      )

      for (let index = 0; index < tokenIds.length; index += 1) {
        const tokenId = tokenIds[index]

        setProgress(
          `Preparing cached v1.0.0 base pack [${index + 1}/${tokenIds.length}] ${tokenId}`,
        )
        await waitForPaint()

        try {
          const prepared = await prepareBase(activeCase, tokenId, throttle)

          baseCache.packByToken.set(tokenId, prepared.pack)
          baseCache.entriesByToken.set(tokenId, prepared.entries)
        } catch (e: unknown) {
          baseErrors.set(tokenId, e instanceof Error ? e.message : String(e))
        }
      }

      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index]

        setProgress(`[${index + 1}/${variants.length}] ${variant.label}`)
        setStatuses(prev => new Map(prev).set(variant.id, { state: 'running' }))
        await waitForPaint()

        const baseError = variant.token?.id ? baseErrors.get(variant.token.id) : null

        if (
          baseError &&
          (variant.kind === 'diff-apply' ||
            variant.kind === 'range-changed-fetch' ||
            variant.kind === 'range-changed-stream')
        ) {
          setStatuses(prev => new Map(prev).set(variant.id, { state: 'errored', error: baseError }))
          continue
        }
        try {
          const row = await runVariant({
            item: activeCase,
            throttle,
            iterations,
            variant,
            baseCache,
          })

          setStatuses(prev => new Map(prev).set(variant.id, { state: 'done', row }))
        } catch (e: unknown) {
          const error = e instanceof Error ? e.message : String(e)

          setStatuses(prev => new Map(prev).set(variant.id, { state: 'errored', error }))
        }
      }
      setProgress('')
    } catch (e: unknown) {
      setTopError(e instanceof Error ? e.message : String(e))
      setProgress('')
    } finally {
      setRunning(false)
    }
  }

  async function handleClearCaches() {
    try {
      if ('caches' in self) {
        const names = await caches.keys()

        await Promise.all(names.map(name => caches.delete(name)))
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()

        await Promise.all(regs.map(reg => reg.unregister()))
      }
      setProgress('Caches cleared.')
      window.setTimeout(() => setProgress(''), 2000)
    } catch (e: unknown) {
      setTopError(`clear caches failed: ${e instanceof Error ? e.message : e}`)
    }
  }

  function handleExportCsv() {
    const lines = [
      'variant,kind,iterations,median_total_ms,p95_total_ms,median_decode_ms,median_apply_ms,wire_bytes,verify_hash,verify_bytes',
    ]

    for (const row of doneRows) {
      lines.push(
        [
          row.id,
          row.kind,
          row.iterations,
          row.median.totalMs,
          row.p95.totalMs,
          row.median.decodeMs,
          row.median.applyMs,
          row.median.wireBytes,
          row.verifyHash ?? '',
          row.verifyBytes,
        ].join(','),
      )
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `apply-diff-bench-${activeCase?.id ?? 'results'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!manifest) {
    return <main className="mx-auto max-w-6xl px-4 py-16 text-white/40">Loading…</main>
  }

  if (!manifest.available) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <Surface className="rounded-2xl p-5 text-sm text-white/60">
          {manifest.hint ?? 'Apply-diff fixtures are not available.'}
        </Surface>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Apply Diff Bench</h1>
        <p className="mt-0.5 text-xs text-white/40">
          v1.0.0 cached locally; v1.0.1 arrives as full bundle, full token, diff token, or
          pixel-range changed-file ranges.
        </p>
      </div>

      <Surface className="rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-white/50">Case:</span>
            <select
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
              disabled={running}
              value={activeCase?.id ?? ''}
              onChange={e => setCaseId(e.target.value)}
            >
              {manifest.cases.map(item => (
                <option key={item.id} value={item.id}>
                  {item.sizeKB}KB · {item.changeRatePct}% changed ·{' '}
                  {formatBytes(item.changedOriginalBytes)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Iterations:</span>
            <input
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-16"
              disabled={running}
              max={20}
              min={1}
              type="number"
              value={iterations}
              onChange={e => setIterations(Math.max(1, Math.min(20, Number(e.target.value))))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Network:</span>
            <select
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
              disabled={running}
              value={throttle}
              onChange={e => setThrottle(e.target.value as Throttle)}
            >
              {THROTTLES.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Button isDisabled={running} isPending={running} onPress={handleRun}>
            <PlayIcon className="mr-1.5" size={14} />
            {running ? 'Running…' : 'Run case'}
          </Button>
          <Button isDisabled={running} size="sm" variant="ghost" onPress={handleClearCaches}>
            <BroomIcon className="mr-1.5" size={12} /> Clear caches
          </Button>
          {doneRows.length > 0 && !running && (
            <Button size="sm" variant="ghost" onPress={handleExportCsv}>
              <DownloadSimpleIcon className="mr-1.5" size={12} /> Export CSV
            </Button>
          )}
        </div>

        {activeCase && (
          <div className="grid gap-2 text-[11px] text-white/40 sm:grid-cols-4">
            <Metric label="Base" value={formatBytes(activeCase.baseOriginalBytes)} />
            <Metric label="Next" value={formatBytes(activeCase.nextOriginalBytes)} />
            <Metric
              label="Changed"
              value={`${activeCase.changedFileCount}/${activeCase.fileCount} files · ${formatBytes(activeCase.changedOriginalBytes)}`}
            />
            <Metric label="Expected hash" value={activeCase.nextTreeSha256.slice(0, 12)} />
          </div>
        )}

        {progress && <div className="text-[11px] text-white/35">{progress}</div>}
        {topError && <div className="text-[11px] text-red-300">{topError}</div>}
      </Surface>

      <ResultsTable
        expectedHash={activeCase?.nextTreeSha256 ?? null}
        statuses={statuses}
        variants={variants}
      />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/30">{label}</div>
      <div className="mt-1 text-white/70">{value}</div>
    </div>
  )
}

function buildVariants(item: ApplyDiffCase): Variant[] {
  const native: Variant[] = [
    { id: 'http-raw-full', label: 'http raw full 1.0.1', kind: 'native-full', encoding: 'raw' },
    {
      id: 'http-deflate-full',
      label: 'http deflate full 1.0.1',
      kind: 'native-full',
      encoding: 'deflate',
    },
    {
      id: 'http-brotli-full',
      label: 'http brotli full 1.0.1',
      kind: 'native-full',
      encoding: 'brotli',
    },
  ]
  const tokenVariants = item.tokens.map(token => ({
    id: `token-full-${token.id}`,
    label: `${token.id} full 1.0.1`,
    kind: 'token-full' as const,
    token,
  }))
  const diffVariants = item.tokens.map(token => ({
    id: `diff-apply-${token.id}`,
    label: `${token.id} diff apply`,
    kind: 'diff-apply' as const,
    token,
  }))
  const rangeVariants = item.tokens
    .filter(token => token.rangePackBytes)
    .flatMap(token => [
      {
        id: `range-fetch-${token.id}`,
        label: `${token.id} range changed fetch`,
        kind: 'range-changed-fetch' as const,
        token,
      },
      {
        id: `range-stream-${token.id}`,
        label: `${token.id} range changed stream`,
        kind: 'range-changed-stream' as const,
        token,
      },
    ])

  return [...native, ...tokenVariants, ...diffVariants, ...rangeVariants]
}

function ResultsTable({
  variants,
  statuses,
  expectedHash,
}: {
  variants: Variant[]
  statuses: StatusMap
  expectedHash: string | null
}) {
  const doneRows = variants
    .map(variant => statuses.get(variant.id))
    .filter((status): status is { state: 'done'; row: RowResult } => status?.state === 'done')
    .map(status => status.row)
  const bestOverall = bestRow(doneRows)
  const bestBySection = bestRowIdsBySection(doneRows)

  return (
    <Surface className="rounded-2xl p-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-white/35">
            <tr className="border-b border-white/10">
              <th className="px-3 py-3">Variant</th>
              <th className="px-3 py-3">Group</th>
              <th className="px-3 py-3 text-right">TTFB</th>
              <th className="px-3 py-3 text-right">Transfer</th>
              <th className="px-3 py-3 text-right">Decode</th>
              <th className="px-3 py-3 text-right">Apply</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-right">P95</th>
              <th className="px-3 py-3 text-right">Wire</th>
              <th className="px-3 py-3">Verify</th>
              <th className="px-3 py-3 text-right">vs best</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => {
              const section = sectionLabel(variant.kind)
              const previousSection = index > 0 ? sectionLabel(variants[index - 1].kind) : null

              return (
                <Fragment key={variant.id}>
                  {section !== previousSection && (
                    <tr key={`${section}-section`} className="border-b border-white/5">
                      <td
                        className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-widest text-white/30"
                        colSpan={11}
                      >
                        {section}
                      </td>
                    </tr>
                  )}
                  <ResultRow
                    bestOverall={bestOverall}
                    bestOverallId={bestOverall?.id ?? null}
                    bestSectionIds={bestBySection}
                    expectedHash={expectedHash}
                    status={statuses.get(variant.id) ?? { state: 'pending' }}
                    variant={variant}
                  />
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}

function ResultRow({
  variant,
  status,
  bestOverall,
  bestOverallId,
  bestSectionIds,
  expectedHash,
}: {
  variant: Variant
  status: Status
  bestOverall: RowResult | null
  bestOverallId: string | null
  bestSectionIds: Set<string>
  expectedHash: string | null
}) {
  const isBest = status.state === 'done' && status.row.id === bestOverallId
  const isSectionBest = status.state === 'done' && bestSectionIds.has(status.row.id)
  const streamingClass = isStreamVariant(variant)
    ? 'border-l-2 border-purple-500/40 bg-purple-500/[0.025]'
    : ''

  if (status.state === 'pending' || status.state === 'running') {
    return (
      <tr className={`border-b border-white/8 text-white/35 ${streamingClass}`}>
        <VariantCell isBest={false} isSectionBest={false} status="idle" variant={variant} />
        <td className="px-3 py-3">{kindLabel(variant.kind)}</td>
        <td className="px-3 py-3" colSpan={9}>
          {status.state === 'running' ? 'running…' : 'queued'}
        </td>
      </tr>
    )
  }

  if (status.state === 'errored') {
    return (
      <tr className={`border-b border-red-400/10 bg-red-500/5 text-red-300 ${streamingClass}`}>
        <VariantCell isBest={false} isSectionBest={false} status="error" variant={variant} />
        <td className="px-3 py-3">{kindLabel(variant.kind)}</td>
        <td className="px-3 py-3" colSpan={9}>
          {status.error}
        </td>
      </tr>
    )
  }

  const row = status.row
  const expectedShort = expectedHash?.slice(0, 16)
  const ok = !expectedShort || row.kind === 'native-full' || row.verifyHash === expectedShort

  return (
    <tr className={`border-b border-white/8 text-white/70 ${streamingClass}`}>
      <VariantCell isBest={isBest} isSectionBest={isSectionBest} status="done" variant={variant} />
      <td className="px-3 py-3 text-white/45">{kindLabel(row.kind)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.ttfbMs)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.transferMs)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.decodeMs)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.applyMs)}</td>
      <td
        className={`px-3 py-3 text-right font-semibold ${
          isBest || isSectionBest ? 'text-green-300' : 'text-white'
        }`}
      >
        {formatMs(row.median.totalMs)}
      </td>
      <td className="px-3 py-3 text-right text-white/45">{formatMs(row.p95.totalMs)}</td>
      <td className="px-3 py-3 text-right">{formatBytes(row.median.wireBytes)}</td>
      <td className={ok ? 'px-3 py-3 text-green-300/80' : 'px-3 py-3 text-red-300'}>
        {row.verifyHash ?? '—'} · {formatBytes(row.verifyBytes)}
      </td>
      <td className="px-3 py-3 text-right">
        <BestCompareCell best={bestOverall} row={row} />
      </td>
    </tr>
  )
}

function VariantCell({
  variant,
  isBest,
  isSectionBest,
  status,
}: {
  variant: Variant
  isBest: boolean
  isSectionBest: boolean
  status: 'idle' | 'done' | 'error'
}) {
  const isToken = Boolean(variant.token)
  const isStream = isStreamVariant(variant)
  const labelClass =
    status === 'error'
      ? 'text-red-300/85'
      : isBest || isSectionBest
        ? 'text-green-400 font-medium'
        : 'text-white/85'

  return (
    <td className="px-3 py-3 font-medium">
      <span className={labelClass}>
        <span className="font-mono">{variant.label}</span>
        {isToken && <TableBadge tone="blue">TK</TableBadge>}
        {isStream && <TableBadge tone="purple">STREAM</TableBadge>}
        {(isBest || isSectionBest) && <TableBadge tone="green">BEST</TableBadge>}
      </span>
    </td>
  )
}

function TableBadge({ children, tone }: { children: string; tone: 'blue' | 'green' | 'purple' }) {
  const toneClass = {
    blue: 'bg-blue-500/15 text-blue-300',
    green: 'bg-green-500/15 text-green-300',
    purple: 'bg-purple-500/15 text-purple-300',
  }[tone]

  return (
    <span
      className={`ml-1.5 rounded px-1 py-0.5 text-[9px] uppercase tracking-widest ${toneClass}`}
    >
      {children}
    </span>
  )
}

function BestCompareCell({ row, best }: { row: RowResult; best: RowResult | null }) {
  if (!best) return <span className="text-white/25">—</span>

  const base = best.median.totalMs
  const value = row.median.totalMs

  if (!Number.isFinite(base) || !Number.isFinite(value) || base <= 0 || value <= 0) {
    return <span className="text-white/25">—</span>
  }

  const ratio = value / base
  const isBest = row.id === best.id

  return <span className={isBest ? 'text-green-300' : 'text-red-300'}>{ratio.toFixed(1)}x</span>
}

function sectionLabel(kind: Variant['kind']): string {
  switch (kind) {
    case 'native-full':
      return 'full http'
    case 'token-full':
      return 'full token'
    case 'diff-apply':
      return 'diff token'
    case 'range-changed-fetch':
    case 'range-changed-stream':
      return 'pixel-range changed file ranges'
  }
}

function kindLabel(kind: Variant['kind']): string {
  switch (kind) {
    case 'native-full':
      return 'full http'
    case 'token-full':
      return 'full token'
    case 'diff-apply':
      return 'diff token'
    case 'range-changed-fetch':
      return 'range fetch'
    case 'range-changed-stream':
      return 'range stream'
  }
}

function isStreamVariant(variant: Variant): boolean {
  return Boolean(variant.token?.streamable) || variant.kind === 'range-changed-stream'
}

function bestRow(rows: RowResult[]): RowResult | null {
  return rows.reduce<RowResult | null>(
    (best, row) => (!best || row.median.totalMs < best.median.totalMs ? row : best),
    null,
  )
}

function bestRowIdsBySection(rows: RowResult[]): Set<string> {
  const bySection = new Map<string, RowResult[]>()

  for (const row of rows) {
    const section = sectionLabel(row.kind)
    const items = bySection.get(section)

    if (items) {
      items.push(row)
    } else {
      bySection.set(section, [row])
    }
  }

  return new Set(
    Array.from(bySection.values())
      .map(items => bestRow(items)?.id)
      .filter((id): id is string => Boolean(id)),
  )
}

function waitForPaint(): Promise<void> {
  if (typeof requestAnimationFrame === 'undefined') {
    return Promise.resolve()
  }

  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}
