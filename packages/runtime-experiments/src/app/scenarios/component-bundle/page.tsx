'use client'

import { ArrowLeftIcon, PackageIcon } from '@phosphor-icons/react'
import { decode, encode } from '@tokenpack/browser'
import Link from 'next/link'
import { createElement, type ReactElement, useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { packBuffers } from 'tokenpack'

import { ScenarioRunner, type Variant } from '@/components/ScenarioRunner'

import HeavyComponent from './HeavyComponent'

// Plain-ESM module string for the "TokenPack" variant. The host page exposes
// React on `globalThis.__tokenpack_react__` so the imported module can resolve
// React without an import map (a real production setup would use an actual
// import map or a wrapped-bundle approach).

const COMPONENT_MODULE_JS = `
const React = globalThis.__tokenpack_react__
const ICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>'

export default function HeavyComponent({ message, count }) {
  return React.createElement('div', { className: 'heavy' },
    React.createElement('div', { className: 'heavy-header' },
      React.createElement('img', { src: ICON, alt: '', className: 'heavy-icon' }),
      React.createElement('span', { className: 'heavy-title' }, 'Heavy mounted (TokenPack)')
    ),
    React.createElement('p', { className: 'heavy-message' }, message),
    React.createElement('ul', { className: 'heavy-list' },
      Array.from({ length: count }, (_, i) =>
        React.createElement('li', { className: 'heavy-item', key: i }, 'Item #' + (i + 1))
      )
    )
  )
}
`

const COMPONENT_CSS = `
.heavy{border:1px solid rgba(255,255,255,0.15);background:rgba(74,222,128,0.04);border-radius:12px;padding:1rem;font-family:system-ui,sans-serif}
.heavy-header{display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:rgba(255,255,255,0.7);margin-bottom:0.5rem}
.heavy-icon{width:14px;height:14px;color:#4ade80}
.heavy-title{text-transform:uppercase;letter-spacing:0.08em;font-size:10px}
.heavy-message{color:white;font-size:0.95rem;margin:0.25rem 0 0.75rem}
.heavy-list{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.25rem}
.heavy-item{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.03);padding:0.2rem 0.5rem;border-radius:4px}
`

const MANIFEST = JSON.stringify({
  entry: 'component.js',
  externals: ['react'],
  styles: ['component.css'],
})

interface PackBytes {
  pngBytes: number
  jsBytes: number
  cssBytes: number
}

export default function ComponentBundlePage() {
  const [pack, setPack] = useState<{ blob: Blob; bytes: PackBytes } | null>(null)
  const [variants, setVariants] = useState<Variant[] | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<Root | null>(null)
  const styleRefs = useRef<HTMLStyleElement[]>([])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      // Expose React for the dynamically-imported module.
      const React = await import('react')

      ;(globalThis as { __tokenpack_react__?: typeof React }).__tokenpack_react__ = React

      const cssBytes = new TextEncoder().encode(COMPONENT_CSS).length
      const jsBytes = new TextEncoder().encode(COMPONENT_MODULE_JS).length
      const archive = packBuffers([
        { path: 'manifest.json', bytes: new TextEncoder().encode(MANIFEST) },
        { path: 'component.js', bytes: new TextEncoder().encode(COMPONENT_MODULE_JS) },
        { path: 'component.css', bytes: new TextEncoder().encode(COMPONENT_CSS) },
      ])
      const result = await encode(archive, { algo: 'linear', compressionMode: 'brotli-6' })

      if (cancelled) return
      const bytes = { pngBytes: result.blobs[0].size, jsBytes, cssBytes }

      setPack({ blob: result.blobs[0], bytes })
      setVariants(buildVariants(result.blobs[0], containerRef, rootRef, styleRefs, bytes))
    })()

    return () => {
      cancelled = true
      cleanupMount(rootRef, styleRefs)
    }
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link
        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6"
        href="/"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">Component as Token</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        Pack a React component (JS module + CSS + inline SVG icon) into a single TokenPack PNG,
        decode + <code>import(blob:)</code> at the use-site, and mount. Compared against synchronous
        import (in the main bundle) and dynamic <code>import()</code> (a code-split chunk).
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
        <div className="text-white/40 uppercase tracking-widest mb-2">Pack catalog</div>
        {!pack ? (
          <div className="text-white/30 animate-pulse">Encoding component into TokenPack PNG…</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-white/40 text-[10px]">JS</div>
              <div className="text-white/80 tabular-nums">{pack.bytes.jsBytes} B</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">CSS</div>
              <div className="text-white/80 tabular-nums">{pack.bytes.cssBytes} B</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">TokenPack PNG (compressed)</div>
              <div className="text-green-400 tabular-nums">{pack.bytes.pngBytes} B</div>
            </div>
          </div>
        )}
      </div>

      {variants ? (
        <div className="mt-4">
          <ScenarioRunner defaultIterations={10} variants={variants} />
        </div>
      ) : (
        <div className="mt-6 text-white/30 text-sm py-6 animate-pulse">Preparing variants…</div>
      )}

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
          <PackageIcon size={14} /> Mount target
        </h2>
        <div
          ref={containerRef}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 min-h-[120px]"
        />
      </div>

      <details className="mt-8 text-xs text-white/40">
        <summary className="cursor-pointer hover:text-white/60">Methodology + caveats</summary>
        <ul className="mt-3 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>Sync</strong>: imports the component statically (in the main bundle); the
            iteration measures only React mount + DOM update.
          </li>
          <li>
            <strong>Async</strong>: <code>import(&apos;./HeavyComponent&apos;)</code> — Next splits
            this into a chunk; warm cache after first run.
          </li>
          <li>
            <strong>TokenPack</strong>:{' '}
            <code>decode(pngBlob) → unpackBuffers → import(blob:) → mount</code>. CSS injected via a{' '}
            <code>&lt;style&gt;</code> tag.
          </li>
          <li>
            <strong>React resolution</strong>: This demo exposes React via{' '}
            <code>globalThis.__tokenpack_react__</code>. Production: use an import map or a
            pre-bundled module wrapper.
          </li>
          <li>
            <strong>Sourcemaps + DevTools</strong>: not handled. Add{' '}
            <code>{'//# sourceURL=…'}</code> hints + ride-along <code>.map</code> files for
            production polish.
          </li>
          <li>
            <strong>CSP</strong>: <code>{`script-src 'self' blob:`}</code> required for{' '}
            <code>import(blob:)</code>; <code>{`style-src 'self' 'unsafe-inline'`}</code> for the
            injected CSS.
          </li>
        </ul>
      </details>
    </main>
  )
}

