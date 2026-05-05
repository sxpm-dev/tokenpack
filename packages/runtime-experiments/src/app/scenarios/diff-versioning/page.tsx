'use client'

import { Button } from '@heroui/react'
import { ArrowLeftIcon, PackageIcon, RocketLaunchIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState } from 'react'
import { encode, decode } from '@tokenpack/browser'
import {
  applyDiff,
  diffPack,
  packBuffers,
  unpackBuffers,
  isCartArchive,
  type PackEntry,
} from 'tokenpack'

const enc = new TextEncoder()
const dec = new TextDecoder()

interface VersionFixture {
  version: string
  entries: PackEntry[]
}

function buildFixtures(): VersionFixture[] {
  const baseAppCss = `body{font-family:system-ui;background:#0a0a0a;color:#fff}.card{padding:1rem;border-radius:8px;background:#111;border:1px solid #222}h1{font-size:1.5rem;margin:0}`
  const baseAppJs = (version: string, msg: string, theme: string) => `export const meta={version:"${version}",theme:"${theme}"};export const greeting="${msg}";`

  const v1: PackEntry[] = [
    { path: 'app.js', bytes: enc.encode(baseAppJs('1.0.0', 'Hello from v1', 'dark')) },
    { path: 'app.css', bytes: enc.encode(baseAppCss) },
    { path: 'config.json', bytes: enc.encode(JSON.stringify({ theme: 'dark', flags: ['analytics'] }, null, 2)) },
    { path: 'about.md', bytes: enc.encode('# About\n\nv1 of the demo SPA.') },
  ]

  // v1.0.1: tweak the greeting + add a new feature flag
  const v1_0_1: PackEntry[] = [
    { path: 'app.js', bytes: enc.encode(baseAppJs('1.0.1', 'Hello from v1.0.1 (patched!)', 'dark')) },
    { path: 'app.css', bytes: enc.encode(baseAppCss) },
    { path: 'config.json', bytes: enc.encode(JSON.stringify({ theme: 'dark', flags: ['analytics', 'experiments'] }, null, 2)) },
    { path: 'about.md', bytes: enc.encode('# About\n\nv1 of the demo SPA.') },
  ]

  // v1.0.2: switch theme + remove about.md + add a new welcome.md
  const v1_0_2: PackEntry[] = [
    { path: 'app.js', bytes: enc.encode(baseAppJs('1.0.2', 'Hello from v1.0.2', 'light')) },
    { path: 'app.css', bytes: enc.encode(baseAppCss.replace('#0a0a0a', '#fff').replace('#fff', '#000').replace('#111', '#f5f5f5').replace('#222', '#ddd')) },
    { path: 'config.json', bytes: enc.encode(JSON.stringify({ theme: 'light', flags: ['analytics', 'experiments'] }, null, 2)) },
    { path: 'welcome.md', bytes: enc.encode('# Welcome\n\nThis replaces about.md in v1.0.2.') },
  ]

  return [
    { version: '1.0.0', entries: v1 },
    { version: '1.0.1', entries: v1_0_1 },
    { version: '1.0.2', entries: v1_0_2 },
  ]
}

interface PackBlob {
  version: string
  blob: Blob
  bytes: number
  isDiff: boolean
  added: string[]
  modified: string[]
  deleted: string[]
}

interface AppliedState {
  version: string
  entries: PackEntry[]
  totalWireBytes: number
}

