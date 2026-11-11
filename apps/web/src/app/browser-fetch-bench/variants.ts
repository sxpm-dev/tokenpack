// Variants are generated from the live algorithm catalog: every browser-safe
// registered algorithm × supported channel counts, plus the three universally-
// decodable HTTP encodings.
//
// Filtering rules:
//   1. `feFriendly === 'yes'` — algorithm metadata says it can decode in the
//      browser end-to-end.
//   2. `compressorFamily !== 'brotli'` — brotli outer compression requires
//      `DecompressionStream('br')` which isn't universally available; brotli
//      variants are exercised by the server-fetch bench instead. Keeping them
//      here only added "Partial-compat" rows that always skipped.
//   3. `BROWSER_FETCH_PAGE_EXCLUDE_*` — manual escape hatch to skip a specific
//      algo or variant in this UI without touching the catalog. Mirrors the
//      `BROWSER_FETCH_EXCLUDE` array in `scripts/benchmark/bench-algos.ts` (which
//      controls the bench-script side); kept duplicated rather than coupled
//      so this page can stay catalog-driven at runtime.

import '@tokenpack/browser'

import { browserAlgorithmCatalog as algorithmCatalog } from '@tokenpack/browser/algorithms/catalog'
import { type AlgorithmInfo, listAlgorithmInfos } from 'tokenpack/algorithms/catalog-info'
import type { AlgorithmCtor } from 'tokenpack/algorithms/types'

import { isStaticSite } from '@/lib/site-path'

import type { Variant } from './types'

const BROWSER_FETCH_PAGE_EXCLUDE_ALGOS: readonly string[] = []
const BROWSER_FETCH_PAGE_EXCLUDE_VARIANTS: readonly string[] = [
  // Browser canvas PNG C4 can corrupt the compact header for the non-stream
  // linear PNG surface; the streaming C4 path owns PNG parsing and is valid.
  'linear-deflate-c4',
]
const ENABLE_FULL_BROWSER_FETCH_BENCH = false
const FOCUSED_TEXT_VARIANT_IDS = new Set([
  'http-brotli',
  'linear-upng-deflate-c3',
  'pixel-range-range-fetch-all',
  'pixel-range-range-stream-all',
  'router-token-text-all',
  'router-token-text-fetch-all',
])
const FOCUSED_SCRIPT_VARIANT_IDS = new Set([
  'http-brotli',
  'linear-upng-deflate-c3',
  'pixel-range-range-fetch-all',
  'pixel-range-range-stream-all',
  'router-token-materialize-all',
  'router-token-materialize-fetch-all',
])
const FOCUSED_EXACT_VARIANT_IDS = new Set([
  'http-brotli-exact',
  'pixel-range-range-fetch-exact',
  'pixel-range-range-stream-exact',
  'router-token-text-exact',
  'router-token-text-fetch-exact',
  'router-token-text-full-exact',
])

function browserFetchAlgoInfos(): AlgorithmInfo[] {
  return listAlgorithmInfos(algorithmCatalog)
    .filter(a => a.feFriendly === 'yes')
    .filter(a => {
      const Ctor = algorithmCatalog.getByName(a.name)
      const compressor = Ctor.Compressor as unknown as { familyId: string }

      return compressor.familyId !== 'brotli'
    })
    .filter(a => !BROWSER_FETCH_PAGE_EXCLUDE_ALGOS.includes(a.name))
}

const ENCODINGS = ['raw', 'deflate', 'brotli'] as const

const ENCODING_COMPAT: Record<
  (typeof ENCODINGS)[number],
  { compat: 'full' | 'partial'; note: string }
> = {
  raw: { compat: 'full', note: 'No compression — universal.' },
  deflate: { compat: 'full', note: 'deflate via Content-Encoding — universal browser support.' },
  brotli: { compat: 'full', note: 'brotli via Content-Encoding — browser-native decode.' },
}

const SCRIPT_TAG_COMPAT: Record<
  (typeof ENCODINGS)[number],
  { compat: 'full' | 'partial'; note: string }
