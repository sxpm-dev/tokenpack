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
  const recordOptions = useMemo(() => curatedRecordOptions(manifest), [manifest])

  const initialRows = useMemo(() => buildRows(), [])
  const displayRows = rows.length > 0 ? rows : initialRows
  const doneRows = displayRows.filter(row => row.state === 'done')
  const bestRow = doneRows.reduce<BenchRow | null>(
    (best, row) => (!best || (row.totalMs ?? Infinity) < (best.totalMs ?? Infinity) ? row : best),
    null,
  )

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
            <span className="text-white/50">Dataset:</span>
            <select
              disabled
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              value="client-spec-map"
            >
              <option value="client-spec-map">client-spec-map.json</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-white/50">Target:</span>
            <select
              className="max-w-md rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
              disabled={running || !manifest}
              value={recordId}
              onChange={event => setRecordId(event.target.value)}
            >
              {recordOptions.map(record => (
                <option key={record.id} value={record.id}>
                  {targetLabel(record)}
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

      {doneRows.length > 0 && <JsonSummary best={bestRow} rows={doneRows} />}

      <Surface className="overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[minmax(280px,1.8fr)_minmax(130px,0.8fr)_repeat(8,minmax(88px,0.65fr))] gap-0 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-white/35">
          <div>Scenario</div>
          <div>Group</div>
          <div>TTFB</div>
          <div>Transfer</div>
          <div>Parse / scan</div>
          <div>Total</div>
          <div>vs Best</div>
          <div>Wire</div>
          <div>Output</div>
          <div>Verify</div>
        </div>
        <div className="divide-y divide-white/10">
          {displayRows.map((row, index) => {
            const previous = index > 0 ? displayRows[index - 1] : null
            const showSection = !previous || previous.group !== row.group

            return (
              <div key={row.id}>
                {showSection && (
                  <div className="border-b border-white/10 px-4 pb-1 pt-4 text-[10px] uppercase tracking-[0.18em] text-white/30">
                    {groupLabel(row.group)}
                  </div>
                )}
                <div className="grid grid-cols-[minmax(280px,1.8fr)_minmax(130px,0.8fr)_repeat(8,minmax(88px,0.65fr))] gap-0 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <BracketsCurlyIcon className="text-green-500" size={14} />
                    <span>{row.label}</span>
                    {bestRow?.id === row.id && (
                      <span className="rounded bg-green-500/15 px-1 py-0.5 text-[9px] uppercase tracking-widest text-green-300">
                        best
                      </span>
                    )}
                  </div>
                  <div className="text-white/45">{groupLabel(row.group)}</div>
                  {row.state === 'errored' ? (
                    <div className="col-span-8 text-red-300">{row.error}</div>
                  ) : row.state === 'running' ? (
                    <div className="col-span-8 text-white/45">running</div>
                  ) : row.state === 'pending' ? (
                    <div className="col-span-8 text-white/25">queued</div>
                  ) : (
                    <>
                      <Cell>{formatMs(row.ttfbMs)}</Cell>
                      <Cell>{formatMs(row.transferMs)}</Cell>
                      <Cell>{formatMs(row.decodeMs)}</Cell>
                      <Cell strong>{formatMs(row.totalMs)}</Cell>
                      <Cell>
                        <VsBest best={bestRow} row={row} />
                      </Cell>
                      <Cell>{formatBytes(row.wireBytes)}</Cell>
                      <Cell>{row.emitted ?? '—'}</Cell>
                      <Cell>{row.verify ?? '—'}</Cell>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Surface>

      <JsonLegend />
    </main>
  )
}

function JsonSummary({ rows, best }: { rows: BenchRow[]; best: BenchRow | null }) {
  const full = bestOfGroup(rows, 'full json')
  const stream = bestOfGroup(rows, 'stream')
  const exact = bestOfGroup(rows, 'exact api')
  const range = bestOfGroup(rows, 'pixel range')

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <JsonCard label="Winner" row={best} tone="green" />
      <JsonCard label="Best full JSON" row={full} />
      <JsonCard compareTo={full} label="Best server API" row={exact} />
      <JsonCard compareTo={full} label="Best pixel range" row={range} />
      <JsonCard compareTo={full} label="Best NDJSON stream" row={stream} />
    </div>
  )
}

function JsonCard({
  label,
  row,
  compareTo,
  tone = 'neutral',
}: {
  label: string
  row: BenchRow | null
  compareTo?: BenchRow | null
  tone?: 'neutral' | 'green'
}) {
  const ratio = row && compareTo ? compareMs(compareTo.totalMs, row.totalMs) : null

  return (
    <Surface className="rounded-2xl p-3">
      <div className="text-[9px] uppercase tracking-widest text-white/30">{label}</div>
      {row ? (
        <>
          <div
            className={`mt-2 text-sm font-semibold ${tone === 'green' ? 'text-green-300' : 'text-white/85'}`}
          >
            {row.label}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/45">
            <span className="text-white/75">{formatMs(row.totalMs)}</span>
            <span>{formatBytes(row.wireBytes)}</span>
            {ratio && (
              <span className={ratio.faster ? 'text-green-300' : 'text-red-300'}>{ratio.text}</span>
            )}
          </div>
        </>
      ) : (
        <div className="mt-2 text-sm text-white/30">not run</div>
      )}
    </Surface>
  )
}

function JsonLegend() {
  return (
    <Surface className="space-y-3 rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/30">Scenario guide</div>
      <div className="grid gap-3 text-[11px] leading-4 text-white/45 md:grid-cols-2">
        <p>
          <span className="text-white/65">Full JSON</span> fetches the whole JSON source, decodes
          text, parses JSON, then checks the selected target.
        </p>
        <p>
          <span className="text-white/65">NDJSON stream</span> scans records until the selected
          target is found. Wire currently shows response size, not necessarily consumed bytes after
          early cancel.
        </p>
        <p>
          <span className="text-white/65">Server API</span> is the server-side competitor: return
          root keys or one selected record without client-side full JSON parsing.
        </p>
        <p>
          <span className="text-white/65">Pixel range</span> reads the semantic pack manifest and
          fetches only the selected record region from the pack.
        </p>
      </div>
    </Surface>
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
    rows.push(pendingRow(`json-parse-${encoding}`, `full JSON · ${encoding}`, 'full json'))
  }
  for (const encoding of JSON_ENCODINGS) {
    rows.push(pendingRow(`ndjson-find-${encoding}`, `NDJSON find target · ${encoding}`, 'stream'))
  }

  rows.push(pendingRow('keys-api', 'Server API · list root keys', 'exact api'))
  rows.push(pendingRow('item-api', 'Server API · fetch selected record', 'exact api'))
  rows.push(
    pendingRow('range-manifest-keys', 'Pixel range · list root keys from manifest', 'pixel range'),
  )
  rows.push(
    pendingRow('range-item-fetch', 'Pixel range · fetch selected record bytes', 'pixel range'),
  )
  rows.push(
    pendingRow('range-item-stream', 'Pixel range · stream selected record bytes', 'pixel range'),
  )

  return rows
}

function curatedRecordOptions(manifest: Manifest | null): JsonRecordSummary[] {
  if (!manifest) return []

  const byId = new Map<string, JsonRecordSummary>()
  const add = (record: JsonRecordSummary | null | undefined) => {
    if (record) byId.set(record.id, record)
  }

  add(manifest.records.find(record => record.id === manifest.suggestedRecordId))
  manifest.records
    .filter(record => record.kind === 'collection')
    .slice(0, 4)
    .forEach(add)
  ;[...manifest.records]
    .filter(record => record.kind === 'component')
    .sort((a, b) => b.byteLength - a.byteLength)
    .slice(0, 6)
    .forEach(add)

  return [...byId.values()].slice(0, 10)
}

function targetLabel(record: JsonRecordSummary): string {
  const parent = record.parentKey ? `${record.parentKey} / ` : ''

  return `${record.kind} · ${parent}${record.label} · ${formatBytes(record.byteLength)}`
}

function bestOfGroup(rows: BenchRow[], group: string): BenchRow | null {
  return rows
    .filter(row => row.group === group)
    .reduce<BenchRow | null>(
      (best, row) => (!best || (row.totalMs ?? Infinity) < (best.totalMs ?? Infinity) ? row : best),
      null,
    )
}

function groupLabel(group: string): string {
  switch (group) {
    case 'full json':
      return 'Full JSON fetch + parse'
    case 'stream':
      return 'NDJSON stream scan'
    case 'exact api':
      return 'Server exact endpoint'
    case 'pixel range':
      return 'Pixel-range semantic pack'
    default:
      return group
  }
}

function VsBest({ row, best }: { row: BenchRow; best: BenchRow | null }) {
  if (!best || row.id === best.id) return <span className="text-white/25">—</span>
  const ratio = compareMs(best.totalMs, row.totalMs)

  return <span className={ratio.faster ? 'text-green-300' : 'text-red-300'}>{ratio.text}</span>
}

function compareMs(
  baseMs: number | undefined,
  valueMs: number | undefined,
): { text: string; faster: boolean } {
  if (!baseMs || !valueMs) return { text: '—', faster: false }

  if (valueMs <= baseMs) return { text: `${(baseMs / valueMs).toFixed(1)}x faster`, faster: true }

  return { text: `${(valueMs / baseMs).toFixed(1)}x slower`, faster: false }
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
    label: 'Server API · list root keys',
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
    label: 'Server API · fetch selected record',
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
    label: 'Pixel range · list root keys from manifest',
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
    label: 'Pixel range · fetch selected record bytes',
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
    label: 'Pixel range · stream selected record bytes',
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
