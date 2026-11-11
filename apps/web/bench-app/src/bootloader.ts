/**
 * Bench-app bootloader.
 *
 * Phases:
 *   1. boot   — load eager modules / styles / images, render eager UI
 *   2. lazy   — fires on button click, load lazy modules / styles / images,
 *               then run window.__BENCH_LAZY.initScene(dialogEl, bitmaps)
 *
 * URL params:
 *   loader = multi | single | router   (default: multi)
 *   origin = local | cdn               (default: local)
 *   cdnBase = <url>                    (overrides cdn base)
 *   cache = cold | warm                (default: cold)
 *   run = <id>                         (cold cache-bust id)
 *
 * Signals (CustomEvent + window globals):
 *   bench:boot:done   when eager render is done
 *   bench:lazy:done   when lazy materialization is done
 *   bench:lazy:scene-rendered  when three.js spin finishes
 *
 * Three loaders converge on the same end state per phase. Router keeps its
 * RouterToken instance from boot for lazy reuse (chunk-cache stays hot).
 */
import { decodeRouter, type MaterializedFile, type RouterToken } from '@tokenpack/browser'

import { collectWireBytes, diffWireBytes, type WireBytes } from './benchBytes'
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
  version: number
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
    __BENCH_BYTES?: WireBytes
    __BENCH_LAZY_BYTES?: WireBytes
    __BENCH_ERROR?: string
    __BENCH_COUNTS?: Record<string, number>
    __BENCH_START?: number
    __BENCH_VARIANT?: { loader: string; origin: string; base: string }
  }
}

declare const __BENCH_CDN_BASE__: string
declare const __BENCH_ASSET_BASE__: string

const params = new URLSearchParams(location.search)
const loader = (params.get('loader') ?? 'multi') as 'multi' | 'single' | 'router'
const origin = (params.get('origin') ?? 'local') as 'local' | 'cdn'
const scope: BenchScope = parseBenchScope(params.get('scope'))
const cacheMode = (params.get('cache') ?? 'cold') as 'cold' | 'warm'
const runId = params.get('run') ?? String(Date.now())
const cdnBaseParam = params.get('cdnBase')
const cdnBase = cdnBaseParam ?? (__BENCH_CDN_BASE__.startsWith('http') ? __BENCH_CDN_BASE__ : '')
const base = origin === 'cdn' ? cdnBase.replace(/\/$/, '') : __BENCH_ASSET_BASE__

window.__BENCH_VARIANT = { loader, origin, base }

// Belt-and-braces: the HTML shell raises this before any asset loads; raise
// again here in case the shell predates the bytes instrumentation.
performance.setResourceTimingBufferSize(20000)

let manifestCache: Manifest | null = null
let routerCache: RouterToken | null = null
let bootBytes: WireBytes | null = null

// A single failed request out of hundreds (dev-server hiccup, dropped
// socket) would otherwise kill boot silently — the harness then waits on
// __BENCH_BOOT_DONE forever. Publish the failure so it can retry.
boot().catch(reportBenchError)

function reportBenchError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)

  window.__BENCH_ERROR = message
  setStatus(`boot failed: ${message}`)
}