> = {
  raw: { compat: 'full', note: 'Native <script src> load with no Content-Encoding.' },
  deflate: {
    compat: 'full',
    note: 'Native <script src> load with deflate Content-Encoding.',
  },
  brotli: {
    compat: 'full',
    note: 'Native <script src> load with brotli Content-Encoding.',
  },
}

interface CatalogBinding {
  Ctor: AlgorithmCtor
  algoName: string
  compressorFamily: string
  streamable: boolean
  channels: ReadonlyArray<1 | 2 | 3 | 4>
}

function readBinding(Ctor: AlgorithmCtor): CatalogBinding {
  const compressor = Ctor.Compressor as unknown as { familyId: string }
  const caps = Ctor.capabilities

  return {
    Ctor,
    algoName: Ctor.name,
    compressorFamily: compressor.familyId,
    streamable: caps.streamable,
    channels: caps.channels,
  }
}

/** Browser-safe algorithms registered in the catalog, filtered by
 *  `BROWSER_FETCH_PAGE_EXCLUDE_ALGOS` and the no-brotli rule. */
function listBindings(): CatalogBinding[] {
  return browserFetchAlgoInfos().map(info => readBinding(algorithmCatalog.getByName(info.name)))
}

function tokenCompat(b: CatalogBinding): { compat: 'full' | 'partial'; note: string } {
  // Defensive: if a brotli-bound binding ever leaks past the filter, mark it
  // partial so the user sees why it's there. With the no-brotli filter this
  // branch is unreachable in practice — kept as a guard rail.
  if (b.compressorFamily === 'brotli') {
    return {
      compat: 'partial',
      note: `${b.algoName}: brotli outer compression — needs DecompressionStream("br"). Should have been filtered out — please report.`,
    }
  }

  return {
    compat: 'full',
    note: `${b.algoName}: ${b.compressorFamily} outer compression — works in every shipping browser. ${b.streamable ? 'Streamable (decode-as-you-fetch).' : 'Non-streaming (full PNG → decode).'}`,
  }
}

function variantId(algoName: string, ch: number): string {
  return `${algoName}-c${ch}`
}

function tokenUrl(
  endpoint: string,
  algo: string,
  ch: number,
  query: { source?: string } = {},
): string {
  const params = new URLSearchParams()

  params.set('algo', algo)
  params.set('ch', String(ch))
  if (query.source) params.set('source', query.source)

  return `${endpoint}?${params.toString()}`
}

function buildTokenVariants(group: 'text' | 'script', sourceful: boolean): Variant[] {
  const endpoint =
    group === 'text' ? '/api/runtime-benchmark/token' : '/api/runtime-benchmark/script-token'
  const out: Variant[] = []

  for (const b of listBindings()) {
    const compatInfo = tokenCompat(b)

    for (const ch of b.channels) {
      const id = variantId(b.algoName, ch)

      if (BROWSER_FETCH_PAGE_EXCLUDE_VARIANTS.includes(id)) continue

      out.push({
        group,
        id,
        label: id,
        isToken: true,
        isStreamable: b.streamable,
        url: ({ source }) => tokenUrl(endpoint, b.algoName, ch, sourceful ? { source } : {}),
        compat: compatInfo.compat,
        compatNote: compatInfo.note,
      })
    }
  }

  return out
}

