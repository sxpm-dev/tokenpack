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
//   3. `BROWSER_FETCH_PAGE_EXCLUDE` — manual escape hatch to skip a specific
//      algo in this UI without touching the catalog. Mirrors the
//      `BROWSER_FETCH_EXCLUDE` array in `benchmark/bench-algos.ts` (which
//      controls the bench-script side); kept duplicated rather than coupled
//      because the app workspace doesn't depend on `tokenpack-benchmark`.

import '@tokenpack/browser'

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { type AlgorithmInfo, listAlgorithmInfos } from 'tokenpack/algorithms/catalog-info'
import type { AlgorithmCtor } from 'tokenpack/algorithms/types'

import type { Variant } from './types'

const BROWSER_FETCH_PAGE_EXCLUDE: readonly string[] = []

function browserFetchAlgoInfos(): AlgorithmInfo[] {
  return listAlgorithmInfos()
    .filter(a => a.feFriendly === 'yes')
    .filter(a => {
      const Ctor = algorithmCatalog.getByName(a.name)
      const compressor = Ctor.Compressor as unknown as { familyId: string }

      return compressor.familyId !== 'brotli'
    })
    .filter(a => !BROWSER_FETCH_PAGE_EXCLUDE.includes(a.name))
}

const ENCODINGS = ['raw', 'gzip', 'deflate'] as const

const ENCODING_COMPAT: Record<
  (typeof ENCODINGS)[number],
  { compat: 'full' | 'partial'; note: string }
> = {
  raw: { compat: 'full', note: 'No compression — universal.' },
  gzip: { compat: 'full', note: 'gzip via Content-Encoding — universal browser support.' },
  deflate: { compat: 'full', note: 'deflate via Content-Encoding — universal browser support.' },
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
 *  `BROWSER_FETCH_PAGE_EXCLUDE` and the no-brotli rule. */
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
      out.push({
        group,
        id: variantId(b.algoName, ch),
        label: variantId(b.algoName, ch),
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
  ...buildTokenVariants('text', /* sourceful */ true),
]

export const SCRIPT_VARIANTS: Variant[] = [
  ...ENCODINGS.map<Variant>(e => ({
    group: 'script',
    id: `http-${e}`,
    label: `http-${e}`,
    isToken: false,
    url: () => `/api/runtime-benchmark/script?encoding=${e}`,
    compat: ENCODING_COMPAT[e].compat,
    compatNote: ENCODING_COMPAT[e].note,
  })),
  ...buildTokenVariants('script', /* sourceful */ false),
]