async function boot(): Promise<void> {
  const t0 = benchStart()
  const phases: Record<string, number> = {}

  setStatus(`loading manifest from ${base}`)
  const tManifest = performance.now()
  const manifest = await fetchManifest(base)

  manifestCache = manifest
  phases.manifestMs = performance.now() - tManifest
  window.__BENCH_COUNTS = {
    modules: manifest.modules.length,
    styles: manifest.styles?.length ?? 0,
    images: manifest.assets?.length ?? 0,
    lazyModules: manifest.lazyModules?.length ?? 0,
    lazyStyles: manifest.lazyStyles?.length ?? 0,
    lazyImages: manifest.lazyAssets?.length ?? 0,
  }
  const eager = selectEager(manifest)

  setStatus(`eager: ${describeEager(eager)} via ${loader} · ${describeScope(scope)}`)
  const tLoad = performance.now()

  const loadPhases =
    loader === 'multi'
      ? await loadEagerMulti(eager, base)
      : loader === 'single'
        ? await loadEagerSingle(eager, base)
        : loader === 'router'
          ? await loadEagerRouter(eager, base)
          : undefined

  if (!loadPhases) throw new Error(`unknown loader: ${loader}`)
  Object.assign(phases, loadPhases)

  phases.loadMs = performance.now() - tLoad
  const tRender = performance.now()

  renderEager(eager.modules)
  phases.renderMs = performance.now() - tRender

  const total = performance.now() - t0

  bootBytes = collectWireBytes()
  window.__BENCH_BYTES = bootBytes
  window.__BENCH_BOOT_DONE = total
  window.__BENCH_PHASES = phases
  document.title = `${loader}/${origin} · boot ${Math.round(total)}ms`
  setStatus(
    `boot ${Math.round(total)} ms · ${phaseSummary(phases)} · render ${Math.round(phases.renderMs)} ms (${eager.modules.length} modules)`,
  )
  setupLazyButton()
  window.dispatchEvent(
    new CustomEvent('bench:boot:done', { detail: { loader, origin, totalMs: total, phases } }),
  )
}

async function fetchManifest(b: string): Promise<Manifest> {
  const r = await fetch(cacheUrl(`${b}/manifest.json`), {
    cache: cacheMode === 'cold' ? 'no-store' : 'default',
  })

  if (!r.ok) throw new Error(`manifest fetch failed: ${r.status}`)

  return (await r.json()) as Manifest
}

// ── Eager loaders ─────────────────────────────────────────────────────────

async function loadEagerMulti(eager: EagerSelection, b: string): Promise<Record<string, number>> {
  const imageRoot = ensureImageContainer()
  const started = performance.now()
  const jsCssTasks: Promise<unknown>[] = []
  const imageTasks: Promise<unknown>[] = []

  for (const m of eager.modules) jsCssTasks.push(injectScript(cacheUrl(`${b}/${m.path}`)))
  for (const s of eager.styles) jsCssTasks.push(injectStylesheet(cacheUrl(`${b}/${s.path}`)))
  for (const a of eager.assets) imageTasks.push(attachImage(cacheUrl(`${b}/${a.path}`), imageRoot))

  const jsCssDone = Promise.all(jsCssTasks).then(() => performance.now() - started)
  const imagesDone = Promise.all(imageTasks).then(() => performance.now() - started)
  const [jsCssMs, imagesMs] = await Promise.all([jsCssDone, imagesDone])

  return { jsCssMs, imagesMs }
}

async function loadEagerSingle(eager: EagerSelection, b: string): Promise<Record<string, number>> {
  const imageRoot = ensureImageContainer()
  const started = performance.now()
  const jsCssTasks: Promise<unknown>[] = [
    injectScript(cacheUrl(`${b}/bundle.js`)),
    injectStylesheet(cacheUrl(`${b}/bundle.css`)),
  ]
  const imageTasks: Promise<unknown>[] = []

  for (const a of eager.assets) imageTasks.push(attachImage(cacheUrl(`${b}/${a.path}`), imageRoot))
  const jsCssDone = Promise.all(jsCssTasks).then(() => performance.now() - started)
  const imagesDone = Promise.all(imageTasks).then(() => performance.now() - started)
  const [jsCssMs, imagesMs] = await Promise.all([jsCssDone, imagesDone])

  return { jsCssMs, imagesMs }
}

async function loadEagerRouter(eager: EagerSelection, b: string): Promise<Record<string, number>> {
  const started = performance.now()
  const router = await decodeRouter(cacheUrl(`${b}/router/router.png`))

  routerCache = router
  const eagerPaths = [
    ...eager.modules.map(m => m.path),
    ...eager.styles.map(s => s.path),
    ...eager.assets.map(a => a.path),
  ]
  const files = await router.materialize(eagerPaths)
  const materializeMs = performance.now() - started
  const tImages = performance.now()

  await attachImagesFromMaterialized(files, ensureImageContainer())

  return { materializeMs, imagesMs: performance.now() - tImages }
}

