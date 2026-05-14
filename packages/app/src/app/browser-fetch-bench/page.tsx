'use client'

import { Button, Surface } from '@heroui/react'
import {
  BroomIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  DownloadSimpleIcon,
  FloppyDiskIcon,
  MinusCircleIcon,
  PlayIcon,
  WarningOctagonIcon,
} from '@phosphor-icons/react'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { formatBytes, formatMs, runVariant } from './runner'
import type { AggregatedRow, BenchTab, RouterFixtureStats, Throttle, Variant } from './types'
import { EXACT_VARIANTS, SCRIPT_VARIANTS, TEXT_VARIANTS } from './variants'

interface ThrottleOption {
  id: Throttle
  label: string
}

const THROTTLE_OPTIONS: readonly ThrottleOption[] = [
  { id: 'local', label: 'Local' },
  { id: 'fast-cdn', label: 'Fast CDN' },
  { id: 'average', label: 'Average' },
  { id: 'slow', label: 'Slow shared' },
  { id: 'slow-parallel', label: 'Slow parallel' },
] as const

interface Manifest {
  sources: RuntimeCase[]
  rangePackCases: RuntimeRangePackCase[]
  routerCases: RuntimeRouterCase[]
  scriptCases: RuntimeCase[]
  scenarios: { id: string; available: boolean; mime: string | null }[]
}

interface RuntimeCase {
  id: string
  source: string
  sourceKind: 'json' | 'text'
  chunkCount: number
  rawBytes: number
  chunkIndexes: number[]
}

interface RuntimeRangePackCase {
  id: string
  tab?: 'content' | 'script'
  source: string
  sourceKind: 'json' | 'text'
  chunkCount: number
  rawBytes: number
  fileCount: number
}

interface RuntimeRouterCase {
  id: string
  tab?: 'content' | 'script'
  source: string
  sourceKind: 'json' | 'text'
  chunkCount: number
  rawBytes: number
  fileCount: number
  chunkTokenCount: number
  wireBytes: number
  requestCount: number
}

// Per-variant lifecycle. The table renders one row per variant in every state
// so skipped, in-flight, queued, and failed runs are all visible at once.
type VariantStatus =
  | { state: 'pending' }
  | { state: 'running' }
  | { state: 'done'; row: AggregatedRow }
  | { state: 'errored'; error: string }
  | { state: 'skipped'; reason: string }

type StatusMap = Map<string, VariantStatus>

interface RuntimeBaseline {
  createdAt: string
  tab: BenchTab
  source: string
  throttle: Throttle
  iterations: number
  rows: AggregatedRow[]
}

function emptyMap(): StatusMap {
  return new Map()
}

function initialStatuses(variants: Variant[], runSkipped: boolean): StatusMap {
  const m = new Map<string, VariantStatus>()

  for (const v of variants) {
    if (!runSkipped && v.compat === 'partial') {
      m.set(v.id, {
        state: 'skipped',
        reason:
          'Partial-compat — needs DecompressionStream(\'br\'). Toggle "Run skipped" to include.',
      })
    } else {
      m.set(v.id, { state: 'pending' })
    }
  }

  return m
}

