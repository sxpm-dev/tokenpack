'use client'

import { Surface } from '@heroui/react'

export interface SourceOption {
  id: string
  label: string
}

export interface ConditionOption {
  id: string
  label: string
  detail: string
}

interface SourceFilterProps {
  source: string
  onSourceChange: (source: string) => void
  sources: readonly SourceOption[]
  condition: string
  onConditionChange: (condition: string) => void
  conditions: readonly ConditionOption[]
  totalRows: number
  errorRows: number
}

export function SourceFilter({
  source,
  onSourceChange,
  sources,
  condition,
  onConditionChange,
  conditions,
  totalRows,
  errorRows,
}: SourceFilterProps) {
  return (
    <Surface className="rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs">
        <label className="flex min-w-0 items-center gap-2">
          <span className="text-tp-muted">Source:</span>
          <select
            className="min-w-[16rem] rounded border border-tp-border bg-white/7 px-3 py-2 text-xs text-white outline-none transition focus:border-blue-300/70"
            value={source}
            onChange={event => onSourceChange(event.target.value)}
          >
            {sources.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-tp-muted">Network:</span>
          <select
            className="rounded border border-tp-border bg-white/7 px-3 py-2 text-xs text-white outline-none transition focus:border-blue-300/70"
            value={condition}
            onChange={event => onConditionChange(event.target.value)}
          >
            {conditions.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto text-[11px] text-tp-muted">
          {totalRows} rows · {errorRows} errors
        </div>
      </div>
    </Surface>
  )
}
