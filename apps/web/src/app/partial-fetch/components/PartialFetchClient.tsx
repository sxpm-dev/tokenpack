'use client'

// PartialFetchClient — runs four delivery strategies for the same target
// file and reports per-strategy timing, wire-bytes, and a per-mode result
// (text content or imported module sentinel).
import { decode } from '@tokenpack/browser'
import { fetchPackFile, fetchPackManifest } from '@tokenpack/browser/fetch-pack'
import { useCallback, useEffect, useState } from 'react'
import { decompressRaw } from 'tokenpack/compressors'

import { useSavedBenchRun } from '@/lib/use-saved-bench-run'

interface IndexFile {
  path: string
  size: number
}

interface IndexJson {
  files: IndexFile[]
  totalKb: number
}

type Mode = 'text-fetch' | 'js-fetch'

type StrategyId = 'tokenpack-partial' | 'tokenpack-whole' | 'http-single' | 'http-multi'

interface RunRow {
  id: StrategyId
  label: string
  detail: string
  totalMs: number | null
  wireBytes: number | null
  result: string | null
  error: string | null
  running: boolean
}

const PACK_URL = '/api/fixtures/partial-fetch/pack.pixel-range.png'
const LINEAR_PACK_URL = '/api/fixtures/partial-fetch/pack.linear-deflate.png'
const INDEX_URL = '/api/fixtures/partial-fetch/index.json'
const FILE_URL = (name: string) => `/api/fixtures/partial-fetch/${name}`

const STRATEGY_DEFS: Omit<RunRow, 'totalMs' | 'wireBytes' | 'result' | 'error' | 'running'>[] = [
  {
    id: 'tokenpack-partial',
    label: 'A. tokenpack range-fetch one file',
    detail:
      'fetchPackManifest reads the manifest header, then fetchPackFile issues a Range header for the target region. No pixel decode. Two HTTP calls.',
  },
  {
    id: 'tokenpack-whole',
    label: 'B. tokenpack whole pack + decode',
    detail:
      'fetch(packUrl).blob() then decode(blob) → DirPack → pack.extract(path). Whole pack downloaded; full pixel decode; one file extracted.',
  },
  {
    id: 'http-single',
    label: 'C. http single file (no pack)',
    detail: 'Plain fetch(fileUrl) for the target file only. Baseline for one file.',
  },
  {
    id: 'http-multi',
    label: 'D. http all files (no pack)',
    detail: 'Parallel fetch(...) for every file in the pack. Baseline for "no pack at all".',
  },
]

