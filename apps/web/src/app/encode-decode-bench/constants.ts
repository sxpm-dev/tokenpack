/** Source picker order mirrors scripts/benchmark/fixture-corpus.ts. */
export const SOURCES = [
  { id: 'client-spec-map', label: 'client spec map' },
  { id: 'react-dom-client-production', label: 'React DOM production' },
  { id: 'chunk-5mb', label: 'Editor application bundle' },
] as const

export const CONDITIONS = [
  { id: 'local', label: 'Local', detail: '0ms · no throttle' },
  { id: 'fast-cdn', label: 'Fast CDN', detail: '10ms · 100 MB/s' },
  { id: 'average', label: 'Average', detail: '50ms · 10 MB/s' },
  { id: 'slow', label: 'Slow', detail: '100ms · 2 MB/s' },
] as const

export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  CONDITIONS.map(c => [c.id, `${c.label} · ${c.detail}`]),
)
