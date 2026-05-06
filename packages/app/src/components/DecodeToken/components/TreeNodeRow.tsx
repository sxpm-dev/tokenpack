'use client'

import { Button } from '@heroui/react'
import { CaretDownIcon, CaretRightIcon, FolderIcon, FolderOpenIcon } from '@phosphor-icons/react'

import type { FileEntry } from '@/app/api/decode/route'

import type { TreeNode } from '../types'
import { FileIcon } from './FileIcon'

interface TreeNodeRowProps {
  node: TreeNode
  depth: number
  selected: FileEntry | null
  onSelect: (entry: FileEntry) => void
  expanded: Set<string>
  onToggle: (path: string) => void
}

export function TreeNodeRow({
  node,
  depth,
  selected,
  onSelect,
  expanded,
  onToggle,
}: TreeNodeRowProps) {
  const isExpanded = expanded.has(node.path)
  const isSelected = node.entry && selected?.path === node.entry.path

  return (
    <>
      <Button
        fullWidth
        className="justify-start gap-1.5 px-2 py-[3px] rounded-none text-xs font-mono text-left select-none group"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        variant={isSelected ? 'primary' : 'tertiary'}
        onPress={() =>
          node.type === 'dir' ? onToggle(node.path) : node.entry && onSelect(node.entry)
        }
      >
        {node.type === 'dir' ? (
          <>
            <span className="w-3 shrink-0 flex items-center justify-center text-white/30">
              {isExpanded ? <CaretDownIcon size={10} /> : <CaretRightIcon size={10} />}
            </span>
            {isExpanded ? (
              <FolderOpenIcon className="shrink-0 text-yellow-300/80" size={14} weight="fill" />
            ) : (
              <FolderIcon className="shrink-0 text-yellow-300/60" size={14} weight="fill" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileIcon className="shrink-0" name={node.name} />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {node.entry && (
          <span className="ml-auto text-white/20 text-[10px] shrink-0 pr-1">
            {(node.entry.size / 1024).toFixed(1)}K
          </span>
        )}
      </Button>

      {node.type === 'dir' &&
        isExpanded &&
        node.children.map(child => (
          <TreeNodeRow
            key={child.path}
            depth={depth + 1}
            expanded={expanded}
            node={child}
            selected={selected}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}
