'use client'

import { Button, Surface } from '@heroui/react'
import { BroomIcon, PlayIcon } from '@phosphor-icons/react'
import { decode } from '@tokenpack/browser'
import {
  estimatePackRangeWireBytes,
  fetchPackFile,
  fetchPackFileStream,
  fetchPackManifest,
} from '@tokenpack/browser/fetch-pack'
import type { ReactNode } from 'react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { decompressRaw } from 'tokenpack/compressors'

import { useSavedBenchRun } from '@/lib/use-saved-bench-run'

type Encoding = 'raw' | 'deflate' | 'brotli'
type PackMode = 'fixture' | 'lazy'
type Throttle = 'local' | 'fast-cdn' | 'average' | 'slow'
type RowState = 'pending' | 'running' | 'done' | 'errored'
type AccessScenario = 'root-keys' | 'object-by-path'
type JsonTokenAlgo = 'pixel-range-none-c3' | 'linear-deflate-c3'

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
    algo: JsonTokenAlgo
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
  kind: string
  label: string
  algo: string
  scenario: AccessScenario
  scenarioLabel: string
  path: string
  state: RowState
  error?: string
  ttfbMs?: number
  transferMs?: number
  parseMs?: number
  accessMs?: number
  totalMs?: number
  wireBytes?: number
  result?: string
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
  const [pathSearch, setPathSearch] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [iterations, setIterations] = useState(3)
  const [packMode, setPackMode] = useState<PackMode>('lazy')
  const [throttle, setThrottle] = useState<Throttle>('local')
  const [rows, setRows] = useState<BenchRow[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [topError, setTopError] = useState<string | null>(null)

  const savedRunMessage = useSavedBenchRun(
    'json',
    JSON.stringify({ recordId, iterations, packMode, throttle }),
    running,
    rows,
    setRows,
  )

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
  const recordOptions = useMemo(
    () =>
      (manifest?.records ?? []).filter(record =>
        `${record.path} ${record.label}`.toLowerCase().includes(pathSearch.toLowerCase()),
      ),
    [manifest, pathSearch],
  )

  const initialRows = useMemo(
    () => buildRows().filter(row => row.scenario === 'object-by-path'),
    [],
  )
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
    setPreview(null)

    try {
      // Prepare both packs before timing any fetch or decode.
      for (const algo of ['pixel-range-none-c3', 'linear-deflate-c3']) {
        const response = await fetch(`/api/json-playground/prepare?algo=${algo}`, {
          method: 'POST',
        })

        if (!response.ok)
          throw new Error('Could not prepare the JSON fixture. Retry the comparison.')
      }
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
      const remote = await fetchPackManifest(rootPackUrl('local', packMode))
      const bytes = await fetchPackFile(remote, selectedRecord.path, decompressRaw)
      const value = JSON.parse(new TextDecoder().decode(bytes)).value

      setPreview(JSON.stringify(value, null, 2).slice(0, 12000))
    } catch (error) {
      setTopError(error instanceof Error ? error.message : String(error))
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
        <h1 className="text-lg font-semibold tracking-tight">Large JSON playground</h1>
        <p className="mt-0.5 text-xs text-tp-muted">
          Explore a large JSON document by indexed path. Compare downloading and parsing the whole
          document with fetching only the selected record.
        </p>
      </div>

      <Surface className="space-y-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-tp-muted">Dataset:</span>
            <select
              disabled
              className="rounded border border-tp-border bg-white/5 px-2 py-1 text-xs"
              value="client-spec-map"
            >
              <option value="client-spec-map">client-spec-map.json</option>
            </select>
          </label>

          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-tp-muted">Indexed path</span>
            <input
              aria-label="Search JSON paths"
              className="min-w-0 rounded border border-tp-border bg-tp-bg p-2 text-sm"
              disabled={running}
              placeholder="Search collections or components…"
              value={pathSearch}
              onChange={event => {
                setPathSearch(event.target.value)
                setRecordId('')
                setRows([])
                setPreview(null)
              }}
            />
            <select
              aria-label="Indexed JSON path"
              className="w-full max-w-full sm:max-w-md rounded border border-tp-border bg-white/5 px-2 py-1 text-xs"
              disabled={running || !manifest}
              value={recordId}
              onChange={event => {
                setRecordId(event.target.value)
                setRows([])
                setPreview(null)
              }}
            >
              <option value="">Choose an indexed path</option>
              {recordOptions.map(record => (
                <option key={record.id} value={record.id}>
                  {record.path} · {formatBytes(record.byteLength)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-tp-muted">Iterations:</span>
            <input
              className="w-16 rounded border border-tp-border bg-white/5 px-2 py-1 text-xs"
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

          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-tp-muted">Pack:</span>
            <select
              className="rounded border border-tp-border bg-white/5 px-2 py-1 text-xs"
              disabled={running}
              value={packMode}
              onChange={event => setPackMode(event.target.value as PackMode)}
            >
              <option value="fixture">Pre-generated</option>
              <option value="lazy">Lazy</option>
            </select>
          </label>

          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-tp-muted">Network:</span>
            <select
              className="rounded border border-tp-border bg-white/5 px-2 py-1 text-xs"
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
            {running ? 'Comparing…' : 'Compare access methods'}
          </Button>
          <Button isDisabled={running} size="sm" variant="ghost" onPress={handleClearCaches}>
            <BroomIcon className="mr-1.5" size={12} /> Clear caches
          </Button>
        </div>

        {manifest && (
          <div className="grid gap-2 text-[11px] text-tp-muted sm:grid-cols-4">
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
        {progress && <div className="text-[11px] text-tp-muted">{progress}</div>}
        {topError && <div className="text-[11px] text-red-300">{topError}</div>}
      </Surface>

      {doneRows.length > 0 && <JsonSummary best={bestRow} rows={doneRows} />}

      {selectedRecord && (
        <section className="space-y-3 border-y border-tp-border py-5">
          <h2 className="text-base font-semibold">Selected record</h2>
          <code className="block break-all text-sm">{selectedRecord.path}</code>
          <p className="text-sm text-tp-muted">
            {formatBytes(selectedRecord.byteLength)} of {formatBytes(manifest?.source.bytes)} JSON.
            The range request reads the pack index and the selected compressed record. Each method
            returns this same record.
          </p>
          {preview && (
            <details open>
              <summary className="cursor-pointer text-sm">
                Fetched value · preview limited to 12,000 characters
              </summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded border border-tp-border bg-tp-elev p-4 text-xs">
                {preview}
              </pre>
            </details>
          )}
        </section>
      )}
      <details className="min-w-0">
        <summary className="cursor-pointer py-3 text-sm font-semibold">
          All access methods · timing and transfer details
        </summary>
        <ResultsTable bestRow={bestRow} rows={displayRows} />
      </details>

      <p className="text-xs text-tp-muted">
        *Range transfer sizes are estimates from the index and requested regions. HTTP sizes use
        response lengths. Timings reflect this browser and the selected network simulation.
      </p>
      <p className="text-xs text-tp-muted" role="status">
        {savedRunMessage}
      </p>
      <JsonLegend />
    </main>
  )
}

function JsonSummary({ rows }: { rows: BenchRow[]; best: BenchRow | null }) {
  const full = bestOfGroup(rows, 'http json')
  const exact = bestOfGroup(rows, 'server api')
  const range = bestOfGroup(
    rows.filter(row => row.id === 'token-range-object-fetch'),
    'tokenpack',
  )

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <JsonCard label="Download whole JSON" row={full} />
      <JsonCard compareTo={full} label="Request a server record" row={exact} />
      <JsonCard compareTo={full} label="Range-fetch selected record" row={range} />
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
      <div className="text-[9px] uppercase tracking-widest text-tp-muted">{label}</div>
      {row ? (
        <>
          <div
            className={`mt-2 text-sm font-semibold ${tone === 'green' ? 'text-green-300' : 'text-tp-fg'}`}
          >
            {row.label}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-tp-muted">
            <span className="text-tp-fg">{formatMs(row.totalMs)}</span>
            <span>{formatBytes(row.wireBytes)}</span>
            {ratio && (
              <span className={ratio.faster ? 'text-green-300' : 'text-red-300'}>{ratio.text}</span>
            )}
          </div>
        </>
      ) : (
        <div className="mt-2 text-sm text-tp-muted">not run</div>
      )}
    </Surface>
  )
}

function JsonLegend() {
  return (
    <Surface className="space-y-3 rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-tp-muted">Scenario guide</div>
      <div className="grid gap-3 text-[11px] leading-4 text-tp-muted md:grid-cols-2">
        <p>
          <span className="text-tp-fg">Native JSON document</span> fetches one full JSON file, then
          decodes and parses on the client.
        </p>
        <p>
          <span className="text-tp-fg">Native NDJSON stream</span> fetches one line-delimited
          document and stops scanning when the selected target is found.
        </p>
        <p>
          <span className="text-tp-fg">Server API requests</span> return root keys or one selected
          record from purpose-built endpoints.
        </p>
        <p>
          <span className="text-tp-fg">Pixel-range TokenPack</span> reads a PNG-backed pack
          manifest, then fetches selected record bytes by HTTP Range.
        </p>
      </div>
    </Surface>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-tp-border bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-tp-muted">{label}</div>
      <div className="mt-1 text-tp-fg">{value}</div>
    </div>
  )
}

function ResultsTable({ rows, bestRow }: { rows: BenchRow[]; bestRow: BenchRow | null }) {
  return (
    <Surface className="overflow-x-auto rounded-2xl p-3.5">
      <table className="w-full min-w-[1080px] text-xs">
        <thead>
          <tr className="border-b border-tp-border text-[10px] uppercase tracking-widest text-tp-muted">
            <th className="px-2 py-2 text-left font-normal">Kind</th>
            <th className="px-2 py-2 text-left font-normal">Algo</th>
            <th className="px-2 py-2 text-left font-normal">Format / Case</th>
            <th className="px-2 py-2 text-left font-normal">Scenario</th>
            <th className="px-2 py-2 text-left font-normal">Path</th>
            <th className="px-2 py-2 text-right font-normal">Load</th>
            <th className="px-2 py-2 text-right font-normal">Parse</th>
            <th className="px-2 py-2 text-right font-normal">Access</th>
            <th className="px-2 py-2 text-right font-normal">Total</th>
            <th className="px-2 py-2 text-right font-normal">Transfer bytes*</th>
            <th className="px-2 py-2 text-left font-normal">Result</th>
            <th className="px-2 py-2 text-left font-normal">Verify</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const previous = index > 0 ? rows[index - 1] : null
            const showSection = !previous || previous.group !== row.group

            return (
              <Fragment key={row.id}>
                {showSection && (
                  <tr className="border-b border-tp-border">
                    <td
                      className="px-2 pb-1 pt-4 text-[10px] uppercase tracking-widest text-tp-muted"
                      colSpan={12}
                    >
                      {groupLabel(row.group)}
                    </td>
                  </tr>
                )}
                <ResultRow bestRow={bestRow} row={row} />
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </Surface>
  )
}

function ResultRow({ row, bestRow }: { row: BenchRow; bestRow: BenchRow | null }) {
  const isBest = row.state === 'done' && bestRow?.id === row.id
  const isStream = row.kind === 'http-ndjson'
  const streamClass = isStream ? 'border-l-2 border-purple-500/40 bg-purple-500/[0.025]' : ''

  if (row.state === 'pending' || row.state === 'running') {
    return (
      <tr className={`border-b border-tp-border text-tp-muted ${streamClass}`}>
        <VariantCells isBest={isBest} row={row} />
        <td className="px-2 py-1.5 text-[10px] italic text-tp-muted" colSpan={10}>
          {row.state === 'running' ? 'running…' : 'queued'}
        </td>
      </tr>
    )
  }

  if (row.state === 'errored') {
    return (
      <tr className={`border-b border-red-400/10 bg-red-500/5 text-red-300 ${streamClass}`}>
        <VariantCells isBest={isBest} row={row} />
        <td className="px-2 py-1.5" colSpan={10}>
          {row.error}
        </td>
      </tr>
    )
  }

  return (
    <tr className={`border-b border-tp-border text-tp-fg ${streamClass}`}>
      <VariantCells isBest={isBest} row={row} />
      <td className="px-2 py-1.5 text-tp-fg">{row.scenarioLabel}</td>
      <td className="max-w-[260px] truncate px-2 py-1.5 font-mono text-[10px] text-tp-muted">
        {row.path}
      </td>
      <NumberCell>{formatMs(row.transferMs)}</NumberCell>
      <NumberCell>{formatMs(row.parseMs)}</NumberCell>
      <NumberCell>{formatMs(row.accessMs)}</NumberCell>
      <NumberCell strong className={isBest ? 'text-green-400' : 'text-tp-fg'}>
        {formatMs(row.totalMs)}
      </NumberCell>
      <NumberCell>{formatBytes(row.wireBytes)}</NumberCell>
      <td className="px-2 py-1.5 text-tp-muted">{row.result ?? '—'}</td>
      <td
        className={
          row.verify === 'ok' ? 'px-2 py-1.5 text-green-300/80' : 'px-2 py-1.5 text-red-300'
        }
      >
        {row.verify ?? '—'}
      </td>
    </tr>
  )
}

function VariantCells({ row, isBest }: { row: BenchRow; isBest: boolean }) {
  return (
    <>
      <td className="px-2 py-1.5 text-tp-muted">{row.kind}</td>
      <td className="px-2 py-1.5 font-mono text-[10px] text-tp-muted">{row.algo}</td>
      <td className="px-2 py-1.5 font-medium">
        <span className={isBest ? 'text-green-400' : 'text-tp-fg'}>
          <span className="font-mono">{row.label}</span>
          {row.kind === 'token' && <TableBadge tone="blue">TK</TableBadge>}
          {row.kind === 'http-ndjson' && <TableBadge tone="purple">STREAM</TableBadge>}
          {isBest && <TableBadge tone="green">BEST</TableBadge>}
        </span>
      </td>
    </>
  )
}

function NumberCell({
  children,
  strong,
  className = 'text-tp-fg',
}: {
  children: ReactNode
  strong?: boolean
  className?: string
}) {
  return (
    <td
      className={`px-2 py-1.5 text-right tabular-nums ${strong ? 'font-medium' : ''} ${className}`}
    >
      {children}
    </td>
  )
}

function TableBadge({ children, tone }: { children: string; tone: 'blue' | 'green' | 'purple' }) {
  const toneClass = {
    blue: 'bg-blue-500/15 text-blue-300',
    green: 'bg-green-500/15 text-green-300',
    purple: 'bg-purple-500/15 text-purple-300',
  }[tone]

  return (
    <span
      className={`ml-1.5 rounded px-1 py-0.5 text-[9px] uppercase tracking-widest ${toneClass}`}
    >
      {children}
    </span>
  )
}

function buildRows(): BenchRow[] {
  const rows: BenchRow[] = []

  rows.push(
    pendingRow(
      'token-range-root-keys',
      'metadata',
      'tokenpack',
      'token',
      'pixel-range-none-c3',
      'root-keys',
    ),
  )
  rows.push(
    pendingRow(
      'token-range-object-fetch',
      'range fetch',
      'tokenpack',
      'token',
      'pixel-range-none-c3',
      'object-by-path',
    ),
  )
  rows.push(
    pendingRow(
      'token-range-object-stream',
      'range stream',
      'tokenpack',
      'token',
      'pixel-range-none-c3',
      'object-by-path',
    ),
  )
  rows.push(
    pendingRow(
      'token-linear-root-keys',
      'full token',
      'tokenpack',
      'token',
      'linear-deflate-c3',
      'root-keys',
    ),
  )
  rows.push(
    pendingRow(
      'token-linear-object',
      'full token',
      'tokenpack',
      'token',
      'linear-deflate-c3',
      'object-by-path',
    ),
  )
  rows.push(pendingRow('api-root-keys', 'server fs', 'server api', 'api', 'server', 'root-keys'))
  rows.push(pendingRow('api-object', 'server fs', 'server api', 'api', 'server', 'object-by-path'))

  for (const encoding of JSON_ENCODINGS) {
    rows.push(
      pendingRow(
        `json-root-keys-${encoding}`,
        encoding,
        'http json',
        'http-json',
        encoding,
        'root-keys',
      ),
    )
    rows.push(
      pendingRow(
        `json-object-${encoding}`,
        encoding,
        'http json',
        'http-json',
        encoding,
        'object-by-path',
      ),
    )
  }
  for (const encoding of JSON_ENCODINGS) {
    rows.push(
      pendingRow(
        `ndjson-root-keys-${encoding}`,
        encoding,
        'http ndjson scan',
        'http-ndjson',
        encoding,
        'root-keys',
      ),
    )
    rows.push(
      pendingRow(
        `ndjson-object-${encoding}`,
        encoding,
        'http ndjson scan',
        'http-ndjson',
        encoding,
        'object-by-path',
      ),
    )
  }

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
    case 'tokenpack':
      return 'TokenPack'
    case 'server api':
      return 'Server API'
    case 'http json':
      return 'HTTP full JSON'
    case 'http ndjson scan':
      return 'HTTP NDJSON scan'
    default:
      return group
  }
}

function compareMs(
  baseMs: number | undefined,
  valueMs: number | undefined,
): { text: string; faster: boolean } {
  if (!baseMs || !valueMs) return { text: '—', faster: false }

  if (valueMs <= baseMs) return { text: `${(baseMs / valueMs).toFixed(1)}x faster`, faster: true }

  return { text: `${(valueMs / baseMs).toFixed(1)}x slower`, faster: false }
}

function pendingRow(
  id: string,
  label: string,
  group: string,
  kind: string,
  algo: string,
  scenario: AccessScenario,
): BenchRow {
  return {
    algo,
    group,
    id,
    kind,
    label,
    path: scenario === 'root-keys' ? '$' : 'selected JSON path',
    scenario,
    scenarioLabel: scenario === 'root-keys' ? 'root keys' : 'object by path',
    state: 'pending',
  }
}

async function runCase(
  id: string,
  manifest: Manifest,
  record: JsonRecordSummary,
  throttle: Throttle,
  packMode: PackMode,
): Promise<BenchRow> {
  if (id.startsWith('json-root-keys-')) {
    return runFullJsonAccess(
      id,
      id.replace('json-root-keys-', '') as Encoding,
      'root-keys',
      record,
      manifest,
      throttle,
    )
  }
  if (id.startsWith('json-object-')) {
    return runFullJsonAccess(
      id,
      id.replace('json-object-', '') as Encoding,
      'object-by-path',
      record,
      manifest,
      throttle,
    )
  }
  if (id.startsWith('ndjson-root-keys-')) {
    return runNdjsonAccess(
      id,
      id.replace('ndjson-root-keys-', '') as Encoding,
      'root-keys',
      record,
      manifest,
      throttle,
    )
  }
  if (id.startsWith('ndjson-object-')) {
    return runNdjsonAccess(
      id,
      id.replace('ndjson-object-', '') as Encoding,
      'object-by-path',
      record,
      manifest,
      throttle,
    )
  }
  if (id === 'api-root-keys') return runKeysApi(id, manifest, throttle)
  if (id === 'api-object') return runItemApi(id, record, throttle)
  if (id === 'token-range-root-keys') return runRangeManifestKeys(id, manifest, throttle, packMode)
  if (id === 'token-range-object-fetch') return runRangeItemFetch(id, record, throttle, packMode)
  if (id === 'token-range-object-stream') return runRangeItemStream(id, record, throttle, packMode)
  if (id === 'token-linear-root-keys') {
    return runLinearTokenAccess(id, 'root-keys', record, manifest, throttle, packMode)
  }
  if (id === 'token-linear-object') {
    return runLinearTokenAccess(id, 'object-by-path', record, manifest, throttle, packMode)
  }

  throw new Error(`unknown JSON playground case: ${id}`)
}

async function runFullJsonAccess(
  id: string,
  encoding: Encoding,
  scenario: AccessScenario,
  record: JsonRecordSummary,
  manifest: Manifest,
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
  const parseEnd = performance.now()
  const access = accessJsonScenario(parsed, record, scenario, manifest)
  const accessEnd = performance.now()

  return {
    ...rowBase(id, encoding, 'http json', 'http-json', encoding, scenario, record),
    state: 'done',
    accessMs: accessEnd - parseEnd,
    parseMs: parseEnd - transferEnd,
    result: access.result,
    totalMs: accessEnd - start,
    transferMs: transferEnd - start,
    ttfbMs,
    verify: access.ok ? 'ok' : 'miss',
    wireBytes: contentLength(response) ?? bytes.byteLength,
  }
}

async function runNdjsonAccess(
  id: string,
  encoding: Encoding,
  scenario: AccessScenario,
  record: JsonRecordSummary,
  manifest: Manifest,
  throttle: Throttle,
): Promise<BenchRow> {
  const start = performance.now()
  const { response, ttfbMs } = await fetchTimed(
    `/api/json-playground/ndjson?encoding=${encoding}&throttle=${throttle}`,
  )
  const scanStart = performance.now()
  const result = await scanNdjson(response, record.id, scenario, manifest)
  const scanEnd = performance.now()

  return {
    ...rowBase(id, encoding, 'http ndjson scan', 'http-ndjson', encoding, scenario, record),
    state: 'done',
    accessMs: scanEnd - scanStart,
    parseMs: 0,
    result: result.result,
    totalMs: scanEnd - start,
    transferMs: scanEnd - start,
    ttfbMs,
    verify: result.ok ? 'ok' : 'miss',
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
    ...rowBase(id, 'server fs', 'server api', 'api', 'server', 'root-keys', null),
    state: 'done',
    accessMs: 0,
    parseMs: decodeEnd - transferEnd,
    result: `${keys.length} keys`,
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
    ...rowBase(id, 'server fs', 'server api', 'api', 'server', 'object-by-path', record),
    state: 'done',
    accessMs: 0,
    parseMs: decodeEnd - transferEnd,
    result: 'object',
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
    ...rowBase(id, 'metadata', 'tokenpack', 'token', 'pixel-range-none-c3', 'root-keys', null),
    state: 'done',
    accessMs: 0,
    parseMs: 0,
    result: `${rootKeys.length} keys`,
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
    ...rowBase(
      id,
      'range fetch',
      'tokenpack',
      'token',
      'pixel-range-none-c3',
      'object-by-path',
      record,
    ),
    state: 'done',
    accessMs: 0,
    parseMs: decodeEnd - transferEnd,
    result: 'object',
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
    ...rowBase(
      id,
      'range stream',
      'tokenpack',
      'token',
      'pixel-range-none-c3',
      'object-by-path',
      record,
    ),
    state: 'done',
    accessMs: 0,
    parseMs: decodeEnd - transferEnd,
    result: 'object',
    totalMs: decodeEnd - start,
    transferMs: transferEnd - start,
    ttfbMs: manifestEnd - start,
    verify: parsed.id === record.id ? 'ok' : 'miss',
    wireBytes: estimatePackRangeWireBytes(remote, [record.path]),
  }
}

async function runLinearTokenAccess(
  id: string,
  scenario: AccessScenario,
  record: JsonRecordSummary,
  manifest: Manifest,
  throttle: Throttle,
  packMode: PackMode,
): Promise<BenchRow> {
  const start = performance.now()
  const { response, ttfbMs } = await fetchTimed(
    rootPackUrl(throttle, packMode, 'linear-deflate-c3'),
  )
  const bytes = new Uint8Array(await response.arrayBuffer())
  const transferEnd = performance.now()
  const pack = await decode(bytes)
  const parseEnd = performance.now()

  if (!pack.isPack()) throw new Error('linear token did not decode to a pack')

  if (scenario === 'root-keys') {
    const rootKeys = pack.entries.filter(entry => entry.path.startsWith('collections/'))
    const accessEnd = performance.now()

    return {
      ...rowBase(id, 'full token', 'tokenpack', 'token', 'linear-deflate-c3', 'root-keys', null),
      state: 'done',
      accessMs: accessEnd - parseEnd,
      parseMs: parseEnd - transferEnd,
      result: `${rootKeys.length} keys`,
      totalMs: accessEnd - start,
      transferMs: transferEnd - start,
      ttfbMs,
      verify: rootKeys.length === manifest.rootKeys.length ? 'ok' : 'miss',
      wireBytes: contentLength(response) ?? bytes.byteLength,
    }
  }

  const fileBytes = await pack.extract(record.path)
  const parsed = JSON.parse(new TextDecoder().decode(fileBytes)) as { id?: string }
  const accessEnd = performance.now()

  return {
    ...rowBase(
      id,
      'full token',
      'tokenpack',
      'token',
      'linear-deflate-c3',
      'object-by-path',
      record,
    ),
    state: 'done',
    accessMs: accessEnd - parseEnd,
    parseMs: parseEnd - transferEnd,
    result: 'object',
    totalMs: accessEnd - start,
    transferMs: transferEnd - start,
    ttfbMs,
    verify: parsed.id === record.id ? 'ok' : 'miss',
    wireBytes: contentLength(response) ?? bytes.byteLength,
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

function rowBase(
  id: string,
  label: string,
  group: string,
  kind: string,
  algo: string,
  scenario: AccessScenario,
  record: JsonRecordSummary | null,
): Pick<
  BenchRow,
  'algo' | 'group' | 'id' | 'kind' | 'label' | 'path' | 'scenario' | 'scenarioLabel'
> {
  return {
    algo,
    group,
    id,
    kind,
    label,
    path: scenario === 'root-keys' ? '$' : (record?.path ?? 'selected JSON path'),
    scenario,
    scenarioLabel: scenario === 'root-keys' ? 'root keys' : 'object by path',
  }
}

function accessJsonScenario(
  root: Record<string, unknown>,
  record: JsonRecordSummary,
  scenario: AccessScenario,
  manifest: Manifest,
): { ok: boolean; result: string } {
  if (scenario === 'root-keys') {
    const keyCount = Object.keys(root).length

    return { ok: keyCount === manifest.rootKeys.length, result: `${keyCount} keys` }
  }

  const value = findObjectByRecord(root, record)

  return { ok: value !== null, result: value === null ? 'miss' : resultType(value) }
}

function findObjectByRecord(
  root: Record<string, unknown>,
  record: JsonRecordSummary,
): unknown | null {
  if (record.kind === 'collection') {
    const key = record.id.replace('collection:', '')

    return key in root ? root[key] : null
  }

  const collection = record.parentKey ? root[record.parentKey] : null

  if (!isObject(collection) || !Array.isArray(collection.components)) return null

  return (
    collection.components.find(
      component => isObject(component) && component.componentId === record.label,
    ) ?? null
  )
}

function resultType(value: unknown): string {
  if (Array.isArray(value)) return 'array'
  if (isObject(value)) return 'object'

  return typeof value
}

async function scanNdjson(
  response: Response,
  id: string,
  scenario: AccessScenario,
  manifest: Manifest,
): Promise<{ ok: boolean; result: string }> {
  if (!response.body) throw new Error('NDJSON response has no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let lines = 0
  const rootKeys = new Set<string>()

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
          const parsed = JSON.parse(line) as { id?: string; kind?: string; parentKey?: string }

          if (scenario === 'root-keys' && parsed.kind === 'collection' && parsed.id) {
            rootKeys.add(parsed.id.replace('collection:', ''))
            if (rootKeys.size === manifest.rootKeys.length) {
              await reader.cancel()

              return { ok: true, result: `${rootKeys.size} keys` }
            }
          }

          if (scenario === 'object-by-path' && parsed.id === id) {
            await reader.cancel()

            return { ok: true, result: 'object' }
          }
        }
        newline = pending.indexOf('\n')
      }
    }

    pending += decoder.decode()
    if (pending.trim()) {
      lines += 1
      const parsed = JSON.parse(pending) as { id?: string; kind?: string }

      if (scenario === 'root-keys' && parsed.kind === 'collection' && parsed.id) {
        rootKeys.add(parsed.id.replace('collection:', ''))
      }
      if (scenario === 'object-by-path' && parsed.id === id) return { ok: true, result: 'object' }
    }

    if (scenario === 'root-keys') {
      return {
        ok: rootKeys.size === manifest.rootKeys.length,
        result: `${rootKeys.size} keys`,
      }
    }

    return { ok: false, result: `${lines} lines` }
  } finally {
    reader.releaseLock()
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
    accessMs: median(samples.map(sample => sample.accessMs ?? 0)),
    parseMs: median(samples.map(sample => sample.parseMs ?? 0)),
    result: samples[0]?.result,
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

function rootPackUrl(
  throttle: Throttle,
  packMode: PackMode,
  algo: JsonTokenAlgo = 'pixel-range-none-c3',
): string {
  return withNonce(
    `/api/json-playground/root-pack?throttle=${throttle}&mode=${packMode}&algo=${algo}`,
  )
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
