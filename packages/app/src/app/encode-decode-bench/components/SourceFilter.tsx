'use client'

import { Surface, ToggleButton, ToggleButtonGroup } from '@heroui/react'

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
    <Surface className="rounded-2xl flex flex-row flex-wrap items-center justify-start gap-x-6 gap-y-3 p-3">
      <div className="space-y-2">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Source</div>
        <ToggleButtonGroup
          disallowEmptySelection
          className="flex-wrap"
          selectedKeys={new Set([source])}
          selectionMode="single"
          size="sm"
          onSelectionChange={keys => {
            const [k] = [...(keys as Set<string>)]

            if (k) onSourceChange(k)
          }}
        >
          {sources.map(s => (
            <ToggleButton key={s.id} id={s.id}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <div className="space-y-2">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Throttle</div>
        <ToggleButtonGroup
          disallowEmptySelection
          className="flex-wrap"
          selectedKeys={new Set([condition])}
          selectionMode="single"
          size="sm"
          onSelectionChange={keys => {
            const [k] = [...(keys as Set<string>)]

            if (k) onConditionChange(k)
          }}
        >
          {conditions.map(c => (
            <ToggleButton key={c.id} id={c.id}>
              {c.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <div className="ml-auto text-[11px] text-white/25 font-mono">
        {totalRows} rows · {errorRows} errors
      </div>
    </Surface>
  )
}
