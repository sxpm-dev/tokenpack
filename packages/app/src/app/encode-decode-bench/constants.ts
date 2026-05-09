export const SOURCES = [
  { id: 'react-dom-dev', label: 'react-dom dev' },
  { id: 'react-dom-prod', label: 'react-dom prod' },
  { id: 'chunk-5mb', label: 'chunk 5MB JS' },
  { id: 'screenshot', label: 'screenshot' },
  { id: 'client-spec', label: 'client spec map' },
  { id: 'client-spec-min', label: 'client spec map (min)' },
] as const

export const SOURCE_TO_ARCHIVE_NAME: Record<string, string> = {
  'react-dom-dev': 'react-dom-client.development',
  'react-dom-prod': 'react-dom-client.production',
  'chunk-5mb': 'chunk-5mb',
  screenshot: 'screenshot',
  'fs-app-core': 'fs-app-core',
  'client-spec': 'client-spec-map',
  'client-spec-min': 'client-spec-map.min',
}
