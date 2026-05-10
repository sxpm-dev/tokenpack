'use client'

import { Button, Surface } from '@heroui/react'
import { BracketsCurlyIcon, BroomIcon, PlayIcon } from '@phosphor-icons/react'
import {
  estimatePackRangeWireBytes,
  fetchPackFile,
  fetchPackFileStream,
  fetchPackManifest,
} from '@tokenpack/browser/fetch-pack'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { decompressRaw } from 'tokenpack/compressors'

type Encoding = 'raw' | 'deflate' | 'brotli'
type PackMode = 'fixture' | 'lazy'
type Throttle = 'local' | 'fast-cdn' | 'average' | 'slow'
type RowState = 'pending' | 'running' | 'done' | 'errored'

interface JsonRecordSummary {
  id: string
  kind: 'collection' | 'component'
  parentKey: string | null
  path: string
  label: string
  byteLength: number
}

interface Manifest {
  source: {
    id: string
    file: string
    bytes: number
    sha256: string
    rootKeyCount: number
    recordCount: number
    ndjsonBytes: number
  }
  rootKeys: string[]
  records: JsonRecordSummary[]
  rootPack: {
    available: boolean
    bytes: number
    error: string | null
    mode: PackMode
    path: string
    records: number
    url: string
  }
  suggestedRecordId: string | null
}

interface BenchRow {
  id: string
  group: string
  label: string
  state: RowState
  error?: string
  ttfbMs?: number
  transferMs?: number
  decodeMs?: number
  totalMs?: number
  wireBytes?: number
  emitted?: number
  verify?: string
}

interface TimedResponse {
  response: Response
  ttfbMs: number
}

const THROTTLES: Array<{ id: Throttle; label: string }> = [
  { id: 'local', label: 'Local' },
  { id: 'fast-cdn', label: 'Fast CDN' },
  { id: 'average', label: 'Average' },
  { id: 'slow', label: 'Slow' },
]

const JSON_ENCODINGS: Encoding[] = ['raw', 'deflate', 'brotli']

