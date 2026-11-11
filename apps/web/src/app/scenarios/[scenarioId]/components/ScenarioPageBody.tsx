'use client'

import { Surface } from '@heroui/react'
import { useCallback, useMemo, useState } from 'react'

import { ScenarioExplanation } from '@/components/ScenarioExplanation'
import { runVariant } from '@/lib/runner'
import type { ThrottleName } from '@/lib/throttle'
import { useSavedBenchRun } from '@/lib/use-saved-bench-run'
import type { FixtureFetcher, RunCtx, ScenarioDef, VariantDef } from '@/scenarios/types'

import type { StatusMap, VariantStatus } from '../runner-state'
import { ScenarioControls } from './ScenarioControls'
import { ScenarioResultsTable } from './ScenarioResultsTable'
import { ScenarioRunButton } from './ScenarioRunButton'

const SKIP_REASON_PARTIAL =
  'Partial-compat — needs DecompressionStream(\'br\'). Toggle "Run skipped cases" to include.'

interface ScenarioPageBodyProps {
  scenario: ScenarioDef
}

/**
 * The actual scenario page body. Extracted from the route component so the
 * route can call `notFound()` for unknown ids without TS losing track of the
 * narrowed `scenario` reference.
 */
export function ScenarioPageBody({ scenario }: ScenarioPageBodyProps) {
  const initialSize = scenario.sizes?.[0] ?? null
  const [size, setSize] = useState<number | null>(initialSize)
  const [iterations, setIterations] = useState(5)
  const [throttle, setThrottle] = useState<ThrottleName>('local')
  const [runSkipped, setRunSkipped] = useState(false)
  const [statuses, setStatuses] = useState<StatusMap>(() =>
    initialStatuses(scenario.variants, false),
  )
  const [running, setRunning] = useState(false)

  useSavedBenchRun(
    'scenario',
    JSON.stringify({ scenario: scenario.id, size, iterations, throttle, runSkipped }),
    running,
    Array.from(statuses),
    value => setStatuses(new Map(value)),
  )

  const handleRunSkippedChange = useCallback(
    (v: boolean) => {
      setRunSkipped(v)
      setStatuses(initialStatuses(scenario.variants, v))
    },
    [scenario.variants],
  )

  const fetchFixture = useCallback<FixtureFetcher>(
    async (file: string, query?: Record<string, string>) => {
      const params = new URLSearchParams({ throttle, ...query })
      const url = `/api/fixtures/${scenario.id}/${file}?${params.toString()}`

      return fetch(url, { cache: 'no-store', credentials: 'omit' })
    },
    [scenario.id, throttle],
  )

  const withExecuteColumn = useMemo(() => {
    for (const s of statuses.values()) {
      if (s.state === 'done' && s.row.stages?.executeMs) return true
    }

    return false
  }, [statuses])

  async function handleRun() {
    if (running) return
    setRunning(true)

    const ctx: RunCtx = {
      scenarioId: scenario.id,
      size,
      fetchFixture,
    }
    let next = initialStatuses(scenario.variants, runSkipped)

    setStatuses(next)

    for (const v of scenario.variants) {
      if (next.get(v.id)?.state === 'skipped') continue

      next = new Map(next).set(v.id, { state: 'running' })
      setStatuses(next)

      try {
        const row = await runVariant(v, ctx, iterations)

        next = new Map(next).set(v.id, { state: 'done', row })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)

        next = new Map(next).set(v.id, { state: 'errored', error: msg })
      }
      setStatuses(next)
    }

    setRunning(false)
  }

  return (
    <>
      <Surface className="rounded-2xl p-4">
        <details open>
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-tp-muted mb-2">
            About this scenario
          </summary>
          <ScenarioExplanation markdown={scenario.explanation} />
        </details>
      </Surface>

      <Surface className="rounded-2xl p-4 space-y-4">
        <ScenarioControls
          disabled={running}
          iterations={iterations}
          runSkipped={runSkipped}
          size={size}
          sizes={scenario.sizes}
          throttle={throttle}
          onIterationsChange={setIterations}
          onRunSkippedChange={handleRunSkippedChange}
          onSizeChange={setSize}
          onThrottleChange={setThrottle}
        />
        <div className="flex items-center gap-2">
          <ScenarioRunButton isDisabled={running} isRunning={running} onRun={handleRun} />
        </div>
      </Surface>

      <ScenarioResultsTable
        statuses={statuses}
        variants={scenario.variants}
        withExecuteColumn={withExecuteColumn}
      />
    </>
  )
}

function initialStatuses(variants: readonly VariantDef[], runSkipped: boolean): StatusMap {
  const m = new Map<string, VariantStatus>()

  for (const v of variants) {
    if (!runSkipped && v.compat === 'partial') {
      m.set(v.id, { state: 'skipped', reason: SKIP_REASON_PARTIAL })
    } else {
      m.set(v.id, { state: 'pending' })
    }
  }

  return m
}
