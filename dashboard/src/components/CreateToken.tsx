'use client'

import { useState, useRef } from 'react'
import { Button, Card } from '@heroui/react'

const PRESETS = ['none', 'sunset', 'aurora', 'candy', 'midnight', 'fire', 'matrix', 'spiral', 'shuffle', 'raw']
const ALGOS   = ['linear', 'radial', 'interleaved', 'semantic']

export function CreateToken() {
  const [mode, setMode]         = useState<'text' | 'file'>('text')
  const [text, setText]         = useState('')
  const [file, setFile]         = useState<File | null>(null)
  const [isZip, setIsZip]       = useState(false)
  const [unzip, setUnzip]       = useState(false)
  const [preset, setPreset]     = useState('none')
  const [algo, setAlgo]         = useState('linear')
  const [compress, setCompress] = useState(true)
  const [cellSize, setCellSize] = useState('1')
  const [loading, setLoading]   = useState(false)
  const [tokenUrl, setTokenUrl] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [stats, setStats]       = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setIsZip(f?.name.endsWith('.zip') ?? false)
    setUnzip(false)
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setTokenUrl(null)
    setStats(null)

    try {
      let res: Response

      if (mode === 'file' && file && (isZip && unzip)) {
        const form = new FormData()
        form.append('file', file)
        form.append('unzip', 'true')
        if (preset !== 'none') form.append('preset', preset)
        else { form.append('algo', algo); form.append('cellSize', cellSize) }
        if (compress) form.append('compress', 'true')
        res = await fetch('/api/pack', { method: 'POST', body: form })
      } else {
        const form = new FormData()
        if (mode === 'text') form.append('text', text)
        else if (file) form.append('file', file)
        if (preset !== 'none') form.append('preset', preset)
        else { form.append('algo', algo); form.append('cellSize', cellSize) }
        if (compress) form.append('compress', 'true')
        res = await fetch('/api/encode', { method: 'POST', body: form })
      }

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error)
      }

      const blob = await res.blob()
      setTokenUrl(URL.createObjectURL(blob))
      setStats(`${(blob.size / 1024).toFixed(1)} KB`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Source mode */}
      <div className="flex gap-2">
        {(['text', 'file'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/15'
            }`}
          >
            {m === 'text' ? 'Text' : 'File'}
          </button>
        ))}
      </div>

      {/* Input */}
      {mode === 'text' ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your source code or any text here…"
          rows={10}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
        />
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
        >
          <div className="text-white/40 text-sm">
            {file ? (
              <span className="text-white/80 font-medium">{file.name} <span className="text-white/40">({(file.size / 1024).toFixed(1)} KB)</span></span>
            ) : (
              'Click to upload a file or .zip'
            )}
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Zip unpack checkbox */}
      {isZip && (
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={unzip} onChange={e => setUnzip(e.target.checked)} className="accent-white" />
          Unzip and pack as filesystem token
        </label>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Preset</label>
          <select
            value={preset}
            onChange={e => setPreset(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          >
            {PRESETS.map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
          </select>
        </div>

        {preset === 'none' && (
          <div>
            <label className="text-xs text-white/40 mb-1 block">Algorithm</label>
            <select
              value={algo}
              onChange={e => setAlgo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            >
              {ALGOS.map(a => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
            </select>
          </div>
        )}

        {preset === 'none' && (
          <div>
            <label className="text-xs text-white/40 mb-1 block">Cell size (1=dense, 5=dots)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={cellSize}
              onChange={e => setCellSize(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" checked={compress} onChange={e => setCompress(e.target.checked)} className="accent-white" />
        Compress with brotli (smaller token)
      </label>

      <Button onPress={handleGenerate} isPending={loading} fullWidth>
        {loading ? 'Generating…' : 'Generate Token'}
      </Button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {tokenUrl && (
        <Card variant="secondary">
          <Card.Content className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Token generated · {stats}</span>
              <a
                href={tokenUrl}
                download="token.png"
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Download token.png
              </a>
            </div>
            <img
              src={tokenUrl}
              alt="Generated token"
              className="w-full rounded-lg border border-white/10"
              style={{ imageRendering: 'pixelated' }}
            />
          </Card.Content>
        </Card>
      )}
    </div>
  )
}