export default function RuntimeBenchmarkPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [source, setSource] = useState('')
  const [iterations, setIterations] = useState(5)
  const [activeTab, setActiveTab] = useState<BenchTab>('source')
  const [throttle, setThrottle] = useState<Throttle>('local')
  // Partial-compat token variants (the brotli-decode ones) fail on Chromium <
  // 124 / Firefox < 126 / Safari < 18. Default-skipped so first-time runs are
  // clean; toggle to include them.
  const [runSkipped, setRunSkipped] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [textStatuses, setTextStatuses] = useState<StatusMap>(emptyMap)
  const [exactStatuses, setExactStatuses] = useState<StatusMap>(emptyMap)
  const [scriptStatuses, setScriptStatuses] = useState<StatusMap>(emptyMap)
  const [deselectedTextVariants, setDeselectedTextVariants] = useState<Set<string>>(() => new Set())
  const [deselectedExactVariants, setDeselectedExactVariants] = useState<Set<string>>(
    () => new Set(),
  )
  const [deselectedScriptVariants, setDeselectedScriptVariants] = useState<Set<string>>(
    () => new Set(),
  )
  const [topError, setTopError] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<RuntimeBaseline | null>(null)
  const [baselineMessage, setBaselineMessage] = useState('')

  useEffect(() => {
    fetch('/api/runtime-benchmark/manifest', { cache: 'no-store' })
      .then(r => r.json())
      .then((m: Manifest) => {
        setManifest(m)
        const first = contentCasesFor(m)[0] ?? scriptCasesFor(m)[0]

        if (first) setSource(first.id)
      })
      .catch(e => setTopError(String(e)))
  }, [])

  useEffect(() => {
    if (!source) return

    const controller = new AbortController()
    const params = new URLSearchParams({
      iterations: String(iterations),
      source,
      tab: activeTab,
      throttle,
    })

    fetch(`/api/runtime-benchmark/baseline?${params}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`baseline fetch failed: ${r.status}`)

        return r.json() as Promise<RuntimeBaseline | null>
      })
      .then(setBaseline)
      .catch(e => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setTopError(String(e))
      })

    return () => controller.abort()
  }, [activeTab, iterations, source, throttle])

  const textVariants = useMemo(
    () => filterGeneratedVariants(TEXT_VARIANTS, manifest, 'content'),
    [manifest],
  )
  const exactVariants = useMemo(
    () => filterGeneratedVariants(EXACT_VARIANTS, manifest, 'content'),
    [manifest],
  )
  const scriptVariants = useMemo(
    () => filterGeneratedVariants(SCRIPT_VARIANTS, manifest, 'script'),
    [manifest],
  )

  const currentBaseline = useMemo(() => {
    if (!baseline) return null
    if (baseline.tab !== activeTab) return null
    if (baseline.source !== source) return null
    if (baseline.throttle !== throttle) return null
    if (baseline.iterations !== iterations) return null

    return baseline
  }, [activeTab, baseline, iterations, source, throttle])

  async function handleRun() {
    if (!manifest) return
    setRunning(true)
    setTopError(null)

    const isScriptTab = activeTab === 'script'
    const allVariants =
      activeTab === 'source' ? textVariants : activeTab === 'exact' ? exactVariants : scriptVariants
    const deselectedVariants =
      activeTab === 'source'
        ? deselectedTextVariants
        : activeTab === 'exact'
          ? deselectedExactVariants
          : deselectedScriptVariants
    // Variants we'll actually iterate. Skipped variants get a 'skipped' status
    // up front so the table renders them with a clear marker — they aren't
    // hidden, just not run.
    const toRun = allVariants.filter(
      v => !deselectedVariants.has(v.id) && (runSkipped || v.compat !== 'partial'),
    )
    const setStatuses =
      activeTab === 'source'
        ? setTextStatuses
        : activeTab === 'exact'
          ? setExactStatuses
          : setScriptStatuses

    const initial = initialStatuses(allVariants, runSkipped)

    for (const variant of allVariants) {
      if (deselectedVariants.has(variant.id)) {
        initial.set(variant.id, { state: 'skipped', reason: 'Unchecked for this run.' })
      }
    }

    setStatuses(initial)

    try {
      if (toRun.length === 0) {
        setProgress('No selected variants to run.')
        window.setTimeout(() => setProgress(''), 2000)

        return
      }

      for (let i = 0; i < toRun.length; i++) {
        const variant: Variant = toRun[i]

        setProgress(`[${i + 1}/${toRun.length}] ${variant.id} (${iterations} iterations)`)
        setStatuses(prev => new Map(prev).set(variant.id, { state: 'running' }))
        try {
          const row = await runVariant(variant, iterations, {
            source,
            sourceKind: activeCase?.sourceKind ?? 'text',
            withExecute: isScriptTab,
            throttle,
            routerFixtureStats: routerFixtureStatsFor(manifest, activeTab, source),
          })

          setStatuses(prev => new Map(prev).set(variant.id, { state: 'done', row }))
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)

          setStatuses(prev => new Map(prev).set(variant.id, { state: 'errored', error: msg }))
        }
      }

      setProgress('')
    } finally {
      setRunning(false)
    }
  }

  async function handleClearCaches() {
    try {
      if ('caches' in self) {
        const names = await caches.keys()

        await Promise.all(names.map(n => caches.delete(n)))
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()

        await Promise.all(regs.map(r => r.unregister()))
      }
      setProgress('Caches cleared.')
      window.setTimeout(() => setProgress(''), 2000)
    } catch (e: unknown) {
      setTopError(`clear caches failed: ${e instanceof Error ? e.message : e}`)
    }
  }

  function handleExportCsv() {
    const lines: string[] = []

    lines.push(
      'group,variant,iterations,median_total_ms,p95_total_ms,median_decode_ms,median_execute_ms,wire_bytes,requests,router_plan_kind,router_plan_mode,router_plan_reason,router_plan_requests,router_plan_fetched_bytes,router_plan_selected_bytes,router_plan_chunks,router_plan_segments,router_plan_concurrency,decoded_hash,decoded_bytes,per_run_total_ms',
    )
    for (const s of textStatuses.values()) {
      if (s.state === 'done') lines.push(csvRow('text', s.row))
    }
    for (const s of exactStatuses.values()) {
      if (s.state === 'done') lines.push(csvRow('exact', s.row))
    }
    for (const s of scriptStatuses.values()) {
      if (s.state === 'done') lines.push(csvRow('script', s.row))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `runtime-bench-${source}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSaveBaseline() {
    const rows = doneRowsFromStatuses(activeStatuses)

    if (!rows.length) return
    setTopError(null)
    setBaselineMessage('')

    try {
      const res = await fetch('/api/runtime-benchmark/baseline', {
        body: JSON.stringify({
          tab: activeTab,
          source,
          throttle,
          iterations,
          rows,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })

      if (!res.ok) throw new Error(`save baseline failed: ${res.status}`)
      const saved = (await res.json()) as RuntimeBaseline

      setBaseline(saved)
      setBaselineMessage(
        `Baseline saved · ${rows.length} rows · ${iterations} iterations · ${throttle}`,
      )
      window.setTimeout(() => setBaselineMessage(''), 3000)
    } catch (e: unknown) {
      setTopError(e instanceof Error ? e.message : String(e))
    }
  }

  function handleTabChange(nextTab: BenchTab) {
    setActiveTab(nextTab)
    setBaselineMessage('')

    const nextCases = nextTab === 'script' ? scriptCasesFor(manifest) : contentCasesFor(manifest)

    if (nextCases?.[0] && !nextCases.some(item => item.id === source)) {
      setSource(nextCases[0].id)
    }
  }

  if (!manifest) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-white/30 text-sm animate-pulse">Loading manifest…</div>
      </div>
    )
  }

  const isScriptTab = activeTab === 'script'
  const activeStatuses =
    activeTab === 'source' ? textStatuses : activeTab === 'exact' ? exactStatuses : scriptStatuses
  const activeVariants =
    activeTab === 'source' ? textVariants : activeTab === 'exact' ? exactVariants : scriptVariants
  const activeDeselectedVariants =
    activeTab === 'source'
      ? deselectedTextVariants
      : activeTab === 'exact'
        ? deselectedExactVariants
        : deselectedScriptVariants
  const activeCases = isScriptTab ? scriptCasesFor(manifest) : contentCasesFor(manifest)
  const activeCaseIndex = activeCases.findIndex(item => item.id === source)
  const activeCase = activeCaseIndex >= 0 ? activeCases[activeCaseIndex] : null
  const hasAnyDone = [...activeStatuses.values()].some(s => s.state === 'done')
  const setActiveDeselectedVariants =
    activeTab === 'source'
      ? setDeselectedTextVariants
      : activeTab === 'exact'
        ? setDeselectedExactVariants
        : setDeselectedScriptVariants
  const selectedVariantCount = activeVariants.filter(
    variant => !activeDeselectedVariants.has(variant.id),
  ).length

  function handleVariantSelected(variantId: string, selected: boolean) {
    setActiveDeselectedVariants(previous => {
      const next = new Set(previous)

      if (selected) next.delete(variantId)
      else next.add(variantId)

      return next
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Browser Fetch Bench</h1>
        <p className="mt-0.5 text-xs text-white/40">
          Real-network download + decode (+ optional JS exec). Cache-busted per request.
        </p>
      </div>

      {/* Tab selector — Source content vs Generated script. Both use the same
          strategy id shape, but the script tab displays synthetic script sizes
          instead of source-file names. */}
      <div className="flex border-b border-white/10">
        <TabButton
          active={activeTab === 'source'}
          disabled={running}
          onClick={() => handleTabChange('source')}
        >
          Source content
          <span className="ml-2 text-[10px] text-white/35 font-normal normal-case tracking-normal">
            download + decode
          </span>
        </TabButton>
        <TabButton
          active={activeTab === 'exact'}
          disabled={running}
          onClick={() => handleTabChange('exact')}
        >
          Exact files
          <span className="ml-2 text-[10px] text-white/35 font-normal normal-case tracking-normal">
            selected files only
          </span>
        </TabButton>
        <TabButton
          active={activeTab === 'script'}
          disabled={running}
          onClick={() => handleTabChange('script')}
        >
          Generated script
          <span className="ml-2 text-[10px] text-white/35 font-normal normal-case tracking-normal">
            download + decode + run
          </span>
        </TabButton>
      </div>

      <Surface className="rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-white/50">{isScriptTab ? 'Script:' : 'Source:'}</span>
            <select
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
              disabled={running}
              value={source}
              onChange={e => {
                setBaselineMessage('')
                setSource(e.target.value)
              }}
            >
              {activeCases.map((s, index) => (
                <option key={s.id} value={s.id}>
                  {caseLabel(s, isScriptTab ? 'script' : 'source', index)}
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

          <label
            className="flex items-center gap-2"
            title="Server-side latency + bandwidth simulation. Matches /server-fetch-bench conditions."
          >
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
              {THROTTLE_OPTIONS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label
            className="flex items-center gap-1.5 text-[11px] text-white/55 cursor-pointer"
            title="Skipped cases are partial-compat token variants (max-webp3 / max-png3 / stream-png3). They need DecompressionStream('br') — Chromium ≥ 124, Firefox ≥ 126, Safari ≥ 18."
          >
            <input
              checked={runSkipped}
              disabled={running}
              type="checkbox"
              onChange={e => setRunSkipped(e.target.checked)}
            />
            Run skipped cases
          </label>

          <Button isDisabled={running} isPending={running} onPress={handleRun}>
            <PlayIcon className="mr-1.5" size={14} />{' '}
            {running
              ? 'Running…'
              : `Run ${activeTab === 'exact' ? 'exact' : isScriptTab ? 'script' : 'source'} (${selectedVariantCount})`}
          </Button>
          <Button isDisabled={running} size="sm" variant="ghost" onPress={handleClearCaches}>
            <BroomIcon className="mr-1.5" size={12} /> Clear caches
          </Button>
          {hasAnyDone && !running && (
            <Button size="sm" variant="ghost" onPress={handleExportCsv}>
              <DownloadSimpleIcon className="mr-1.5" size={12} /> Export CSV
            </Button>
          )}
          {hasAnyDone && !running && (
            <Button size="sm" variant="ghost" onPress={handleSaveBaseline}>
              <FloppyDiskIcon className="mr-1.5" size={12} /> Save as baseline
            </Button>
          )}
        </div>

        {currentBaseline && (
          <div className="text-[11px] text-white/35">
            Baseline: {currentBaseline.rows.length} rows · {currentBaseline.iterations} iterations ·{' '}
            {currentBaseline.throttle} · {new Date(currentBaseline.createdAt).toLocaleString()}
          </div>
        )}

        {baselineMessage && <div className="text-[11px] text-green-300/80">{baselineMessage}</div>}

        <div className="rounded border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-[11px] leading-4 text-yellow-200">
          <strong>Real-network mode.</strong> Disable Service Workers, close other tabs, and avoid
          running with devtools&apos; <em>Network throttling</em> active unless that&apos;s
          intentional. Every request appends a unique{' '}
          <code className="text-yellow-100">?nonce</code>, sets{' '}
          <code className="text-yellow-100">Cache-Control: no-store</code>, and uses{' '}
          <code className="text-yellow-100">
            fetch({'{'} cache: &apos;no-store&apos; {'}'})
          </code>{' '}
          — three layers of cache prevention.
        </div>

        {progress && <div className="text-[11px] text-white/45 animate-pulse">{progress}</div>}

        {topError && (
          <pre className="text-[11px] whitespace-pre-wrap text-red-400 bg-red-500/5 border border-red-500/15 rounded p-2">
            {topError}
          </pre>
        )}
      </Surface>

      {activeTab === 'source' ? (
        <>
          <SectionTitle>
            Source content · {throttle} · <code>{source}</code>
          </SectionTitle>
          <ResultsTable
            baseline={currentBaseline}
            deselectedVariantIds={activeDeselectedVariants}
            disabled={running}
            statuses={textStatuses}
            variants={activeVariants}
            withExecute={false}
            onSelectedChange={handleVariantSelected}
          />
          <RuntimeLegend withExecute={false} />
        </>
      ) : activeTab === 'exact' ? (
        <>
          <SectionTitle>
            Exact files · {throttle} · <code>{source}</code>
          </SectionTitle>
          <ResultsTable
            baseline={currentBaseline}
            deselectedVariantIds={activeDeselectedVariants}
            disabled={running}
            statuses={exactStatuses}
            variants={activeVariants}
            withExecute={false}
            onSelectedChange={handleVariantSelected}
          />
          <RuntimeLegend withExecute={false} />
        </>
      ) : (
        <>
          <SectionTitle>
            Generated script · {throttle} ·{' '}
            <code>{activeCase ? caseLabel(activeCase, 'script', activeCaseIndex) : source}</code>
          </SectionTitle>
          <ResultsTable
            withExecute
            baseline={currentBaseline}
            deselectedVariantIds={activeDeselectedVariants}
            disabled={running}
            statuses={scriptStatuses}
            variants={activeVariants}
            onSelectedChange={handleVariantSelected}
          />
          <RuntimeLegend withExecute />
        </>
      )}
    </div>
  )
}

function routerFixtureStatsFor(
  manifest: Manifest,
  tab: BenchTab,
  source: string,
): RouterFixtureStats | undefined {
  if (tab === 'exact') return undefined

  const apiTab = tab === 'source' ? 'content' : 'script'
  const routerCase = manifest.routerCases.find(item => item.tab === apiTab && item.id === source)

  return routerCase
    ? { wireBytes: routerCase.wireBytes, requestCount: routerCase.requestCount }
    : undefined
}

function filterGeneratedVariants(
  variants: Variant[],
  manifest: Manifest | null,
  tab: 'content' | 'script',
): Variant[] {
  if (!manifest) return variants.filter(v => !v.isToken)

  const availableTokenIds = new Set(manifest.scenarios.filter(s => s.available).map(s => s.id))
  const hasRangePackCases = manifest.rangePackCases.some(rangePack => rangePack.tab === tab)
  const hasRouterCases = manifest.routerCases.some(routerCase => routerCase.tab === tab)

  return variants.filter(v => {
    if (
      v.loadMode === 'range-pack-fetch' ||
      v.loadMode === 'range-pack-stream' ||
      v.loadMode === 'range-pack-exact-fetch' ||
      v.loadMode === 'range-pack-exact-stream'
    ) {
      return hasRangePackCases
    }
    if (
      v.loadMode === 'router-text' ||
      v.loadMode === 'router-exact-text' ||
      v.loadMode === 'router-materialize'
    ) {
      return hasRouterCases
    }

    return !v.isToken || availableTokenIds.has(v.id)
  })
}

function contentCasesFor(manifest: Manifest | null): RuntimeCase[] {
  return casesForTab(manifest, 'content')
}

function scriptCasesFor(manifest: Manifest | null): RuntimeCase[] {
  return casesForTab(manifest, 'script')
}

function casesForTab(manifest: Manifest | null, tab: 'content' | 'script'): RuntimeCase[] {
  if (!manifest) return []
  const out = new Map<string, RuntimeCase>()

  for (const item of tab === 'content' ? manifest.sources : manifest.scriptCases) {
    out.set(item.id, item)
  }
  for (const item of manifest.rangePackCases) {
    if (item.tab !== tab || out.has(item.id)) continue
    out.set(item.id, runtimeCaseFromPackCase(item))
  }
  for (const item of manifest.routerCases) {
    if (item.tab !== tab || out.has(item.id)) continue
    out.set(item.id, runtimeCaseFromPackCase(item))
  }

  return [...out.values()]
}

function runtimeCaseFromPackCase(item: RuntimeRangePackCase | RuntimeRouterCase): RuntimeCase {
  return {
    id: item.id,
    source: item.source,
    sourceKind: item.sourceKind,
    chunkCount: item.chunkCount,
    rawBytes: item.rawBytes,
    chunkIndexes: Array.from({ length: item.chunkCount }, (_, index) => index),
  }
}

function caseLabel(item: RuntimeCase, kind: 'source' | 'script', index = 0): string {
  const requestCount = `${item.chunkCount} request${item.chunkCount === 1 ? '' : 's'}`
  const size = formatBytes(item.rawBytes)

  if (kind === 'script') return `script profile ${index + 1} · ${requestCount} · ${size}`

  return `${item.source} · ${requestCount} · ${size}`
}

function RuntimeLegend({ withExecute }: { withExecute: boolean }) {
  return (
    <Surface className="rounded-2xl p-4 space-y-3">
      <div className="text-[10px] text-white/30 uppercase tracking-widest">
        Legend — what each column measures
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Def term="Variant">
          The encoding / transport under test. <code>http-*</code> rows fetch the source with the
          named <code>Content-Encoding</code>; <code>stream-*</code> / <code>max-*</code> rows fetch
          a TokenPack image and decode in JS. <code>http-raw</code> is the byte-for-byte baseline —
          its decoded hash sets the canonical Verify fingerprint that every other variant is checked
          against.
        </Def>

        <Def term="Compat">
          Whether the variant decodes in every modern browser (
          <span className="text-green-300">Full</span>) or requires a recent Chromium/Firefox/Safari
          that ships <code>DecompressionStream(&apos;br&apos;)</code> (
          <span className="text-yellow-300">Partial</span>).
        </Def>

        <Def term="TTFB">
          Time-to-first-byte: <code>fetch()</code> start → first network byte arrives. The server
          streams pre-generated fixtures from the unified benchmark manifest, so encode CPU is
          measured by the generator, not mixed into runtime fetch timings.
        </Def>

        <Def term="Transfer">
          <span className="text-white/60">HTTP variants</span>: <code>fetch()</code> start →{' '}
          <code>response.arrayBuffer()</code> resolves. Includes payload transfer and the
          browser&apos;s native <code>Content-Encoding</code> decompression, stopping when decoded
          response bytes are materialized.
          <br />
          <span className="text-white/60">Non-stream token variants</span>: <code>fetch()</code>{' '}
          start → <code>response.arrayBuffer()</code> resolves. This is token wire transfer only; JS
          decode is reported separately.
          <br />
          <span className="text-white/60">Stream token variants</span>: <code>fetch()</code> start →
          streaming decoder drain. Network and JS decode overlap, so Transfer is the pipeline
          window, not a separately additive network-only phase.
          {withExecute && (
            <>
              <br />
              <span className="text-white/60">
                Native <code>&lt;script&gt;</code> rows
              </span>
              : script tag append → browser load event. Browser fetch, content decoding,
              parse/compile, and execution are inside this native lifecycle, so use Total as the
              fair number.
            </>
          )}
        </Def>

        <Def term="Decode">
          <span className="text-white/60">HTTP variants</span>: source content materialization after
          bytes arrive: UTF-8 text decode for text/script cases, or JSON parse plus{' '}
          <code>Object.keys</code> verification for JSON cases. Browser-native{' '}
          <code>Content-Encoding</code> decode remains inside Transfer.
          <br />
          <span className="text-white/60">Token variants</span>: TokenPack JS decode plus the same
          text/JSON materialization used for HTTP rows.
        </Def>

        {withExecute && (
          <Def term="Execute">
            <span className="text-white/60">fetch-based rows</span>: time spent inside the script
            body invocation after script text is decoded. The body is identical across all variants.
            <br />
            <span className="text-white/60">
              <code>&lt;script&gt;</code> rows
            </span>
            : shown as <code>—</code> because browser script loading fetches, decompresses, and
            executes before the load event; that whole native path is included in Total.
            <br />
            <span className="text-white/60">Token script rows</span>: fetch and decode the token,
            create a Blob URL, insert it as a real <code>&lt;script&gt;</code>, then wait for the
            same benchmark callback as native script rows.
          </Def>
        )}

        <Def term="Total">
          End-to-end wall time: <code>fetch()</code> start → bytes ready
          {withExecute ? ' (+ executed)' : ''}. The single apples-to-apples column across HTTP and
          token variants.
        </Def>

        <Def term="P95">
          95th percentile of the per-iteration Total. High p95 vs median = jittery / variable
          timing.
        </Def>

        <Def term="Wire">
          Bytes pulled from the network — the on-the-wire (post-encoding, post-image-container)
          size. Native <code>&lt;script&gt;</code> rows rely on browser ResourceTiming; if the
          browser does not expose encoded size the table shows <code>—</code>. Pixel-range rows show
          compressed range payload accounting, not decoded source size.
        </Def>

        <Def term="Verify">
          SHA-256 short hash of the decoded payload. The first variant to complete sets the
          canonical (dashed-circle icon); every subsequent variant is compared (check =&nbsp;match,
          warning =&nbsp;mismatch — that&apos;s a real decoder bug worth investigating). Computed
          AFTER all timing samples, never enters any reported metric. Native script-tag rows verify
          by callback/expected payload length rather than decoded-byte hash.
        </Def>
      </dl>
    </Surface>
  )
}

function Def({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-white/55">{term}</dt>
      <dd className="text-[11px] leading-4 text-white/45">{children}</dd>
    </div>
  )
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
        active
          ? 'text-white'
          : 'text-white/40 hover:text-white/70 disabled:text-white/20 disabled:hover:text-white/20'
      }`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
      {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-white/80 rounded-t" />}
    </button>
  )
}

function csvRow(group: 'text' | 'exact' | 'script', r: AggregatedRow): string {
  return [
    group,
    r.variantId,
    r.iterations,
    r.median.totalMs,
    r.p95.totalMs,
    r.median.decodeMs,
    r.median.executeMs ?? '',
    r.median.wireBytes,
    r.median.requestCount,
    r.routerPlan?.kind ?? '',
    r.routerPlan?.mode ?? '',
    csvCell(r.routerPlan?.reason ?? ''),
    r.routerPlan?.requestCount ?? '',
    r.routerPlan?.fetchedBytes ?? '',
    r.routerPlan?.selectedBytes ?? '',
    r.routerPlan?.chunkCount ?? '',
    r.routerPlan?.segmentCount ?? '',
    r.routerPlan?.concurrency ?? '',
    r.fingerprint?.hash ?? '',
    r.fingerprint?.bytes ?? '',
    csvCell(r.perRunTotal.join(';')),
  ].join(',')
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

// Re-export for the page-export helper.
void csvRow

function doneRowsFromStatuses(statuses: StatusMap): AggregatedRow[] {
  return [...statuses.values()].flatMap(s => (s.state === 'done' ? [s.row] : []))
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1 mt-3">
      {children}
    </h2>
  )
}

function ResultsTable({
  variants,
  statuses,
  withExecute,
  baseline,
  deselectedVariantIds,
  disabled,
  onSelectedChange,
}: {
  variants: Variant[]
  statuses: StatusMap
  withExecute: boolean
  baseline: RuntimeBaseline | null
  deselectedVariantIds: ReadonlySet<string>
  disabled: boolean
  onSelectedChange: (variantId: string, selected: boolean) => void
}) {
  // Best total + canonical hash are computed only from completed runs.
  const doneRows: AggregatedRow[] = []

  for (const s of statuses.values()) {
    if (s.state === 'done') doneRows.push(s.row)
  }
  const bestTotal = doneRows.length ? Math.min(...doneRows.map(r => r.median.totalMs)) : Infinity
  const canonical = doneRows.find(r => r.fingerprint != null)?.fingerprint ?? null
  const baselineRows = useMemo(
    () => new Map((baseline?.rows ?? []).map(row => [row.variantId, row])),
    [baseline],
  )
  const visibleRows = useMemo(
    () =>
      variants.map(variant => ({
        variant,
        status: statuses.get(variant.id) ?? { state: 'pending' },
      })),
    [statuses, variants],
  )

  const colCount = withExecute ? 13 : 12

  if (visibleRows.length === 0) {
    return (
      <Surface className="rounded-2xl p-4">
        <div className="py-8 text-center text-[12px] text-white/35">
          Run this bench to populate results.
        </div>
      </Surface>
    )
  }

  return (
    <Surface className="rounded-2xl p-3.5 overflow-x-auto">
      <table className="w-full min-w-[96rem] table-fixed text-xs">
        <colgroup>
          <col className="w-10" />
          <col className="w-[19rem]" />
          <col className="w-[5.25rem]" />
          <col className="w-[6rem]" />
          <col className="w-[5.75rem]" />
          {withExecute && <col className="w-[5.75rem]" />}
          <col className="w-[5.5rem]" />
          <col className="w-[7rem]" />
          <col className="w-[5.25rem]" />
          <col className="w-[5.75rem]" />
          <col className="w-[3.75rem]" />
          <col className="w-[19rem]" />
          <col className="w-[19rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px]">
            <th className="w-8 py-2 px-2 font-normal" />
            <th className="px-2 py-2 text-left font-normal">Variant</th>
            <th className="px-2 py-2 text-right font-normal">TTFB</th>
            <th className="px-2 py-2 text-right font-normal">Transfer</th>
            <th className="px-2 py-2 text-right font-normal">Decode</th>
            {withExecute && <th className="px-2 py-2 text-right font-normal">Execute</th>}
            <th className="px-2 py-2 text-right font-normal">Total</th>
            <th className="px-2 py-2 text-right font-normal">vs Base</th>
            <th className="px-2 py-2 text-right font-normal">p95</th>
            <th className="px-2 py-2 text-right font-normal">Wire</th>
            <th className="px-2 py-2 text-right font-normal">Req</th>
            <th className="px-2 py-2 text-left font-normal">Plan</th>
            <th className="px-2 py-2 text-left font-normal">Verify</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(({ variant: v, status }, index) => {
            const section = variantSectionTitle(v)
            const prevSection =
              index > 0 ? variantSectionTitle(visibleRows[index - 1].variant) : null
            const showSection = section !== prevSection

            return (
              <Fragment key={v.id}>
                {showSection && (
                  <tr key={`${section}-section`} className="border-b border-white/5">
                    <td
                      className="pt-4 pb-1 px-2 text-[10px] uppercase tracking-widest text-white/30"
                      colSpan={colCount}
                    >
                      {section}
                    </td>
                  </tr>
                )}
                <ResultRow
                  baselineRow={baselineRows.get(v.id) ?? null}
                  bestTotal={bestTotal}
                  canonical={canonical}
                  colCount={colCount}
                  disabled={disabled}
                  selected={!deselectedVariantIds.has(v.id)}
                  status={status}
                  variant={v}
                  withExecute={withExecute}
                  onSelectedChange={onSelectedChange}
                />
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </Surface>
  )
}

function variantSectionTitle(variant: Variant): string {
  if (
    variant.loadMode === 'router-text' ||
    variant.loadMode === 'router-exact-text' ||
    variant.loadMode === 'router-materialize'
  ) {
    return 'Router token bundle'
  }
  if (
    variant.loadMode === 'range-pack-fetch' ||
    variant.loadMode === 'range-pack-stream' ||
    variant.loadMode === 'range-pack-exact-fetch' ||
    variant.loadMode === 'range-pack-exact-stream'
  ) {
    return 'Pixel-range partial file ranges'
  }
  if (variant.loadMode === 'script-tag') return 'Native script tag'
  if (variant.isToken) return 'Whole-token fetch + decode'

  return 'Native HTTP'
}

function ResultRow({
  variant,
  status,
  bestTotal,
  canonical,
  withExecute,
  colCount,
  baselineRow,
  selected,
  disabled,
  onSelectedChange,
}: {
  variant: Variant
  status: VariantStatus
  bestTotal: number
  canonical: AggregatedRow['fingerprint']
  withExecute: boolean
  colCount: number
  baselineRow: AggregatedRow | null
  selected: boolean
  disabled: boolean
  onSelectedChange: (variantId: string, selected: boolean) => void
}) {
  const checkboxCell = (
    <td className="py-1.5 px-2 align-middle">
      <input
        checked={selected}
        className="h-3.5 w-3.5 align-middle accent-green-500"
        disabled={disabled}
        title={selected ? 'Run this variant' : 'Variant unchecked'}
        type="checkbox"
        onChange={event => onSelectedChange(variant.id, event.target.checked)}
      />
    </td>
  )
  const variantCell = (
    <td className="px-2 py-1.5">
      <span
        className={
          status.state === 'done' && status.row.median.totalMs === bestTotal
            ? 'text-green-400 font-medium'
            : status.state === 'errored'
              ? 'text-red-300/85'
              : 'text-white/85'
        }
      >
        <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
          <span className="font-mono">{variant.label}</span>
          {variantChips(variant, status).map(chip => (
            <VariantChip key={chip.label} title={chip.title} tone={chip.tone}>
              {chip.label}
            </VariantChip>
          ))}
          {status.state === 'done' && status.row.median.totalMs === bestTotal && (
            <VariantChip tone="best">best</VariantChip>
          )}
        </span>
      </span>
    </td>
  )

  if (status.state === 'pending') {
    return (
      <tr className={`border-b border-white/5 ${selected ? 'opacity-50' : 'opacity-30'}`}>
        {checkboxCell}
        {variantCell}
        <td className="py-1.5 px-2 text-[10px] text-white/30 italic" colSpan={colCount - 2}>
          {selected ? 'queued' : 'unchecked'}
        </td>
      </tr>
    )
  }

  if (status.state === 'running') {
    return (
      <tr className="border-b border-white/5">
        {checkboxCell}
        {variantCell}
        <td className="py-1.5 px-2 text-[10px] text-white/55 animate-pulse" colSpan={colCount - 2}>
          running…
        </td>
      </tr>
    )
  }

  if (status.state === 'skipped') {
    return (
      <tr className={`border-b border-white/5 ${selected ? 'opacity-60' : 'opacity-30'}`}>
        {checkboxCell}
        {variantCell}
        <td className="py-1.5 px-2" colSpan={colCount - 2}>
          <span
            className="inline-flex items-center gap-1.5 text-[10.5px] text-white/45"
            title={status.reason}
          >
            <MinusCircleIcon className="text-white/35" size={12} />
            <span>skipped</span>
            <span className="text-[10px] text-white/30">— {status.reason}</span>
          </span>
        </td>
      </tr>
    )
  }

  if (status.state === 'errored') {
    return (
      <tr className={`border-b border-white/5 bg-red-500/[0.025] ${selected ? '' : 'opacity-30'}`}>
        {checkboxCell}
        {variantCell}
        <td className="py-1.5 px-2" colSpan={colCount - 2}>
          <span
            className="inline-flex items-center gap-1.5 text-[10.5px] text-red-300"
            title={status.error}
          >
            <WarningOctagonIcon className="text-red-400" size={12} weight="fill" />
            <span className="truncate max-w-[60ch]">{status.error}</span>
          </span>
        </td>
      </tr>
    )
  }

  // done
  const r = status.row
  const isBest = r.median.totalMs === bestTotal
  const streamingClass = variant.isStreamable
    ? 'border-l-2 border-purple-500/40 bg-purple-500/[0.025]'
    : ''

  return (
    <tr className={`border-b border-white/5 ${streamingClass} ${selected ? '' : 'opacity-30'}`}>
      {checkboxCell}
      {variantCell}
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/60">
        {formatMs(r.median.ttfbMs)}
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/70">
        {formatMs(r.median.transferMs)}
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/60">
        {formatMs(r.median.decodeMs)}
      </td>
      {withExecute && (
        <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/60">
          {r.median.executeMs !== null ? formatMs(r.median.executeMs) : '—'}
        </td>
      )}
      <td
        className={`whitespace-nowrap px-2 py-1.5 text-right tabular-nums font-medium ${
          isBest ? 'text-green-400' : 'text-white/85'
        }`}
      >
        {formatMs(r.median.totalMs)}
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
        <BaselineDeltaCell baseline={baselineRow} row={r} />
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/45">
        {formatMs(r.p95.totalMs)}
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/55">
        <WireCell row={r} variant={variant} />
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-white/45">
        {formatCount(r.median.requestCount)}
      </td>
      <td className="px-2 py-1.5">
        <PlanCell row={r} variant={variant} />
      </td>
      <td className="px-2 py-1.5">
        <VerifyCell canonical={canonical} row={r} variant={variant} />
      </td>
    </tr>
  )
}

type VariantChipTone =
  | 'http'
  | 'token'
  | 'router'
  | 'range'
  | 'fetch'
  | 'stream'
  | 'script'
  | 'best'

interface VariantChipInfo {
  label: string
  tone: VariantChipTone
  title?: string
}

function variantChips(variant: Variant, status: VariantStatus): VariantChipInfo[] {
  const chips: VariantChipInfo[] = []

  if (
    variant.loadMode === 'router-text' ||
    variant.loadMode === 'router-exact-text' ||
    variant.loadMode === 'router-materialize'
  ) {
    chips.push({ label: 'router', tone: 'router', title: 'Router token bundle' })
  } else if (
    variant.loadMode === 'range-pack-fetch' ||
    variant.loadMode === 'range-pack-stream' ||
    variant.loadMode === 'range-pack-exact-fetch' ||
    variant.loadMode === 'range-pack-exact-stream'
  ) {
    chips.push({ label: 'range', tone: 'range', title: 'HTTP Range over packed file regions' })
  } else if (variant.isToken) {
    chips.push({ label: 'tk', tone: 'token', title: 'Whole TokenPack image' })
  } else {
    chips.push({ label: 'http', tone: 'http', title: 'Native HTTP payload' })
  }

  const loadChip = variantLoadChip(variant, status)

  chips.push(loadChip)

  if (
    variant.loadMode === 'native-exact' ||
    variant.loadMode === 'range-pack-exact-fetch' ||
    variant.loadMode === 'range-pack-exact-stream'
  ) {
    chips.push({ label: 'exact', tone: 'fetch', title: 'Selected files only' })
  }

  if (variant.routerStrategy && variant.routerStrategy !== 'auto') {
    chips.push({
      label: variant.routerStrategy === 'full' ? 'full' : variant.routerStrategy,
      tone: variant.routerStrategy.includes('stream') ? 'stream' : 'fetch',
      title: `Router planner override: ${variant.routerStrategy}`,
    })
  }

  return chips
}

function variantLoadChip(variant: Variant, status: VariantStatus): VariantChipInfo {
  if (variant.loadMode === 'script-tag') {
    return { label: 'script', tone: 'script', title: 'Native <script src> load' }
  }

  if (
    status.state === 'done' &&
    status.row.routerPlan &&
    (variant.loadMode === 'router-text' ||
      variant.loadMode === 'router-exact-text' ||
      variant.loadMode === 'router-materialize')
  ) {
    return status.row.routerPlan.mode === 'stream'
      ? { label: 'stream', tone: 'stream', title: 'Router planner used streaming chunk reads' }
      : { label: 'fetch', tone: 'fetch', title: 'Router planner used buffered chunk/range reads' }
  }

  if (
    variant.loadMode === 'range-pack-stream' ||
    variant.loadMode === 'range-pack-exact-stream' ||
    variant.routerStrategy === 'range-stream' ||
    variant.routerStrategy === 'range-stream-all' ||
    (!variant.routerStrategy &&
      (variant.loadMode === 'router-text' ||
        variant.loadMode === 'router-exact-text' ||
        variant.loadMode === 'router-materialize')) ||
    variant.isStreamable
  ) {
    return { label: 'stream', tone: 'stream', title: 'Streaming decode/load path' }
  }

  return { label: 'fetch', tone: 'fetch', title: 'Buffered fetch/load path' }
}

function VariantChip({
  tone,
  title,
  children,
}: {
  tone: VariantChipTone
  title?: string
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'best'
      ? 'bg-green-500/15 text-green-300'
      : tone === 'stream'
        ? 'bg-purple-500/15 text-purple-300'
        : tone === 'fetch'
          ? 'bg-cyan-500/15 text-cyan-300'
          : tone === 'router'
            ? 'bg-emerald-500/15 text-emerald-300'
            : tone === 'range'
              ? 'bg-amber-500/15 text-amber-300'
              : tone === 'script'
                ? 'bg-orange-500/15 text-orange-300'
                : tone === 'http'
                  ? 'bg-slate-500/20 text-slate-300'
                  : 'bg-blue-500/15 text-blue-300'

  return (
    <span
      className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] uppercase tracking-widest ${toneClass}`}
      title={title}
    >
      {children}
    </span>
  )
}

function PlanCell({ row, variant }: { row: AggregatedRow; variant: Variant }) {
  const plan = row.routerPlan

  if (!plan) {
    if (
      variant.loadMode === 'router-text' ||
      variant.loadMode === 'router-exact-text' ||
      variant.loadMode === 'router-materialize'
    ) {
      return <span className="text-white/25">missing</span>
    }

    return <span className="text-white/25">—</span>
  }

  const detailLines = [
    `kind: ${plan.kind}`,
    `mode: ${plan.mode}`,
    `reason: ${plan.reason}`,
    `requests: ${plan.requestCount}`,
    `fetched: ${formatBytes(plan.fetchedBytes)}`,
    `selected: ${formatBytes(plan.selectedBytes)}`,
    `chunks: ${plan.chunkCount}`,
    `segments: ${plan.segmentCount}`,
    `concurrency: ${plan.concurrency}`,
    plan.ranges.length
      ? `ranges: ${plan.ranges
          .map(range => `${range.chunkId}@${range.offset}+${range.length}`)
          .join('; ')}`
      : '',
    plan.chunks.length ? `chunk ids: ${plan.chunks.map(chunk => chunk.id).join(', ')}` : '',
  ].filter(Boolean)

  return (
    <div className="max-w-full text-[10.5px] leading-4" title={detailLines.join('\n')}>
      <div className="font-mono text-white/70 truncate">
        {plan.kind}
        <span className="text-white/35"> · {plan.mode}</span>
      </div>
      <div className="text-white/35 truncate">
        {plan.reason} · {plan.requestCount} req · {formatBytes(plan.fetchedBytes)}
      </div>
    </div>
  )
}

function WireCell({ row, variant }: { row: AggregatedRow; variant: Variant }) {
  if (variant.loadMode === 'script-tag' && row.median.wireBytes === 0) {
    return (
      <span title="Browser ResourceTiming did not expose encodedBodySize for this script tag load.">
        —
      </span>
    )
  }

  return <span>{formatBytes(row.median.wireBytes)}</span>
}

function formatCount(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value)) : '—'
}

function BaselineDeltaCell({
  row,
  baseline,
}: {
  row: AggregatedRow
  baseline: AggregatedRow | null
}) {
  if (!baseline) return <span className="text-white/25">—</span>

  const delta = row.median.totalMs - baseline.median.totalMs
  const pct = baseline.median.totalMs > 0 ? (delta / baseline.median.totalMs) * 100 : 0
  const improved = delta < 0
  const neutral = Math.abs(delta) < 0.1
  const cls = neutral ? 'text-white/40' : improved ? 'text-green-400' : 'text-red-300'
  const sign = delta > 0 ? '+' : ''

  return (
    <span
      className={`inline-block whitespace-nowrap ${cls}`}
      title={`baseline: ${formatMs(baseline.median.totalMs)}`}
    >
      {sign}
      {formatMs(Math.abs(delta))} · {sign}
      {pct.toFixed(1)}%
    </span>
  )
}

function VerifyCell({
  row,
  canonical,
  variant,
}: {
  row: AggregatedRow
  canonical: AggregatedRow['fingerprint']
  variant: Variant
}) {
  const fp = row.fingerprint

  if (!fp) {
    if (variant.loadMode === 'script-tag') {
      return (
        <span
          className="inline-flex items-center gap-1 text-green-300/75 text-[10px]"
          title="The generated script called the benchmark callback with the expected chunk count and payload length."
        >
          <CheckCircleIcon size={12} weight="fill" />
          callback ok
        </span>
      )
    }

    return <span className="text-white/30 text-[10px]">—</span>
  }

  // First fingerprint in the group is canonical (no prior to compare against).
  const isCanonical = canonical === fp
  const matches = canonical && canonical.hash === fp.hash
  const status: 'canonical' | 'match' | 'mismatch' = isCanonical
    ? 'canonical'
    : matches
      ? 'match'
      : 'mismatch'

  const tooltip = [
    `hash: ${fp.hash}`,
    `bytes: ${fp.bytes.toLocaleString()}`,
    `head: ${fp.head}`,
    canonical && !isCanonical
      ? matches
        ? 'matches canonical hash'
        : `MISMATCH — canonical was ${canonical.hash}`
      : 'first variant — sets canonical hash for this group',
  ]
    .filter(Boolean)
    .join('\n')

  const Icon =
    status === 'mismatch'
      ? WarningOctagonIcon
      : status === 'match'
        ? CheckCircleIcon
        : CircleDashedIcon
  const colorCls =
    status === 'mismatch'
      ? 'text-red-400'
      : status === 'match'
        ? 'text-green-400/80'
        : 'text-white/45'
  const hashCls =
    status === 'mismatch' ? 'text-red-300' : status === 'match' ? 'text-white/55' : 'text-white/40'

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={tooltip}>
      <Icon className={colorCls} size={12} weight={status === 'mismatch' ? 'fill' : 'regular'} />
      <span className={`font-mono text-[10px] tabular-nums ${hashCls}`}>{fp.hash}</span>
      <span className="text-[10px] text-white/35 tabular-nums">{formatBytes(fp.bytes)}</span>
    </span>
  )
}
