// Variants are generated from the live algorithm catalog: every browser-
// registered algorithm × supported channel counts, plus the four HTTP
// encodings. Importing `@tokenpack/browser` populates the catalog as a side
// effect (its `register.ts` auto-runs).

import '@tokenpack/browser'

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import type { AlgorithmCtor } from 'tokenpack/algorithms/types'

import type { Variant } from './types'

const ENCODINGS = ['raw', 'gzip', 'br', 'deflate'] as const

const ENCODING_COMPAT: Record<
  (typeof ENCODINGS)[number],
  { compat: 'full' | 'partial'; note: string }
> = {
  raw: { compat: 'full', note: 'No compression — universal.' },
  gzip: { compat: 'full', note: 'gzip via Content-Encoding — universal browser support.' },
  br: {
    compat: 'partial',
    note: 'brotli via Content-Encoding — Chromium ≥ 50, Firefox ≥ 44, Safari ≥ 11. Wide support, slight asterisk on very old browsers.',
  },
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

/** Every algorithm registered in the browser catalog. */
function listBindings(): CatalogBinding[] {
  return algorithmCatalog.list().map(readBinding)
}

function tokenCompat(b: CatalogBinding): { compat: 'full' | 'partial'; note: string } {
  // Browser decode of brotli requires DecompressionStream('br') —
  // Chromium ≥ 124, Firefox ≥ 126, Safari ≥ 18.
  if (b.compressorFamily === 'brotli') {
    return {
      compat: 'partial',
      note: `${b.algoName}: brotli outer compression — needs DecompressionStream("br"). Chromium ≥ 124 / Firefox ≥ 126 / Safari ≥ 18.`,
    }
  }

  if (b.algoName.startsWith('pixel-range')) {
    return {
      compat: 'partial',
      note: `${b.algoName}: pack data lives in a tpAK chunk; inner compressor is brotli (same browser caveat).`,
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
