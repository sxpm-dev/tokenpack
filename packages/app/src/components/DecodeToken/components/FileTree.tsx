'use client'

import { useState } from 'react'
import type { FileEntry } from '@/app/api/decode/route'
import { buildTree } from '../utils'
import { FileIcon } from './FileIcon'
import { TreeNodeRow } from './TreeNodeRow'

interface FileTreeProps {
  files: FileEntry[]
}

export function FileTree({ files }: FileTreeProps) {
  const tree = buildTree(files)
  const firstFile = files[0] ?? null
  const [selected, setSelected] = useState<FileEntry | null>(firstFile)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const dirs = new Set<string>()
    files.forEach(f => {
      const parts = f.path.split('/')
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'))
    })
    return dirs
  })

  function toggle(path: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div className="flex h-[58vh] min-h-[420px] flex-col overflow-hidden rounded-xl border border-white/10 sm:flex-row">
      <div className="w-full max-h-[40vh] shrink-0 overflow-y-auto border-b border-white/10 bg-white/[0.035] sm:max-h-none sm:w-64 sm:border-b-0 sm:border-r">
        <div className="px-3 py-2 text-[10px] text-white/25 uppercase tracking-wider font-semibold border-b border-white/5">
          Explorer
        </div>
        {tree.map(node => (
          <TreeNodeRow
            key={node.path}
            node={node}
            depth={0}
            selected={selected}
            onSelect={setSelected}
            expanded={expanded}
            onToggle={toggle}
          />
        ))}
      </div>

      <div className="flex-1 overflow-auto bg-black/25">
        {selected ? (
          <>
            <div className="px-4 py-2 text-[11px] text-white/30 font-mono border-b border-white/5 flex items-center gap-2">
              <FileIcon name={selected.path} />
              <span className="truncate">{selected.path}</span>
            </div>
            <pre className="p-4 text-xs font-mono text-green-300/80 whitespace-pre-wrap break-all leading-relaxed">
              {selected.isBinary ? `[binary — ${selected.size} bytes]` : selected.content}
            </pre>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20 text-sm">
            Select a file
          </div>
        )}
      </div>
    </div>
  )
}
