'use client'

import { Button, Surface } from '@heroui/react'
import { decode } from '@tokenpack/browser'
import { useCallback, useMemo, useState } from 'react'
import { type PackEntry, unpackBuffers } from 'tokenpack/archive-buffers'
import { applyDiff } from 'tokenpack/diff-pack'

import { ScenarioExplanation } from '@/components/ScenarioExplanation'
import { NETWORK_CONDITIONS, type ThrottleName } from '@/lib/throttle'
import { useSavedBenchRun } from '@/lib/use-saved-bench-run'

import type { FixtureRow, JsEncoding } from '../page'
import { DiffVersioningResultsTable, type ResultCell } from './DiffVersioningResultsTable'

interface DiffVersioningClientProps {
  explanation: string
  rows: readonly FixtureRow[]
  sizes: readonly number[]
  rates: readonly number[]
}

const JS_ENCODINGS: readonly JsEncoding[] = ['identity', 'gzip', 'brotli']

const JS_ENCODING_LABEL: Record<JsEncoding, string> = {
  identity: 'no encoding',
  gzip: 'gzip',
  brotli: 'brotli',
}

const JS_ENCODING_QUERY: Record<JsEncoding, Record<string, string>> = {
  identity: {},
  gzip: { encoding: 'gz' },
  brotli: { encoding: 'br' },
}