const ALL_TEXT_VARIANTS: Variant[] = [
  ...ENCODINGS.map<Variant>(e => ({
    group: 'text',
    id: `http-${e}`,
    label: `http-${e}`,
    isToken: false,
    url: ({ source }) => `/api/runtime-benchmark/text?source=${source}&encoding=${e}`,
    compat: ENCODING_COMPAT[e].compat,
    compatNote: ENCODING_COMPAT[e].note,
  })),
  {
    group: 'text',
    id: 'pixel-range-range-fetch-all',
    label: 'pixel-range-none',
    isToken: true,
    loadMode: 'range-pack-fetch',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?tab=content&source=${source}`,
    compat: 'full',
    compatNote:
      'Partial remote pack access: pixel-range-none outer container, deflate per-file regions. Fetch manifest once, then fetch all file regions with HTTP Range.',
  },
  {
    group: 'text',
    id: 'pixel-range-range-stream-all',
    label: 'pixel-range-none',
    isToken: true,
    isStreamable: true,
    loadMode: 'range-pack-stream',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?tab=content&source=${source}`,
    compat: 'full',
    compatNote:
      'Partial remote pack access: pixel-range-none outer container, deflate per-file regions. Fetch manifest once, then stream all file regions with HTTP Range.',
  },
  {
    group: 'text',
    id: 'router-token-text-all',
    label: 'router token text',
    isToken: true,
    loadMode: 'router-text',
    url: ({ source }) => `/api/runtime-benchmark/router/content/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token entrypoint: decode router.png, then bulk extract all routed file bytes through the auto planner.',
  },
  {
    group: 'text',
    id: 'router-token-text-fetch-all',
    label: 'router token text',
    isToken: true,
    loadMode: 'router-text',
    routerStrategy: 'full',
    url: ({ source }) => `/api/runtime-benchmark/router/content/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token entrypoint: decode router.png, then bulk extract all routed file bytes through the buffered full-chunk planner.',
  },
  ...buildTokenVariants('text', /* sourceful */ true),
]

const ALL_SCRIPT_VARIANTS: Variant[] = [
  ...ENCODINGS.map<Variant>(e => ({
    group: 'script',
    id: `http-${e}`,
    label: `http-${e}`,
    isToken: false,
    url: ({ source }) => `/api/runtime-benchmark/script?source=${source}&encoding=${e}`,
    compat: ENCODING_COMPAT[e].compat,
    compatNote: ENCODING_COMPAT[e].note,
  })),
  ...ENCODINGS.map<Variant>(e => ({
    group: 'script',
    id: `http-script-${e}`,
    label: e === 'raw' ? 'http <script>' : `http ${e} <script>`,
    isToken: false,
    loadMode: 'script-tag',
    url: ({ source }) => `/api/runtime-benchmark/script?source=${source}&encoding=${e}`,
    compat: SCRIPT_TAG_COMPAT[e].compat,
    compatNote: SCRIPT_TAG_COMPAT[e].note,
  })),
  {
    group: 'script',
    id: 'pixel-range-range-fetch-all',
    label: 'pixel-range-none',
    isToken: true,
    loadMode: 'range-pack-fetch',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?tab=script&source=${source}`,
    compat: 'full',
    compatNote:
      'Partial remote pack access for generated scripts: pixel-range-none outer container, deflate per-file regions. Fetch manifest once, then fetch all script regions with HTTP Range.',
  },
  {
    group: 'script',
    id: 'pixel-range-range-stream-all',
    label: 'pixel-range-none',
    isToken: true,
    isStreamable: true,
    loadMode: 'range-pack-stream',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?tab=script&source=${source}`,
    compat: 'full',
    compatNote:
      'Partial remote pack access for generated scripts: pixel-range-none outer container, deflate per-file regions. Fetch manifest once, then stream all script regions with HTTP Range.',
  },
  {
    group: 'script',
    id: 'router-token-materialize-all',
    label: 'router token materialize',
    isToken: true,
    loadMode: 'router-materialize',
    url: ({ source }) => `/api/runtime-benchmark/router/script/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token entrypoint: decode router.png, let the auto planner load routed JS chunks and execute them.',
  },
  {
    group: 'script',
    id: 'router-token-materialize-fetch-all',
    label: 'router token materialize',
    isToken: true,
    loadMode: 'router-materialize',
    routerStrategy: 'full',
    url: ({ source }) => `/api/runtime-benchmark/router/script/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token entrypoint: decode router.png, then materialize routed JS chunks with the buffered full-chunk planner.',
  },
  ...buildTokenVariants('script', /* sourceful */ true),
]

