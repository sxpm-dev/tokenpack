'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { formatBytes } from './format'
import { useDecoder } from './useDecoder'
import { useEncoder } from './useEncoder'

const DEFAULT_PAYLOAD = `Hello, TokenPack.

This is a real string being encoded into the pixels of an Image Token.
Drag the rendered image into the decode panel on the right —
or into any new browser tab — and you'll see the same bytes
on the way out.

The compression is brotli/deflate. The image is the carrier.`

const ALGOS = [
  { value: 'linear-deflate', label: 'linear-deflate', hint: 'browser-decodable' },
  {
    value: 'linear-stream-deflate',
    label: 'stream-deflate',
    hint: 'first byte before transfer ends',
  },
  {
    value: 'pixel-range-deflate',
    label: 'pixel-range-deflate',
    hint: 'tpAK chunk · range-fetch',
  },
  { value: 'pixel-range-none', label: 'pixel-range-none', hint: 'no compression · debug' },
]

export function EncodeDecodePanel() {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD)
  const [algo, setAlgo] = useState('linear-deflate')
  const [name, setName] = useState('greeting.txt')

  const encoder = useEncoder()
  const decoder = useDecoder()
  const encode = encoder.run
  const decode = decoder.run

  // Auto-encode on input changes (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      encode({ payload, algo, name })
    }, 220)

    return () => clearTimeout(handle)
  }, [payload, algo, name, encode])

  // When encode produces a token, push it into the decoder for round-trip
  const lastEncodedRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (encoder.result && encoder.result.bytes !== lastEncodedRef.current) {
      lastEncodedRef.current = encoder.result.bytes
      decode(encoder.result.bytes)
    }
  }, [encoder.result, decode])

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-2">
      <EncodePanel
        algo={algo}
        error={encoder.error}
        name={name}
        payload={payload}
        result={encoder.result}
        running={encoder.loading}
        onAlgoChange={setAlgo}
        onNameChange={setName}
        onPayloadChange={setPayload}
      />
      <DecodePanel decoder={decoder} encodedBytes={encoder.result?.bytes ?? null} />
    </div>
  )
}

interface EncodePanelProps {
  payload: string
  algo: string
  name: string
  running: boolean
  error: string | null
  result: ReturnType<typeof useEncoder>['result']
  onPayloadChange: (v: string) => void
  onAlgoChange: (v: string) => void
  onNameChange: (v: string) => void
}

function EncodePanel({
  payload,
  algo,
  name,
  running,
  error,
  result,
  onPayloadChange,
  onAlgoChange,
  onNameChange,
}: EncodePanelProps) {
  const payloadBytes = useMemo(() => new TextEncoder().encode(payload).byteLength, [payload])
  const ratio =
    result && payloadBytes > 0 ? ((result.bytes.byteLength / payloadBytes) * 100).toFixed(0) : null

  return (
    <section className="bg-tp-bg p-7">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-tp-accent/15 font-mono text-[12px] text-tp-accent">
            ↑
          </span>
          <h2 className="text-[15px] font-medium tracking-tight">Encode</h2>
          <span className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
            payload → Image Token
          </span>
        </div>
        {running ? (
          <span className="font-mono text-[11px] text-tp-muted">encoding…</span>
        ) : (
          <span className="font-mono text-[11px] text-tp-muted">
            {formatBytes(payloadBytes)} in
          </span>
        )}
      </header>

      <div className="mb-4 grid gap-4">
        <Field label="Algorithm">
          <select
            className="w-full rounded-md border border-tp-border bg-tp-elev px-3 py-2 font-mono text-[13px] text-tp-fg outline-none focus:border-tp-accent"
            value={algo}
            onChange={e => onAlgoChange(e.target.value)}
          >
            {ALGOS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.hint}
              </option>
            ))}
          </select>
        </Field>
        <Field label="File name (optional)">
          <input
            className="w-full rounded-md border border-tp-border bg-tp-elev px-3 py-2 font-mono text-[13px] text-tp-fg outline-none focus:border-tp-accent"
            placeholder="anonymous"
            value={name}
            onChange={e => onNameChange(e.target.value)}
          />
        </Field>
        <Field label="Payload (UTF-8 text)">
          <textarea
            className="h-48 w-full resize-none rounded-md border border-tp-border bg-tp-elev px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-tp-fg outline-none focus:border-tp-accent"
            value={payload}
            onChange={e => onPayloadChange(e.target.value)}
          />
        </Field>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-[12px] whitespace-pre-wrap text-red-500">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-tp-border bg-tp-elev2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] tracking-[0.14em] text-tp-muted uppercase">
              Encoded token
            </span>
            <a
              className="font-mono text-[11px] text-tp-fg hover:text-tp-accent"
              download={`${name || 'token'}.png`}
              href={result.objectURL}
            >
              ↓ download
            </a>
          </div>
          <div className="mb-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- object-URL blob; next/image can't optimize a per-keystroke preview */}
            <img
              alt="Encoded token preview"
              className="h-20 w-20 rounded border border-tp-border object-cover"
              src={result.objectURL}
            />
            <dl className="flex-1 text-[12.5px]">
              <Row
                label="Size on wire"
                value={`${formatBytes(result.bytes.byteLength)}${ratio ? ` · ${ratio}% of input` : ''}`}
              />
              <Row label="MIME" value={result.mediaType ?? 'image/png'} />
              <Row label="Algo" value={algo} />
            </dl>
          </div>
          <details>
            <summary className="cursor-pointer text-[11px] tracking-[0.14em] text-tp-muted uppercase select-none hover:text-tp-fg">
              First 64 bytes (hex)
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-tp-elev p-3 font-mono text-[11px] leading-relaxed text-tp-fg">
              {hexDump(result.bytes, 64)}
            </pre>
          </details>
        </div>
      )}
    </section>
  )
}

