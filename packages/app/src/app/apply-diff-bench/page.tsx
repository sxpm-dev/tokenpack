'use client'

import { Button, Surface } from '@heroui/react'
import { BroomIcon, DownloadSimpleIcon, FloppyDiskIcon, PlayIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'

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

interface Baseline {
  createdAt: string
  caseId: string
  throttle: string
  iterations: number
  rows: RowResult[]
}

export default function ApplyDiffBenchPage() {
  const [manifest, setManifest] = useState<ApplyDiffManifest | null>(null)
  const [caseId, setCaseId] = useState('')
  const [iterations, setIterations] = useState(5)
  const [throttle, setThrottle] = useState<Throttle>('local')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [statuses, setStatuses] = useState<StatusMap>(new Map())
  const [topError, setTopError] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<Baseline | null>(null)
  const [baselineMessage, setBaselineMessage] = useState('')

  useEffect(() => {
    fetch('/api/apply-diff-benchmark/manifest', { cache: 'no-store' })
      .then(r => r.json())
      .then((m: ApplyDiffManifest) => {
        setManifest(m)
        if (m.cases[0]) setCaseId(m.cases[0].id)
      })
      .catch(e => setTopError(String(e)))
  }, [])

  useEffect(() => {
    if (!caseId) return
    const controller = new AbortController()
    const params = new URLSearchParams({
      case: caseId,
      iterations: String(iterations),
      throttle,
    })

    fetch(`/api/apply-diff-benchmark/baseline?${params}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`baseline fetch failed: ${r.status}`)

        return r.json() as Promise<Baseline | null>
      })
      .then(setBaseline)
      .catch(e => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setTopError(String(e))
      })

    return () => controller.abort()
  }, [caseId, iterations, throttle])

  const activeCase = useMemo(
    () => manifest?.cases.find(item => item.id === caseId) ?? manifest?.cases[0] ?? null,
    [manifest, caseId],
  )
  const variants = useMemo(() => (activeCase ? buildVariants(activeCase) : []), [activeCase])
  const currentBaseline = useMemo(() => {
    if (!baseline) return null
    if (baseline.caseId !== caseId) return null
    if (baseline.throttle !== throttle) return null
    if (baseline.iterations !== iterations) return null

    return baseline
  }, [baseline, caseId, iterations, throttle])
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
    setBaselineMessage('')
    setProgress('Preparing cached v1.0.0 base packs…')
    setStatuses(new Map(variants.map(variant => [variant.id, { state: 'pending' } as Status])))

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

      for (const tokenId of tokenIds) {
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

  async function handleSaveBaseline() {
    if (!activeCase || doneRows.length === 0) return
    setTopError(null)
    setBaselineMessage('')

    try {
      const response = await fetch('/api/apply-diff-benchmark/baseline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          throttle,
          iterations,
          rows: doneRows,
        }),
      })

      if (!response.ok) throw new Error(`save baseline failed: ${response.status}`)
      const saved = (await response.json()) as Baseline

      setBaseline(saved)
      setBaselineMessage(
        `Baseline saved · ${doneRows.length} rows · ${iterations} iterations · ${throttle}`,
      )
      window.setTimeout(() => setBaselineMessage(''), 3000)
    } catch (e: unknown) {
      setTopError(e instanceof Error ? e.message : String(e))
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
              onChange={e => {
                setBaselineMessage('')
                setCaseId(e.target.value)
              }}
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
              onChange={e => {
                setBaselineMessage('')
                setIterations(Math.max(1, Math.min(20, Number(e.target.value))))
              }}
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Network:</span>
            <select
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
              disabled={running}
              value={throttle}
              onChange={e => {
                setBaselineMessage('')
                setThrottle(e.target.value as Throttle)
              }}
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
          {doneRows.length > 0 && !running && (
            <Button size="sm" variant="ghost" onPress={handleSaveBaseline}>
              <FloppyDiskIcon className="mr-1.5" size={12} /> Save as baseline
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

        {currentBaseline && (
          <div className="text-[11px] text-white/35">
            Baseline: {currentBaseline.rows.length} rows · {currentBaseline.iterations} iterations ·{' '}
            {currentBaseline.throttle} · {new Date(currentBaseline.createdAt).toLocaleString()}
          </div>
        )}
        {baselineMessage && <div className="text-[11px] text-green-300/80">{baselineMessage}</div>}
        {progress && <div className="text-[11px] text-white/35">{progress}</div>}
        {topError && <div className="text-[11px] text-red-300">{topError}</div>}
      </Surface>

      <ResultsTable
        baseline={currentBaseline}
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
  baseline,
  expectedHash,
}: {
  variants: Variant[]
  statuses: StatusMap
  baseline: Baseline | null
  expectedHash: string | null
}) {
  const baselineRows = useMemo(
    () => new Map((baseline?.rows ?? []).map(row => [row.id, row])),
    [baseline],
  )

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
              <th className="px-3 py-3 text-right">vs baseline</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(variant => (
              <ResultRow
                key={variant.id}
                baseline={baselineRows.get(variant.id) ?? null}
                expectedHash={expectedHash}
                status={statuses.get(variant.id) ?? { state: 'pending' }}
                variant={variant}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}

function ResultRow({
  variant,
  status,
  baseline,
  expectedHash,
}: {
  variant: Variant
  status: Status
  baseline: RowResult | null
  expectedHash: string | null
}) {
  if (status.state === 'pending' || status.state === 'running') {
    return (
      <tr className="border-b border-white/8 text-white/35">
        <td className="px-3 py-3 text-white/70">{variant.label}</td>
        <td className="px-3 py-3">{kindLabel(variant.kind)}</td>
        <td className="px-3 py-3" colSpan={9}>
          {status.state === 'running' ? 'running…' : 'queued'}
        </td>
      </tr>
    )
  }

  if (status.state === 'errored') {
    return (
      <tr className="border-b border-red-400/10 bg-red-500/5 text-red-300">
        <td className="px-3 py-3">{variant.label}</td>
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
    <tr className="border-b border-white/8 text-white/70">
      <td className="px-3 py-3 font-medium text-white/85">{variant.label}</td>
      <td className="px-3 py-3 text-white/45">{kindLabel(row.kind)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.ttfbMs)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.transferMs)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.decodeMs)}</td>
      <td className="px-3 py-3 text-right">{formatMs(row.median.applyMs)}</td>
      <td className="px-3 py-3 text-right font-semibold text-white">
        {formatMs(row.median.totalMs)}
      </td>
      <td className="px-3 py-3 text-right text-white/45">{formatMs(row.p95.totalMs)}</td>
      <td className="px-3 py-3 text-right">{formatBytes(row.median.wireBytes)}</td>
      <td className={ok ? 'px-3 py-3 text-green-300/80' : 'px-3 py-3 text-red-300'}>
        {row.verifyHash ?? '—'} · {formatBytes(row.verifyBytes)}
      </td>
      <td className="px-3 py-3 text-right">{baseline ? delta(row, baseline) : '—'}</td>
    </tr>
  )
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

function delta(row: RowResult, baseline: RowResult): string {
  const value = row.median.totalMs
  const base = baseline.median.totalMs

  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return '—'

  const diff = value - base
  const pct = (diff / base) * 100

  return `${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}
