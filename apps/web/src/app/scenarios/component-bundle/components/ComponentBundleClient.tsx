'use client'

import { Button, Surface } from '@heroui/react'
import { useCallback, useMemo, useState } from 'react'

import { ScenarioExplanation } from '@/components/ScenarioExplanation'
import type { AggregatedRow } from '@/lib/runner'
import { runVariant } from '@/lib/runner'
import { NETWORK_CONDITIONS, type ThrottleName } from '@/lib/throttle'
import { useSavedBenchRun } from '@/lib/use-saved-bench-run'
import { findScenario } from '@/scenarios/registry'
import type { FixtureFetcher, RunCtx, VariantDef } from '@/scenarios/types'

import { ComponentBundleResultsTable } from './ComponentBundleResultsTable'

const SIZE_TABS = [
  { sizeKb: 50, label: 'small (50 KB)' },
  { sizeKb: 200, label: 'medium (200 KB)' },
  { sizeKb: 1024, label: 'large (1 MB)' },
  { sizeKb: 5120, label: 'huge (5 MB)' },
]

export interface RunResult {
  variantId: string
  row?: AggregatedRow
  error?: string
}

export function ComponentBundleClient() {
  const scenario = findScenario('component-bundle')

  const [iterations, setIterations] = useState(5)
  const [throttle, setThrottle] = useState<ThrottleName>('local')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<Map<string, RunResult>>(new Map())
  const [selectedSize, setSelectedSize] = useState<number>(50)
  const [error, setError] = useState<string | null>(null)

  useSavedBenchRun(
    'scenario',
    JSON.stringify({ scenario: 'component-bundle', iterations, throttle }),
    running,
    Array.from(results),
    value => setResults(new Map(value)),
  )

  const variantsBySize = useMemo(() => {
    const m = new Map<number, VariantDef[]>()

    if (!scenario) return m
    for (const v of scenario.variants) {
      const match = v.id.match(/(\d+)kb/)
      const size = match ? Number(match[1]) : 0

      if (!m.has(size)) m.set(size, [])
      m.get(size)!.push(v)
    }

    return m
  }, [scenario])

  const visibleVariants = variantsBySize.get(selectedSize) ?? []

  const fetchFixture = useCallback<FixtureFetcher>(
    async (file: string, query?: Record<string, string>) => {
      if (!scenario) throw new Error('scenario missing')
      const params = new URLSearchParams({ throttle, ...query })
      const url = `/api/fixtures/${scenario.id}/${file}?${params.toString()}`

      return fetch(url, { cache: 'no-store', credentials: 'omit' })
    },
    [scenario, throttle],
  )

  const handleRun = useCallback(async () => {
    if (!scenario || running) return
    setRunning(true)
    setError(null)
    setResults(new Map())

    try {
      const ctx: RunCtx = { scenarioId: scenario.id, size: null, fetchFixture }
      const next = new Map<string, RunResult>()

      for (const v of scenario.variants) {
        try {
          const row = await runVariant(v, ctx, iterations)

          next.set(v.id, { variantId: v.id, row })
        } catch (e: unknown) {
          next.set(v.id, {
            variantId: v.id,
            error: e instanceof Error ? e.message : String(e),
          })
        }
        setResults(new Map(next))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }, [scenario, running, fetchFixture, iterations])

  // Best / worst per visible size group — by median totalMs of done rows.
  const { bestId, worstId } = useMemo(() => {
    let best: { id: string; ms: number } | null = null
    let worst: { id: string; ms: number } | null = null

    for (const v of visibleVariants) {
      const r = results.get(v.id)

      if (!r?.row) continue
      const ms = r.row.totalMs.median

      if (!Number.isFinite(ms)) continue
      if (!best || ms < best.ms) best = { id: v.id, ms }
      if (!worst || ms > worst.ms) worst = { id: v.id, ms }
    }

    return { bestId: best?.id ?? null, worstId: worst?.id ?? null }
  }, [visibleVariants, results])

  if (!scenario) return null

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{scenario.name}</h1>
        <p className="mt-1 text-sm text-tp-muted">{scenario.description}</p>
      </div>

      <Surface className="rounded-2xl p-4">
        <details open>
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-tp-muted mb-2">
            About this scenario
          </summary>
          <ScenarioExplanation markdown={scenario.explanation} />
        </details>
      </Surface>

      <Surface className="rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-tp-muted">
            Iterations
            <input
              className="w-20 bg-black/30 border border-tp-border rounded px-2 py-1 text-xs text-tp-fg normal-case"
              max={20}
              min={1}
              type="number"
              value={iterations}
              onChange={e => setIterations(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-tp-muted">
            Throttle
            <select
              className="bg-black/30 border border-tp-border rounded px-2 py-1 text-xs text-tp-fg normal-case"
              value={throttle}
              onChange={e => setThrottle(e.target.value as ThrottleName)}
            >
              {NETWORK_CONDITIONS.map(c => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <Button isDisabled={running} isPending={running} onPress={handleRun}>
            {running ? 'Running…' : 'Run all'}
          </Button>
          <p className="text-[11px] text-tp-muted">
            All sizes run on every Run; switch tabs to compare without re-running.
          </p>
        </div>
        {error && <p className="text-xs text-red-400 break-all">Run failed: {error}</p>}
      </Surface>

      <Surface className="rounded-2xl p-3.5 space-y-3">
        <div className="inline-flex rounded-md border border-tp-border overflow-hidden">
          {SIZE_TABS.map(t => {
            const isActive = t.sizeKb === selectedSize

            return (
              <button
                key={t.sizeKb}
                className={
                  'px-3 py-1 text-xs ' +
                  (isActive
                    ? 'bg-accent/20 text-accent'
                    : 'text-tp-muted hover:text-tp-fg hover:bg-white/5')
                }
                type="button"
                onClick={() => setSelectedSize(t.sizeKb)}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <ComponentBundleResultsTable
          bestId={bestId}
          results={results}
          variants={visibleVariants}
          worstId={worstId}
        />
      </Surface>
    </>
  )
}
