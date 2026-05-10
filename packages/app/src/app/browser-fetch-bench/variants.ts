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

import type { Variant } from './types'

const BROWSER_FETCH_PAGE_EXCLUDE_ALGOS: readonly string[] = []
const BROWSER_FETCH_PAGE_EXCLUDE_VARIANTS: readonly string[] = [
  // Browser canvas PNG C4 can corrupt the compact header for the non-stream
  // linear PNG surface; the streaming C4 path owns PNG parsing and is valid.
  'linear-deflate-c4',
]

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

export const TEXT_VARIANTS: Variant[] = [
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
    label: 'pixel-range-none range fetch all',
    isToken: true,
    loadMode: 'range-pack-fetch',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?source=${source}`,
    compat: 'full',
    compatNote:
      'Partial remote pack access: pixel-range-none outer container, deflate per-file regions. Fetch manifest once, then fetch all file regions with HTTP Range.',
  },
  {
    group: 'text',
    id: 'pixel-range-range-stream-all',
    label: 'pixel-range-none range stream all',
    isToken: true,
    isStreamable: true,
    loadMode: 'range-pack-stream',
    url: ({ source }) => `/api/runtime-benchmark/range-pack?source=${source}`,
    compat: 'full',
    compatNote:
      'Partial remote pack access: pixel-range-none outer container, deflate per-file regions. Fetch manifest once, then stream all file regions with HTTP Range.',
  },
  ...buildTokenVariants('text', /* sourceful */ true),
]

export const SCRIPT_VARIANTS: Variant[] = [
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
  ...buildTokenVariants('script', /* sourceful */ true),
]
