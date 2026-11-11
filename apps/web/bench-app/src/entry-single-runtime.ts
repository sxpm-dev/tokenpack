/**
 * native-single runtime — the small part of entry-all.js that orchestrates
 * boot and lazy. The actual module IIFEs and Three.js bundle are
 * concatenated AHEAD of this file by scripts/build-entry-single.ts, so by
 * the time this runtime runs:
 *   - window.__BENCH_MODULES is populated (eager modules executed)
 *   - window.__BENCH_LAZY_MODULES is populated (lazy modules executed)
 *   - window.__BENCH_LAZY.initScene is defined (Three.js scene ready)
 *
 * CSS is inlined as build-time constants (__BENCH_EAGER_CSS__, __BENCH_LAZY_CSS__).
 * Lazy image paths come from the inlined manifest. Eager <img> tags are
 * pre-rendered into the HTML by build-native-html.ts so the browser starts
 * fetching them at document-parse time, before this script even runs.
 */
import { collectWireBytes, diffWireBytes, type WireBytes } from './benchBytes'
import { type BenchScope, parseBenchScope, selectRandomHalf } from './benchScope'

interface ManifestImageEntry {
  path: string
  bytes: number
}

declare global {
  interface Window {
    __BENCH_MODULES?: Record<number, { id: number; render: (root: Element) => Element }>
    __BENCH_LAZY_MODULES?: Record<number, { id: number; render: (root: Element) => Element }>
    __BENCH_LAZY?: {
      initScene?: (root: HTMLElement, bitmaps: readonly ImageBitmap[]) => void
    }
    __BENCH_BOOT_DONE?: number
    __BENCH_LAZY_DONE?: number
    __BENCH_PHASES?: Record<string, number>
    __BENCH_LAZY_PHASES?: Record<string, number>
    __BENCH_BYTES?: WireBytes
    __BENCH_LAZY_BYTES?: WireBytes
    __BENCH_ERROR?: string
    __BENCH_START?: number
    __BENCH_VARIANT?: { loader: string; origin: string; base: string }
  }
}

declare const __BENCH_EAGER_CSS__: string
declare const __BENCH_LAZY_CSS__: string
declare const __BENCH_LAZY_ASSETS_JSON__: string
declare const __BENCH_CDN_BASE__: string
declare const __BENCH_ASSET_BASE__: string

const lazyAssets = JSON.parse(__BENCH_LAZY_ASSETS_JSON__) as ManifestImageEntry[]

const params = new URLSearchParams(location.search)
const origin = (params.get('origin') ?? 'local') as 'local' | 'cdn'
const scope: BenchScope = parseBenchScope(params.get('scope'))
const cacheMode = (params.get('cache') ?? 'cold') as 'cold' | 'warm'
const runId = params.get('run') ?? String(Date.now())
const cdnBaseParam = params.get('cdnBase')
const cdnBase = cdnBaseParam ?? (__BENCH_CDN_BASE__.startsWith('http') ? __BENCH_CDN_BASE__ : '')
const base = origin === 'cdn' ? cdnBase.replace(/\/$/, '') : __BENCH_ASSET_BASE__

window.__BENCH_VARIANT = { loader: 'native-single', origin, base }

// Belt-and-braces: the HTML shell raises this before any asset loads; raise
// again here in case the shell predates the bytes instrumentation.
performance.setResourceTimingBufferSize(20000)

let bootBytes: WireBytes | null = null

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot().catch(reportBenchError)
  })
} else {
  boot().catch(reportBenchError)
}

function reportBenchError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)

  window.__BENCH_ERROR = message
  setStatus(`boot failed: ${message}`)
}

async function boot(): Promise<void> {
  const t0 = benchStart()
  const phases: Record<string, number> = {}

  phases.jsCssMs = performance.now() - t0

  const tStyle = performance.now()

  if (!document.querySelector('link[data-bench-eager-css]')) {
    const style = document.createElement('style')

    style.textContent = __BENCH_EAGER_CSS__
    document.head.appendChild(style)
  }
  phases.styleMs = performance.now() - tStyle

  // Render eager module tags. Their IIFEs already executed at script-parse.
  const tRender = performance.now()

  const renderedModules = renderEager()

  phases.renderMs = performance.now() - tRender

  // Wait for the inline <img> tags (already in HTML, browser has been
  // fetching them since parse) to fully decode.
  const imgs = Array.from(document.querySelectorAll('img.eager-img')) as HTMLImageElement[]

  await Promise.all(
    imgs.map(img => (img.complete ? img.decode().catch(() => undefined) : waitForDecode(img))),
  )
  phases.imagesMs = performance.now() - t0

  const total = performance.now() - t0

  bootBytes = collectWireBytes()
  window.__BENCH_BYTES = bootBytes
  window.__BENCH_BOOT_DONE = total
  window.__BENCH_PHASES = phases
  document.title = `native-single/${origin} · boot ${Math.round(total)}ms`
  setStatus(
    `boot ${Math.round(total)} ms · JS/CSS ${Math.round(phases.jsCssMs)} ms (entry-all.js + bundle.css) · images ${Math.round(phases.imagesMs)} ms (${imgs.length} eager images decoded) · render ${Math.round(phases.renderMs)} ms (${renderedModules} modules) · ${describeScope(scope)}`,
  )
  setupLazyButton()
  window.dispatchEvent(
    new CustomEvent('bench:boot:done', {
      detail: { loader: 'native-single', origin, totalMs: total, phases },
    }),
  )
}

