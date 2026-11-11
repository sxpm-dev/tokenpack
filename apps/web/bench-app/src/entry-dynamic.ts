/**
 * native-dynamic entry — what a webpack/rollup runtime chunk looks like in
 * production. ONE script tag in the HTML, that script knows its full asset
 * list (inlined at build time as `__BENCH_MANIFEST_JSON__`), and it
 * dynamically injects <script>/<link>/<img> for every eager file.
 *
 * No @tokenpack/browser, no shared bootloader — this is the "real app"
 * baseline that the router variant has to beat.
 *
 * Lazy phase: button click triggers the same dynamic-load pattern for the
 * lazy bucket (including mod-lazy-three.js, which is itself an esbuild
 * bundle of Three.js + scene init).
 */

import { type BenchScope, parseBenchScope, selectBenchEntries } from './benchScope'

interface ManifestEntry {
  id?: number
  path: string
  bytes: number
  contentType?: string
}

interface ManifestImageEntry extends ManifestEntry {
  kind: 'image'
}

interface Manifest {
  modules: ManifestEntry[]
  styles?: ManifestEntry[]
  assets?: ManifestImageEntry[]
  lazyModules?: ManifestEntry[]
  lazyStyles?: ManifestEntry[]
  lazyAssets?: ManifestImageEntry[]
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
    __BENCH_VARIANT?: { loader: string; origin: string; base: string }
  }
}

declare const __BENCH_MANIFEST_JSON__: string
declare const __BENCH_CDN_BASE__: string
declare const __BENCH_ASSET_BASE__: string

const manifest = JSON.parse(__BENCH_MANIFEST_JSON__) as Manifest
const params = new URLSearchParams(location.search)
const origin = (params.get('origin') ?? 'local') as 'local' | 'cdn'
const scope: BenchScope = parseBenchScope(params.get('scope'))
const cdnBaseParam = params.get('cdnBase')
const cdnBase = cdnBaseParam ?? (__BENCH_CDN_BASE__.startsWith('http') ? __BENCH_CDN_BASE__ : '')
const base = origin === 'cdn' ? cdnBase.replace(/\/$/, '') : __BENCH_ASSET_BASE__

window.__BENCH_VARIANT = { loader: 'native-dynamic', origin, base }

void boot()

async function boot(): Promise<void> {
  const t0 = performance.now()
  const phases: Record<string, number> = { manifestMs: 0 }
  const eager = selectEager(manifest)

  setStatus(`eager: ${describeEager(eager)} · native-dynamic · ${describeScope(scope)}`)

  const imageRoot = ensureImageContainer()
  const tLoad = performance.now()
  const tasks: Promise<unknown>[] = []

  for (const m of eager.modules) tasks.push(injectScript(`${base}/${m.path}`))
  for (const s of eager.styles) tasks.push(injectStylesheet(`${base}/${s.path}`))
  for (const a of eager.assets) tasks.push(attachImage(`${base}/${a.path}`, imageRoot))
  await Promise.all(tasks)
  phases.loadMs = performance.now() - tLoad

  const tRender = performance.now()

  renderEager(eager.modules)
  phases.renderMs = performance.now() - tRender

  const total = performance.now() - t0

  window.__BENCH_BOOT_DONE = total
  window.__BENCH_PHASES = phases
  document.title = `native-dynamic/${origin} · boot ${Math.round(total)}ms`
  setStatus(
    `boot ${Math.round(total)} ms · load ${Math.round(phases.loadMs)} ms (${describeEager(eager)}) · render ${Math.round(phases.renderMs)} ms (${eager.modules.length} modules)`,
  )
  setupLazyButton()
  window.dispatchEvent(
    new CustomEvent('bench:boot:done', {
      detail: { loader: 'native-dynamic', origin, totalMs: total, phases },
    }),
  )
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
  const tLoad = performance.now()
  const imagePromises: Array<Promise<ImageBitmap>> = []
  const tasks: Promise<unknown>[] = []

  for (const m of manifest.lazyModules ?? []) tasks.push(injectScript(`${base}/${m.path}`))
  for (const s of manifest.lazyStyles ?? []) tasks.push(injectStylesheet(`${base}/${s.path}`))
  for (const a of manifest.lazyAssets ?? []) {
    const p = fetchLazyBitmap(`${base}/${a.path}`)

    imagePromises.push(p)
    tasks.push(p)
  }
  await Promise.all(tasks)
  const bitmaps = await Promise.all(imagePromises)

  phases.loadMs = performance.now() - tLoad
  const tRender = performance.now()

  renderLazyTags(dialog)
  if (window.__BENCH_LAZY?.initScene) {
    const sceneRoot = dialog.querySelector('.scene') as HTMLElement | null

    if (sceneRoot) window.__BENCH_LAZY.initScene(sceneRoot, bitmaps)
  }
  phases.renderMs = performance.now() - tRender

  const total = performance.now() - t0

  window.__BENCH_LAZY_DONE = total
  window.__BENCH_LAZY_PHASES = phases
  setLazyStatus(
    `done · ${Math.round(total)}ms (load ${Math.round(phases.loadMs)} · render ${Math.round(phases.renderMs)})`,
  )
  window.dispatchEvent(
    new CustomEvent('bench:lazy:done', {
      detail: { loader: 'native-dynamic', origin, totalMs: total, phases },
    }),
  )
}

// ── helpers (same shape as bootloader.ts, intentionally duplicated to keep
//    native-dynamic standalone — no shared infrastructure to argue about) ─

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')

    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`script failed: ${src}`))
    document.head.appendChild(s)
  })
}

function injectStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const l = document.createElement('link')

    l.rel = 'stylesheet'
    l.href = href
    l.onload = () => resolve()
    l.onerror = () => reject(new Error(`stylesheet failed: ${href}`))
    document.head.appendChild(l)
  })
}

function attachImage(url: string, container: HTMLElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.src = url
    img.decoding = 'async'
    img.loading = 'eager'
    container.appendChild(img)
    img
      .decode()
      .then(() => resolve())
      .catch(reject)
  })
}

async function fetchLazyBitmap(url: string): Promise<ImageBitmap> {
  const r = await fetch(url, { cache: 'no-store' })

  if (!r.ok) throw new Error(`image fetch failed: ${r.status} ${url}`)
  const blob = await r.blob()

  return createImageBitmap(blob)
}

function ensureImageContainer(): HTMLElement {
  let container = document.getElementById('images')

  if (!container) {
    container = document.createElement('div')
    container.id = 'images'
    document.body.appendChild(container)
  }

  return container
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

interface EagerSelection {
  modules: ManifestEntry[]
  styles: ManifestEntry[]
  assets: ManifestImageEntry[]
}

function selectEager(source: Manifest): EagerSelection {
  const modules = source.modules
  const styles = source.styles ?? []
  const assets = source.assets ?? []

  return selectBenchEntries(scope, { modules, styles, assets })
}

function describeEager(eager: EagerSelection): string {
  return `${eager.modules.length} JS + ${eager.styles.length} CSS + ${eager.assets.length} PNG`
}

function describeScope(value: BenchScope): string {
  return value === 'random' ? '50% deterministic random request set' : 'full app request set'
}

function renderEager(modules: ManifestEntry[]): void {
  const root = document.getElementById('root')

  if (!root) throw new Error('#root missing')
  const bag = window.__BENCH_MODULES ?? {}
  const ids = modules.map(module => module.id).filter(id => id !== undefined)

  for (const id of ids) bag[id]?.render(root)
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
