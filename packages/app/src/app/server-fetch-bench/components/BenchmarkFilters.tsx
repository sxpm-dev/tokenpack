'use client'

import { Surface, ToggleButton, ToggleButtonGroup } from '@heroui/react'

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
    <Surface className="rounded-2xl flex flex-row flex-wrap items-center justify-start gap-x-6 gap-y-3 p-3">
      <div className="space-y-2">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Network condition</div>
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
          {CONDITIONS.map(c => (
            <ToggleButton key={c} id={c}>
              {c}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

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
          {availableSources.map(s => (
            <ToggleButton key={s} id={s}>
              {s === 'avg' ? 'Avg' : (SOURCE_LABELS[s] ?? s)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    </Surface>
  )
}