function benchStart(): number {
  return typeof window.__BENCH_START === 'number' ? window.__BENCH_START : performance.now()
}

function cacheUrl(rawUrl: string): string {
  if (cacheMode !== 'cold') return rawUrl
  const url = new URL(rawUrl, location.href)

  url.searchParams.set('benchRun', runId)

  return url.href
}

function waitForDecode(img: HTMLImageElement): Promise<void> {
  return new Promise(resolve => {
    img.onload = () => {
      img.decode().then(
        () => resolve(),
        () => resolve(),
      )
    }
    img.onerror = () => resolve()
  })
}

function setupLazyButton(): void {
  const btn = document.getElementById('open-dialog') as HTMLButtonElement | null

  if (!btn) return
  btn.disabled = false
  btn.addEventListener(
    'click',
    () => {
      void openLazyDialog()
    },
    { once: true },
  )
}

async function openLazyDialog(): Promise<void> {
  const t0 = performance.now()
  const phases: Record<string, number> = {}

  const dialog = ensureDialog()

  setLazyStatus('loading…')

  const tStyle = performance.now()
  const style = document.createElement('style')

  style.textContent = __BENCH_LAZY_CSS__
  document.head.appendChild(style)
  phases.styleMs = performance.now() - tStyle

  // Fetch lazy images. Lazy modules + Three.js are already in this bundle.
  const tLoad = performance.now()
  const bitmaps = await Promise.all(
    lazyAssets.map(async a => {
      const r = await fetch(cacheUrl(`${base}/${a.path}`), {
        cache: cacheMode === 'cold' ? 'no-store' : 'default',
      })

      if (!r.ok) throw new Error(`image ${a.path} failed: ${r.status}`)
      const blob = await r.blob()

      return createImageBitmap(blob)
    }),
  )

  phases.loadMs = performance.now() - tLoad
  const tRender = performance.now()

  renderLazyTags(dialog)
  if (window.__BENCH_LAZY?.initScene) {
    const sceneRoot = dialog.querySelector('.scene') as HTMLElement | null

    if (sceneRoot) window.__BENCH_LAZY.initScene(sceneRoot, bitmaps)
  }
  phases.renderMs = performance.now() - tRender

  const total = performance.now() - t0

  window.__BENCH_LAZY_BYTES = bootBytes
    ? diffWireBytes(collectWireBytes(), bootBytes)
    : collectWireBytes()
  window.__BENCH_LAZY_DONE = total
  window.__BENCH_LAZY_PHASES = phases
  setLazyStatus(
    `done · ${Math.round(total)}ms (load ${Math.round(phases.loadMs)} · render ${Math.round(phases.renderMs)})`,
  )
  window.dispatchEvent(
    new CustomEvent('bench:lazy:done', {
      detail: { loader: 'native-single', origin, totalMs: total, phases },
    }),
  )
}

function ensureDialog(): HTMLElement {
  const existing = document.getElementById('lazy-dialog')

  if (existing) return existing
  const dialog = document.createElement('div')

  dialog.id = 'lazy-dialog'

  const bar = document.createElement('div')

  bar.className = 'bar'
  const title = document.createElement('strong')

  title.textContent = 'Lazy dialog'
  bar.append(title, document.createTextNode(' · '))
  const status = document.createElement('span')

  status.id = 'lazy-status'
  status.textContent = 'opening'
  bar.appendChild(status)

  const scene = document.createElement('div')

  scene.className = 'scene'

  const tags = document.createElement('div')

  tags.className = 'tags'

  dialog.append(bar, scene, tags)
  document.body.appendChild(dialog)

  return dialog
}

function setStatus(msg: string): void {
  const el = document.getElementById('status')

  if (el) el.textContent = msg
}

function setLazyStatus(msg: string): void {
  const el = document.getElementById('lazy-status')

  if (el) el.textContent = msg
}

function renderEager(): number {
  const root = document.getElementById('root')

  if (!root) throw new Error('#root missing')
  const bag = window.__BENCH_MODULES ?? {}
  let ids = Object.keys(bag)
    .map(Number)
    .sort((a, b) => a - b)

  if (scope === 'random') {
    ids = selectRandomHalf(
      ids.map(id => ({ path: `mod-${String(id).padStart(4, '0')}.js`, id })),
    ).map(entry => entry.id)
  }

  for (const id of ids) bag[id]?.render(root)

  return ids.length
}

function renderLazyTags(dialog: HTMLElement): void {
  const tagsRoot = dialog.querySelector('.tags')

  if (!tagsRoot) return
  const bag = window.__BENCH_LAZY_MODULES ?? {}
  const ids = Object.keys(bag)
    .map(Number)
    .sort((a, b) => a - b)

  for (const id of ids) bag[id]?.render(tagsRoot)
}

export {}

function describeScope(value: BenchScope): string {
  return value === 'random' ? '50% deterministic random request set' : 'full app request set'
}
