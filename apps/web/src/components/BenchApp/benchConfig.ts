import type { BenchSize } from '@/lib/benchAppFiles'

export const SIZES: Array<{ id: BenchSize; label: string; note: string }> = [
  { id: 'small', label: 'Small', note: 'quick smoke' },
  { id: 'medium', label: 'Medium', note: 'balanced app' },
  { id: 'large', label: 'Large', note: 'stress run' },
]

export const SCOPES = [
  { id: 'full', label: 'Full app', note: 'all eager files' },
  { id: 'random', label: '50% random', note: 'same seeded file set' },
] as const

export const CACHE_MODES = [
  { id: 'cold', label: 'Cold', note: 'cache-busted urls' },
  { id: 'warm', label: 'Warm', note: 'browser cache allowed' },
] as const

export const REPEAT_OPTIONS = [
  { id: 1, label: '1×', note: 'single shot' },
  { id: 3, label: '3×', note: 'median of 3' },
  { id: 5, label: '5×', note: 'median of 5' },
] as const

export const CASES = [
  {
    id: 'router',
    label: 'Router materialize',
    token: true,
    title: 'Router token + materialize()',
    body: 'TokenPack path. A router Image Token holds the app manifest plus linked chunks. The benchmark asks for the selected JS, CSS, and image paths; materialize(paths) range-fetches only the chunk bytes needed for that request.',
    details: [
      'Manifest source: decoded from router.png.',
      'Boot: materialize selected JS, CSS, and image paths from router chunks.',
      'Network shape: router Image Token plus HTTP Range requests into chunk images; chunk cache is reused.',
    ],
    frame: '/index.html',
    query: 'variant=router&loader=router&origin=local',
  },
  {
    id: 'multi',
    label: 'Manifest chunks',
    title: 'Manifest + many dynamic files',
    body: 'Dynamic app path. The loader fetches manifest.json separately, computes the same selected request set, then fetches each JS, CSS, and image file as its own browser request.',
    details: [
      'Manifest source: manifest.json fetched before loading assets.',
      'Boot: fetch selected JS/CSS/image files individually and inject tags at runtime.',
      'Lazy: fan out another set of JS, CSS, and image requests when the preview opens.',
      'Network shape: maximum browser-native parallelism, but one request per selected file.',
    ],
    frame: '/index.html',
    query: 'variant=multi&loader=multi&origin=local',
  },
  {
    id: 'single',
    label: 'Manifest bundle',
    title: 'Manifest + dynamic bundle',
    body: 'The page receives the same selected app surface, but JS and CSS are bundled, so boot still pays for bundle.js and bundle.css up front. Images stay individually requested.',
    details: [
      'Manifest source: manifest.json fetched before loading assets.',
      'Boot: load full bundle.js and bundle.css, render selected modules, then fetch selected images.',
      'Lazy: load lazy.js and lazy.css, then fetch lazy image bytes for the 3D scene.',
      'Network shape: fewer JS/CSS requests, but less granular code loading.',
    ],
    frame: '/index.html',
    query: 'variant=single&loader=single&origin=local',
  },
  {
    id: 'native-chunks',
    label: 'Native chunks',
    title: 'Initial HTML with many files',
    body: 'Native HTML path. The selected JS, CSS, and image tags are written directly into the initial HTML, so the browser discovers the chunks during parse instead of through a runtime manifest fetch.',
    details: [
      'Manifest source: build-time only; no runtime manifest request.',
      'Boot: initial HTML contains selected script, link, and image tags.',
      'Network shape: browser parser discovers many native asset requests immediately.',
    ],
    frame: '/native-chunks.html',
    query: 'variant=native-chunks&origin=local',
  },
  {
    id: 'native-single',
    label: 'Native single',
    title: 'Production-style single bundle',
    body: 'Native single-bundle path. The initial HTML starts selected image and CSS requests, then one entry-all.js script pays for the full JS bundle. It represents apps with no granular JS delivery.',
    details: [
      'Manifest source: build-time only; no runtime manifest request.',
      'Boot: initial HTML contains selected image tags plus one full entry-all.js script.',
      'Network shape: simplest runtime, but JS is paid up front even for a partial request set.',
    ],
    frame: '/native-single.html',
    query: 'variant=native-single&origin=local',
  },
] as const

export type BenchCase = (typeof CASES)[number]
export type CaseId = BenchCase['id']
export type LoadScope = (typeof SCOPES)[number]['id']
export type CacheMode = (typeof CACHE_MODES)[number]['id']
export type RepeatCount = (typeof REPEAT_OPTIONS)[number]['id']
