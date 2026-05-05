export const SOURCES = [
  { id: 'react-dom-dev',  label: 'react-dom dev' },
  { id: 'react-dom-prod', label: 'react-dom prod' },
  { id: 'screenshot',     label: 'screenshot' },
] as const

export const SOURCE_TO_ARCHIVE_NAME: Record<string, string> = {
  'react-dom-dev':     'react-dom-client.development',
  'react-dom-prod':    'react-dom-client.production',
  'screenshot':        'screenshot',
  'fs-app-core': 'fs-app-core',
}

