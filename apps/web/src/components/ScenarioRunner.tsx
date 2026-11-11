'use client'

import { Button } from '@heroui/react'
import { DownloadSimpleIcon, PlayIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { type AggregatedResult, runRepeated } from '@/lib/measure'
import { useSavedBenchRun } from '@/lib/use-saved-bench-run'

import { ComparisonTable } from './ComparisonTable'

export interface Variant {
  label: string
  /** Returns measurement: `ms` is the headline metric; `bytes` is wire/data size. */
  run: () => Promise<{ ms: number; bytes?: number }>
}

interface ScenarioRunnerProps {
  variants: Variant[]
  /** Default iteration count. */
  defaultIterations?: number
}

export function ScenarioRunner({ variants, defaultIterations = 10 }: ScenarioRunnerProps) {
  const [iterations, setIterations] = useState(defaultIterations)
  const [results, setResults] = useState<AggregatedResult[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<string>('')

  const savedRunMessage = useSavedBenchRun(
    'scenario',
    JSON.stringify({ variants: variants.map(v => v.label), iterations }),
    running,
    results,
    setResults,
  )

  async function handleRun() {
    setRunning(true)
    setResults([])
    try {
      const collected: AggregatedResult[] = []

      for (const variant of variants) {
        setProgress(`Running ${variant.label} (${iterations}× iterations)…`)
        const aggregated = await runRepeated(variant.label, iterations, variant.run)

        collected.push(aggregated)
        setResults([...collected])
      }
      setProgress('')
    } finally {
      setRunning(false)
    }
  }

  function handleExport() {
    const header = 'variant,iterations,median_ms,p95_ms,min_ms,max_ms,bytes,per_run_ms\n'
    const rows = results
      .map(
        r =>
          `${r.label},${r.iterations},${r.median},${r.p95},${r.min},${r.max},${r.bytes ?? ''},"${r.perRun.join(';')}"`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `tokenpack-bench-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button isDisabled={running} isPending={running} onPress={handleRun}>
          <PlayIcon className="mr-1.5" size={14} />
          {running ? 'Running…' : 'Run benchmark'}
        </Button>
        <label className="text-xs text-tp-muted">
          Iterations:{' '}
          <input
            className="bg-white/5 border border-tp-border rounded px-2 py-0.5 text-xs w-16 text-white"
            max={100}
            min={1}
            type="number"
            value={iterations}
            onChange={e => setIterations(Math.max(1, Number(e.target.value)))}
          />
        </label>
        {results.length > 0 && !running && (
          <Button size="sm" variant="ghost" onPress={handleExport}>
            <DownloadSimpleIcon className="mr-1.5" size={14} />
            Export CSV
          </Button>
        )}
        {progress && <span className="text-xs text-tp-muted animate-pulse">{progress}</span>}
      </div>
      <p className="text-xs text-tp-muted" role="status">
        {savedRunMessage}
      </p>
      <ComparisonTable results={results} />
    </div>
  )
}
