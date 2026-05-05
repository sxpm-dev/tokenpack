'use client'

import { Button } from '@heroui/react'
import { PlayIcon, DownloadSimpleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { type AggregatedResult, runRepeated } from '@/lib/measure'
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
      .map(r => `${r.label},${r.iterations},${r.median},${r.p95},${r.min},${r.max},${r.bytes ?? ''},"${r.perRun.join(';')}"`)
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
        <Button onPress={handleRun} isPending={running} isDisabled={running}>
          <PlayIcon size={14} className="mr-1.5" />
          {running ? 'Running…' : 'Run benchmark'}
        </Button>
        <label className="text-xs text-white/50">
          Iterations:{' '}
          <input
            type="number"
            min={1}
            max={100}
            value={iterations}
            onChange={e => setIterations(Math.max(1, Number(e.target.value)))}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs w-16 text-white"
          />
        </label>
        {results.length > 0 && !running && (
          <Button size="sm" variant="ghost" onPress={handleExport}>
            <DownloadSimpleIcon size={14} className="mr-1.5" />
            Export CSV
          </Button>
        )}
        {progress && <span className="text-xs text-white/40 animate-pulse">{progress}</span>}
      </div>
      <ComparisonTable results={results} />
    </div>
  )
}
