'use client'

import { useState, useRef } from 'react'
import { Button } from '@heroui/react'
import { ImageSquare, ArrowsClockwise, GitDiff } from '@phosphor-icons/react'

function TokenSlot({
  label, file, previewUrl, onFile, onReset,
}: {
  label: string
  file: File | null
  previewUrl: string | null
  onFile: (f: File) => void
  onReset: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="flex-1 space-y-2">
      <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</div>
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt={label}
            className="w-full rounded-xl border border-white/10"
            style={{ imageRendering: 'pixelated', maxHeight: '220px', objectFit: 'contain', background: '#111' }}
          />
          <button
            onClick={onReset}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 text-white/70 hover:text-white text-xs"
          >
            <ArrowsClockwise size={11} /> Change
          </button>
          <div className="text-[11px] text-white/25 text-center mt-1 font-mono">
            {file?.name} · {((file?.size ?? 0) / 1024).toFixed(1)} KB
          </div>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/30 transition-colors"
          style={{ minHeight: '180px' }}
        >
          <ImageSquare size={28} className="text-white/20" />
          <span className="text-sm text-white/35">Upload token.png</span>
        </div>
      )}
      <input
        ref={ref} type="file" accept="image/png" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}

export function DiffTokens() {
  const [fileA, setFileA]     = useState<File | null>(null)
  const [fileB, setFileB]     = useState<File | null>(null)
  const [urlA, setUrlA]       = useState<string | null>(null)
  const [urlB, setUrlB]       = useState<string | null>(null)
  const [mode, setMode]       = useState<'image' | 'text'>('image')
  const [loading, setLoading] = useState(false)
  const [diffUrl, setDiffUrl] = useState<string | null>(null)
  const [textDiff, setTextDiff] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  function setA(f: File) { setFileA(f); setUrlA(URL.createObjectURL(f)); setDiffUrl(null); setTextDiff(null) }
  function setB(f: File) { setFileB(f); setUrlB(URL.createObjectURL(f)); setDiffUrl(null); setTextDiff(null) }
  function resetA() { setFileA(null); setUrlA(null); setDiffUrl(null); setTextDiff(null) }
  function resetB() { setFileB(null); setUrlB(null); setDiffUrl(null); setTextDiff(null) }

  async function handleDiff() {
    if (!fileA || !fileB) return
    setLoading(true)
    setError(null)
    setDiffUrl(null)
    setTextDiff(null)

    try {
      const form = new FormData()
      form.append('tokenA', fileA)
      form.append('tokenB', fileB)
      form.append('mode', mode)

      const res = await fetch('/api/diff', { method: 'POST', body: form })

      if (mode === 'image') {
        if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
        const blob = await res.blob()
        setDiffUrl(URL.createObjectURL(blob))
      } else {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setTextDiff(data.content)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Two token slots */}
      <div className="flex gap-4">
        <TokenSlot label="Token A (before)" file={fileA} previewUrl={urlA} onFile={setA} onReset={resetA} />
        <TokenSlot label="Token B (after)"  file={fileB} previewUrl={urlB} onFile={setB} onReset={resetB} />
      </div>

      {/* Mode + action */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['image', 'text'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                mode === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {m === 'image' ? 'Visual diff' : 'Text diff'}
            </button>
          ))}
        </div>

        <Button
          onPress={handleDiff}
          isPending={loading}
          isDisabled={!fileA || !fileB}
          className="flex-1"
        >
          <GitDiff size={16} />
          {loading ? 'Comparing…' : 'Compare Tokens'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono">
          {error}
        </div>
      )}

      {/* Image diff result */}
      {diffUrl && (
        <div className="space-y-2">
          <div className="text-xs text-white/40 uppercase tracking-wider">
            Diff · <span className="text-white/60">dark = unchanged · blue/orange/red = changed bytes</span>
          </div>
          <img
            src={diffUrl}
            alt="Diff"
            className="w-full rounded-xl border border-white/10"
            style={{ imageRendering: 'pixelated', background: '#0a0a0a' }}
          />
          <a
            href={diffUrl}
            download="diff.png"
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Download diff.png
          </a>
        </div>
      )}

      {/* Text diff result */}
      {textDiff && (
        <div className="space-y-2">
          <div className="text-xs text-white/40 uppercase tracking-wider">Line diff</div>
          <pre className="text-xs font-mono leading-relaxed max-h-[500px] overflow-auto bg-[#0f0f0f] border border-white/10 rounded-xl p-4 whitespace-pre-wrap">
            {textDiff.split('\n').map((line, i) => {
              const color =
                line.startsWith('+ ') ? 'text-green-400' :
                line.startsWith('- ') ? 'text-red-400' :
                line.startsWith('━') || line.startsWith('@@') ? 'text-blue-400/80' :
                'text-white/50'
              return <span key={i} className={`block ${color}`}>{line}</span>
            })}
          </pre>
        </div>
      )}
    </div>
  )
}
