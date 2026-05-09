/** Trimmed corpus matching benchmark/generate.ts:FILE_SOURCES. To investigate
 *  a focused case, add the source back to both lists at once. */
export const SOURCES = [
  { id: 'react-dom-dev', label: 'react-dom dev' },
  { id: 'chunk-5mb', label: 'chunk 5MB JS' },
] as const

export const SOURCE_TO_ARCHIVE_NAME: Record<string, string> = {
  'react-dom-dev': 'react-dom-client.development',
  'chunk-5mb': 'chunk-5mb',
}
