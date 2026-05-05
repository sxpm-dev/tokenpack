'use client'

import { Surface, ToggleButton, ToggleButtonGroup } from '@heroui/react'

interface AlgorithmFiltersProps {
  browserOnly: boolean
  onBrowserOnlyChange: (value: boolean) => void
  streamOnly: boolean
  onStreamOnlyChange: (value: boolean) => void
  filteredCount: number
  totalCount: number
}

export function AlgorithmFilters({
  browserOnly,
  onBrowserOnlyChange,
  streamOnly,
  onStreamOnlyChange,
  filteredCount,
  totalCount,
}: AlgorithmFiltersProps) {
  return (
    <Surface className="rounded-2xl flex flex-row flex-wrap items-center justify-start gap-x-6 gap-y-3 p-3">
      <div className="flex flex-col gap-2">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Filter</div>
        <ToggleButtonGroup
          selectionMode="multiple"
          selectedKeys={new Set([
            ...(browserOnly ? ['browser'] : []),
            ...(streamOnly ? ['stream'] : []),
          ])}
          onSelectionChange={keys => {
            const s = keys as Set<string>
            onBrowserOnlyChange(s.has('browser'))
            onStreamOnlyChange(s.has('stream'))
          }}
          size="sm"
          className="flex-wrap"
        >
          <ToggleButton id="browser">Browser-safe</ToggleButton>
          <ToggleButton id="stream">
            <ToggleButtonGroup.Separator />
            Streaming-only
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="ml-auto text-[11px] text-white/25 font-mono">
        {filteredCount} / {totalCount}
      </div>
    </Surface>
  )
}
