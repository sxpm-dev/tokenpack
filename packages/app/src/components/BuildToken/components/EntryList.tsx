'use client'

import { Button } from '@heroui/react'
import { FilePlusIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { useRef } from 'react'

import type { UseBuilderEntriesApi } from '../hooks/useBuilderEntries'
import { EntryRow } from './EntryRow'

interface EntryListProps {
  api: UseBuilderEntriesApi
}

export function EntryList({ api }: EntryListProps) {
  const { entries, addText, addFiles, remove, setPath, setText, replaceFile } = api
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="text-[13px] font-medium">Entries</div>
          <div className="text-[11px] text-white/38">
            {entries.length === 0
              ? 'Add text snippets or upload files to assemble a pack.'
              : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="tertiary" onPress={addText}>
            <FilePlusIcon className="mr-1.5" size={14} />
            Add text
          </Button>

          <Button size="sm" variant="tertiary" onPress={() => fileRef.current?.click()}>
            <UploadSimpleIcon className="mr-1.5" size={14} />
            Upload files
          </Button>
          <input
            ref={fileRef}
            multiple
            accept="*/*"
            className="hidden"
            type="file"
            onChange={e => {
              const list = e.target.files

              if (!list || list.length === 0) return
              addFiles(Array.from(list))
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-[12px] text-white/35">
          No entries yet — add text or upload files to start.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(entry => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onPathChange={path => setPath(entry.id, path)}
              onRemove={() => remove(entry.id)}
              onReplaceFile={file => replaceFile(entry.id, file)}
              onTextChange={text => setText(entry.id, text)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