const ALL_EXACT_VARIANTS: Variant[] = [
  {
    group: 'text',
    id: 'http-brotli-exact',
    label: 'http-brotli',
    isToken: false,
    loadMode: 'native-exact',
    url: ({ source }) => `/api/runtime-benchmark/text?source=${source}&encoding=brotli`,
    compat: 'full',
    compatNote:
      'Native HTTP exact-file mode: fetches only the selected source files with browser-native brotli Content-Encoding.',
  },
  {
    group: 'text',
    id: 'pixel-range-range-fetch-exact',
    label: 'pixel-range-none',
    isToken: true,
    loadMode: 'range-pack-exact-fetch',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?tab=content&source=${source}`,
    compat: 'full',
    compatNote:
      'Exact remote pack access: fetch selected compressed file regions with HTTP Range, then decode in JS.',
  },
  {
    group: 'text',
    id: 'pixel-range-range-stream-exact',
    label: 'pixel-range-none',
    isToken: true,
    isStreamable: true,
    loadMode: 'range-pack-exact-stream',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?tab=content&source=${source}`,
    compat: 'full',
    compatNote:
      'Exact remote pack access: pack.stream.text(paths) fetches one HTTP Range body per selected file.',
  },
  {
    group: 'text',
    id: 'router-token-text-exact',
    label: 'router token text',
    isToken: true,
    loadMode: 'router-exact-text',
    url: ({ source }) => `/api/runtime-benchmark/router/content/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token exact-file mode: decode router.png, then the auto planner loads only selected routed files.',
  },
  {
    group: 'text',
    id: 'router-token-text-fetch-exact',
    label: 'router token text',
    isToken: true,
    loadMode: 'router-exact-text',
    routerStrategy: 'range-fetch',
    url: ({ source }) => `/api/runtime-benchmark/router/content/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token exact-file mode: decode router.png, then fetch selected routed file segments with HTTP Range.',
  },
  {
    group: 'text',
    id: 'router-token-text-full-exact',
    label: 'router token text',
    isToken: true,
    loadMode: 'router-exact-text',
    routerStrategy: 'full',
    url: ({ source }) => `/api/runtime-benchmark/router/content/${source}/router.png`,
    compat: 'full',
    compatNote:
      'Router token exact-file control: decode router.png, then fetch whole selected chunk tokens.',
  },
]

// Focus mode while router-token loading is under active investigation.
// Flip ENABLE_FULL_BROWSER_FETCH_BENCH back to true to restore every generated
// token/range/materialization variant without reconstructing the catalog wiring.
export const TEXT_VARIANTS: Variant[] = ENABLE_FULL_BROWSER_FETCH_BENCH
  ? ALL_TEXT_VARIANTS
  : ALL_TEXT_VARIANTS.filter(variant => FOCUSED_TEXT_VARIANT_IDS.has(variant.id))

export const SCRIPT_VARIANTS: Variant[] = ENABLE_FULL_BROWSER_FETCH_BENCH
  ? ALL_SCRIPT_VARIANTS
  : ALL_SCRIPT_VARIANTS.filter(variant => FOCUSED_SCRIPT_VARIANT_IDS.has(variant.id))

export const EXACT_VARIANTS: Variant[] = ENABLE_FULL_BROWSER_FETCH_BENCH
  ? ALL_EXACT_VARIANTS
  : ALL_EXACT_VARIANTS.filter(variant => FOCUSED_EXACT_VARIANT_IDS.has(variant.id))

// Pages controls neither Content-Encoding nor server throttling. Use the host response honestly.
if (isStaticSite)
  for (const variants of [TEXT_VARIANTS, SCRIPT_VARIANTS, EXACT_VARIANTS]) {
    for (const variant of variants)
      if (!variant.isToken) {
        variant.id = variant.id.replace('brotli', 'host')
        variant.label = 'HTTP (host encoding)'
        variant.compatNote = 'Static host chooses Content-Encoding; no forced Brotli comparison.'
      }
  }
