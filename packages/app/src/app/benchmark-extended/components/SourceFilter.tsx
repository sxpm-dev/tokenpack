'use client'

import { Surface, ToggleButton, ToggleButtonGroup } from '@heroui/react'

export interface SourceOption {
  id: string
  label: string
}

interface SourceFilterProps {
  source: string
  onSourceChange: (source: string) => void
  sources: readonly SourceOption[]
  totalRows: number
  errorRows: number
}

export function SourceFilter({
  source,
  onSourceChange,
  sources,
  totalRows,
  errorRows,
}: SourceFilterProps) {
  return (
    <Surface className="rounded-2xl flex flex-row flex-wrap items-center justify-start gap-x-6 gap-y-3 p-3">
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
          {sources.map((s, i) => (
            <ToggleButton key={s.id} id={s.id}>
              {i > 0 && <ToggleButtonGroup.Separator />}
              {s.label}
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
