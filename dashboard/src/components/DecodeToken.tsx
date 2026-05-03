'use client'

import { useState, useRef } from 'react'
import { Button, Card } from '@heroui/react'
import {
  Folder, FolderOpen, File, FileCode, FileText,
  FileCss, FileTs, FileJs, CaretRight, CaretDown,
  Image as ImageIcon, ArrowsClockwise,
} from '@phosphor-icons/react'
import type { FileEntry } from '@/app/api/decode/route'

type DecodeResult =
  | { type: 'text';       content: string }
  | { type: 'filesystem'; files: FileEntry[] }
  | { type: 'binary';     size: number }

// ── File icon by extension ────────────────────────────────────────────────────

function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const props = { size: 14, className }
  if (['ts', 'tsx'].includes(ext)) return <FileTs {...props} className={`${className} text-blue-400`} />
  if (['js', 'jsx', 'mjs'].includes(ext)) return <FileJs {...props} className={`${className} text-yellow-400`} />
  if (['css', 'scss', 'sass'].includes(ext)) return <FileCss {...props} className={`${className} text-pink-400`} />
  if (['md', 'mdx', 'txt'].includes(ext)) return <FileText {...props} className={`${className} text-white/50`} />
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return <FileCode {...props} className={`${className} text-orange-400`} />
  return <File {...props} className={`${className} text-white/40`} />
}

// ── Tree node types ───────────────────────────────────────────────────────────

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children: TreeNode[]
  entry?: FileEntry
}

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = []
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sorted) {
    const parts = file.path.split('/')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      if (i === parts.length - 1) {
        current.push({ name, path: file.path, type: 'file', children: [], entry: file })
      } else {
        let dir = current.find(n => n.name === name && n.type === 'dir')
        if (!dir) {
          dir = { name, path: parts.slice(0, i + 1).join('/'), type: 'dir', children: [] }
          current.push(dir)
        }
        current = dir.children
      }
    }
  }
  return root
}

// ── VSCode-like tree node ─────────────────────────────────────────────────────

function TreeNodeRow({
  node, depth, selected, onSelect, expanded, onToggle,
}: {
  node: TreeNode
  depth: number
  selected: FileEntry | null
  onSelect: (e: FileEntry) => void
  expanded: Set<string>
  onToggle: (path: string) => void
}) {
  const isExpanded = expanded.has(node.path)
  const isSelected = node.entry && selected?.path === node.entry.path

  return (
    <>
      <button
        onClick={() => node.type === 'dir' ? onToggle(node.path) : node.entry && onSelect(node.entry)}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] text-xs font-mono transition-colors text-left select-none group ${
          isSelected
            ? 'bg-blue-600/30 text-white'
            : 'text-white/60 hover:bg-white/5 hover:text-white/90'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {node.type === 'dir' ? (
          <>
            <span className="text-white/30 w-3 shrink-0">
              {isExpanded ? <CaretDown size={10} /> : <CaretRight size={10} />}
            </span>
            {isExpanded
              ? <FolderOpen size={14} className="shrink-0 text-yellow-300/80" />
              : <Folder     size={14} className="shrink-0 text-yellow-300/60" />}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileIcon name={node.name} />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {node.entry && (
          <span className="ml-auto text-white/20 text-[10px] shrink-0 pr-1">
            {(node.entry.size / 1024).toFixed(1)}K
          </span>
        )}
      </button>

      {node.type === 'dir' && isExpanded &&
        node.children.map(child => (
          <TreeNodeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}

// ── Filesystem explorer ───────────────────────────────────────────────────────

function FileTree({ files }: { files: FileEntry[] }) {
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
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  return (
    <div className="flex h-[480px] rounded-xl overflow-hidden border border-white/10">
      {/* Sidebar */}
      <div className="w-52 shrink-0 bg-[#1e1e1e] border-r border-white/10 overflow-y-auto">
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

      {/* Content pane */}
      <div className="flex-1 overflow-auto bg-[#1a1a1a]">
        {selected ? (
          <>
            <div className="px-4 py-2 text-[11px] text-white/30 font-mono border-b border-white/5 flex items-center gap-2">
              <FileIcon name={selected.path} />
              {selected.path}
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

// ── Main component ────────────────────────────────────────────────────────────

export function DecodeToken() {
  const [file, setFile]         = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<DecodeResult | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
    setError(null)
    if (f) setPreviewUrl(URL.createObjectURL(f))
    else setPreviewUrl(null)
  }

  function handleReset() {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDecode() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const form = new FormData()
      form.append('token', file)
      const res  = await fetch('/api/decode', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload area or image preview */}
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Token preview"
            className="w-full rounded-xl border border-white/10"
            style={{ imageRendering: 'pixelated', maxHeight: '320px', objectFit: 'contain', background: '#111' }}
          />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 text-white/70 hover:text-white text-xs backdrop-blur-sm"
            >
              <ArrowsClockwise size={12} />
              Change
            </button>
          </div>
          <div className="mt-2 text-xs text-white/30 text-center font-mono">
            {file?.name} · {((file?.size ?? 0) / 1024).toFixed(1)} KB
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/15 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-white/30 transition-colors group"
        >
          <ImageIcon size={32} className="text-white/20 group-hover:text-white/40 transition-colors" />
          <div className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
            Click to upload a token.png
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/png" className="hidden" onChange={handleFileChange} />

      {file && (
        <Button onPress={handleDecode} isPending={loading} fullWidth>
          {loading ? 'Decoding…' : 'Decode Token'}
        </Button>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {result && (
        <Card variant="secondary">
          <Card.Header className="px-4 pt-4 pb-2">
            <Card.Title className="text-sm font-medium text-white/60">
              {result.type === 'text'       && 'Text content'}
              {result.type === 'filesystem' && `Filesystem · ${result.files.length} files`}
              {result.type === 'binary'     && 'Binary content'}
            </Card.Title>
          </Card.Header>
          <Card.Content className="px-4 pb-4">
            {result.type === 'text' && (
              <pre className="text-xs font-mono text-green-300/80 whitespace-pre-wrap break-all leading-relaxed max-h-[480px] overflow-auto bg-[#1a1a1a] rounded-lg p-4">
                {result.content}
              </pre>
            )}
            {result.type === 'filesystem' && <FileTree files={result.files} />}
            {result.type === 'binary' && (
              <div className="text-white/40 text-sm">{result.size.toLocaleString()} bytes</div>
            )}
          </Card.Content>
        </Card>
      )}
    </div>
  )
}