export default function JsonPlaygroundPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [recordId, setRecordId] = useState('')
  const [iterations, setIterations] = useState(3)
  const [packMode, setPackMode] = useState<PackMode>('fixture')
  const [throttle, setThrottle] = useState<Throttle>('local')
  const [rows, setRows] = useState<BenchRow[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [topError, setTopError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/json-playground/manifest?mode=${packMode}`, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`manifest failed: HTTP ${response.status}`)

        return response.json() as Promise<Manifest>
      })
      .then(nextManifest => {
        setManifest(nextManifest)
        if (nextManifest.suggestedRecordId) setRecordId(nextManifest.suggestedRecordId)
      })
      .catch(error => setTopError(error instanceof Error ? error.message : String(error)))
  }, [packMode])

  const selectedRecord = useMemo(
    () => manifest?.records.find(record => record.id === recordId) ?? null,
    [manifest, recordId],
  )

  const initialRows = useMemo(() => buildRows(), [])

  async function handleRun() {
    if (!manifest || !selectedRecord) return

    setRunning(true)
    setTopError(null)
    setRows(initialRows)

    try {
      for (const row of initialRows) {
        setProgress(`${row.group} · ${row.label}`)
        setRows(previous => updateRow(previous, row.id, { state: 'running' }))

        try {
          const samples: BenchRow[] = []

          for (let i = 0; i < iterations; i++) {
            samples.push(await runCase(row.id, manifest, selectedRecord, throttle, packMode))
          }

          setRows(previous => updateRow(previous, row.id, aggregateRow(row, samples)))
        } catch (error) {
          setRows(previous =>
            updateRow(previous, row.id, {
              state: 'errored',
              error: error instanceof Error ? error.message : String(error),
            }),
          )
        }
      }
    } finally {
      setProgress('')
      setRunning(false)
    }
  }

  async function handleClearCaches() {
    if ('caches' in self) {
      const names = await caches.keys()

      await Promise.all(names.map(name => caches.delete(name)))
    }
  }

  const displayRows = rows.length > 0 ? rows : initialRows

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">JSON Playground</h1>
        <p className="mt-0.5 text-xs text-white/40">
          Full JSON, NDJSON streaming, direct APIs, and semantic pixel-range pack access over
          client-spec-map.
        </p>
      </div>

      <Surface className="space-y-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-white/50">Record:</span>
            <select
              className="max-w-md rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              disabled={running || !manifest}
              value={recordId}
              onChange={event => setRecordId(event.target.value)}
            >
              {(manifest?.records ?? []).map(record => (
                <option key={record.id} value={record.id}>
                  {record.kind} · {record.label} · {formatBytes(record.byteLength)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Iterations:</span>
            <input
              className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              disabled={running}
              max={20}
              min={1}
              type="number"
              value={iterations}
              onChange={event =>
                setIterations(Math.max(1, Math.min(20, Number(event.target.value))))
              }
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Pack:</span>
            <select
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              disabled={running}
              value={packMode}
              onChange={event => setPackMode(event.target.value as PackMode)}
            >
              <option value="fixture">Pre-generated</option>
              <option value="lazy">Lazy</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Network:</span>
            <select
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              disabled={running}
              value={throttle}
              onChange={event => setThrottle(event.target.value as Throttle)}
            >
              {THROTTLES.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            isDisabled={!manifest || !selectedRecord || running}
            isPending={running}
            onPress={handleRun}
          >
            <PlayIcon className="mr-1.5" size={14} />
            {running ? 'Running…' : 'Run JSON cases'}
          </Button>
          <Button isDisabled={running} size="sm" variant="ghost" onPress={handleClearCaches}>
            <BroomIcon className="mr-1.5" size={12} /> Clear caches
          </Button>
        </div>

        {manifest && (
          <div className="grid gap-2 text-[11px] text-white/40 sm:grid-cols-4">
            <Metric label="Source" value={`${formatBytes(manifest.source.bytes)} JSON`} />
            <Metric
              label="Records"
              value={`${manifest.source.rootKeyCount} roots · ${manifest.source.recordCount} lines`}
            />
            <Metric label="NDJSON" value={formatBytes(manifest.source.ndjsonBytes)} />
            <Metric
              label="Range pack"
              value={`${manifest.rootPack.available ? 'ready' : 'missing'} · ${formatBytes(manifest.rootPack.bytes)}`}
            />
          </div>
        )}

        {manifest?.rootPack.error && (
          <div className="text-[11px] text-amber-200/80">{manifest.rootPack.error}</div>
        )}
        {progress && <div className="text-[11px] text-white/35">{progress}</div>}
        {topError && <div className="text-[11px] text-red-300">{topError}</div>}
      </Surface>

      <Surface className="overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[minmax(260px,1.8fr)_minmax(130px,0.8fr)_repeat(7,minmax(92px,0.65fr))] gap-0 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-white/35">
          <div>Scenario</div>
          <div>Group</div>
          <div>TTFB</div>
          <div>Transfer</div>
          <div>Parse</div>
          <div>Total</div>
          <div>Wire</div>
          <div>Emit</div>
          <div>Verify</div>
        </div>
        <div className="divide-y divide-white/10">
          {displayRows.map(row => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(260px,1.8fr)_minmax(130px,0.8fr)_repeat(7,minmax(92px,0.65fr))] gap-0 px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-2 font-medium">
                <BracketsCurlyIcon className="text-green-500" size={14} />
                <span>{row.label}</span>
              </div>
              <div className="text-white/45">{row.group}</div>
              {row.state === 'errored' ? (
                <div className="col-span-7 text-red-300">{row.error}</div>
              ) : row.state === 'running' ? (
                <div className="col-span-7 text-white/45">running</div>
              ) : row.state === 'pending' ? (
                <div className="col-span-7 text-white/25">queued</div>
              ) : (
                <>
                  <Cell>{formatMs(row.ttfbMs)}</Cell>
                  <Cell>{formatMs(row.transferMs)}</Cell>
                  <Cell>{formatMs(row.decodeMs)}</Cell>
                  <Cell strong>{formatMs(row.totalMs)}</Cell>
                  <Cell>{formatBytes(row.wireBytes)}</Cell>
                  <Cell>{row.emitted ?? '—'}</Cell>
                  <Cell>{row.verify ?? '—'}</Cell>
                </>
              )}
            </div>
          ))}
        </div>
      </Surface>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/30">{label}</div>
      <div className="mt-1 text-white/70">{value}</div>
    </div>
  )
}

function Cell({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <div className={strong ? 'font-semibold text-white/85' : 'text-white/65'}>{children}</div>
}

function buildRows(): BenchRow[] {
  const rows: BenchRow[] = []

  for (const encoding of JSON_ENCODINGS) {
    rows.push(pendingRow(`json-parse-${encoding}`, `full JSON parse · ${encoding}`, 'full json'))
  }
  for (const encoding of JSON_ENCODINGS) {
    rows.push(pendingRow(`ndjson-find-${encoding}`, `NDJSON stream find · ${encoding}`, 'stream'))
  }

  rows.push(pendingRow('keys-api', 'root keys API', 'exact api'))
  rows.push(pendingRow('item-api', 'record API', 'exact api'))
  rows.push(pendingRow('range-manifest-keys', 'range manifest root keys', 'pixel range'))
  rows.push(pendingRow('range-item-fetch', 'range fetch selected record', 'pixel range'))
  rows.push(pendingRow('range-item-stream', 'range stream selected record', 'pixel range'))

  return rows
}

function pendingRow(id: string, label: string, group: string): BenchRow {
  return { id, group, label, state: 'pending' }
}

async function runCase(
  id: string,
  manifest: Manifest,
  record: JsonRecordSummary,
  throttle: Throttle,
  packMode: PackMode,
): Promise<BenchRow> {
  if (id.startsWith('json-parse-')) {
    return runFullJsonParse(id, id.replace('json-parse-', '') as Encoding, record, throttle)
  }
  if (id.startsWith('ndjson-find-')) {
    return runNdjsonFind(id, id.replace('ndjson-find-', '') as Encoding, record, throttle)
  }
  if (id === 'keys-api') return runKeysApi(id, manifest, throttle)
  if (id === 'item-api') return runItemApi(id, record, throttle)
  if (id === 'range-manifest-keys') return runRangeManifestKeys(id, manifest, throttle, packMode)
  if (id === 'range-item-fetch') return runRangeItemFetch(id, record, throttle, packMode)
  if (id === 'range-item-stream') return runRangeItemStream(id, record, throttle, packMode)

  throw new Error(`unknown JSON playground case: ${id}`)
}

async function runFullJsonParse(
  id: string,
  encoding: Encoding,
  record: JsonRecordSummary,
  throttle: Throttle,
): Promise<BenchRow> {
  const start = performance.now()
  const { response, ttfbMs } = await fetchTimed(
    `/api/json-playground/json?encoding=${encoding}&throttle=${throttle}`,
  )
  const bytes = new Uint8Array(await response.arrayBuffer())
  const transferEnd = performance.now()
  const text = new TextDecoder().decode(bytes)
  const parsed = JSON.parse(text) as Record<string, unknown>
  const decodeEnd = performance.now()
  const key = record.parentKey ?? record.id.replace('collection:', '')

  return {
    id,
    group: 'full json',
    label: `full JSON parse · ${encoding}`,
    state: 'done',
    decodeMs: decodeEnd - transferEnd,
    emitted: Object.keys(parsed).length,
    totalMs: decodeEnd - start,
    transferMs: transferEnd - start,
    ttfbMs,
    verify: key in parsed ? 'ok' : 'miss',
    wireBytes: contentLength(response) ?? bytes.byteLength,
  }
}

async function runNdjsonFind(
  id: string,
  encoding: Encoding,
  record: JsonRecordSummary,
  throttle: Throttle,
): Promise<BenchRow> {
  const start = performance.now()
  const { response, ttfbMs } = await fetchTimed(
    `/api/json-playground/ndjson?encoding=${encoding}&throttle=${throttle}`,
  )
  const scanStart = performance.now()
  const result = await findRecordInNdjson(response, record.id)
  const scanEnd = performance.now()

  return {
    id,
    group: 'stream',
    label: `NDJSON stream find · ${encoding}`,
    state: 'done',
    decodeMs: scanEnd - scanStart,
    emitted: result.lines,
    totalMs: scanEnd - start,
    transferMs: scanEnd - start,
    ttfbMs,
    verify: result.found ? 'ok' : 'miss',
    wireBytes: contentLength(response),
  }
}

async function runKeysApi(id: string, manifest: Manifest, throttle: Throttle): Promise<BenchRow> {
  const start = performance.now()
  const { response, ttfbMs } = await fetchTimed(`/api/json-playground/keys?throttle=${throttle}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const transferEnd = performance.now()
  const keys = JSON.parse(new TextDecoder().decode(bytes)) as string[]
  const decodeEnd = performance.now()

  return {
    id,
    group: 'exact api',
    label: 'root keys API',
    state: 'done',
    decodeMs: decodeEnd - transferEnd,
    emitted: keys.length,
    totalMs: decodeEnd - start,
    transferMs: transferEnd - start,
    ttfbMs,
    verify: keys.length === manifest.rootKeys.length ? 'ok' : 'miss',
    wireBytes: contentLength(response) ?? bytes.byteLength,
  }
}

async function runItemApi(
  id: string,
  record: JsonRecordSummary,
  throttle: Throttle,
): Promise<BenchRow> {
  const start = performance.now()
  const { response, ttfbMs } = await fetchTimed(
    `/api/json-playground/item?id=${encodeURIComponent(record.id)}&throttle=${throttle}`,
  )
  const bytes = new Uint8Array(await response.arrayBuffer())
  const transferEnd = performance.now()
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { id?: string }
  const decodeEnd = performance.now()

  return {
    id,
    group: 'exact api',
    label: 'record API',
    state: 'done',
    decodeMs: decodeEnd - transferEnd,
    emitted: 1,
    totalMs: decodeEnd - start,
    transferMs: transferEnd - start,
    ttfbMs,
    verify: parsed.id === record.id ? 'ok' : 'miss',
    wireBytes: contentLength(response) ?? bytes.byteLength,
  }
}

async function runRangeManifestKeys(
  id: string,
  manifest: Manifest,
  throttle: Throttle,
  packMode: PackMode,
): Promise<BenchRow> {
  const start = performance.now()
  const remote = await fetchPackManifest(rootPackUrl(throttle, packMode))
  const end = performance.now()
  const rootKeys = remote.manifest.files.filter(file => file.path.startsWith('collections/'))

  return {
    id,
    group: 'pixel range',
    label: 'range manifest root keys',
    state: 'done',
    decodeMs: 0,
    emitted: rootKeys.length,
    totalMs: end - start,
    transferMs: end - start,
    ttfbMs: end - start,
    verify: rootKeys.length === manifest.rootKeys.length ? 'ok' : 'miss',
    wireBytes: remote.prefetchedBytes.byteLength,
  }
}

async function runRangeItemFetch(
  id: string,
  record: JsonRecordSummary,
  throttle: Throttle,
  packMode: PackMode,
): Promise<BenchRow> {
  const start = performance.now()
  const remote = await fetchPackManifest(rootPackUrl(throttle, packMode))
  const manifestEnd = performance.now()
  const bytes = await fetchPackFile(remote, record.path, decompressRaw)
  const transferEnd = performance.now()
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { id?: string }
  const decodeEnd = performance.now()

  return {
    id,
    group: 'pixel range',
    label: 'range fetch selected record',
    state: 'done',
    decodeMs: decodeEnd - transferEnd,
    emitted: 1,
    totalMs: decodeEnd - start,
    transferMs: transferEnd - start,
    ttfbMs: manifestEnd - start,
    verify: parsed.id === record.id ? 'ok' : 'miss',
    wireBytes: estimatePackRangeWireBytes(remote, [record.path]),
  }
}

async function runRangeItemStream(
  id: string,
  record: JsonRecordSummary,
  throttle: Throttle,
  packMode: PackMode,
): Promise<BenchRow> {
  const start = performance.now()
  const remote = await fetchPackManifest(rootPackUrl(throttle, packMode))
  const manifestEnd = performance.now()
  const file = await fetchPackFileStream(remote, record.path)
  const text = await readTextStream(file.stream)
  const transferEnd = performance.now()
  const parsed = JSON.parse(text) as { id?: string }
  const decodeEnd = performance.now()

  return {
    id,
    group: 'pixel range',
    label: 'range stream selected record',
    state: 'done',
    decodeMs: decodeEnd - transferEnd,
    emitted: 1,
    totalMs: decodeEnd - start,
    transferMs: transferEnd - start,
    ttfbMs: manifestEnd - start,
    verify: parsed.id === record.id ? 'ok' : 'miss',
    wireBytes: estimatePackRangeWireBytes(remote, [record.path]),
  }
}

async function fetchTimed(url: string): Promise<TimedResponse> {
  const start = performance.now()
  const response = await fetch(withNonce(url), {
    cache: 'no-store',
    credentials: 'omit',
    headers: { 'cache-control': 'no-store' },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)

  return { response, ttfbMs: performance.now() - start }
}

async function findRecordInNdjson(
  response: Response,
  id: string,
): Promise<{ found: boolean; lines: number }> {
  if (!response.body) throw new Error('NDJSON response has no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let lines = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break
      pending += decoder.decode(value, { stream: true })

      let newline = pending.indexOf('\n')

      while (newline !== -1) {
        const line = pending.slice(0, newline)

        pending = pending.slice(newline + 1)
        if (line.trim()) {
          lines += 1
          if ((JSON.parse(line) as { id?: string }).id === id) {
            await reader.cancel()

            return { found: true, lines }
          }
        }
        newline = pending.indexOf('\n')
      }
    }

    pending += decoder.decode()
    if (pending.trim()) {
      lines += 1
      if ((JSON.parse(pending) as { id?: string }).id === id) return { found: true, lines }
    }

    return { found: false, lines }
  } finally {
    reader.releaseLock()
  }
}

async function readTextStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let text = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) break
      text += decoder.decode(value, { stream: true })
    }

    return text + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}

