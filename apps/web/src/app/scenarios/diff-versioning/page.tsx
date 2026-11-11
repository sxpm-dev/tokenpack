// diff-versioning scenario — custom override page (Server Component).
//
// Reads the generated manifest at request time to discover (size, rate)
// combos and the wire byte counts of every fixture (token + JS bundled +
// JS chunked, per encoding). The client component picks strategies and
// runs the comparison.

import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import fs from 'fs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import path from 'path'

import { diffVersioningScenario } from '@/scenarios/diff-versioning'
import type { Manifest } from '@/scenarios/types'

import { DiffVersioningClient } from './components/DiffVersioningClient'

const FIXTURES_DIR = path.join(process.cwd(), 'runtime-fixtures')
const SCENARIO_ID = 'diff-versioning'

export const dynamic = 'force-dynamic'

export type JsEncoding = 'identity' | 'gzip' | 'brotli'

export interface FixtureRow {
  sizeKB: number
  ratePct: number
  baseBytes: number
  nextBytes: number
  diffBytes: number
  /** Sum of `js.<size>kb-bundled.{js,css}` per encoding. */
  jsBundledBytesByEnc: Record<JsEncoding, number>
  /** Sum of all `js.<size>kb-{index.js, index.css, chunk-*}` files per encoding. */
  jsChunkedBytesByEnc: Record<JsEncoding, number>
  /** File count in the chunked JS bundle (entry + css + N chunks). */
  jsChunkedFileCount: number
}

export default function DiffVersioningPage() {
  const manifestPath = path.join(FIXTURES_DIR, 'manifest.json')

  if (!fs.existsSync(manifestPath)) notFound()

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  const scenario = manifest.scenarios.find(s => s.scenarioId === SCENARIO_ID)

  if (!scenario) notFound()

  const baseBytesBySize = new Map<number, number>()
  const nextBytesByPair = new Map<string, number>()
  const diffBytesByPair = new Map<string, number>()
  // js fixtures aggregated per (size, encoding):
  //   key = `${sizeKB}_${encoding}_${form}`  where form ∈ {bundled, chunked}
  const jsBytesByKey = new Map<string, number>()
  const jsChunkedFileCountBySize = new Map<number, number>()

  for (const f of scenario.files) {
    const meta = f.meta as
      | {
          kind?: string
          sizeKB?: number
          ratePct?: number
          source?: string
          encoding?: string
        }
      | undefined

    if (!meta || meta.sizeKB === undefined) continue

    if (meta.kind === 'base') {
      baseBytesBySize.set(meta.sizeKB, f.bytes)
    } else if (meta.kind === 'next' && meta.ratePct !== undefined) {
      nextBytesByPair.set(`${meta.sizeKB}_${meta.ratePct}`, f.bytes)
    } else if (meta.kind === 'diff' && meta.ratePct !== undefined) {
      diffBytesByPair.set(`${meta.sizeKB}_${meta.ratePct}`, f.bytes)
    } else if (meta.kind === 'js' && meta.source) {
      const enc = encodingFromMeta(meta.encoding)
      const form = meta.source.startsWith('bundled.') ? 'bundled' : 'chunked'
      const key = `${meta.sizeKB}_${enc}_${form}`

      jsBytesByKey.set(key, (jsBytesByKey.get(key) ?? 0) + f.bytes)

      if (form === 'chunked' && enc === 'identity') {
        jsChunkedFileCountBySize.set(
          meta.sizeKB,
          (jsChunkedFileCountBySize.get(meta.sizeKB) ?? 0) + 1,
        )
      }
    }
  }

  const rows: FixtureRow[] = []

  for (const key of nextBytesByPair.keys()) {
    const [sizeKB, ratePct] = key.split('_').map(Number)
    const baseBytes = baseBytesBySize.get(sizeKB) ?? 0
    const nextBytes = nextBytesByPair.get(key) ?? 0
    const diffBytes = diffBytesByPair.get(`${sizeKB}_${ratePct}`) ?? 0

    rows.push({
      sizeKB,
      ratePct,
      baseBytes,
      nextBytes,
      diffBytes,
      jsBundledBytesByEnc: {
        identity: jsBytesByKey.get(`${sizeKB}_identity_bundled`) ?? 0,
        gzip: jsBytesByKey.get(`${sizeKB}_gzip_bundled`) ?? 0,
        brotli: jsBytesByKey.get(`${sizeKB}_brotli_bundled`) ?? 0,
      },
      jsChunkedBytesByEnc: {
        identity: jsBytesByKey.get(`${sizeKB}_identity_chunked`) ?? 0,
        gzip: jsBytesByKey.get(`${sizeKB}_gzip_chunked`) ?? 0,
        brotli: jsBytesByKey.get(`${sizeKB}_brotli_chunked`) ?? 0,
      },
      jsChunkedFileCount: jsChunkedFileCountBySize.get(sizeKB) ?? 0,
    })
  }

  rows.sort((a, b) => a.sizeKB - b.sizeKB || a.ratePct - b.ratePct)

  const sizes = Array.from(new Set(rows.map(r => r.sizeKB))).sort((a, b) => a - b)
  const rates = Array.from(new Set(rows.map(r => r.ratePct))).sort((a, b) => a - b)

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-xs text-tp-muted hover:text-tp-fg"
        href="/experiments"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{diffVersioningScenario.name}</h1>
        <p className="mt-1 text-sm text-tp-muted">{diffVersioningScenario.description}</p>
      </div>

      <DiffVersioningClient
        explanation={diffVersioningScenario.explanation}
        rates={rates}
        rows={rows}
        sizes={sizes}
      />
    </main>
  )
}

function encodingFromMeta(raw: string | undefined): JsEncoding {
  if (raw === 'gzip-6' || raw === 'gzip') return 'gzip'
  if (raw === 'brotli-6' || raw === 'brotli') return 'brotli'

  return 'identity'
}
