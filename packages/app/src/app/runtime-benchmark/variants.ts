import type { Variant } from './types'

const ENCODINGS = ['raw', 'gzip', 'br', 'deflate'] as const
const SCENARIOS = ['max-webp3', 'max-png3', 'max-def3', 'stream-png3', 'stream-def3'] as const

// Which scenarios were encoded with streaming-PNG (small IDAT chunks, deflateLevel=0).
// The runner uses `decodeStream(response.body)` for these so the JS-side decode
// overlaps with download.
const STREAMABLE_SCENARIOS = new Set<(typeof SCENARIOS)[number]>(['stream-png3', 'stream-def3'])

const ENCODING_COMPAT: Record<
  (typeof ENCODINGS)[number],
  { compat: 'full' | 'partial'; note: string }
> = {
  raw: {
    compat: 'full',
    note: 'No compression — universal.',
  },
  gzip: {
    compat: 'full',
    note: 'gzip via Content-Encoding — universal browser support.',
  },
  br: {
    compat: 'partial',
    note: 'brotli via Content-Encoding — Chromium ≥ 50, Firefox ≥ 44, Safari ≥ 11. Wide support, slight asterisk on very old browsers.',
  },
  deflate: {
    compat: 'full',
    note: 'deflate via Content-Encoding — universal browser support.',
  },
}

const SCENARIO_COMPAT: Record<
  (typeof SCENARIOS)[number],
  { compat: 'full' | 'partial'; note: string }
> = {
  'max-webp3': {
    compat: 'partial',
    note: 'Brotli-11 inner compression — needs DecompressionStream("br") (Chromium ≥ 124, Firefox ≥ 126, Safari ≥ 18). WebP wrapper + max compression = smallest wire bytes.',
  },
  'max-png3': {
    compat: 'partial',
    note: 'Brotli-11 inner compression — same caveat as max-webp3. PNG wrapper, max compression, non-streaming.',
  },
  'max-def3': {
    compat: 'full',
    note: 'Deflate-6 inner compression, non-streaming PNG (one big IDAT block). Universal browser support — pair with stream-def3 to compare with vs without streaming.',
  },
  'stream-png3': {
    compat: 'partial',
    note: 'Brotli-6 inner compression with streaming PNG (small IDAT chunks). Same brotli caveat; benefit is decompress-on-flight.',
  },
  'stream-def3': {
    compat: 'full',
    note: 'Universal: PNG + deflate everywhere. DecompressionStream("deflate") in Chrome ≥ 80, Safari ≥ 16.4, Firefox ≥ 113. The decompress-on-flight sweet spot.',
  },
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
  ...SCENARIOS.map<Variant>(s => ({
    group: 'text',
    id: s,
    label: s,
    isToken: true,
    isStreamable: STREAMABLE_SCENARIOS.has(s),
    url: ({ source }) => `/api/runtime-benchmark/token?source=${source}&scenario=${s}`,
    compat: SCENARIO_COMPAT[s].compat,
    compatNote: SCENARIO_COMPAT[s].note,
  })),
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
  ...SCENARIOS.map<Variant>(s => ({
    group: 'script',
    id: s,
    label: s,
    isToken: true,
    isStreamable: STREAMABLE_SCENARIOS.has(s),
    url: () => `/api/runtime-benchmark/script-token?scenario=${s}`,
    compat: SCENARIO_COMPAT[s].compat,
    compatNote: SCENARIO_COMPAT[s].note,
  })),
]
