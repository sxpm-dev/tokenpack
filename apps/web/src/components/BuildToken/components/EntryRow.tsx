'use client'

import { Button, Input, TextArea } from '@heroui/react'
import { FileTextIcon, PaperclipIcon, TrashIcon } from '@phosphor-icons/react'
import { useRef } from 'react'

import { formatBytes } from '@/components/EncodeForm'

import type { BuilderEntry } from '../types'

interface EntryRowProps {
  entry: BuilderEntry
  onPathChange: (path: string) => void
  onTextChange: (text: string) => void
  onReplaceFile: (file: File) => void
  onRemove: () => void
}

export function EntryRow({
  entry,
  onPathChange,
  onTextChange,
  onReplaceFile,
  onRemove,
}: EntryRowProps) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        {entry.kind === 'text' ? (
          <FileTextIcon className="text-tp-muted shrink-0" size={16} />
        ) : (
          <PaperclipIcon className="text-tp-muted shrink-0" size={16} />
        )}

        <Input
          aria-label="Entry path"
          className="flex-1"
          placeholder="path/inside/pack.txt"
          value={entry.path}
          variant="secondary"
          onChange={e => onPathChange(e.target.value)}
        />

        <Button
          isIconOnly
          aria-label="Remove entry"
          size="sm"
          variant="tertiary"
          onPress={onRemove}
        >
          <TrashIcon size={14} />
        </Button>
      </div>

      {entry.kind === 'text' ? (
        <TextArea
          fullWidth
          aria-label="Entry text content"
          className="!rounded-xl font-mono text-[12px]"
          placeholder="// content goes here"
          rows={4}
          value={entry.text}
          variant="secondary"
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onTextChange(e.target.value)}
        />
      ) : (
        <FileEntryControls file={entry.file} onReplace={onReplaceFile} />
      )}
    </div>
  )
}

function FileEntryControls({ file, onReplace }: { file: File; onReplace: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="text-[12px] text-tp-muted truncate">
        <span className="font-mono">{file.name}</span>
        <span className="text-tp-muted"> · {formatBytes(file.size)}</span>
      </div>

      <button
        className="text-[11px] text-blue-400 hover:text-blue-300 underline"
        type="button"
        onClick={() => ref.current?.click()}
      >
        replace
      </button>
      <input
        ref={ref}
        accept="*/*"
        className="hidden"
        type="file"
        onChange={e => {
          const next = e.target.files?.[0]

          if (next) onReplace(next)
          e.target.value = ''
        }}
      />
    </div>
  )
}