function aggregateRow(template: BenchRow, samples: BenchRow[]): BenchRow {
  return {
    ...template,
    state: 'done',
    decodeMs: median(samples.map(sample => sample.decodeMs ?? 0)),
    emitted: samples[0]?.emitted,
    totalMs: median(samples.map(sample => sample.totalMs ?? 0)),
    transferMs: median(samples.map(sample => sample.transferMs ?? 0)),
    ttfbMs: median(samples.map(sample => sample.ttfbMs ?? 0)),
    verify: samples.every(sample => sample.verify === 'ok') ? 'ok' : 'miss',
    wireBytes: samples[0]?.wireBytes,
  }
}

function updateRow(rows: BenchRow[], id: string, patch: Partial<BenchRow>): BenchRow[] {
  return rows.map(row => (row.id === id ? { ...row, ...patch } : row))
}

function rootPackUrl(throttle: Throttle, packMode: PackMode): string {
  return withNonce(`/api/json-playground/root-pack?throttle=${throttle}&mode=${packMode}`)
}

function withNonce(url: string): string {
  const join = url.includes('?') ? '&' : '?'

  return `${url}${join}nonce=${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function contentLength(response: Response): number | undefined {
  const raw = response.headers.get('content-length')

  if (!raw) return undefined
  const value = Number(raw)

  return Number.isFinite(value) ? value : undefined
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function formatMs(value: number | undefined): string {
  if (value === undefined) return '—'
  if (value < 1) return `${(value * 1000).toFixed(1)}µs`
  if (value < 100) return `${value.toFixed(1)}ms`

  return `${Math.round(value)}ms`
}

function formatBytes(value: number | undefined): string {
  if (value === undefined) return '—'
  if (value < 1024) return `${value}B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`

  return `${(value / 1024 / 1024).toFixed(2)}MB`
}
