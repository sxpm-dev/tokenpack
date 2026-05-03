'use client'

import { useState, useRef } from 'react'
import { Button, Card } from '@heroui/react'
import type { FileEntry } from '@/app/api/decode/route'

type DecodeResult =
  | { type: 'text';       content: string }
  | { type: 'filesystem'; files: FileEntry[] }
  | { type: 'binary';     size: number }

function FileTree({ files }: { files: FileEntry[] }) {
  const [selected, setSelected] = useState<FileEntry | null>(files[0] ?? null)

  const tree = files.reduce<Record<string, FileEntry[]>>((acc, f) => {
    const dir = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '.'
    ;(acc[dir] ??= []).push(f)
    return acc
  }, {})

  return (
    <div className="flex gap-0 h-[500px] rounded-xl overflow-hidden border border-white/10">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-white/5 border-r border-white/10 overflow-y-auto">
        {Object.entries(tree).sort().map(([dir, entries]) => (
          <div key={dir}>
            {dir !== '.' && (
              <div className="px-3 py-1.5 text-xs text-white/30 font-mono border-b border-white/5 sticky top-0 bg-white/5">
                {dir}/
              </div>
            )}
            {entries.sort((a, b) => a.path.localeCompare(b.path)).map(f => (
              <button
                key={f.path}
                onClick={() => setSelected(f)}
                className={`w-full text-left px-3 py-1.5 text-xs font-mono truncate transition-colors ${
                  selected?.path === f.path
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                {f.path.split('/').pop()}
                <span className="ml-1 text-white/20">{(f.size / 1024).toFixed(1)}K</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-black/20 p-4">
        {selected ? (
          <>
            <div className="text-xs text-white/30 mb-2 font-mono">{selected.path}</div>
            {selected.isBinary ? (
              <div className="text-white/40 text-sm">{selected.content}</div>
            ) : (
              <pre className="text-xs font-mono text-green-300/80 whitespace-pre-wrap break-all leading-relaxed">
                {selected.content}
              </pre>
            )}
          </>
        ) : (
          <div className="text-white/30 text-sm">Select a file</div>
        )}
      </div>
    </div>
  )
}

export function DecodeToken() {
  const [file, setFile]       = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<DecodeResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleDecode() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const form = new FormData()
      form.append('token', file)
      const res = await fetch('/api/decode', { method: 'POST', body: form })
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
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
      >
        <div className="text-sm text-white/40">
          {file ? (
            <span className="text-white/80 font-medium">
              {file.name} <span className="text-white/40">({(file.size / 1024).toFixed(1)} KB)</span>
            </span>
          ) : (
            'Click to upload a token.png'
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

      <Button onPress={handleDecode} isPending={loading} isDisabled={!file} fullWidth>
        {loading ? 'Decoding…' : 'Decode Token'}
      </Button>

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
              {result.type === 'binary'     && `Binary · ${(result.size / 1024).toFixed(1)} KB`}
            </Card.Title>
          </Card.Header>
          <Card.Content className="px-4 pb-4">
            {result.type === 'text' && (
              <pre className="text-xs font-mono text-green-300/80 whitespace-pre-wrap break-all leading-relaxed max-h-[500px] overflow-auto bg-black/20 rounded-lg p-4">
                {result.content}
              </pre>
            )}
            {result.type === 'filesystem' && <FileTree files={result.files} />}
            {result.type === 'binary' && (
              <div className="text-white/40 text-sm">Binary content — {result.size} bytes</div>
            )}
          </Card.Content>
        </Card>
      )}
    </div>
  )
}
