'use client'

import { Chip } from '@heroui/react'
import type { Pack } from '@tokenpack/browser'

import { formatBytes } from '@/components/EncodeForm'

interface EntryListViewProps {
  pack: Pack
  selectedPath: string | null
  onSelect: (path: string | null) => void
}

export function EntryListView({ pack, selectedPath, onSelect }: EntryListViewProps) {
  if (pack.isDiff()) {
    return (
      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
        {pack.entries.map(entry => {
          const active = entry.path === selectedPath

          return (
            <button
              key={`${entry.op}:${entry.path}`}
              className={`text-left rounded-lg border px-2.5 py-1.5 text-[12px] flex items-center gap-2 transition ${
                active
                  ? 'border-blue-400/60 bg-blue-400/5'
                  : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
              type="button"
              onClick={() => onSelect(active ? null : entry.path)}
            >
              <Chip color={diffChipColor(entry.op)} size="sm" variant="soft">
                {entry.op}
              </Chip>
              <span className="font-mono truncate flex-1">{entry.path}</span>
              {entry.fromPath && (
                <span className="text-tp-muted text-[10px]">← {entry.fromPath}</span>
              )}
              {typeof entry.size === 'number' && entry.size > 0 && (
                <span className="text-tp-muted text-[10px]">{formatBytes(entry.size)}</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (!pack.isPack()) {
    const single = pack.list[0]

    // Anonymous FilePack (no name) — skip the row entirely; the preview pane is enough.
    if (!single) return null

    const size = pack.entries[0]?.size ?? 0

    return (
      <button
        className={`text-left rounded-lg border px-2.5 py-1.5 text-[12px] flex items-center gap-2 transition ${
          selectedPath === single
            ? 'border-blue-400/60 bg-blue-400/5'
            : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
        }`}
        type="button"
        onClick={() => onSelect(selectedPath === single ? null : single)}
      >
        <span className="font-mono truncate flex-1">{single}</span>
        {size > 0 && <span className="text-tp-muted text-[10px]">{formatBytes(size)}</span>}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
      {pack.entries.map(entry => {
        const active = entry.path === selectedPath

        return (
          <button
            key={entry.path}
            className={`text-left rounded-lg border px-2.5 py-1.5 text-[12px] flex items-center gap-2 transition ${
              active
                ? 'border-blue-400/60 bg-blue-400/5'
                : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
            }`}
            type="button"
            onClick={() => onSelect(active ? null : entry.path)}
          >
            <span className="font-mono truncate flex-1">{entry.path}</span>
            <span className="text-tp-muted text-[10px]">{formatBytes(entry.size)}</span>
          </button>
        )
      })}
    </div>
  )
}

function diffChipColor(op: 'add' | 'modify' | 'patch' | 'delete' | 'rename') {
  switch (op) {
    case 'add':
      return 'success' as const
    case 'modify':
    case 'patch':
      return 'warning' as const
    case 'delete':
      return 'danger' as const
    case 'rename':
      return 'accent' as const
  }
}
