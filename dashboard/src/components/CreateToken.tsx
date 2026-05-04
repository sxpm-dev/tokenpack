'use client'

import { useState, useRef } from 'react'
import { Button, Card } from '@heroui/react'
import { UploadSimple, ArrowRight, ArrowDown, ArrowUp, Cpu, Lock } from '@phosphor-icons/react'

const PRESETS = [
  'none',
  'sunset',
  'aurora',
  'candy',
  'midnight',
  'fire',
  'matrix',
  'shuffle',
  'raw',
]
const ALGOS = ['linear', 'interleaved', 'bitplane', 'delta', 'xor', 'delta-chain', 'rle', 'predict', 'bitshuffle', 'zstdpix']

const COMPRESSION_MODES = [
  { value: 'none', label: 'none', stream: true },
  { value: 'deflate-1', label: 'deflate-1', stream: true },
  { value: 'deflate-6', label: 'deflate-6', stream: true },
  { value: 'deflate-9', label: 'deflate-9', stream: true },
  { value: 'brotli-4', label: 'brotli-4', stream: true },
  { value: 'brotli-6', label: 'brotli-6', stream: true },
  { value: 'brotli-11', label: 'brotli-11', stream: false },
]

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

interface SizeStats {
  inputBytes: number
  tokenBytes: number
  gzipBytes: number | null
  brotliBytes: number | null
}

