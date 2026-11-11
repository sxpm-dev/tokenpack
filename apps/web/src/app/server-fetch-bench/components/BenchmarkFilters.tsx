'use client'

import { Surface } from '@heroui/react'

import { CONDITIONS, SOURCE_LABELS } from '../constants'

interface BenchmarkFiltersProps {
  condition: string
  onConditionChange: (condition: string) => void
  source: string
  onSourceChange: (source: string) => void
  availableSources: string[]
}

export function BenchmarkFilters({
  condition,
  onConditionChange,
  source,
  onSourceChange,
  availableSources,
}: BenchmarkFiltersProps) {
  return (
    <Surface className="rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-tp-muted">Network:</span>
          <select
            className="rounded border border-tp-border bg-white/7 px-3 py-2 text-xs text-white outline-none transition focus:border-blue-300/70"
            value={condition}
            onChange={event => onConditionChange(event.target.value)}
          >
            {CONDITIONS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 items-center gap-2">
          <span className="text-tp-muted">Source:</span>
          <select
            className="min-w-[18rem] rounded border border-tp-border bg-white/7 px-3 py-2 text-xs text-white outline-none transition focus:border-blue-300/70"
            value={source}
            onChange={event => onSourceChange(event.target.value)}
          >
            {availableSources.map(s => (
              <option key={s} value={s}>
                {s === 'avg' ? 'Avg' : (SOURCE_LABELS[s] ?? s)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Surface>
  )
}