interface DecodePanelProps {
  encodedBytes: Uint8Array | null
  decoder: ReturnType<typeof useDecoder>
}

function DecodePanel({ encodedBytes, decoder }: DecodePanelProps) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      const buf = new Uint8Array(await file.arrayBuffer())

      decoder.run(buf)
    },
    [decoder],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]

      if (file) void handleFile(file)
    },
    [handleFile],
  )

  return (
    <section className="bg-tp-bg p-7">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-tp-accent/15 font-mono text-[12px] text-tp-accent">
            ↓
          </span>
          <h2 className="text-[15px] font-medium tracking-tight">Decode</h2>
          <span className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
            Image Token → payload
          </span>
        </div>
        <span className="font-mono text-[11px] text-tp-muted">
          {encodedBytes ? 'round-trip' : 'drop an Image Token'}
        </span>
      </header>

      <div
        className={`mb-4 rounded-md border-2 border-dashed p-6 text-center text-[13px] transition-colors ${
          dragging
            ? 'border-tp-accent bg-tp-mark/10 text-tp-fg'
            : 'border-tp-border bg-tp-elev text-tp-muted'
        }`}
        onDragLeave={() => setDragging(false)}
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDrop={onDrop}
      >
        Drop any TokenPack Image Token here{' '}
        <span className="text-tp-soft">— or use the encoded token from the left.</span>
        <div className="mt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-tp-border bg-tp-bg px-3 py-1.5 font-mono text-[12px] text-tp-fg hover:border-tp-fg/40">
            choose file…
            <input
              accept="image/png,image/webp,image/avif"
              className="sr-only"
              type="file"
              onChange={e => {
                const file = e.target.files?.[0]

                if (file) void handleFile(file)
              }}
            />
          </label>
        </div>
      </div>

      {decoder.error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-[12px] whitespace-pre-wrap text-red-500">
          {decoder.error}
        </div>
      )}

      {decoder.result && (
        <div className="rounded-md border border-tp-border bg-tp-elev2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] tracking-[0.14em] text-tp-muted uppercase">Decoded</span>
            <span className="font-mono text-[11px] text-tp-muted">
              {decoder.result.kind}
              {decoder.result.kind === 'file' && decoder.result.name
                ? ` · ${decoder.result.name}`
                : ''}
            </span>
          </div>
          {decoder.result.kind === 'file' && (
            <pre className="max-h-64 overflow-auto rounded bg-tp-elev p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-tp-fg">
              {decoder.result.text ?? hexDump(decoder.result.bytes, 256)}
            </pre>
          )}
          {decoder.result.kind === 'pack' && (
            <ul className="divide-y divide-tp-border">
              {decoder.result.entries.map(entry => (
                <li
                  key={entry.path}
                  className="flex items-center justify-between gap-2 py-2 font-mono text-[12.5px]"
                >
                  <span className="truncate text-tp-fg">{entry.path}</span>
                  <span className="text-tp-muted">{formatBytes(entry.size)}</span>
                </li>
              ))}
            </ul>
          )}
          {decoder.result.kind === 'diff' && (
            <div className="font-mono text-[12.5px] text-tp-fg">
              Diff token · {decoder.result.entries.length} ops
            </div>
          )}
          {decoder.result.kind === 'router' && (
            <div className="font-mono text-[12.5px] text-tp-fg">
              Router token · {decoder.result.entries.length} files
            </div>
          )}
        </div>
      )}
    </section>
  )
}

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

interface RowProps {
  label: string
  value: string
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <dt className="font-mono text-[10px] tracking-[0.12em] text-tp-soft uppercase">{label}</dt>
      <dd className="font-mono text-tp-fg">{value}</dd>
    </div>
  )
}

function hexDump(bytes: Uint8Array, max = 64): string {
  const slice = bytes.subarray(0, max)
  const lines: string[] = []

  for (let i = 0; i < slice.length; i += 16) {
    const row = Array.from(slice.subarray(i, i + 16))
    const hex = row.map(b => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = row.map(b => (b >= 32 && b < 127 ? String.fromCharCode(b) : '·')).join('')

    lines.push(`${i.toString(16).padStart(4, '0')}  ${hex.padEnd(48)}  ${ascii}`)
  }
  if (bytes.length > max) lines.push(`… ${bytes.length - max} more bytes`)

  return lines.join('\n')
}