export default function DiffVersioningPage() {
  const [fixtures, setFixtures] = useState<VersionFixture[] | null>(null)
  const [packs, setPacks] = useState<PackBlob[] | null>(null)
  const [state, setState] = useState<AppliedState | null>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])

  function append(line: string) {
    setLog(prev => [...prev, line])
  }

  async function generateFixtures() {
    setBusy(true)
    setLog([])
    setState(null)
    try {
      const fxs = buildFixtures()
      setFixtures(fxs)

      // Encode v1 as a full pack; v1.0.1 + v1.0.2 as diffs.
      const v1Bytes = packBuffers(fxs[0].entries)
      const v1Encoded = await encode(v1Bytes, { algo: 'linear', compressionMode: 'brotli-6' })
      const fullPack: PackBlob = {
        version: fxs[0].version,
        blob: v1Encoded.blobs[0],
        bytes: v1Encoded.blobs[0].size,
        isDiff: false,
        added: fxs[0].entries.map(e => e.path),
        modified: [],
        deleted: [],
      }
      append(`Encoded v${fxs[0].version} full pack: ${fullPack.bytes} B`)

      const diff1 = diffPack(fxs[0].entries, fxs[1].entries)
      const diff1Encoded = await encode(diff1.diff, { algo: 'linear', compressionMode: 'brotli-6' })
      const pack1_0_1: PackBlob = {
        version: fxs[1].version,
        blob: diff1Encoded.blobs[0],
        bytes: diff1Encoded.blobs[0].size,
        isDiff: true,
        added: diff1.added,
        modified: diff1.modified,
        deleted: diff1.deleted,
      }
      append(`Encoded v${fxs[1].version} diff: ${pack1_0_1.bytes} B (added=${diff1.added.length}, modified=${diff1.modified.length}, deleted=${diff1.deleted.length})`)

      const diff2 = diffPack(fxs[1].entries, fxs[2].entries)
      const diff2Encoded = await encode(diff2.diff, { algo: 'linear', compressionMode: 'brotli-6' })
      const pack1_0_2: PackBlob = {
        version: fxs[2].version,
        blob: diff2Encoded.blobs[0],
        bytes: diff2Encoded.blobs[0].size,
        isDiff: true,
        added: diff2.added,
        modified: diff2.modified,
        deleted: diff2.deleted,
      }
      append(`Encoded v${fxs[2].version} diff: ${pack1_0_2.bytes} B (added=${diff2.added.length}, modified=${diff2.modified.length}, deleted=${diff2.deleted.length})`)

      setPacks([fullPack, pack1_0_1, pack1_0_2])
    } finally {
      setBusy(false)
    }
  }

  async function bootV1() {
    if (!packs || !fixtures) return
    setBusy(true)
    try {
      const decoded = await decode(packs[0].blob)
      if (!isCartArchive(decoded)) throw new Error('v1 payload is not a CART archive')
      const entries = unpackBuffers(decoded)
      setState({
        version: packs[0].version,
        entries,
        totalWireBytes: packs[0].bytes,
      })
      append(`Booted v${packs[0].version} from ${packs[0].bytes} B PNG (full pack)`)
    } finally {
      setBusy(false)
    }
  }

  async function applyVersion(idx: 1 | 2) {
    if (!packs || !state) return
    setBusy(true)
    try {
      const target = packs[idx]
      const decoded = await decode(target.blob)
      const next = applyDiff(state.entries, decoded)
      setState({
        version: target.version,
        entries: next,
        totalWireBytes: state.totalWireBytes + target.bytes,
      })
      append(`Applied v${target.version} diff (${target.bytes} B): added=${target.added.length}, modified=${target.modified.length}, deleted=${target.deleted.length}. Total wire: ${state.totalWireBytes + target.bytes} B`)
    } finally {
      setBusy(false)
    }
  }

  // Compute "what if we shipped each version as a full bundle" for comparison.
  const fullBundleEquivalent = packs ? packs[0].bytes * 3 : 0
  const diffChainTotal = packs ? packs.reduce((s, p) => s + p.bytes, 0) : 0
  const savingsPct = fullBundleEquivalent > 0 ? ((1 - diffChainTotal / fullBundleEquivalent) * 100).toFixed(0) : '—'

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6">
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">Diff-versioning prototype</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        Boot v1.0.0 baseline → apply a v1.0.1 diff PNG → apply v1.0.2. The diffs are tiny CART archives carrying
        only changed/added files plus a deletions list, encoded as TokenPack PNGs. Apply happens entirely in-page —
        Phase 6 polish wires this through a Service Worker so it intercepts SPA bundle requests transparently.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Button onPress={generateFixtures} isPending={busy} isDisabled={busy}>
          <PackageIcon size={14} className="mr-1.5" /> Generate fixtures
        </Button>
        {packs && (
          <>
            <Button onPress={bootV1} isPending={busy} isDisabled={busy} variant="ghost">
              <RocketLaunchIcon size={14} className="mr-1.5" /> Boot v1.0.0
            </Button>
            <Button onPress={() => applyVersion(1)} isPending={busy} isDisabled={busy || !state || state.version !== '1.0.0'} variant="ghost">
              Apply v1.0.1 diff
            </Button>
            <Button onPress={() => applyVersion(2)} isPending={busy} isDisabled={busy || !state || state.version !== '1.0.1'} variant="ghost">
              Apply v1.0.2 diff
            </Button>
          </>
        )}
      </div>

      {packs && (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-xs uppercase tracking-widest text-white/35 mb-2">Wire-bytes comparison</div>
            <div className="flex items-end gap-6 text-sm">
              <div>
                <div className="text-white/40 text-xs">Full bundle × 3 reloads</div>
                <div className="text-white/80 tabular-nums text-base">{fullBundleEquivalent.toLocaleString()} B</div>
              </div>
              <div>
                <div className="text-white/40 text-xs">v1 + 2 diffs (chain)</div>
                <div className="text-green-400 tabular-nums text-base">{diffChainTotal.toLocaleString()} B</div>
              </div>
              <div>
                <div className="text-white/40 text-xs">Savings</div>
                <div className="text-green-400 tabular-nums text-base">{savingsPct}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-xs uppercase tracking-widest text-white/35 mb-2">Pack catalog</div>
            <table className="w-full text-xs">
              <thead className="text-white/40">
                <tr>
                  <th className="text-left py-1 font-normal">Version</th>
                  <th className="text-left py-1 font-normal">Type</th>
                  <th className="text-right py-1 font-normal">Bytes</th>
                  <th className="text-right py-1 font-normal">Added</th>
                  <th className="text-right py-1 font-normal">Modified</th>
                  <th className="text-right py-1 font-normal">Deleted</th>
                </tr>
              </thead>
              <tbody>
                {packs.map(p => (
                  <tr key={p.version} className="border-t border-white/5">
                    <td className="py-1.5 text-white/80">v{p.version}</td>
                    <td className="py-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.isDiff ? 'bg-blue-500/15 text-blue-300' : 'bg-green-500/15 text-green-300'}`}>
                        {p.isDiff ? 'diff' : 'full'}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-white/80">{p.bytes.toLocaleString()}</td>
                    <td className="py-1.5 text-right tabular-nums text-white/50">{p.added.length}</td>
                    <td className="py-1.5 text-right tabular-nums text-white/50">{p.modified.length}</td>
                    <td className="py-1.5 text-right tabular-nums text-white/50">{p.deleted.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="text-xs uppercase tracking-widest text-green-300 mb-2">
                Currently mounted: v{state.version} ({state.entries.length} files, {state.totalWireBytes} B over wire)
              </div>
              <div className="space-y-2 text-xs">
                {state.entries.map(e => (
                  <details key={e.path} className="border border-white/10 rounded">
                    <summary className="cursor-pointer px-2 py-1 hover:bg-white/[0.03] text-white/70">
                      <span className="font-mono">{e.path}</span>
                      <span className="text-white/30 ml-2">({e.bytes.length} B)</span>
                    </summary>
                    <pre className="px-3 py-2 text-[10px] text-white/60 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                      {dec.decode(e.bytes)}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {log.length > 0 && (
        <details className="mt-6" open>
          <summary className="cursor-pointer text-xs text-white/50 uppercase tracking-widest">Activity log</summary>
          <pre className="mt-2 text-[11px] text-white/60 bg-white/[0.02] border border-white/10 rounded p-3 overflow-auto max-h-60">
            {log.join('\n')}
          </pre>
        </details>
      )}

      <div className="mt-8 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-100/80 leading-relaxed">
        <strong className="text-yellow-200">Polish remaining:</strong> Service Worker integration so this happens transparently
        when an SPA fetches <code>/bundle/&lt;v&gt;.png</code>. Plus <code>BroadcastChannel('tokenpack-versioning')</code>
        for hot-reload events that re-import only changed modules.
      </div>
    </main>
  )
}
