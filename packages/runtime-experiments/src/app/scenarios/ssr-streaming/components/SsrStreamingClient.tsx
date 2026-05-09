'use client'

import { Button, Surface } from '@heroui/react'
import { useCallback, useState } from 'react'

import { ScenarioExplanation } from '@/components/ScenarioExplanation'
import { formatBytes } from '@/lib/runner'
import type { Compat } from '@/scenarios/types'

import { SsrStreamingResultsTable } from './SsrStreamingResultsTable'

/** Scalar projection of `VariantDef` — `run` functions stripped because RSC
 *  cannot serialize functions across the server/client boundary. */
export interface SsrStreamingVariantInfo {
  id: string
  label: string
  compat: Compat
  detail?: string
}

interface SsrStreamingClientProps {
  explanation: string
  variants: readonly SsrStreamingVariantInfo[]
  sizes: { jsonBytes: number; pngBytes: number; pngDataURIBytes: number }
}

export interface SsrStreamingResult {
  variantId: string
  totalMs: number
  iterations: { totalMs: number }[]
  wireBytes: number
}

export function SsrStreamingClient({ explanation, variants, sizes }: SsrStreamingClientProps) {
  const [results, setResults] = useState<readonly SsrStreamingResult[]>([])
  const [running, setRunning] = useState(false)
  const [iterations, setIterations] = useState(5)

  const [error, setError] = useState<string | null>(null)

  const handleRun = useCallback(async () => {
    if (running) return
    setRunning(true)
    setError(null)
    setResults([])

    try {
      // Pre-fetch the inlined PNG as a Blob ONCE per run. `node.src` is a
      // data URI; the conversion is a synthetic same-document fetch (no
      // network) and is excluded from the timing window — by the time the
      // user clicks Run, this is "asset already in memory" prep work.
      const pngBlob = await fetchInlinePngBlob()
      const next: SsrStreamingResult[] = []

      for (const v of variants) {
        const runs: { totalMs: number }[] = []

        for (let i = 0; i < iterations; i += 1) {
          const totalMs =
            v.id === 'inline-json-script'
              ? await measureInlineJson()
              : v.id === 'tokenpack-inline-img'
                ? await measureTokenpackImg(pngBlob)
                : NaN

          runs.push({ totalMs })
        }
        const median = medianOf(runs.map(r => r.totalMs))
        const wireBytes =
          v.id === 'inline-json-script'
            ? sizes.jsonBytes
            : v.id === 'tokenpack-inline-img'
              ? sizes.pngBytes
              : 0

        next.push({ variantId: v.id, totalMs: median, iterations: runs, wireBytes })
        setResults([...next])
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)

      setError(msg)
    } finally {
      setRunning(false)
    }
  }, [running, variants, iterations, sizes])

  return (
    <>
      <Surface className="rounded-2xl p-4">
        <details open>
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-white/35 mb-2">
            About this scenario
          </summary>
          <ScenarioExplanation markdown={explanation} />
        </details>
      </Surface>

      <Surface className="rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <Stat label="JSON inlined" value={formatBytes(sizes.jsonBytes)} />
          <Stat label="PNG inlined (raw bytes)" value={formatBytes(sizes.pngBytes)} />
          <Stat label="PNG as data URI" value={formatBytes(sizes.pngDataURIBytes)} />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/55">
            Iterations
            <input
              className="w-16 bg-black/30 border border-white/15 rounded px-2 py-1 text-xs text-white/85"
              max={50}
              min={1}
              type="number"
              value={iterations}
              onChange={e => setIterations(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
          </label>
          <Button isDisabled={running} isPending={running} onPress={handleRun}>
            {running ? 'Running…' : 'Run'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-400 break-all">Run failed: {error}</p>}
      </Surface>

      <SsrStreamingResultsTable results={results} variants={variants} />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div>
      <div className="mt-0.5 font-medium text-white/85">{value}</div>
    </div>
  )
}

async function measureInlineJson(): Promise<number> {
  const t0 = performance.now()
  const node = document.getElementById('ssr-payload-json')

  if (!node) throw new Error('inline JSON script element missing')
  const text = node.textContent ?? ''

  JSON.parse(text)

  return performance.now() - t0
}

async function fetchInlinePngBlob(): Promise<Blob> {
  const node = document.getElementById('ssr-payload-png') as HTMLImageElement | null

  if (!node) throw new Error('inline PNG img element missing')
  if (!node.complete) {
    await new Promise<void>((res, rej) => {
      node.addEventListener('load', () => res(), { once: true })
      node.addEventListener('error', () => rej(new Error('img load failed')), { once: true })
    })
  }
  // Manual base64 decode of `node.src` instead of `fetch(node.src)`. The
  // browser would handle the data URI fetch synthetically (no real network),
  // but it still logs an entry in DevTools' Network panel — confusing when
  // the whole point of the scenario is "asset is already in memory."
  const dataURI = node.src
  const comma = dataURI.indexOf(',')
  const b64 = comma >= 0 ? dataURI.slice(comma + 1) : dataURI
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)

  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)

  return new Blob([bytes], { type: 'image/png' })
}

async function measureTokenpackImg(pngBlob: Blob): Promise<number> {
  const t0 = performance.now()
  const { decode } = await import('@tokenpack/browser')
  // `decode(blob)` runs the channel-detecting path: PNG header sniff →
  // `createImageBitmap` → canvas → codec → decompression. This is the
  // honest per-mount cost when an inlined PNG is hydrated as JSON.
  const pack = await decode(pngBlob)

  if (pack.isPack() || pack.isDiff()) throw new Error('expected single-file Pack')
  const bytes = await pack.content()

  JSON.parse(new TextDecoder().decode(bytes))

  return performance.now() - t0
}

function medianOf(values: number[]): number {
  if (values.length === 0) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