function PctBadge({ base, value }: { base: number; value: number }) {
  const diff = value - base
  const pct = Math.abs((diff / base) * 100).toFixed(1)
  const smaller = diff < 0
  return (
    <span
      className={`flex items-center gap-0.5 font-mono text-xs px-1.5 py-0.5 rounded-full ${
        smaller ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
      }`}
    >
      {smaller ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
      {pct}%
    </span>
  )
}

function SizeBadge({ stats }: { stats: SizeStats }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="text-white/50 font-mono">{formatBytes(stats.inputBytes)}</span>
        <ArrowRight size={14} className="text-white/20" />
        <span className="text-white/80 font-mono font-semibold">
          {formatBytes(stats.tokenBytes)}
        </span>
        <PctBadge base={stats.inputBytes} value={stats.tokenBytes} />
        <span className="text-white/30 text-xs">
          {stats.tokenBytes < stats.inputBytes
            ? `${formatBytes(stats.inputBytes - stats.tokenBytes)} smaller`
            : `${formatBytes(stats.tokenBytes - stats.inputBytes)} larger`}
        </span>
      </div>

      {(stats.gzipBytes !== null || stats.brotliBytes !== null) && (
        <div className="flex items-center gap-4 text-xs text-white/40 pl-0.5">
          <span className="text-white/20">vs</span>
          {stats.gzipBytes !== null && (
            <span className="flex items-center gap-1.5">
              <span className="font-mono">.zip / .tar.gz</span>
              <span className="font-mono text-white/60">{formatBytes(stats.gzipBytes)}</span>
              <PctBadge base={stats.inputBytes} value={stats.gzipBytes} />
            </span>
          )}
          {stats.brotliBytes !== null && (
            <span className="flex items-center gap-1.5">
              <span className="font-mono">.br</span>
              <span className="font-mono text-white/60">{formatBytes(stats.brotliBytes)}</span>
              <PctBadge base={stats.inputBytes} value={stats.brotliBytes} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function CreateToken() {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [configMode, setConfigMode] = useState<'default' | 'manual'>('default')
  const [defaultPreset, setDefaultPreset] = useState<'streamable' | 'max'>('max')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isZip, setIsZip] = useState(false)
  const [unzip, setUnzip] = useState(false)
  const [preset, setPreset] = useState('none')
  const [algo, setAlgo] = useState('linear')
  const [compressionMode, setCompressionMode] = useState('brotli-11')
  const [cellSize, setCellSize] = useState('1')
  const [key, setKey] = useState('')
  const [bpp, setBpp] = useState<number>(4)
  const [imgFormat, setImgFormat] = useState<'png' | 'avif' | 'webp'>('webp')
  const [loading, setLoading] = useState(false)
  const [tokenUrl, setTokenUrl] = useState<string | null>(null)
  const [tokenFileName, setTokenFileName] = useState<string>('token.png')
  const [error, setError] = useState<string | null>(null)
  const [sizeStats, setSizeStats] = useState<SizeStats | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function getInputBytes() {
    if (inputMode === 'text') return new TextEncoder().encode(text).length
    return file?.size ?? 0
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setIsZip(f?.name.endsWith('.zip') ?? false)
    setUnzip(false)
  }

  function clearResult() {
    setTokenUrl(null)
    setSizeStats(null)
    setError(null)
  }

  // WebP alpha premultiplication makes bpp=4 unsafe.
  const isWebP = imgFormat === 'webp'
  const effectiveBpp = isWebP && bpp === 4 ? 3 : bpp

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setTokenUrl(null)
    setSizeStats(null)

    const inputBytes = getInputBytes()

    try {
      let res: Response

      const isPackMode = inputMode === 'file' && file && isZip && unzip
      const fileName = `token.${imgFormat}`
      setTokenFileName(fileName)

      if (isPackMode) {
        const form = new FormData()
        form.append('file', file)
        form.append('unzip', 'true')
        if (configMode === 'manual') {
          if (preset !== 'none') form.append('preset', preset)
          else {
            form.append('algo', algo)
            form.append('cellSize', cellSize)
            form.append('channels', String(effectiveBpp))
            form.append('format', imgFormat)
          }
          form.append('compressionMode', compressionMode)
        } else {
          const cm = defaultPreset === 'streamable' ? 'brotli-6' : 'brotli-11'
          form.append('compressionMode', cm)
          form.append('channels', '4')
          form.append('format', 'webp')
        }
        if (key) form.append('key', key)
        res = await fetch('/api/pack', { method: 'POST', body: form })
      } else {
        const form = new FormData()
        if (inputMode === 'text') form.append('text', text)
        else if (file) form.append('file', file)
        if (configMode === 'manual') {
          if (preset !== 'none') form.append('preset', preset)
          else {
            form.append('algo', algo)
            form.append('cellSize', cellSize)
            form.append('channels', String(effectiveBpp))
            form.append('format', imgFormat)
          }
          form.append('compressionMode', compressionMode)
        } else {
          const cm = defaultPreset === 'streamable' ? 'brotli-6' : 'brotli-11'
          form.append('compressionMode', cm)
          form.append('channels', '4')
          form.append('format', 'webp')
        }
        if (key) form.append('key', key)
        res = await fetch('/api/encode', { method: 'POST', body: form })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const imgBytes = Uint8Array.from(atob(data.token), c => c.charCodeAt(0))
      const mimeType = imgFormat === 'avif' ? 'image/avif' : imgFormat === 'webp' ? 'image/webp' : 'image/png'
      const blob = new Blob([imgBytes], { type: mimeType })
      setTokenUrl(URL.createObjectURL(blob))
      setSizeStats({
        inputBytes,
        tokenBytes: blob.size,
        gzipBytes: data.gzipSize ?? null,
        brotliBytes: data.brotliSize ?? null,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = inputMode === 'text' ? text.length > 0 : file !== null

  return (
    <div className="space-y-4">
      {/* Input mode toggle */}
      <div className="flex gap-2">
        {(['text', 'file'] as const).map(m => (
          <button
            key={m}
            onClick={() => {
              setInputMode(m)
              clearResult()
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              inputMode === m
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/15'
            }`}
          >
            {m === 'text' ? 'Text' : 'File'}
          </button>
        ))}
      </div>

      {/* Input */}
      {inputMode === 'text' ? (
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value)
            clearResult()
          }}
          placeholder="Paste your source code or any text here…"
          rows={10}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
        />
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-colors flex flex-col items-center gap-2"
        >
          <UploadSimple size={24} className="text-white/30" />
          <div className="text-sm text-white/40">
            {file ? (
              <span className="text-white/80 font-medium">
                {file.name}
                <span className="text-white/40 ml-2">({formatBytes(file.size)})</span>
              </span>
            ) : (
              'Click to upload a file or .zip'
            )}
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Zip checkbox */}
      {isZip && (
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input
            type="checkbox"
            checked={unzip}
            onChange={e => setUnzip(e.target.checked)}
            className="accent-white"
          />
          Unzip and pack as filesystem token
        </label>
      )}

      {/* Config mode tabs */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          {(['default', 'manual'] as const).map(m => (
            <button
              key={m}
              onClick={() => setConfigMode(m)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                configMode === m
                  ? 'bg-white/8 text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/4'
              }`}
            >
              {m === 'default' ? 'Default' : 'Manual'}
            </button>
          ))}
        </div>

        <div className="p-3">
          {configMode === 'default' ? (
            <div className="space-y-2">
              {([
                { key: 'max', label: 'Max compression', desc: 'brotli-11 · WebP · 4 bpp', stream: false },
                { key: 'streamable', label: 'Max streamable', desc: 'brotli-6 · WebP · 4 bpp', stream: true },
              ] as const).map(p => (
                <button
                  key={p.key}
                  onClick={() => setDefaultPreset(p.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    defaultPreset === p.key ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                  }`}
                >
                  <Cpu size={13} className="shrink-0 text-white/30" />
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="text-xs text-white/30 font-mono">{p.desc}</span>
                  {p.stream && <span className="ml-auto text-[10px] text-green-400/70 font-mono">stream</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Preset</label>
                  <select
                    value={preset}
                    onChange={e => setPreset(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    {PRESETS.map(p => (
                      <option key={p} value={p} className="bg-zinc-900">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {preset === 'none' && (
                  <>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Algorithm</label>
                      <select
                        value={algo}
                        onChange={e => setAlgo(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                      >
                        {ALGOS.map(a => (
                          <option key={a} value={a} className="bg-zinc-900">
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-white/40 mb-1 block">
                        Cell size (1=dense · 5=dots)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cellSize}
                        onChange={e => setCellSize(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    {/* BPP selector */}
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">
                        Bytes per pixel
                      </label>
                      <div className="flex gap-1.5">
                        {([1, 2, 3, 4] as const).map(n => (
                          <button
                            key={n}
                            onClick={() => setBpp(n)}
                            disabled={isSemanticPreset}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              effectiveBpp === n
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/60 hover:bg-white/15'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Format selector */}
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Image format</label>
                      <div className="flex gap-1.5">
                        {(['png', 'avif', 'webp'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setImgFormat(f)}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              imgFormat === f
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/60 hover:bg-white/15'
                            }`}
                          >
                            {f.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Compression</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMPRESSION_MODES.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setCompressionMode(m.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        compressionMode === m.value
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {m.label}
                      {m.stream && (
                        <span className="ml-1 text-[9px] text-green-400/70 font-normal">stream</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Encryption key (optional) */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
        <Lock size={14} className="shrink-0 text-white/30" />
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="Encryption key (optional)"
          className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 focus:outline-none"
        />
        {key && (
          <span className="text-[10px] text-amber-400/70 font-mono shrink-0">AES-256</span>
        )}
      </div>

      <Button onPress={handleGenerate} isPending={loading} isDisabled={!canGenerate} fullWidth>
        {loading ? 'Generating…' : 'Generate Token'}
      </Button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {tokenUrl && sizeStats && (
        <Card variant="secondary">
          <Card.Content className="p-4 space-y-3">
            <SizeBadge stats={sizeStats} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">{tokenFileName}</span>
              <a
                href={tokenUrl}
                download={tokenFileName}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Download
              </a>
            </div>
            <img
              src={tokenUrl}
              alt="Generated token"
              className="w-full rounded-lg border border-white/10"
              style={{ imageRendering: 'pixelated', background: '#111' }}
            />
          </Card.Content>
        </Card>
      )}
    </div>
  )
}
