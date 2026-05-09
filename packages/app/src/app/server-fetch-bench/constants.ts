export const CONDITIONS: readonly string[] = ['local', 'fast-cdn', 'average', 'slow']

export const SOURCES: readonly string[] = [
  'react-dom-client.development',
  'react-dom-client.production',
  'chunk-5mb',
  'screenshot',
  'fs-app-core',
  'client-spec-map',
  'client-spec-map.min',
]

/** Archive baselines have fixed identities and colors. Token-pack scenarios
 *  are catalog-driven (`<algo>-c<ch>`), so the dashboard derives them from
 *  the data via `buildScenarioConfig(...)`. */
export const ARCHIVE_SCENARIOS: readonly string[] = ['zip', 'tar.gz', 'brotli-11', 'brotli-6']

const ARCHIVE_COLORS: Record<string, string> = {
  zip: '#f59e0b',
  'tar.gz': '#f97316',
  'brotli-11': '#10b981',
  'brotli-6': '#34d399',
}

const TOKEN_PALETTE = [
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#6366f1',
  '#a5b4fc',
  '#f472b6',
  '#f9a8d4',
  '#22d3ee',
  '#a78bfa',
  '#fb7185',
  '#facc15',
  '#84cc16',
  '#06b6d4',
  '#ec4899',
  '#fbbf24',
  '#8b5cf6',
]

/** Build the scenario list + color map from the actual scenario ids present
 *  in `results.json`. Token scenarios come first (catalog order), archive
 *  baselines after — chart and table consumers iterate this list. */
export function buildScenarioConfig(scenarioIds: ReadonlyArray<string>): {
  scenarios: string[]
  colors: Record<string, string>
} {
  const seen = new Set<string>()
  const tokens: string[] = []

  for (const id of scenarioIds) {
    if (seen.has(id) || ARCHIVE_SCENARIOS.includes(id)) {
      seen.add(id)
      continue
    }
    seen.add(id)
    tokens.push(id)
  }

  const archivesPresent = ARCHIVE_SCENARIOS.filter(a => seen.has(a))
  const colors: Record<string, string> = { ...ARCHIVE_COLORS }

  tokens.forEach((id, i) => {
    colors[id] = TOKEN_PALETTE[i % TOKEN_PALETTE.length]
  })

  return { scenarios: [...tokens, ...archivesPresent], colors }
}

export const SOURCE_LABELS: Record<string, string> = {
  'react-dom-client.development': 'react-dom dev',
  'react-dom-client.production': 'react-dom prod',
  'chunk-5mb': 'chunk 5MB JS',
  screenshot: 'screenshot PNG',
  'fs-app-core': 'fs: app+core src',
  'client-spec-map': 'client spec map',
  'client-spec-map.min': 'client spec map (min)',
}

export const CONDITION_LABELS: Record<string, string> = {
  local: 'Local (0ms, ∞)',
  'fast-cdn': 'Fast CDN (10ms, 100MB/s)',
  average: 'Average (50ms, 10MB/s)',
  slow: 'Slow (100ms, 2MB/s)',
}