export function PartialFetchClient() {
  const [index, setIndex] = useState<IndexJson | null>(null)
  const [indexErr, setIndexErr] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('text-fetch')
  const [target, setTarget] = useState<string>('module-03.js')
  const [rows, setRows] = useState<RunRow[]>(() =>
    STRATEGY_DEFS.map(d => ({
      ...d,
      totalMs: null,
      wireBytes: null,
      result: null,
      error: null,
      running: false,
    })),
  )
  const [running, setRunning] = useState(false)

  useSavedBenchRun('partial-fetch', JSON.stringify({ mode, target }), running, rows, setRows)

  useEffect(() => {
    fetch(INDEX_URL)
      .then(r => {
        if (!r.ok) throw new Error('index fetch failed: ' + r.status)

        return r.json() as Promise<IndexJson>
      })
      .then(setIndex)
      .catch(e => setIndexErr(e instanceof Error ? e.message : String(e)))
  }, [])

  const run = useCallback(async () => {
    if (!index) return
    setRunning(true)
    setRows(prev =>
      prev.map(r => ({
        ...r,
        totalMs: null,
        wireBytes: null,
        result: null,
        error: null,
        running: true,
      })),
    )
    const allFiles = index.files.map(f => f.path)

    const updateRow = (id: StrategyId, patch: Partial<RunRow>) => {
      setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
    }

    // Sequential so timing is not perturbed by concurrent network.
    await runStrategy('tokenpack-partial', () => runTokenpackPartial(target, mode), updateRow)
    await runStrategy('tokenpack-whole', () => runTokenpackWhole(target, mode), updateRow)
    await runStrategy('http-single', () => runHttpSingle(target, mode), updateRow)
    await runStrategy('http-multi', () => runHttpMulti(allFiles, target, mode), updateRow)

    setRunning(false)
  }, [index, target, mode])

  return (
    <section className="space-y-4">
      {indexErr && (
        <div className="rounded-md border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
          Failed to load fixture index: {indexErr}.{' '}
          <strong>
            Run <code>yarn workspace tokenpack-web generate:fixtures</code>.
          </strong>
        </div>
      )}

      {index && (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-md border border-tp-border bg-white/[0.02] p-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-tp-muted">Target file</span>
              <select
                className="bg-black/40 border border-tp-border rounded px-2 py-1 text-sm"
                disabled={running}
                value={target}
                onChange={e => setTarget(e.target.value)}
              >
                {index.files.map(f => (
                  <option key={f.path} value={f.path}>
                    {f.path} ({(f.size / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="text-tp-muted">Mode</span>
              <select
                className="bg-black/40 border border-tp-border rounded px-2 py-1 text-sm"
                disabled={running}
                value={mode}
                onChange={e => setMode(e.target.value as Mode)}
              >
                <option value="text-fetch">text-fetch (display content)</option>
                <option value="js-fetch">js-fetch (dynamic import + run)</option>
              </select>
            </label>

            <button
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-tp-muted px-4 py-1.5 rounded text-sm font-medium ml-auto"
              disabled={running}
              onClick={() => void run()}
            >
              {running ? 'Running…' : 'Run all strategies'}
            </button>
          </div>

          <div className="text-xs text-tp-muted">
            Pack: {index.files.length} files · {index.totalKb.toFixed(1)} KB total. Times include
            decode/decompression where applicable. Wire bytes report what was actually transferred
            (Range request body, whole-pack body, etc.).
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase text-tp-muted border-b border-tp-border">
                <th className="py-2 pr-3 font-medium">Strategy</th>
                <th className="py-2 pr-3 font-medium text-right">total ms</th>
                <th className="py-2 pr-3 font-medium text-right">wire B</th>
                <th className="py-2 pr-3 font-medium">result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-tp-border align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs text-tp-muted mt-0.5">{r.detail}</div>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.running
                      ? '…'
                      : r.totalMs !== null
                        ? r.totalMs.toFixed(1)
                        : r.error
                          ? '—'
                          : ''}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-tp-fg">
                    {r.wireBytes !== null ? r.wireBytes.toLocaleString() : ''}
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    {r.error ? (
                      <span className="text-red-400">{r.error}</span>
                    ) : r.result ? (
                      <pre className="whitespace-pre-wrap break-words text-tp-fg max-h-32 overflow-y-auto bg-black/30 p-2 rounded border border-tp-border">
                        {r.result}
                      </pre>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}

// ─── Strategy runners ──────────────────────────────────────────────────────

interface StrategyResult {
  totalMs: number
  wireBytes: number
  result: string
}

async function runStrategy(
  id: StrategyId,
  run: () => Promise<StrategyResult>,
  updateRow: (id: StrategyId, patch: Partial<RunRow>) => void,
) {
  try {
    const r = await run()

    updateRow(id, { totalMs: r.totalMs, wireBytes: r.wireBytes, result: r.result, running: false })
  } catch (e) {
    updateRow(id, {
      error: e instanceof Error ? e.message : String(e),
      running: false,
    })
  }
}

async function runTokenpackPartial(target: string, mode: Mode): Promise<StrategyResult> {
  const t0 = performance.now()
  const remote = await fetchPackManifest(PACK_URL)
  const fileBytes = await fetchPackFile(remote, target, decompressRaw)
  const entry = remote.manifest.files.find(f => f.path === target)
  // Include all prefetched bytes, even when the requested file was already in
  // the head slice; only the uncovered tail needs an additional range request.
  const start = remote.regionsAbsOffset + (entry?.offset ?? 0)
  const end = start + (entry?.compressedSize ?? 0)
  const wireBytes =
    remote.prefetchedBytes.byteLength +
    Math.max(0, end - Math.max(start, remote.prefetchedBytes.byteLength))
  const result = await materialize(fileBytes, mode)
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, result }
}

async function runTokenpackWhole(target: string, mode: Mode): Promise<StrategyResult> {
  const t0 = performance.now()
  const r = await fetch(LINEAR_PACK_URL)

  if (!r.ok) throw new Error('pack fetch failed: ' + r.status)
  const blob = await r.blob()
  const wireBytes = blob.size
  const pack = await decode(blob)

  if (!pack.isPack()) throw new Error('decoded payload is not a DirPack')
  const fileBytes = await pack.extract(target)
  const result = await materialize(fileBytes, mode)
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, result }
}

async function runHttpSingle(target: string, mode: Mode): Promise<StrategyResult> {
  const t0 = performance.now()
  const r = await fetch(FILE_URL(target))

  if (!r.ok) throw new Error('http fetch failed: ' + r.status)
  const arrayBuf = await r.arrayBuffer()
  const wireBytes = arrayBuf.byteLength
  const fileBytes = new Uint8Array(arrayBuf)
  const result = await materialize(fileBytes, mode)
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, result }
}

async function runHttpMulti(
  allFiles: string[],
  target: string,
  mode: Mode,
): Promise<StrategyResult> {
  const t0 = performance.now()
  const responses = await Promise.all(allFiles.map(f => fetch(FILE_URL(f))))

  for (const r of responses) {
    if (!r.ok) throw new Error('http multi-fetch failed: ' + r.status)
  }
  const buffers = await Promise.all(responses.map(r => r.arrayBuffer()))
  const wireBytes = buffers.reduce((s, b) => s + b.byteLength, 0)
  const targetIdx = allFiles.indexOf(target)
  const fileBytes = new Uint8Array(buffers[targetIdx])
  const result = await materialize(fileBytes, mode)
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, result }
}

// ─── Result materialization ────────────────────────────────────────────────

async function materialize(bytes: Uint8Array, mode: Mode): Promise<string> {
  if (mode === 'text-fetch') {
    const text = new TextDecoder().decode(bytes)
    const head = text.slice(0, 200)
    const sentinelMatch = /partial-fetch-\d+/.exec(text)

    return (
      'sentinel: ' +
      (sentinelMatch ? sentinelMatch[0] : '(none)') +
      '\nhead (200B):\n' +
      head +
      (text.length > 200 ? '…' : '')
    )
  }
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)

  try {
    const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ url)) as {
      run?: (stage?: HTMLElement) => string
    }

    if (typeof mod.run !== 'function') {
      return 'imported module has no run() function'
    }
    const sentinel = mod.run()

    return 'imported and ran. sentinel: ' + sentinel
  } finally {
    URL.revokeObjectURL(url)
  }
}
