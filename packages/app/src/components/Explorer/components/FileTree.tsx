'use client'

import { CaretRightIcon, FolderIcon, FolderOpenIcon } from '@phosphor-icons/react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { formatBytes } from '@/components/EncodeForm'

import { getFileIconConfig } from '../utils/file-icon'

export interface TreeFile {
  type: 'file'
  path: string
  name: string
  size: number
}

export interface TreeFolder {
  type: 'folder'
  name: string
  path: string
  children: TreeNode[]
}

export type TreeNode = TreeFile | TreeFolder

export function buildTree(entries: ReadonlyArray<{ path: string; size: number }>): TreeNode[] {
  const root: TreeNode[] = []

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean)

    if (parts.length === 0) continue

    let current = root
    let pathSoFar = ''

    for (let i = 0; i < parts.length - 1; i++) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${parts[i]}` : parts[i]
      const existing = current.find(n => n.type === 'folder' && n.name === parts[i])
      let folder = existing as TreeFolder | undefined

      if (!folder) {
        folder = { type: 'folder', name: parts[i], path: pathSoFar, children: [] }
        current.push(folder)
      }
      current = folder.children
    }

    current.push({
      type: 'file',
      path: entry.path,
      name: parts[parts.length - 1],
      size: entry.size,
    })
  }

  sortTree(root)

  return root
}

function sortTree(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1

    return a.name.localeCompare(b.name)
  })
  for (const n of nodes) {
    if (n.type === 'folder') sortTree(n.children)
  }
}

interface FlatRow {
  node: TreeNode
  depth: number
  parentPath: string | null
}

function flatten(
  nodes: ReadonlyArray<TreeNode>,
  expanded: ReadonlySet<string>,
  depth = 0,
  parent: string | null = null,
): FlatRow[] {
  const out: FlatRow[] = []

  for (const node of nodes) {
    out.push({ node, depth, parentPath: parent })
    if (node.type === 'folder' && expanded.has(node.path)) {
      out.push(...flatten(node.children, expanded, depth + 1, node.path))
    }
  }

  return out
}

function collectAllFolderPaths(nodes: ReadonlyArray<TreeNode>, into: Set<string>): void {
  for (const n of nodes) {
    if (n.type === 'folder') {
      into.add(n.path)
      collectAllFolderPaths(n.children, into)
    }
  }
}

interface FileTreeProps {
  nodes: ReadonlyArray<TreeNode>
  selectedPath: string | null
  onSelect: (path: string | null) => void
}

export function FileTree({ nodes, selectedPath, onSelect }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>()

    collectAllFolderPaths(nodes, s)

    return s
  })
  // Reset expansion when the tree identity changes (fresh pack). Storing the
  // previous nodes ref in state lets us detect the change during render — see
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevNodes, setPrevNodes] = useState(nodes)

  if (prevNodes !== nodes) {
    setPrevNodes(nodes)
    const s = new Set<string>()

    collectAllFolderPaths(nodes, s)
    setExpanded(s)
  }
  const containerRef = useRef<HTMLDivElement>(null)

  const flat = useMemo(() => flatten(nodes, expanded), [nodes, expanded])
  const focusIndex = flat.findIndex(r => r.node.path === selectedPath)

  const focusRow = useCallback(
    (index: number) => {
      if (index < 0 || index >= flat.length) return
      const row = flat[index]

      onSelect(row.node.path)
      const el = containerRef.current?.querySelector(
        `[data-tree-path="${cssEscape(row.node.path)}"]`,
      ) as HTMLElement | null

      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    [flat, onSelect],
  )

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (flat.length === 0) return

      const cur = focusIndex < 0 ? 0 : focusIndex

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          focusRow(Math.min(cur + 1, flat.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          focusRow(Math.max(cur - 1, 0))
          break
        case 'ArrowRight': {
          e.preventDefault()
          const row = flat[cur]

          if (row.node.type === 'folder') {
            if (!expanded.has(row.node.path)) {
              setExpanded(prev => new Set(prev).add(row.node.path))
            } else {
              focusRow(Math.min(cur + 1, flat.length - 1))
            }
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const row = flat[cur]

          if (row.node.type === 'folder' && expanded.has(row.node.path)) {
            setExpanded(prev => {
              const n = new Set(prev)

              n.delete(row.node.path)

              return n
            })
          } else if (row.parentPath) {
            const parentIdx = flat.findIndex(r => r.node.path === row.parentPath)

            if (parentIdx >= 0) focusRow(parentIdx)
          }
          break
        }
        case 'Home':
          e.preventDefault()
          focusRow(0)
          break
        case 'End':
          e.preventDefault()
          focusRow(flat.length - 1)
          break
      }
    },
    [flat, focusIndex, expanded, focusRow],
  )

  function toggleFolder(path: string) {
    setExpanded(prev => {
      const next = new Set(prev)

      if (next.has(path)) next.delete(path)
      else next.add(path)

      return next
    })
  }

  return (
    <div
      ref={containerRef}
      aria-label="Pack contents"
      className="flex flex-col gap-px py-1 outline-none focus-visible:ring-1 focus-visible:ring-blue-400/40 rounded-lg"
      role="tree"
      tabIndex={0}
      onKeyDown={onKey}
    >
      {flat.map(({ node, depth }) => (
        <Row
          key={node.path}
          depth={depth}
          isActive={node.path === selectedPath}
          isExpanded={node.type === 'folder' && expanded.has(node.path)}
          node={node}
          onSelect={onSelect}
          onToggle={() => node.type === 'folder' && toggleFolder(node.path)}
        />
      ))}
    </div>
  )
}

const PADDING_LEFT = 6
const INDENT = 12

interface RowProps {
  node: TreeNode
  depth: number
  isExpanded: boolean
  isActive: boolean
  onSelect: (path: string | null) => void
  onToggle: () => void
}

function Row({ node, depth, isExpanded, isActive, onSelect, onToggle }: RowProps) {
  const guides = depth > 0 ? Array.from({ length: depth }, (_, i) => i) : []
  const offset = PADDING_LEFT + depth * INDENT

  if (node.type === 'folder') {
    return (
      <button
        className={`relative w-full text-left flex items-center gap-1.5 py-[5px] text-[12px] rounded-md transition-colors group ${
          isActive
            ? 'bg-white/[0.07] text-white'
            : 'text-white/75 hover:bg-white/[0.04] hover:text-white'
        }`}
        data-tree-path={node.path}
        style={{ paddingLeft: `${offset}px`, paddingRight: 8 }}
        type="button"
        onClick={onToggle}
      >
        {guides.map(i => (
          <span
            key={i}
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-white/[0.05] group-hover:bg-white/[0.08] transition-colors"
            style={{ left: `${PADDING_LEFT + i * INDENT + 2}px` }}
          />
        ))}
        <CaretRightIcon
          className={`text-white/35 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          size={9}
          weight="bold"
        />
        {isExpanded ? (
          <FolderOpenIcon className="text-blue-400/80 shrink-0" size={13} weight="duotone" />
        ) : (
          <FolderIcon className="text-blue-400/80 shrink-0" size={13} weight="duotone" />
        )}
        <span className="truncate font-medium tracking-tight">{node.name}</span>
      </button>
    )
  }

  const { Icon, tint } = getFileIconConfig(node.name)

  return (
    <button
      className={`relative w-full text-left flex items-center justify-between gap-2 py-[5px] text-[12px] rounded-md transition-colors group ${
        isActive
          ? 'bg-blue-500/[0.18] text-white'
          : 'text-white/65 hover:bg-white/[0.04] hover:text-white/95'
      }`}
      data-tree-path={node.path}
      style={{ paddingLeft: `${offset + 4}px`, paddingRight: 8 }}
      type="button"
      onClick={() => onSelect(isActive ? null : node.path)}
    >
      {guides.map(i => (
        <span
          key={i}
          aria-hidden
          className={`absolute top-0 bottom-0 w-px transition-colors ${
            isActive ? 'bg-blue-400/15' : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
          }`}
          style={{ left: `${PADDING_LEFT + i * INDENT + 2}px` }}
        />
      ))}
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full bg-blue-400"
        />
      )}
      <span className="flex items-center gap-1.5 truncate min-w-0">
        <Icon className={`shrink-0 ${tint}`} size={12} weight="duotone" />
        <span className="truncate font-mono">{node.name}</span>
      </span>
      <span
        className={`text-[10px] shrink-0 font-mono tabular-nums transition-colors ${
          isActive ? 'text-white/55' : 'text-white/30 group-hover:text-white/45'
        }`}
      >
        {formatBytes(node.size)}
      </span>
    </button>
  )
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s)

  return s.replace(/["\\]/g, '\\$&')
}