export function DiffVersioningClient({
  explanation,
  rows,
  sizes,
  rates,
}: DiffVersioningClientProps) {
  const [iterations, setIterations] = useState(3)
  const [throttle, setThrottle] = useState<ThrottleName>('local')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<Map<string, ResultCell>>(new Map())
  const [selectedJsEncoding, setSelectedJsEncoding] = useState<JsEncoding>('brotli')
  const [error, setError] = useState<string | null>(null)

  const savedRunMessage = useSavedBenchRun(
    'diff-matrix',
    JSON.stringify({ iterations, throttle }),
    running,
    Array.from(results),
    value => setResults(new Map(value)),
  )

  const rowByKey = useMemo(() => {
    const m = new Map<string, FixtureRow>()

    for (const r of rows) m.set(`${r.sizeKB}_${r.ratePct}`, r)

    return m
  }, [rows])

  const handleRun = useCallback(async () => {
    if (running) return
    setRunning(true)
    setError(null)
    setResults(new Map())

    try {
      const next = new Map<string, ResultCell>()

      for (const sizeKB of sizes) {
        // Pre-decode the base bundle ONCE per size — simulates the realistic
        // case where the client already has v1.0.0 in memory before upgrade.
        const baseEntries = await fetchAndUnpackBase(sizeKB, throttle)

        for (const ratePct of rates) {
          const key = `${sizeKB}_${ratePct}`
          const row = rowByKey.get(key)

          if (!row) continue

          const cell: ResultCell = {
            sizeKB,
            ratePct,
            nextTokenMs: NaN,
            nextTokenBytes: row.nextBytes,
            diffMs: NaN,
            diffBytes: row.diffBytes,
            jsBundledMsByEnc: { identity: NaN, gzip: NaN, brotli: NaN },
            jsBundledBytesByEnc: { ...row.jsBundledBytesByEnc },
            jsChunkedMsByEnc: { identity: NaN, gzip: NaN, brotli: NaN },
            jsChunkedBytesByEnc: { ...row.jsChunkedBytesByEnc },
            jsChunkedFileCount: row.jsChunkedFileCount,
            ok: false,
          }

          try {
            const nextSamples: number[] = []
            const diffSamples: number[] = []
            const jsBundledSamples: Record<JsEncoding, number[]> = {
              identity: [],
              gzip: [],
              brotli: [],
            }
            const jsChunkedSamples: Record<JsEncoding, number[]> = {
              identity: [],
              gzip: [],
              brotli: [],
            }

            for (let i = 0; i < iterations; i += 1) {
              nextSamples.push(await measureNextToken(sizeKB, ratePct, throttle))
              diffSamples.push(await measureApplyDiff(sizeKB, ratePct, throttle, baseEntries))
              for (const enc of JS_ENCODINGS) {
                jsBundledSamples[enc].push(await measureJsBundled(sizeKB, throttle, enc))
                jsChunkedSamples[enc].push(
                  await measureJsChunked(sizeKB, row.jsChunkedFileCount, throttle, enc),
                )
              }
            }

            cell.nextTokenMs = median(nextSamples)
            cell.diffMs = median(diffSamples)
            cell.jsBundledMsByEnc = {
              identity: median(jsBundledSamples.identity),
              gzip: median(jsBundledSamples.gzip),
              brotli: median(jsBundledSamples.brotli),
            }
            cell.jsChunkedMsByEnc = {
              identity: median(jsChunkedSamples.identity),
              gzip: median(jsChunkedSamples.gzip),
              brotli: median(jsChunkedSamples.brotli),
            }
            cell.ok = true
          } catch (e: unknown) {
            cell.error = e instanceof Error ? e.message : String(e)
          }
          next.set(key, cell)
          setResults(new Map(next))
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }, [running, sizes, rates, iterations, throttle, rowByKey])

  return (
    <>
      <Surface className="rounded-2xl p-4">
        <details open>
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-tp-muted mb-2">
            About this scenario
          </summary>
          <p className="text-xs text-tp-muted" role="status">
            {savedRunMessage}
          </p>
          <ScenarioExplanation markdown={explanation} />
        </details>
      </Surface>

      <Surface className="rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-tp-muted">
            Iterations
            <input
              className="w-20 bg-black/30 border border-tp-border rounded px-2 py-1 text-xs text-tp-fg normal-case"
              max={20}
              min={1}
              type="number"
              value={iterations}
              onChange={e => setIterations(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-tp-muted">
            Throttle
            <select
              className="bg-black/30 border border-tp-border rounded px-2 py-1 text-xs text-tp-fg normal-case"
              value={throttle}
              onChange={e => setThrottle(e.target.value as ThrottleName)}
            >
              {NETWORK_CONDITIONS.map(c => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <Button isDisabled={running} isPending={running} onPress={handleRun}>
            {running ? 'Running…' : 'Run matrix'}
          </Button>
          <p className="text-[11px] text-tp-muted">
            {sizes.length} sizes × {rates.length} rates = {sizes.length * rates.length} cells,{' '}
            {iterations} iters × (1 next-token + 1 diff + 6 js).
          </p>
        </div>
        {error && <p className="text-xs text-red-400 break-all">Run failed: {error}</p>}
      </Surface>

      <Surface className="rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-tp-muted">
            JS Content-Encoding
          </span>
          <div className="inline-flex rounded-md border border-tp-border overflow-hidden">
            {JS_ENCODINGS.map(enc => {
              const isActive = enc === selectedJsEncoding

              return (
                <button
                  key={enc}
                  className={
                    'px-3 py-1 text-xs ' +
                    (isActive
                      ? 'bg-accent/20 text-accent'
                      : 'text-tp-muted hover:text-tp-fg hover:bg-white/5')
                  }
                  type="button"
                  onClick={() => setSelectedJsEncoding(enc)}
                >
                  {JS_ENCODING_LABEL[enc]}
                </button>
              )
            })}
          </div>
          <span className="text-[11px] text-tp-muted">
            tokens are encoding-agnostic (PNG already deflate-compressed inside)
          </span>
        </div>

        <DiffVersioningResultsTable
          jsEncoding={selectedJsEncoding}
          rates={rates}
          results={results}
          sizes={sizes}
        />
      </Surface>
    </>
  )
}

async function fetchAndUnpackBase(sizeKB: number, throttle: ThrottleName): Promise<PackEntry[]> {
  const url = `/api/fixtures/diff-versioning/base.${sizeKB}kb.tokenpack-deflate.png?throttle=${throttle}`
  const resp = await fetch(url, { cache: 'no-store' })

  if (!resp.ok) throw new Error(`base fetch failed: ${resp.status}`)
  const blob = await resp.blob()
  const pack = await decode(blob)

  if (pack.isPack() || pack.isDiff()) {
    throw new Error('expected single-file Pack containing base CART')
  }
  const cart = await pack.content()

  return unpackBuffers(cart)
}

async function measureNextToken(
  sizeKB: number,
  ratePct: number,
  throttle: ThrottleName,
): Promise<number> {
  const url = `/api/fixtures/diff-versioning/next.${sizeKB}kb.${ratePct}pct.tokenpack-deflate.png?throttle=${throttle}`
  const t0 = performance.now()
  const resp = await fetch(url, { cache: 'no-store' })

  if (!resp.ok) throw new Error(`next fetch failed: ${resp.status}`)
  const blob = await resp.blob()
  const pack = await decode(blob)

  if (pack.isPack() || pack.isDiff()) throw new Error('expected single-file Pack')
  const cart = await pack.content()

  unpackBuffers(cart)

  return performance.now() - t0
}

async function measureApplyDiff(
  sizeKB: number,
  ratePct: number,
  throttle: ThrottleName,
  baseEntries: readonly PackEntry[],
): Promise<number> {
  const url = `/api/fixtures/diff-versioning/diff.${sizeKB}kb.${ratePct}pct.tokenpack-deflate.png?throttle=${throttle}`
  const t0 = performance.now()
  const resp = await fetch(url, { cache: 'no-store' })

  if (!resp.ok) throw new Error(`diff fetch failed: ${resp.status}`)
  const blob = await resp.blob()
  const pack = await decode(blob)

  if (pack.isPack() || pack.isDiff()) throw new Error('expected single-file Pack')
  const diffBytes = await pack.content()

  applyDiff(baseEntries, diffBytes)

  return performance.now() - t0
}

async function measureJsBundled(
  sizeKB: number,
  throttle: ThrottleName,
  enc: JsEncoding,
): Promise<number> {
  const t0 = performance.now()
  const params = new URLSearchParams({ throttle, ...JS_ENCODING_QUERY[enc] })
  const [jsResp, cssResp] = await Promise.all([
    fetch(`/api/fixtures/diff-versioning/js.${sizeKB}kb-bundled.js?${params.toString()}`, {
      cache: 'no-store',
    }),
    fetch(`/api/fixtures/diff-versioning/js.${sizeKB}kb-bundled.css?${params.toString()}`, {
      cache: 'no-store',
    }),
  ])

  if (!jsResp.ok || !cssResp.ok) {
    throw new Error(`js bundled fetch failed: ${jsResp.status}/${cssResp.status}`)
  }
  const [jsText, cssText] = await Promise.all([jsResp.text(), cssResp.text()])

  // Touch bytes so engines can't DCE. Apply CSS + dynamic import of JS.
  const sink = (jsText.length > 0 ? jsText.charCodeAt(0) : 0) + cssText.length

  ;(globalThis as unknown as { __rtExpDiffJsBundledSink?: number }).__rtExpDiffJsBundledSink = sink

  applyCss(`__diff-js-bundled-${sizeKB}-${enc}`, cssText)
  await importAndDiscard(jsText)

  return performance.now() - t0
}

async function measureJsChunked(
  sizeKB: number,
  fileCount: number,
  throttle: ThrottleName,
  enc: JsEncoding,
): Promise<number> {
  const fileNames = jsChunkedFileNames(fileCount)
  const t0 = performance.now()
  const params = new URLSearchParams({ throttle, ...JS_ENCODING_QUERY[enc] })
  const responses = await Promise.all(
    fileNames.map(name =>
      fetch(`/api/fixtures/diff-versioning/js.${sizeKB}kb-${name}?${params.toString()}`, {
        cache: 'no-store',
      }),
    ),
  )

  for (const r of responses) {
    if (!r.ok) throw new Error(`js chunked fetch failed: ${r.status}`)
  }

  const texts = await Promise.all(responses.map(r => r.text()))
  let touch = 0

  for (const t of texts) if (t.length > 0) touch += t.charCodeAt(0)
  ;(globalThis as unknown as { __rtExpDiffJsChunkedSink?: number }).__rtExpDiffJsChunkedSink = touch

  const filesByName = new Map<string, string>()

  for (let i = 0; i < fileNames.length; i += 1) filesByName.set(fileNames[i], texts[i])

  const cssText = filesByName.get('index.css') ?? ''
  const jsText = filesByName.get('index.js') ?? ''

  applyCss(`__diff-js-chunked-${sizeKB}-${enc}`, cssText)
  await importAndDiscard(jsText)

  return performance.now() - t0
}

function jsChunkedFileNames(fileCount: number): string[] {
  const list: string[] = ['index.js', 'index.css']

  for (let i = 1; i <= fileCount - 2; i += 1) {
    list.push(`chunk-${i}.${i % 2 === 0 ? 'json' : 'js'}`)
  }

  return list
}

function applyCss(id: string, cssText: string): void {
  const existing = document.getElementById(id) as HTMLStyleElement | null
  const node = existing ?? document.createElement('style')

  node.id = id
  node.textContent = cssText
  if (!existing) document.head.appendChild(node)
}

async function importAndDiscard(jsText: string): Promise<void> {
  const blob = new Blob([jsText], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)

  try {
    const mod: { mount?: (el: HTMLElement, opts?: { label?: string }) => number } = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      url
    )

    if (typeof mod.mount === 'function') {
      const host = document.createElement('div')

      host.style.cssText = 'position:absolute; left:-9999px; top:-9999px;'
      document.body.appendChild(host)
      try {
        mod.mount(host, { label: 'diff-versioning-js' })
      } finally {
        host.remove()
      }
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function median(values: number[]): number {
  if (values.length === 0) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
