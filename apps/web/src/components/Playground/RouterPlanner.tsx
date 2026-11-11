'use client'

import { useMemo, useState } from 'react'

import { formatBytes } from './format'
import { type FileInput, type PlannedChunk, planRouter, TARGET_CHUNK_BYTES } from './planRouter'

const SAMPLE_BUNDLE: FileInput[] = [
  { id: 'f-1', path: 'app.js', bytes: 240_000 },
  { id: 'f-2', path: 'vendor/react.js', bytes: 1_350_000 },
  { id: 'f-3', path: 'styles.css', bytes: 18_000 },
  { id: 'f-4', path: 'components/header.js', bytes: 8_400 },
  { id: 'f-5', path: 'components/sidebar.js', bytes: 12_100 },
  { id: 'f-6', path: 'components/footer.js', bytes: 5_200 },
  { id: 'f-7', path: 'pages/index.js', bytes: 22_000 },
  { id: 'f-8', path: 'pages/about.js', bytes: 9_800 },
  { id: 'f-9', path: 'pages/docs.js', bytes: 14_200 },
  { id: 'f-10', path: 'icons/sprite.svg', bytes: 4_800 },
]

const CHUNK_COLORS = [
  'bg-tp-accent',
  'bg-sky-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-teal-500',
]

export function RouterPlanner() {
  const [files, setFiles] = useState<FileInput[]>(SAMPLE_BUNDLE)
  const [selectedId, setSelectedId] = useState<string | null>('f-2')

  const plan = useMemo(() => planRouter(files), [files])

  const selectedFile = plan.files.find(f => f.id === selectedId) ?? null

  function setFileBytes(id: string, bytes: number) {
    setFiles(prev => prev.map(f => (f.id === id ? { ...f, bytes } : f)))
  }

  function addFile() {
    const id = `f-${Date.now()}`

    setFiles(prev => [...prev, { id, path: `new-file-${prev.length + 1}.js`, bytes: 64_000 }])
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-[1fr_1.4fr]">
      {/* LEFT — bundle editor */}
      <section className="bg-tp-bg p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-medium tracking-tight">Bundle files</h2>
          <button
            className="rounded-md border border-tp-border bg-tp-elev px-2.5 py-1 font-mono text-[11px] text-tp-fg hover:border-tp-fg/40"
            type="button"
            onClick={addFile}
          >
            + add
          </button>
        </header>
        <ul className="flex flex-col gap-2">
          {plan.files.map(file => (
            <FileRow
              key={file.id}
              file={file}
              selected={file.id === selectedId}
              onRemove={() => removeFile(file.id)}
              onSelect={() => setSelectedId(file.id)}
              onSize={bytes => setFileBytes(file.id, bytes)}
            />
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-tp-border pt-4 text-[11px]">
          <Metric
            detail="manifest covers this"
            label="Bundle"
            value={formatBytes(files.reduce((s, f) => s + f.bytes, 0))}
          />
          <Metric detail="produced" label="Chunks" value={String(plan.chunks.length)} />
          <Metric
            detail={selectedFile ? selectedFile.segments.length + ' segments' : '—'}
            label="Selected"
            value={selectedFile ? formatBytes(selectedFile.bytes) : '—'}
          />
        </div>
      </section>

      {/* RIGHT — chunks visualization */}
      <section className="bg-tp-bg p-6">
        <header className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-medium tracking-tight">Chunk layout</h2>
          <span className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
            1 MB target · 32 KB tiny · 512 KB split
          </span>
        </header>

        <div className="flex flex-col gap-3">
          {plan.chunks.map((chunk, idx) => (
            <ChunkBar
              key={chunk.id}
              chunk={chunk}
              color={CHUNK_COLORS[idx % CHUNK_COLORS.length]!}
              files={plan.files}
              selectedId={selectedId}
            />
          ))}
        </div>

        {selectedFile && (
          <div className="mt-6 rounded-md border border-tp-border bg-tp-elev2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] tracking-[0.14em] text-tp-muted uppercase">
                Range requests for <span className="font-mono text-tp-fg">{selectedFile.path}</span>
              </span>
              <span className="font-mono text-[11px] text-tp-muted">
                {selectedFile.segments.length} request
                {selectedFile.segments.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 font-mono text-[12px]">
              {selectedFile.segments.map((seg, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded bg-tp-elev px-3 py-2"
                >
                  <span className="text-tp-soft">GET</span>
                  <span className="text-tp-fg">chunk-{seg.chunkId}.png</span>
                  <span className="text-tp-soft">Range:</span>
                  <span className="text-tp-accent">
                    bytes={seg.offsetInChunk}-{seg.offsetInChunk + seg.length - 1}
                  </span>
                  <span className="ml-auto text-[10.5px] text-tp-muted">
                    pulls bytes {seg.fileOffset}–{seg.fileOffset + seg.length - 1} of file
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="mt-6">
          <summary className="cursor-pointer text-[11px] tracking-[0.14em] text-tp-muted uppercase select-none hover:text-tp-fg">
            Manifest JSON (lives in router.png)
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-tp-border bg-tp-elev p-4 font-mono text-[11px] leading-relaxed text-tp-fg">
            {JSON.stringify(plan.manifest, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  )
}

interface FileRowProps {
  file: { id: string; path: string; bytes: number }
  selected: boolean
  onSelect: () => void
  onSize: (bytes: number) => void
  onRemove: () => void
}

function FileRow({ file, selected, onSelect, onSize, onRemove }: FileRowProps) {
  return (
    <li
      className={`rounded-md border p-3 transition-colors ${
        selected
          ? 'border-tp-accent bg-tp-mark/10'
          : 'border-tp-border bg-tp-elev hover:border-tp-fg/30'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <button
          className="flex-1 truncate text-left font-mono text-[12.5px] text-tp-fg hover:text-tp-accent"
          type="button"
          onClick={onSelect}
        >
          {file.path}
        </button>
        <span className="font-mono text-[11px] tabular-nums text-tp-muted">
          {formatBytes(file.bytes)}
        </span>
        <button
          aria-label={`Remove ${file.path}`}
          className="text-tp-soft hover:text-tp-fg"
          type="button"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      <input
        aria-label={`Adjust size of ${file.path}`}
        className="mt-1.5 w-full accent-tp-accent"
        max={4_000_000}
        min={100}
        step={100}
        type="range"
        value={file.bytes}
        onChange={e => onSize(Number(e.target.value))}
      />
    </li>
  )
}

interface ChunkBarProps {
  chunk: PlannedChunk
  color: string
  files: { id: string; path: string }[]
  selectedId: string | null
}

function ChunkBar({ chunk, color, files, selectedId }: ChunkBarProps) {
  const width = Math.max(8, (chunk.size / TARGET_CHUNK_BYTES) * 100)

  return (
    <div className="rounded-md border border-tp-border bg-tp-elev p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[12px] text-tp-fg">chunk-{chunk.id}.png</span>
        <span className="font-mono text-[11px] tabular-nums text-tp-muted">
          {formatBytes(chunk.size)}
        </span>
      </div>
      <div
        className="relative h-7 overflow-hidden rounded border border-tp-border bg-tp-bg"
        style={{ width: `${Math.min(100, width)}%` }}
      >
        {chunk.occupants.map((occ, idx) => {
          const file = files.find(f => f.id === occ.fileId)
          const pct = (occ.length / chunk.size) * 100
          const isSelected = selectedId === occ.fileId

          return (
            <div
              key={idx}
              className={`relative h-full ${color} ${isSelected ? 'opacity-100 ring-1 ring-tp-fg ring-inset' : 'opacity-70'}`}
              style={{ width: `${pct}%`, display: 'inline-block' }}
              title={`${file?.path ?? '?'} · ${formatBytes(occ.length)}`}
            />
          )
        })}
      </div>
      {chunk.occupants.length > 1 && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-tp-muted">
          {chunk.occupants.map((occ, idx) => {
            const file = files.find(f => f.id === occ.fileId)

            return (
              <span key={idx} className="font-mono">
                {file?.path ?? '?'}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  detail: string
}

function Metric({ label, value, detail }: MetricProps) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.1em] text-tp-soft uppercase">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] text-tp-fg">{value}</div>
      <div className="text-[10.5px] text-tp-muted">{detail}</div>
    </div>
  )
}
