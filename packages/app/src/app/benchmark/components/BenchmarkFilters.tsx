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
          selectionMode="single"
          selectedKeys={new Set([condition])}
          onSelectionChange={keys => {
            const [k] = [...(keys as Set<string>)]
            if (k) onConditionChange(k)
          }}
          disallowEmptySelection
          size="sm"
          className="flex-wrap"
        >
          {CONDITIONS.map((c, i) => (
            <ToggleButton key={c} id={c}>
              {i > 0 && <ToggleButtonGroup.Separator />}
              {c}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Source</div>
        <ToggleButtonGroup
          selectionMode="single"
          selectedKeys={new Set([source])}
          onSelectionChange={keys => {
            const [k] = [...(keys as Set<string>)]
            if (k) onSourceChange(k)
          }}
          disallowEmptySelection
          size="sm"
          className="flex-wrap"
        >
          {availableSources.map((s, i) => (
            <ToggleButton key={s} id={s}>
              {i > 0 && <ToggleButtonGroup.Separator />}
              {s === 'avg' ? 'Avg' : SOURCE_LABELS[s] ?? s}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    </Surface>
  )
}
