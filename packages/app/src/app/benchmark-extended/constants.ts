export const SOURCES = [
  { id: 'react-dom-dev',  label: 'react-dom dev' },
  { id: 'react-dom-prod', label: 'react-dom prod' },
  { id: 'screenshot',     label: 'screenshot' },
] as const

export const SOURCE_TO_ARCHIVE_NAME: Record<string, string> = {
  'react-dom-dev':     'react-dom-client.development',
  'react-dom-prod':    'react-dom-client.production',
  'screenshot':        'screenshot',
  'fs-src-tests-docs': 'fs-src-tests-docs',
}

export const FAMILY_DOT: Record<string, string> = {
  legacy: 'bg-white/30',
  A:      'bg-blue-400',
  B:      'bg-green-400',
  C:      'bg-amber-400',
}
