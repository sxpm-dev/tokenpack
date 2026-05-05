export const CONDITIONS: readonly string[] = ['local', 'fast-cdn', 'average', 'slow']

export const SOURCES: readonly string[] = [
  'react-dom-client.development',
  'react-dom-client.production',
  'screenshot',
  'fs-src-tests-docs',
]

export const SCENARIOS: readonly string[] = [
  'max-webp3',
  'max-png3',
  'max-png4',
  'stream-png3',
  'stream-png4',
  'stream-def3',
  'stream-def4',
  'zip',
  'tar.gz',
  'brotli-11',
  'brotli-6',
]

export const COLORS: Record<string, string> = {
  'max-webp3':   '#3b82f6',
  'max-png3':    '#60a5fa',
  'max-png4':    '#93c5fd',
  'stream-png3': '#6366f1',
  'stream-png4': '#a5b4fc',
  'stream-def3': '#f472b6',
  'stream-def4': '#f9a8d4',
  'zip':         '#f59e0b',
  'tar.gz':      '#f97316',
  'brotli-11':   '#10b981',
  'brotli-6':    '#34d399',
}

export const SOURCE_LABELS: Record<string, string> = {
  'react-dom-client.development': 'react-dom dev',
  'react-dom-client.production':  'react-dom prod',
  'screenshot':                   'screenshot PNG',
  'fs-src-tests-docs':            'fs: src+tests+docs',
}

export const CONDITION_LABELS: Record<string, string> = {
  'local':    'Local (0ms, ∞)',
  'fast-cdn': 'Fast CDN (10ms, 100MB/s)',
  'average':  'Average (50ms, 10MB/s)',
  'slow':     'Slow (100ms, 2MB/s)',
}