function buildVariants(
  pngBlob: Blob,
  containerRef: React.RefObject<HTMLDivElement | null>,
  rootRef: React.RefObject<Root | null>,
  styleRefs: React.RefObject<HTMLStyleElement[]>,
  bytes: PackBytes,
): Variant[] {
  return [
    {
      label: 'Sync import (component in main bundle)',
      run: async () => {
        const t0 = performance.now()

        await mount(
          containerRef,
          rootRef,
          createElement(HeavyComponent, { message: 'Static import + mount', count: 8 }),
        )

        return { ms: performance.now() - t0, bytes: bytes.jsBytes + bytes.cssBytes }
      },
    },
    {
      label: 'Dynamic import() (code-split chunk)',
      run: async () => {
        const t0 = performance.now()
        const mod = await import('./HeavyComponent')

        await mount(
          containerRef,
          rootRef,
          createElement(mod.default, { message: 'Dynamic import + mount', count: 8 }),
        )

        return { ms: performance.now() - t0, bytes: bytes.jsBytes + bytes.cssBytes }
      },
    },
    {
      label: 'TokenPack (decode → import(blob:) → mount)',
      run: async () => {
        const t0 = performance.now()
        const Component = await mountFromTokenpackBlob(pngBlob, styleRefs)

        await mount(
          containerRef,
          rootRef,
          createElement(Component, { message: 'TokenPack mount', count: 8 }),
        )

        return { ms: performance.now() - t0, bytes: bytes.pngBytes }
      },
    },
  ]
}

async function mountFromTokenpackBlob(
  pngBlob: Blob,
  styleRefs: React.RefObject<HTMLStyleElement[]>,
): Promise<React.ComponentType<{ message: string; count: number }>> {
  const result = await decode(pngBlob)

  if (result.type !== 'dir') throw new Error('component pack is not a packed dir')
  const entries = result.entries
  const dec = new TextDecoder()

  const cssEntry = entries.find(e => e.path === 'component.css')

  if (cssEntry) {
    const style = document.createElement('style')

    style.dataset.tokenpack = 'component-bundle'
    style.textContent = dec.decode(cssEntry.payload)
    document.head.appendChild(style)
    if (styleRefs.current) styleRefs.current.push(style)
  }

  const jsEntry = entries.find(e => e.path === 'component.js')

  if (!jsEntry) throw new Error('component.js missing in pack')
  const jsSource = dec.decode(jsEntry.payload)

  // Module via Blob URL — this IS the goal pattern for component-as-token.
  // The module references React via globalThis.__tokenpack_react__ (set on page mount).
  const blob = new Blob([jsSource as BlobPart], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)

  try {
    const mod = (await import(/* @vite-ignore */ /* webpackIgnore: true */ url)) as {
      default: React.ComponentType<{ message: string; count: number }>
    }

    return mod.default
  } finally {
    // Revoke promptly — the module is already evaluated and won't be re-imported.
    URL.revokeObjectURL(url)
  }
}

async function mount(
  containerRef: React.RefObject<HTMLDivElement | null>,
  rootRef: React.RefObject<Root | null>,
  element: ReactElement,
): Promise<void> {
  const target = containerRef.current

  if (!target) return
  if (!rootRef.current) rootRef.current = createRoot(target)
  rootRef.current.render(element)
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

function cleanupMount(
  rootRef: React.RefObject<Root | null>,
  styleRefs: React.RefObject<HTMLStyleElement[]>,
): void {
  rootRef.current?.unmount()
  rootRef.current = null
  if (styleRefs.current) {
    for (const s of styleRefs.current) s.remove()
    styleRefs.current = []
  }
}