// ── Lazy loaders ──────────────────────────────────────────────────────────

async function loadLazyMulti(manifest: Manifest, b: string): Promise<ImageBitmap[]> {
  const tasks: Promise<unknown>[] = []
  const imagePromises: Array<Promise<ImageBitmap>> = []

  for (const m of manifest.lazyModules ?? []) tasks.push(injectScript(cacheUrl(`${b}/${m.path}`)))
  for (const s of manifest.lazyStyles ?? [])
    tasks.push(injectStylesheet(cacheUrl(`${b}/${s.path}`)))
  for (const a of manifest.lazyAssets ?? []) {
    const p = fetchLazyBitmap(cacheUrl(`${b}/${a.path}`))

    imagePromises.push(p)
    tasks.push(p)
  }
  await Promise.all(tasks)

  return Promise.all(imagePromises)
}

async function loadLazySingle(manifest: Manifest, b: string): Promise<ImageBitmap[]> {
  const tasks: Promise<unknown>[] = [
    injectScript(cacheUrl(`${b}/lazy.js`)),
    injectStylesheet(cacheUrl(`${b}/lazy.css`)),
  ]
  const imagePromises: Array<Promise<ImageBitmap>> = []

  for (const a of manifest.lazyAssets ?? []) {
    const p = fetchLazyBitmap(cacheUrl(`${b}/${a.path}`))

    imagePromises.push(p)
    tasks.push(p)
  }
  await Promise.all(tasks)

  return Promise.all(imagePromises)
}

async function loadLazyRouter(manifest: Manifest, b: string): Promise<ImageBitmap[]> {
  const router = routerCache ?? (await decodeRouter(cacheUrl(`${b}/router/router.png`)))

  routerCache = router
  const lazyPaths = [
    ...(manifest.lazyModules ?? []).map(m => m.path),
    ...(manifest.lazyStyles ?? []).map(s => s.path),
    ...(manifest.lazyAssets ?? []).map(a => a.path),
  ]
  const files = await router.materialize(lazyPaths)

  return decodeImageBitmaps(files)
}

async function decodeImageBitmaps(files: MaterializedFile[]): Promise<ImageBitmap[]> {
  // Used for the LAZY phase only — these bitmaps feed Three.js textures.
  const imageFiles = files.filter(f => f.kind === 'bytes' && f.entry.path.endsWith('.png'))

  if (imageFiles.length === 0) return []

  return Promise.all(
    imageFiles.map(f => {
      const blob = new Blob([snapshotBytes(f.bytes)], { type: 'image/png' })

      return createImageBitmap(blob)
    }),
  )
}

async function attachImagesFromMaterialized(
  files: MaterializedFile[],
  container: HTMLElement,
): Promise<void> {
  // For the EAGER phase — bytes come out of materialize, wrap each in a
  // blob URL, mount an <img>, await decode() so it's actually paint-ready.
  const imageFiles = files.filter(f => f.kind === 'bytes' && f.entry.path.endsWith('.png'))

  if (imageFiles.length === 0) return
  await Promise.all(
    imageFiles.map(f => {
      const blob = new Blob([snapshotBytes(f.bytes)], { type: 'image/png' })
      const url = URL.createObjectURL(blob)

      return attachImageUrl(url, container)
    }),
  )
}

/**
 * Copy bytes into a fresh ArrayBuffer that the Blob can own outright.
 * Router materialize() may return Uint8Array views onto chunk buffers; once
 * the load completes those buffers can be recycled, which intermittently
 * shows up as "EncodingError: The source image cannot be decoded" when
 * img.decode() runs async against now-garbage memory. Snapshotting at
 * Blob-construction time pins the bytes for the blob's lifetime.
 */
function snapshotBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)

  copy.set(bytes)

  return copy.buffer
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

function attachImage(url: string, container: HTMLElement): Promise<void> {
  return attachImageUrl(url, container)
}

function attachImageUrl(url: string, container: HTMLElement): Promise<void> {
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

// ── Lazy button + dialog ──────────────────────────────────────────────────

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
  const manifest = manifestCache

  if (!manifest) throw new Error('manifest missing in lazy phase')

  const dialog = ensureDialog()

  setLazyStatus('loading…')
  const tLoad = performance.now()
  let bitmaps: ImageBitmap[] = []

  if (loader === 'multi') bitmaps = await loadLazyMulti(manifest, base)
  else if (loader === 'single') bitmaps = await loadLazySingle(manifest, base)
  else if (loader === 'router') bitmaps = await loadLazyRouter(manifest, base)
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
    new CustomEvent('bench:lazy:done', { detail: { loader, origin, totalMs: total, phases } }),
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
  const sep = document.createTextNode(' · ')
  const status = document.createElement('span')

  status.id = 'lazy-status'
  status.textContent = 'opening'
  bar.append(title, sep, status)

  const scene = document.createElement('div')

  scene.className = 'scene'

  const tags = document.createElement('div')

  tags.className = 'tags'

  dialog.append(bar, scene, tags)
  document.body.appendChild(dialog)

  return dialog
}

function setLazyStatus(msg: string): void {
  const el = document.getElementById('lazy-status')

  if (el) el.textContent = msg
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

// ── Injection helpers ─────────────────────────────────────────────────────

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

async function fetchLazyBitmap(url: string): Promise<ImageBitmap> {
  // Lazy images feed Three.js textures, so we still want an ImageBitmap.
  const r = await fetch(url, { cache: cacheMode === 'cold' ? 'no-store' : 'default' })

  if (!r.ok) throw new Error(`image fetch failed: ${r.status} ${url}`)
  const blob = await r.blob()

  return createImageBitmap(blob)
}

// ── Eager render ──────────────────────────────────────────────────────────

interface EagerSelection {
  modules: ManifestEntry[]
  styles: ManifestEntry[]
  assets: ManifestImageEntry[]
}

function selectEager(manifest: Manifest): EagerSelection {
  const modules = manifest.modules
  const styles = manifest.styles ?? []
  const assets = manifest.assets ?? []

  return selectBenchEntries(scope, { modules, styles, assets })
}

function describeEager(eager: EagerSelection): string {
  return `${eager.modules.length} JS + ${eager.styles.length} CSS + ${eager.assets.length} PNG`
}

function describeScope(value: BenchScope): string {
  return value === 'random' ? '50% deterministic random request set' : 'full app request set'
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

function phaseSummary(phases: Record<string, number>): string {
  const parts: string[] = []

  if (phases.manifestMs !== undefined) parts.push(`manifest ${Math.round(phases.manifestMs)} ms`)
  if (phases.materializeMs !== undefined)
    parts.push(`materialize ${Math.round(phases.materializeMs)} ms`)
  if (phases.jsCssMs !== undefined) parts.push(`JS/CSS ${Math.round(phases.jsCssMs)} ms`)
  if (phases.imagesMs !== undefined) parts.push(`images ${Math.round(phases.imagesMs)} ms`)
  if (phases.loadMs !== undefined) parts.push(`load ${Math.round(phases.loadMs)} ms`)

  return parts.join(' · ')
}

function renderEager(modules: ManifestEntry[]): void {
  const root = document.getElementById('root')

  if (!root) throw new Error('#root missing')
  const bag = window.__BENCH_MODULES ?? {}
  const ids = modules.map(module => module.id).filter(id => id !== undefined)

  for (const id of ids) bag[id]?.render(root)
}

function setStatus(msg: string): void {
  const el = document.getElementById('status')

  if (el) el.textContent = msg
}
